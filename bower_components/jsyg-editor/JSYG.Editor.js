/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {

    if (typeof define != "undefined" && define.amd) define("jsyg-editor",["jsyg","jsyg-path","jsyg-boudingbox","jsyg-selection","jsyg-container","jsyg-rotatable","jsyg-draggable","jsyg-resizable","jsyg-alignment"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Path && JSYG.Vect && JSYG.BoundingBox && JSYG.Selection && JSYG.Container && JSYG.Draggable && JSYG.Resizable && JSYG.Rotatable && JSYG.Alignment) factory(JSYG,JSYG.Path,JSYG.BoundingBox,JSYG.Selection,JSYG.Container,JSYG.Rotatable);
        else throw new Error("Dependency is missing");
    }
    else throw new Error("JSYG is needed");

})(function(JSYG,Path,BoundingBox,Selection,Container,Rotatable) {

    "use strict";

    var ctrls = ['Drag','CtrlPoints','MainPoints','Resize','Rotate'],
    plugins = ['box','selection','clipBoard'];

    /**
     * <strong>nécessite le module Editor</strong>
     * Edition d'éléments (positionnement, dimensions, rotation, et édition des formes pour les éléments SVG).
     * @param arg argument JSYG canvas des éléments à éditer
     * @param opt optionnel, objet définissant les options.
     * @returns {Editor}
     */
    function Editor(arg,opt) {

        this.ctrlsMainPoints = new MainPoints(this);
        this.ctrlsCtrlPoints = new CtrlPoints(this);
        this.ctrlsResize = new Resize(this);
        this.ctrlsRotate = new Rotate(this);
        this.ctrlsDrag = new Drag(this);

        this.selection = new Selection();
        this.selection.multiple = false;

        this.clipBoard = new ClipBoard(this);

        this.box = new BoundingBox();
        this.box.className = 'fillBox';

        this.container = this.box.container;

        this.node = null;
        this.display = false;

        this._list = null;
        this._target = null;

        this._tempoContainer = new JSYG('<g>').addClass('tempoContainer')[0];

        if (arg) this.setNode(arg);
        if (opt) this.enable(opt);
    }

    Editor.prototype = new JSYG.StdConstruct();

    Editor.prototype.constructor = Editor;

    /**
     * Fonctions à exécuter quand on définit une autre cible
     */
    Editor.prototype.onchangetarget = null;
    /**
     * Fonctions à exécuter avant l'affichage de la boite d'édition (renvoyer false pour empecher l'événement)
     */
    Editor.prototype.onbeforeshow=null;
    /**
     * Fonctions à exécuter à l'affichage de la boite d'édition
     */
    Editor.prototype.onshow=null;
    /**
     * Fonctions à exécuter avant la suppression de la boite d'édition (renvoyer false pour empecher l'événement)
     */
    Editor.prototype.onbeforehide=null;
    /**
     * Fonctions à exécuter à la suppression de la boite d'édition
     */
    Editor.prototype.onhide=null;
    /**
     * Fonctions à exécuter à la mise à jour de la boite d'édition
     */
    Editor.prototype.onupdate=null;
    /**
     * Fonctions à exécuter à chaque fois qu'une action d'édition se prépare, qu'elle est lieu ou non (mousedown sur un contrôle)
     */
    Editor.prototype.onstart=null;
    /**
     * Fonctions à exécuter à chaque fois qu'une action d'édition débute
     */
    Editor.prototype.ondragstart=null;
    /**
     * Fonctions à exécuter pendant une action d'édition
     */
    Editor.prototype.ondrag=null;
    /**
     * Fonctions à exécuter à la fin d'une action d'édition
     */
    Editor.prototype.ondragend=null;
    /**
     * Fonctions à exécuter au relachement du bouton de souris, qu'il y ait eu modification ou non
     */
    Editor.prototype.onend=null;

    /**
     * Fonctions à exécuter à tout changement
     */
    Editor.prototype.onchange=null;
    
    Editor.prototype.set = function(options) {

        for (var n in options) {
            if (options.hasOwnProperty(n) && (n in this)) {
                if (ctrls.indexOf(n) !== -1 || plugins.indexOf(n) !== -1) this[n].set(options[n]);
                else if (n == 'target' || n == 'list') this[n](options[n]);
                else this[n] = options[n];
            }
        }

        return this;
    };

    /**
     * définit le canvas d'édition
     * @param arg argument JSYG
     * @returns {Editor}
     */
    Editor.prototype.setNode = function(arg) {

        JSYG.StdConstruct.prototype.setNode.call(this,arg);
        this.selection.setNode(arg);

        return this;
    };

    /**
     * définit ou renvoie l'élément à éditer
     * @param arg argument JSYG optionnel, si renseigné définit la cible à éditer
     * @returns {Editor,JSYG}
     */
    Editor.prototype.target = function(arg,_preventEvent) {

        var target,display,container;

        if (arg == null) {
            if (!this._target) return null;
            target = new JSYG(this._target);
            return this.isMultiSelection() ? target.children() : target;
        }

        display = this.display;

        if (display) this.hide(null,true);

        target = new JSYG(arg);

        if (target.length > 1) {

            container = new Container(this._tempoContainer).freeItems();

            container.insertBefore(target[0]);

            container.addItems(target);

            this._target = this._tempoContainer;
            this._oldTargets = container.children();
        }
        else {
            this._target = target[0];
            this._oldTargets = null;
        }

        this.box.setNode(this._target);

        if (display) this.show(null,true);

        if (!_preventEvent) this.trigger('changetarget',this.node,this._target);

        return this;
    };

    /**
     * Réinitialise la cible
     */
    Editor.prototype.targetRemove = function() {

        this._target = null;
    };

    /**
     * Indique si plusieurs éléments sont édités à la fois
     * @returns {Boolean}
     */
    Editor.prototype.isMultiSelection = function() {

        return this._target == this._tempoContainer;
    };

    /**
     * définit ou renvoie la liste des éléments éditables dans le canvas.
     */
    Editor.prototype.list = null;

    if (Object.defineProperty) {

        try {

            Object.defineProperty(Editor.prototype,"list",{
                "get" : function() { return this._list; },
                "set" : function(list) {
                    this._list = list;
                    this.selection.list = this._list;
                }
            });
        }
        catch(e) {}
    }

    /**
     * Masque le conteneur d'édition
     */
    Editor.prototype.hide = function(e,_preventEvent) {

        if (!_preventEvent && this.trigger("beforehide",this.node,e,this._target) === false) return this;

        this.box.hide();

        var ctrl,i,N,container;

        for (i=0,N=ctrls.length;i<N;i++) {
            ctrl = this['ctrls'+ctrls[i]];
            if (ctrl && ctrl.enabled) ctrl.hide(_preventEvent);
        }

        if (this.isMultiSelection()) {

            container = new Container(this._tempoContainer);
            container.freeItems().remove();
        }

        this.display = false;

        if (!_preventEvent) this.trigger('hide',this.node,e,this._target);

        return this;
    };

    /**
     * Affiche le conteneur d'édition
     * @param e optionnel, objet Event afin de commencer tout de suite le déplacement de l'élément
     * (ainsi sur un meme événement mousedown on peut afficher le conteneur et commencer le déplacement)
     * @returns {Editor}
     */
    Editor.prototype.show = function(e,_preventEvent) {

        if (!_preventEvent && this.trigger("beforeshow",this.node,e,this._target) === false) return this;

        if (this.isMultiSelection()) this.target(this._oldTargets,_preventEvent);

        this.display = true;

        this.box.show();

        var ctrl,i,N;

        for (i=0,N=ctrls.length;i<N;i++) {
            ctrl = this['ctrls'+ctrls[i]];
            if (ctrl && ctrl.enabled) ctrl.show(_preventEvent);
        }

        if (!_preventEvent) this.trigger('show',this.node,e,this._target);

        if (e && e.type == "mousedown" && this.ctrlsDrag.enabled) this.ctrlsDrag.start(e);

        return this;
    };

    /**
     * Mise à jour du conteneur d'édition. (Si l'élément est modifié par un autre moyen que les contrôles du conteneur,
     * il peut s'avérer utile de mettre à jour le conteneur)
     * @returns {Editor}
     */
    Editor.prototype.update = function(e,_preventEvent) {

        if (!this.display) return this;

        this.box.update();

        var ctrl,i,N;

        for (i=0,N=ctrls.length;i<N;i++) {
            ctrl = this['ctrls'+ctrls[i]];
            if (ctrl && ctrl.display) ctrl.update();
        }

        if (!_preventEvent) this.trigger('update',this.node,e,this._target);

        return this;
    };

    /**
     * Activation des contrôles.<br/>
     * appelée sans argument, tous les contrôles sont activés. Sinon, en arguments (nombre variable) les noms des contrôles à activer
     * ('Drag','Resize','Rotate','CtrlPoints','MainPoints').
     */
    Editor.prototype.enableCtrls = function() {

        if (arguments.length === 0) {
            for (var i=0,N=ctrls.length;i<N;i++) this[ 'ctrls'+ctrls[i] ].enable();
        }
        else {

            var that = this;

            JSYG.makeArray(arguments).forEach(function(arg) {
                var ctrl = that['ctrls'+ JSYG.ucfirst(arg) ];
                if (ctrl) ctrl.enable();
            });
        }

        return this;
    };

    /**
     * Désactivation des contrôles.<br/>
     * appelée sans argument, tous les contrôles sont desactivés. Sinon, en arguments (nombre variable) les noms des contrôles à desactiver
     * ('Drag','Resize','Rotate','CtrlPoints','MainPoints').
     */
    Editor.prototype.disableCtrls = function() {

        if (arguments.length === 0) {
            for (var i=0,N=ctrls.length;i<N;i++) this[ 'ctrls'+ctrls[i] ].disable();
        }
        else {

            var that = this;

            JSYG.makeArray(arguments).forEach(function(arg) {
                var ctrl = that['ctrls'+ JSYG.ucfirst(arg) ];
                if (ctrl) ctrl.disable();
            });
        }

        return this;
    };

    /**
     * Aligne les éléments sélectionnés
     * @param {String} type (top,middle,bottom,left,center,right)
     * @returns {Editor}
     */
    Editor.prototype.align = function(type) {

        if (!this.isMultiSelection()) return this;

        this.target().align(type);

        this.update();
        
        this.trigger("change",this.node,this._target);

        return this;
    };
    
    Editor.prototype.group = function() {
        
        var target = this.target(),
            g, parent;
        
        if (target.length == 1) return this;
            
        g = new JSYG('<g>');
        
        parent = target.parent();

        this.target( g.appendTo(parent).append(target) ).update();
                
        this.trigger("change",this.node,this._target);
        
        return this;
    };
        
    Editor.prototype.ungroup = function() {
      
        var g = this.target();
        
        if (!this.isGrouped()) return this;
        
        new Container(g).freeItems();
	
        this.hide();
        
        this.trigger("change",this.node,this._target);
    
        return this;
    };
    
    Editor.prototype.isGrouped = function() {
        
        var g = this.target();
        
        return g.getTag() == "g" && g.length == 1;
    };
    
    Editor.prototype.enable = function(opt) {

        var selectFcts,n,
        that = this;

        this.disable();

        if (opt) this.set(opt);

        if (!this._list) this.list = '*';

        selectFcts = {

            "beforedeselect beforedrag" : function(e) {
                if (e.target == that.container || new JSYG(e.target).isChildOf(that.container)) return false;
            },

            "selectover" : function(e,elmt) { new JSYG(elmt).boundingBox('show'); },

            "selectout" : function(e,elmt) { new JSYG(elmt).boundingBox('hide'); },

            "selectedlist" : function(e,list) {

                new JSYG(list).boundingBox("hide");

                that.target(list).show(e);
            },

            "deselectedlist" : function(e) { that.hide(e); }
        };

        this.enabled = true;

        if (opt) {
            for (n in opt) {
                if (ctrls.indexOf(n) !== -1 || n == "clipBoard") this[n].enable();
            }
        }

        this.selection.on(selectFcts).enable();

        this.disable = function() {

            this.hide();

            this.targetRemove();

            this.selection.off(selectFcts).disable();

            this.enabled = false;

            return this;
        };

        return this;
    };

    Editor.prototype.disable = function() {

        this.hide();

        this.targetRemove();

        this.enabled = false;

        return this;
    };

    function ClipBoard(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
    }

    ClipBoard.prototype = new JSYG.StdConstruct();

    ClipBoard.prototype.pasteOffset = 10;

    ClipBoard.prototype.oncopy = null;
    ClipBoard.prototype.oncut = null;
    ClipBoard.prototype.onpaste = null;
    
    ClipBoard.prototype.keyShortCutCopy = "ctrl+c";
    ClipBoard.prototype.keyShortCutCut = "ctrl+x";
    ClipBoard.prototype.keyShortCutPaste = "ctrl+v";
    
    ClipBoard.prototype.enabled = false;

    ClipBoard.prototype.buffer = null;

    ClipBoard.prototype._parent = null;
    ClipBoard.prototype._multiSelection = null;

    ClipBoard.prototype.copy = function() {

        var target = new JSYG(this.editor._target);

        this._multiSelection = this.editor.isMultiSelection();

        if (!target.length) return this;

        this.buffer = target.clone()[0];
        this._parent = target.parent()[0];

        this.trigger('copy',this.editor.node,target[0],this.buffer);
        return this;
    };

    ClipBoard.prototype.cut = function() {

        var target = new JSYG(this.editor._target);

        this._multiSelection = this.editor.isMultiSelection();

        if (!target.length) return this;

        this.buffer = target.clone()[0];
        this._parent = target.parent()[0];

        this.editor.hide();
        this.editor.target().remove();
        this.editor.targetRemove();
        
        this.trigger('cut',this.editor.node,this.buffer);
        this.editor.trigger('change',this.editor.node,this.buffer);

        return this;
    };

    ClipBoard.prototype.paste = function(parent) {

        if (!this.buffer) return this;

        var clone = new JSYG(this.buffer),
        children,dim;

        parent = new JSYG(parent || this._parent);

        clone.appendTo(parent);

        dim = clone.getDim(parent);

        clone.setDim({
            x : dim.x+this.pasteOffset,
            y : dim.y+this.pasteOffset,
            from : parent
        });

        this.buffer = clone.clone()[0];

        if (this._multiSelection) {

            children = clone.children();
            new Container(clone).freeItems().remove();
            this.editor.target(children).show(true);
        }
        else this.editor.target(clone).show(true);

        this.trigger('paste',this.editor.node,clone[0]);
        this.editor.trigger('change',this.editor.node,clone[0]);

        return this;
    };

    ClipBoard.prototype.enableKeyShortCuts = function(opt) {

        this.disable();

        if (opt) this.set(opt);

        var that = this,
        $doc = new JSYG(document);

        function copy(e) {
            if (!that.editor.display) return;
            e.preventDefault();
            that.copy();
        }

        function cut(e) {
            if (!that.editor.display) return;
            e.preventDefault();
            that.cut();
        }

        function paste(e) {
            if (!that.buffer) return;
            e.preventDefault();
            that.paste();
        }

        if (this.keyShortCutCopy) $doc.on("keydown",null,this.keyShortCutCopy,copy);
        if (this.keyShortCutCut) $doc.on("keydown",null,this.keyShortCutCut,cut);
        if (this.keyShortCutPaste) $doc.on("keydown",null,this.keyShortCutPaste,paste);
        
        this.disableKeyShortCuts = function() {
            
            if (this.keyShortCutCopy) $doc.off("keydown",null,this.keyShortCutCopy,copy);
            if (this.keyShortCutCut) $doc.off("keydown",null,this.keyShortCutCut,cut);
            if (this.keyShortCutPaste) $doc.off("keydown",null,this.keyShortCutPaste,paste);
            
            this.enabled = false;
            
            return this;
        };

        this.enabled = true;
        return this;
    };

    ClipBoard.prototype.disableKeyShortCuts = function() {
        return this;
    };


    /**
     * Edition des points de contrôle des chemins SVG
     */
    function CtrlPoints(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
        /**
         * liste des contrôles
         */
        this.list = [];
        /**
         * Conteneur des contrôles
         */
        this.container = new JSYG('<g>')[0];
    }

    CtrlPoints.prototype = {

        constructor : CtrlPoints,

        container : null,
        /**
         * Classe appliquée au conteneur des contrôles
         */
        className : 'ctrlPoints',
        /**
         * Forme utilisée pour les contrôles
         */
        shape : 'circle',
        /**
         * lien utilisé si shape est défini à "use"
         */
        xlink : null,
        /**
         * largeur du contrôle
         */
        width : 10,
        /**
         * hauteur du contrôle
         */
        height : 10,
        /**
         * Points de contrôle liés ou non (si on en déplace un, l'autre se déplace en miroir)
         */
        linked : true,
        /**
         * Options supplémentaires pour le drag&drop
         * @see {Draggable}
         */
        draggableOptions:null,
        /**
         * Fonction(s) à exécuter à l'affichage des contrôles
         */
        onshow:null,
        /**
         * Fonction(s) à exécuter à la suppression des contrôles
         */
        onhide:null,
        /**
         * Fonction(s) à exécuter quand on prépare un déplacement (mousedown sur le contrôle)
         */
        onstart:null,
        /**
         * Fonction(s) à exécuter quand on commence un déplacement
         */
        ondragstart:null,
        /**
         * Fonction(s) à exécuter pendant le déplacement
         */
        ondrag:null,
        /**
         * Fonction(s) à exécuter en fin de déplacement
         */
        ondragend:null,
        /**
         * Fonction(s) à exécuter au relâchement de la souris, qu'il y ait eu modification ou non
         */
        onend:null,
        /**
         * Indique si les contrôles sont activés ou non
         */
        enabled : false,
        /**
         * Indique si les contrôles sont affichés ou non
         */
        display : false,

        set : JSYG.StdConstruct.prototype.set,
        /**
         * Ajout d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {CtrlPoints}
         */
        on : JSYG.StdConstruct.prototype.on,
        /**
         * Retrait d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {CtrlPoints}
         */
        off : JSYG.StdConstruct.prototype.off,
        /**
         * Déclenche un événement customisé
         * @see JSYG.StdConstruct.prototype.trigger
         */
        trigger : JSYG.StdConstruct.prototype.trigger,

        _remove : function(i) {

            if (!this.list[i]) return;

            var elmts = ['pt1','path1','pt2','path2'],
            that = this;

            elmts.forEach(function(elmt) {
                if (that.list[i][elmt]) new JSYG(that.list[i][elmt]).remove();
            });

            this.list.splice(i,1);

            return this;
        },

        /**
         * Activation des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {CtrlPoints}
         */
        enable : function(opt) {

            this.hide(true);

            if (opt) this.set(opt);

            var container = this.editor.box.container;

            if (container && container.parentNode) this.show();

            this.enabled = true;

            return this;
        },

        /**
         * Désactivation des contrôles
         *  @returns {CtrlPoints}
         */
        disable : function() {

            this.hide();
            this.enabled = false;
            return this;
        },

        /**
         * Affichage des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {CtrlPoints}
         */
        show : function(opt,_preventEvent) {

            if (opt) this.set(opt);

            var node = this.editor._target;

            if (!node) return this.hide();

            this.node = node;

            var jNode = new JSYG(node);

            if (!jNode.isSVG()) return this;

            var svg = jNode.offsetParent('farthest'),
            CTM = jNode.getMtx(svg),
            tag = jNode.getTag(),
            needReplace = JSYG.support.needReplaceSeg,
            list = [],N,
            that = this,
            start = function(e){
                new JSYG(that.container).appendTo(that.editor.box.container);
                that.editor.trigger('start',node,e);
                that.trigger('start',node,e);
            },
            dragstart = function(e) {
                that.editor.trigger('dragstart',node,e);
                that.trigger('dragstart',node,e);
            },
            dragend = function(e) {
                that.editor.update();
                that.editor.trigger('dragend',node,e);
                that.editor.trigger('change',node,e);
                that.trigger('dragend',node,e);
            },
            end = function(e){
                that.editor.trigger('end',node,e);
                that.trigger('end',node,e);
            };

            if (!this.container.parentNode) {
                new JSYG(this.container).appendTo(this.editor.box.container).addClass(this.className);
            }

            if (tag === 'path') {

                var jPath = new Path(node);

                jPath.rel2abs();

                list = jPath.getSegList();

                list.forEach(function(seg,i) {

                    if (!that.list[i]) { that.list[i] = {}; }

                    var pt1,pt2,jShape,path,drag,
                    test1 = seg.x1!=null && seg.y1!=null,
                    test2 = seg.x2!=null && seg.y2!=null;

                    if (test1 || test2) {

                        if (test1) {

                            pt1 = new JSYG.Vect(seg.x1,seg.y1).mtx(CTM);
                            pt2 = jPath.getCurPt(i).mtx(CTM);

                            if (that.list[i].path1) path = new Path(that.list[i].path1);
                            else {
                                path = new Path();
                                path.appendTo(that.container);
                            }

                            path.clear().moveTo(pt1.x,pt1.y).lineTo(pt2.x,pt2.y);

                            that.list[i].path1 = path[0];

                            drag = function(e) {

                                var path1 = new Path(that.list[i].path1),
                                CTM = jPath.getMtx(svg),
                                //oldX = seg.x1,
                                //oldY = seg.y1,
                                jShape = new JSYG(this),
                                center = jShape.getCenter(),
                                pt = new JSYG.Vect(center.x,center.y).mtx(jShape.getMtx(svg));

                                path1.replaceSeg(0,'M',pt.x,pt.y);
                                pt = pt.mtx(CTM.inverse());

                                seg.x1 = pt.x;
                                seg.y1 = pt.y;

                                if (i>0 && that.linked) {

                                    var prevSeg = list[i-1];

                                    if (prevSeg.x2!=null && prevSeg.y2!=null) {

                                        //var angleTest1 = Math.atan2(oldY-prevSeg.y,oldX-prevSeg.x),
                                        //angleTest2 = Math.atan2(oldY-prevSeg.y2,oldX-prevSeg.x2);

                                        //if ( ((angleTest1%Math.PI)*180/Math.PI).toFixed(1) === ((angleTest2%Math.PI)*180/Math.PI).toFixed(1) )
                                        //{
                                        var angle = Math.atan2(seg.y1-prevSeg.y,seg.x1-prevSeg.x)+Math.PI,
                                        path2 =new Path( that.list[i-1].path2),
                                        dist = Math.sqrt(Math.pow(prevSeg.x2-prevSeg.x,2) + Math.pow(prevSeg.y2-prevSeg.y,2));
                                        prevSeg.x2 = prevSeg.x + dist * Math.cos(angle);
                                        prevSeg.y2 = prevSeg.y + dist * Math.sin(angle);

                                        pt = new JSYG.Vect(prevSeg.x2,prevSeg.y2).mtx(CTM);
                                        new JSYG(that.list[i-1].pt2).setCenter(pt.x,pt.y);
                                        path2.replaceSeg(0,'M',pt.x,pt.y);
                                        //}
                                    }
                                }

                                if (needReplace) jPath.replaceSeg(i,seg);

                                that.editor.trigger('drag',node,e);
                                that.trigger('drag',node,e);
                            };


                            if (that.list[i].pt1) {

                                jShape = new JSYG(that.list[i].pt1);
                                jShape.draggable('set',{
                                    event:'mousedown',
                                    eventWhich:1,
                                    onstart:start,
                                    ondragstart:dragstart,
                                    ondrag:drag,
                                    ondragend:dragend,
                                    onend:end
                                });
                            }
                            else {

                                jShape = new JSYG('<'+that.shape+'>').appendTo(that.container);

                                if (that.xlink) jShape.xlink = that.xlink;

                                jShape.setDim({x:0,y:0,width:that.width,height:that.height});

                                jShape.draggable('set',{
                                    event:'mousedown',
                                    eventWhich:1,
                                    onstart:start,
                                    ondragstart:dragstart,
                                    ondrag:drag,
                                    ondragend:dragend,
                                    onend:end
                                });

                                if (that.draggableOptions) jShape.draggable('set',that.draggableOptions);

                                jShape.draggable('enable');

                                that.list[i].pt1 = jShape[0];
                            }

                            jShape.setCenter(pt1.x,pt1.y);

                        }
                        else {
                            if (that.list[i].pt1) { new JSYG(that.list[i].pt1).remove();  that.list[i].pt1 = null; }
                            if (that.list[i].path1) { new JSYG(that.list[i].path1).remove();  that.list[i].path1 = null; }
                        }

                        if (test2) {

                            pt1 = new JSYG.Vect(seg.x2,seg.y2).mtx(CTM);
                            pt2 = new JSYG.Vect(seg.x,seg.y).mtx(CTM);

                            if (that.list[i].path2) path = new Path(that.list[i].path2);
                            else {
                                path = new Path();
                                path.appendTo(that.container);
                            }

                            path.clear().moveTo(pt1.x,pt1.y).lineTo(pt2.x,pt2.y);

                            that.list[i].path2 = path[0];

                            drag = function(e) {

                                var path2 = new Path(that.list[i].path2),
                                CTM = jPath.getMtx(svg),
                                jShape = new JSYG(this),
                                //oldX = seg.x2,
                                //oldY = seg.y2,
                                center = jShape.getCenter(),
                                pt = new JSYG.Vect(center.x,center.y).mtx(jShape.getMtx(svg));

                                path2.replaceSeg(0,'M',pt.x,pt.y);

                                pt = pt.mtx(CTM.inverse());
                                seg.x2 = pt.x;
                                seg.y2 = pt.y;

                                if (i+1<list.length && that.linked) {

                                    var nextSeg = list[i+1];

                                    if (nextSeg.x1!=null && nextSeg.y1!=null) {

                                        //var angleTest1 = Math.atan2(oldY-seg.y,oldX-seg.x),
                                        //angleTest2 = Math.atan2(oldY-nextSeg.y1,oldX-nextSeg.x1);

                                        //if ( ((angleTest1%Math.PI)*180/Math.PI).toFixed(1) === ((angleTest2%Math.PI)*180/Math.PI).toFixed(1) )
                                        //{
                                        var angle = Math.atan2(seg.y2-seg.y,seg.x2-seg.x)+Math.PI,
                                        path1 = new Path(that.list[i+1].path1),
                                        dist = Math.sqrt(Math.pow(nextSeg.x1-seg.x,2) + Math.pow(nextSeg.y1-seg.y,2));
                                        nextSeg.x1 = seg.x + dist * Math.cos(angle);
                                        nextSeg.y1 = seg.y + dist * Math.sin(angle);

                                        pt = new JSYG.Vect(nextSeg.x1,nextSeg.y1).mtx(CTM);
                                        new JSYG(that.list[i+1].pt1).setCenter(pt.x,pt.y);
                                        path1.replaceSeg(0,'M',pt.x,pt.y);
                                        //}
                                    }
                                }

                                if (needReplace) jPath.replaceSeg(i,seg);

                                that.editor.trigger('drag',node,e);
                                that.trigger('drag',node,e);
                            };

                            if (that.list[i].pt2) {
                                jShape = new JSYG(that.list[i].pt2);
                                jShape.draggable('set',{
                                    event:'mousedown',
                                    eventWhich:1,
                                    onstart:start,
                                    ondragstart:dragstart,
                                    ondrag:drag,
                                    ondragend:dragend,
                                    onend:end
                                });
                            }
                            else {

                                jShape = new JSYG('<'+that.shape+'>').appendTo(that.container);
                                if (that.xlink) { jShape.xlink = that.xlink; }
                                jShape.setDim({x:0,y:0,width:that.width,height:that.height});

                                jShape.draggable('set',{
                                    event:'mousedown',
                                    eventWhich:1,
                                    onstart:start,
                                    ondragstart:dragstart,
                                    ondrag:drag,
                                    ondragend:dragend,
                                    onend:end
                                });
                                if (that.draggableOptions) { jShape.draggable('set',that.draggableOptions); }
                                jShape.draggable('enable');
                                that.list[i].pt2 = jShape[0];
                            }

                            jShape.setCenter(pt1.x,pt1.y);
                        }
                        else {
                            if (that.list[i].pt2) { new JSYG(that.list[i].pt2).remove();  that.list[i].pt2 = null; }
                            if (that.list[i].path2) { new JSYG(that.list[i].path2).remove();  that.list[i].path2 = null; }
                        }
                    }
                    else {
                        that._remove(i);
                        that.list.splice(i,0,null);
                    }
                });
            }
            /*else if (tag === 'rect') {

				var drag,
				pt,pt1,pt2,
				l = jNode.getDim();
				l.rx = parseFloat(jNode.attr('rx') || 0);
				l.ry = parseFloat(jNode.attr('ry') || 0);

				list = [0,1,2,3];

				list.forEach(function(i) {

					if (!that.list[i]) { that.list[i] = {}; };

					if (!that.list[i].path) {
						var path = new Path();
                                                path.appendTo(that.container);
						path.addClass(that.className);
						that.list[i].path = path[0];
					}

					if (!that.list[i].pt) {

						var point = new JSYG('<'+that.shape+'>').appendTo(that.container);
						point.addClass(that.className);
						that.list[i].pt = point[0];

						drag = function(e) {

							var center = point.getCenter().mtx(point.getMtx()),
							pt1 = new JSYG.Vect(center.x,center.y).mtx(jNode.getMtx('ctm').inverse()),
							rx, ry,
							path = new Path(that.list[i].path),
							l = jNode.getDim();

							path.clear();

							switch(i) {
								case 0 :
									rx = Math.max(0,pt1.x - l.x);
									ry = Math.max(0,pt1.y - l.y);
									path.moveTo(l.x,l.y+ry).lineTo(pt1.x,pt1.y).lineTo(l.x+rx,l.y);
									break;
								case 1 :
									rx = Math.max(0,l.x+l.width-pt1.x);
									ry = Math.max(0,pt1.y - l.y);
									path.moveTo(l.x+l.width-rx,l.y).lineTo(pt1.x,pt1.y).lineTo(l.x+l.width,l.y+ry);
									break;
								case 2 :
									rx = Math.max(0,l.x+l.width - pt1.x);
									ry = Math.max(0,l.y+l.height - pt1.y);
									path.moveTo(l.x+l.width,l.y+l.height-ry).lineTo(pt1.x,pt1.y).lineTo(l.x+l.width-rx,l.y+l.height);
									break;
								case 3 :
									rx = Math.max(0,pt1.x - l.x);
									ry = Math.max(0,l.y+l.height - pt1.y);
									path.moveTo(l.x+rx,l.y+l.height).lineTo(pt1.x,pt1.y).lineTo(l.x,l.y+l.height-ry);
									break;
							}

							jNode.attr({'rx':rx,'ry':ry});

							that.editor.trigger('drag',node,e);
							that.trigger('drag',node,e);
						};

						point.draggable({
							type:'attributes',
							ondrag:drag,
							onend:end
						});
					}

				});

				pt = new JSYG.Vect(l.x+l.rx,l.y+l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x,l.y+l.ry).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.rx,l.y).mtx(CTM);
				new JSYG(this.list[0].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new Path(this.list[0].path).clear().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);

				pt = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x+l.width-l.rx,l.y).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.width,l.y+l.ry).mtx(CTM);
				new JSYG(this.list[1].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new Path(this.list[1].path).clear().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);

				pt = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.height-l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x+l.width-l.rx,l.y+l.height).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.width,l.y+l.height-l.ry).mtx(CTM);
				new JSYG(this.list[2].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new Path(this.list[2].path).clear().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);

				pt = new JSYG.Vect(l.x+l.rx,l.y+l.height-l.ry).mtx(CTM);
				pt1 = new JSYG.Vect(l.x,l.y+l.height-l.ry).mtx(CTM);
				pt2 = new JSYG.Vect(l.x+l.rx,l.y+l.height).mtx(CTM);
				new JSYG(this.list[3].pt).setDim({x:0,y:0,width:this.width,height:this.height}).setCenter(pt.x,pt.y);
				new Path(this.list[3].path).clear().moveTo(pt1.x,pt1.y).lineTo(pt.x,pt.y).lineTo(pt2.x,pt2.y);
			}*/

            N = list.length;
            while (this.list.length > N) this._remove(this.list.length-1);

            this.display = true;

            if (!_preventEvent) this.trigger('show',node);

            return this;
        },

        /**
         * Masque les contrôles
         * @returns {CtrlPoints}
         */
        hide : function(_preventEvent) {

            new JSYG(this.container).empty().remove();
            this.list.splice(0,this.list.length);
            this.display = false;
            if (!_preventEvent) this.trigger('hide',this.node);
            return this;
        },
        /**
         * Met à jour les contrôles
         * @returns {CtrlPoints}
         */
        update : function() { return this.display ? this.show() : this; }
    };

    /**
     * Edition des points principaux des chemins SVG
     */
    function MainPoints(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
        /**
         * liste des contrôles
         */
        this.list = [];
        /**
         * Conteneur des contrôles
         */
        this.container = new JSYG('<g>')[0];
    }

    MainPoints.prototype = {

        constructor : MainPoints,
        /**
         * Classe appliquée au conteneur des contrôles
         */
        className : 'mainPoints',
        /**
         * Forme utilisée pour les contrôles
         */
        shape : 'circle',
        /**
         * largeur des contrôles
         */
        width:10,
        /**
         * hauteur des contrôles
         */
        height:10,
        /**
         * classe appliquée au dernier point d'un chemin si le chemin est fermé
         */
        classNameClosing : 'closingPoint',
        /**
         * Force de la magnétisation entre les points extremes pour fermer le chemin
         */
        strengthClosingMagnet : 10,
        /**
         * Lisse automatiquement les chemins
         */
        autoSmooth : false,
        /**
         * Fonction(s) à exécuter à l'affichage des contrôles
         */
        onshow:null,
        /**
         * Fonction(s) à exécuter à la suppression des contrôles
         */
        onhide:null,
        /**
         * Fonction(s) à exécuter quand on prepare un déplacement (mousedown sur le contrôle)
         */
        onstart:null,
        /**
         * Fonction(s) à exécuter quand on commence un déplacement
         */
        ondragstart:null,
        /**
         * Fonction(s) à exécuter pendant le déplacement
         */
        ondrag:null,
        /**
         * Fonction(s) à exécuter en fin de déplacement
         */
        ondragend:null,
        /**
         * Fonction(s) à exécuter au relachement de la souris, qu'il y ait eu modification ou non
         */
        onend:null,

        /**
         * Options supplémentaires pour le drag&drop
         * @see {Draggable}
         */
        draggableOptions : null,

        set : JSYG.StdConstruct.prototype.set,
        /**
         * Ajout d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {MainPoints}
         */
        on : JSYG.StdConstruct.prototype.on,
        /**
         * Retrait d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {MainPoints}
         */
        off : JSYG.StdConstruct.prototype.off,
        /**
         * Déclenche un événement customisé
         * @see JSYG.StdConstruct.prototype.trigger
         */
        trigger : JSYG.StdConstruct.prototype.trigger,

        /**
         * Indique si les contrôles sont activés ou non
         */
        enabled : false,
        /**
         * Indique si les contrôles sont affichés ou non
         */
        display : false,

        _remove : function(i) {

            if (!this.list[i]) return;
            new JSYG(this.list[i]).remove();
            this.list.splice(i,1);
            return this;
        },

        /**
         * Activation des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {MainPoints}
         */
        enable : function(opt) {

            this.hide(true);

            if (opt) this.set(opt);

            var container = this.editor.box.container;

            if (container && container.parentNode) this.show();

            this.enabled = true;
            
            return this;
        },

        /**
         * Désactivation des contrôles
         *  @returns {MainPoints}
         */
        disable : function() {
            
            this.hide();
            
            this.enabled = false;
            
            return this;
        },

        /**
         * Affichage des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {MainPoints}
         */
        show : function(opt,_preventEvent) {

            if (opt) this.set(opt);

            var node = this.editor._target;

            if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();

            this.node = node;

            var jNode = new JSYG(node);

            if (!jNode.isSVG()) return;

            var svg = jNode.offsetParent('farthest'),
            CTM = jNode.getMtx(svg),
            tag = jNode.getTag(),
            list=[],N,
            that = this,
            needReplace = JSYG.support.needReplaceSeg,
            start = function(e){
                new JSYG(that.container).appendTo(that.editor.box.container);
                that.editor.trigger('start',node,e);
                that.trigger('start',node,e);
            },
            dragstart = function(e) {
                that.editor.trigger('dragstart',node,e);
                that.trigger('dragstart',node,e);
            },
            dragend = function(e) {
                that.editor.update();
                that.editor.trigger('dragend',node,e);
                that.editor.trigger('change',node,e);
                that.trigger('dragend',node,e);
            },
            end = function(e){
                that.editor.trigger('end',node,e);
                that.trigger('end',node,e);
            };

            if (!this.container.parentNode) {
                new JSYG(this.container).appendTo(this.editor.box.container).addClass(this.className);
            }

            if (tag === 'path') {

                jNode = new Path(node);
                
                jNode.rel2abs();
                
                list = jNode.getSegList();

                var isClosed = jNode.isClosed(),
                mtxScreen,
                ctrlPoints = this.editor.ctrlsCtrlPoints.list;

                //on écrase la fonction start
                start = function(e){
                    new JSYG(that.container).appendTo(that.editor.box.container);
                    isClosed = jNode.isClosed();
                    mtxScreen = jNode.getMtx('screen');
                    that.editor.trigger('start',node,e);
                    that.trigger('start',node,e);
                };

                jNode.rel2abs();

                list.forEach(function(seg,i) {

                    if (seg.x!=null && seg.y!=null) {

                        var pt = new JSYG.Vect(seg.x,seg.y).mtx(CTM),
                        shape,drag;

                        if (that.list[i]) shape = new JSYG(that.list[i]);
                        else {

                            drag = function(e) {

                                var seg = jNode.getSeg(i), //we must redefine seg if pathSegList has been modified
                                jPoint = new JSYG(this),
                                selfCTM = jNode.getMtx(svg),
                                center = jPoint.getCenter(),
                                posPt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx()), //position dans le repère d'édition
                                pt = posPt.mtx(selfCTM.inverse()), //position dans le repère de l'élément édité
                                decX = pt.x-seg.x,
                                decY = pt.y-seg.y,
                                item,pt1,pt2,
                                firstSeg = jNode.getSeg(0),
                                lastSeg = jNode.getLastSeg();

                                if (seg === lastSeg && isClosed) {
                                    firstSeg.x = pt.x;
                                    firstSeg.y = pt.y;
                                    new JSYG(that.list[0]).setCenter(posPt.x,posPt.y);
                                    if (needReplace) jNode.replaceSeg(0,jNode.getSeg(firstSeg));
                                }

                                if (that.strengthClosingMagnet!=null && (seg === lastSeg || seg === firstSeg)) {

                                    var segRef = (seg === lastSeg) ? firstSeg : lastSeg;
                                    var ref = new JSYG.Vect(segRef.x,segRef.y).mtx(mtxScreen);

                                    if (Math.sqrt(Math.pow(ref.x - e.clientX,2)+Math.pow(ref.y-e.clientY,2)) < that.strengthClosingMagnet) {
                                        pt.x = segRef.x;
                                        pt.y = segRef.y;
                                        var mtx = jNode.getMtx(jPoint);
                                        jPoint.setCenter( new JSYG.Vect(pt.x,pt.y).mtx(mtx) );
                                    }
                                }


                                seg.x = pt.x;
                                seg.y = pt.y;

                                if (that.autoSmooth && !that.editor.ctrlsCtrlPoints.enabled) jNode.autoSmooth(i);
                                else {

                                    if (seg.x2!=null && seg.y2!=null) {

                                        seg.x2+=decX;
                                        seg.y2+=decY;
                                        pt1 = new JSYG.Vect(seg.x2,seg.y2).mtx(selfCTM);
                                        pt2 = new JSYG.Vect(seg.x,seg.y).mtx(selfCTM);

                                        if (that.editor.ctrlsCtrlPoints.enabled && (item = ctrlPoints[i])) {

                                            new Path(item.path2)
                                                .replaceSeg(0, 'M',pt1.x,pt1.y)
                                                .replaceSeg(1, 'L',pt2.x,pt2.y);

                                            new JSYG(item.pt2).setCenter(pt1.x,pt1.y);
                                        }
                                    }

                                    if (i < jNode.nbSegs()-1) {

                                        var next = jNode.getSeg(i+1);

                                        if (next.x1!=null && next.y1!=null) {

                                            next.x1+=decX;
                                            next.y1+=decY;
                                            pt1 = new JSYG.Vect(next.x1,next.y1).mtx(selfCTM);
                                            pt2 = new JSYG.Vect(seg.x,seg.y).mtx(selfCTM);

                                            if (that.editor.ctrlsCtrlPoints.enabled && (item = ctrlPoints[i+1])) {

                                                new Path(item.path1)
                                                    .replaceSeg(0,'M',pt1.x,pt1.y)
                                                    .replaceSeg(1,'L',pt2.x,pt2.y);

                                                new JSYG(item.pt1).setCenter(pt1.x,pt1.y);
                                            }
                                        }
                                    }

                                    if (needReplace) jNode.replaceSeg(i,seg);
                                }

                                that.editor.trigger('drag',node,e);
                                that.trigger('drag',node,e);
                            };

                            shape = new JSYG('<'+that.shape+'>').appendTo(that.container);

                            if (that.xlink) shape.xlink = that.xlink;

                            shape.setDim({x:0,y:0,width:that.width,height:that.height});

                            shape.draggable('set',{
                                event:'mousedown',
                                eventWhich:1,
                                onstart:start,
                                ondragstart:dragstart,
                                ondrag:drag,
                                ondragend:dragend,
                                onend:end
                            });

                            if (that.draggableOptions) shape.draggable('set',that.draggableOptions);

                            shape.draggable('enable');

                            that.list[i] = shape[0];
                        }

                        shape.setCenter(pt.x,pt.y);
                    }
                    else if (that.list[i]) that._remove(i);
                });

                //adaptation des points extremes pour courbes fermées/ouvertes
                var first = new JSYG(that.list[0]),
                last = new JSYG(that.list[that.list.length-1]),
                center = first.getCenter();

                first.setDim({
                    width : that.width * (isClosed ? 1.2 : 1),
                    height : that.height * (isClosed ? 1.2 : 1)
                });

                first.setCenter(center.x,center.y);

                center = last.getCenter();

                last.setDim({
                    width : that.width * (isClosed ? 0.6 : 1),
                    height : that.height * (isClosed ? 0.6 : 1)
                });

                last.setCenter(center.x,center.y);

                last[ (isClosed ? 'add':'remove') + "Class" ](this.classNameClosing);

            }
            else if (tag === 'polyline' || tag === 'polygon') {

                list = JSYG.makeArray(node.points);

                list.forEach(function(point,i) {

                    point = new JSYG.Vect(point).mtx(CTM);
                    var shape,drag;

                    if (that.list[i]) shape = new JSYG(that.list[i]);
                    else {

                        drag = function(e) {

                            var point = node.points.getItem(i), //we must redefine point if points has been modified
                            jPoint = new JSYG(this),
                            selfCTM = jNode.getMtx(svg),
                            center = jPoint.getCenter(),
                            pt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx());
                            pt = pt.mtx(selfCTM.inverse());

                            point.x = pt.x;
                            point.y = pt.y;

                            that.editor.trigger('drag',node,e);
                            that.trigger('drag',node,e);
                        };

                        shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
                        shape.setDim({x:0,y:0,width:that.width,height:that.height});
                        shape.draggable('set',{
                            event:'mousedown',
                            eventWhich:1,
                            onstart:start,
                            ondragstart:dragstart,
                            ondrag:drag,
                            ondragend:dragend,
                            onend:end
                        });

                        if (that.draggableOptions) shape.draggable('set',that.draggableOptions);

                        shape.draggable('enable');
                        that.list[i] = shape[0];
                    }

                    shape.setCenter(point.x,point.y);
                });
            }
            else if (tag === 'line') {

                list = [1,2];

                list.forEach(function(attr,i) {

                    var point = new JSYG.Vect(jNode.attr('x'+attr),jNode.attr('y'+attr)).mtx(CTM),
                    shape,drag;

                    if (that.list[i]) shape = new JSYG(that.list[i]);
                    else {

                        drag = function(e) {

                            var jPoint = new JSYG(this),
                            selfCTM = jNode.getMtx(svg),
                            center = jPoint.getCenter(),
                            pt = new JSYG.Vect(center.x,center.y).mtx(jPoint.getMtx());
                            pt = pt.mtx(selfCTM.inverse());

                            jNode.attr("x"+attr,pt.x).attr("y"+attr,pt.y);

                            that.editor.trigger('drag',node,e);
                            that.trigger('drag',node,e);
                        };

                        shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
                        shape.setDim({x:0,y:0,width:that.width,height:that.height});

                        shape.draggable('set',{
                            event:'mousedown',
                            eventWhich:1,
                            onstart:start,
                            ondragstart:dragstart,
                            ondrag:drag,
                            ondragend:dragend,
                            onend:end
                        });

                        if (that.draggableOptions) shape.draggable('set',that.draggableOptions);

                        shape.draggable('enable');
                        that.list[i] = shape[0];
                    }

                    shape.setCenter(point.x,point.y);
                });
            }

            N = list.length;
            while (this.list.length > N) this._remove(this.list.length-1);

            this.display = true;

            if (_preventEvent) this.trigger('show',node);

            return this;
        },

        /**
         * Masque les contrôles
         * @returns {MainPoints}
         */
        hide : function(_preventEvent) {

            if (this.container) new JSYG(this.container).empty().remove();
            this.list.splice(0,this.list.length);
            this.display = false;
            if (!_preventEvent) this.trigger('hide',this.node);
            return this;
        },

        /**
         * Met à jour les contrôles
         * @returns {MainPoints}
         */
        update : function() { return this.display ? this.show() : this; }
    };

    /**
     * déplacement de l'élément
     */
    var Drag = function(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
    };

    Drag.prototype = {

        constructor : Drag,
        /**
         * Type de déplacement ("attributes" ou "transform" pour agir sur les attributs de mise en page ou sur la matrice de transformation)
         */
        type : 'attributes',
        /**
         * Permet de limiter le déplacement à l'intérieur de l'offsetParent (null pour annuler, valeur numérique négative pour aller au delà de l'offsetParent)
         */
        bounds : null,
        /**
         * Options supplémentaires pour le drag&drop
         * @see {Draggable}
         */
        options : null,
        /**
         * Indique si ce contrôle est actif dans le cas d'une sélection multiple
         */
        multiple : true,
        /**
         * Fonction(s) à exécuter quand on prépare un déplacement (mousedown sur le contrôle)
         */
        onstart:null,
        /**
         * Fonction(s) à exécuter quand on commence un déplacement
         */
        ondragstart:null,
        /**
         * Fonction(s) à exécuter pendant le déplacement
         */
        ondrag:null,
        /**
         * Fonction(s) à exécuter en fin de déplacement
         */
        ondragend:null,
        /**
         * Fonction(s) à exécuter au relachement de la souris, qu'il y ait eu déplacement ou non
         */
        onend:null,

        set : JSYG.StdConstruct.prototype.set,//function(opt) { return JSYG.StdConstruct.prototype.set.apply(this,arguments); },
        /**
         * Ajout d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Drag}
         */
        on : JSYG.StdConstruct.prototype.on,
        /**
         * Retrait d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Drag}
         */
        off : JSYG.StdConstruct.prototype.off,
        /**
         * Déclenche un événement customisé
         * @see JSYG.StdConstruct.prototype.trigger
         */
        trigger : JSYG.StdConstruct.prototype.trigger,

        /**
         * Indique si le controle est activé ou non
         */
        enabled : false,
        /**
         * Indique si le contrôle est affiché ou non
         */
        display : false,

        /**
         * Activation du contrôle
         * @param opt optionnel, objet définissant les options
         */
        enable : function(opt) {

            this.hide();

            if (opt) this.set(opt);

            var container = this.editor.box.container;

            if (container && container.parentNode) this.show();

            this.enabled = true;

            return this;
        },
        /**
         * Désactivation du contrôle
         * @returns {Drag}
         */
        disable : function() {
            this.hide();
            this.enabled = false;
            return this;
        },
        /**
         * commence le drag&drop
         * @param e objet Event
         * @returns {Drag}
         */
        start : function(e) {
            if (!this.display) return this;
            new JSYG(this.node).draggable('start',e);
            return this;
        },
        /**
         * Affiche le contrôle
         * @param opt optionnel, objet définissant les options
         * @returns
         */
        show : function(opt) {

            this.hide();

            if (opt) this.set(opt);

            var node = this.editor._target;
            if (!node || this.editor.isMultiSelection() && !this.multiple) return;

            this.node = node;

            var jNode = new JSYG(node),
            field = new JSYG( jNode.isSVG() ? this.editor.box.pathBox : this.editor.box.container ),
            backup,
            displayShadow = this.editor.box.displayShadow,
            that = this;

            jNode.draggable('set',{
                event:'mousedown',
                eventWhich:1,
                onstart : function(e) {
                    backup = {
                        ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
                        ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
                    };
                    that.editor.trigger('start',node,e);
                    that.trigger('start',node,e);
                },
                ondragstart : function(e) {
                    for (var n in backup) {
                        if (!backup[n]) continue;
                        new JSYG(that.editor[n].container).hide();
                        that.editor[n].display = false;
                    }
                    that.editor.box.displayShadow = false;
                    that.editor.trigger('dragstart',node,e);
                    that.trigger('dragstart',node,e);
                },
                ondrag : function(e){
                    that.editor.update();
                    that.editor.trigger('drag',node,e);
                    that.trigger('drag',node,e);
                },
                ondragend : function(e){
                    if (that.editor.isMultiSelection()) new Container(that.editor._target).applyTransform();
                    that.editor.displayShadow = displayShadow;
                    for (var n in backup){
                        if (!backup[n]) continue;
                        new JSYG(that.editor[n].container).show();
                        that.editor[n].display = true;
                    }
                    that.editor.update();
                    that.editor.trigger('dragend',node,e);
                    that.editor.trigger('change',node,e);
                    that.trigger('dragend',node,e);
                },
                onend : function(e){
                    that.editor.trigger('end',node,e);
                    that.trigger('end',node,e);
                },
                type : this.type,
                bounds : this.bounds,
                field : field,
                click : 'left',
                keepRotation:true,
                key : false
            });

            if (this.options) jNode.draggable('set',this.options);

            jNode.draggable('enable');

            field.css('cursor','move');

            this.display = true;

            return this;
        },
        /**
         * Masque le contrôle
         * @returns {Drag}
         */
        hide : function() {

            if (this.node) new JSYG(this.node).draggable('disable');
            this.display = false;
            return this;
        },
        /**
         * Met à jour le contrôle
         * @returns {Drag}
         */
        update : function() {

            if (!this.display) return this;

            var node = this.editor._target;
            if (!node) return this.hide();

            this.node = node;

            return this;
        }
    };

    /**
     * Edition des dimensions
     */
    function Resize(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
        /**
         * liste des contrôles
         */
        this.list = [];
        /**
         * liste des paliers horizontaux (largeurs en px)
         */
        this.stepsX = [];
        /**
         * liste des paliers verticaux (hauteurs en px)
         */
        this.stepsY = [];
        /**
         * Conteneur des contrôles
         */
        this.container = new JSYG('<g>')[0];
    }

    Resize.prototype = {

        constructor : Resize,

        container : null,

        /**
         * Classe appliquée au conteneur des contrôles
         */
        className : 'resize',
        /**
         * Forme utilisée pour les contrôles
         */
        shape : 'circle',
        /**
         * lien utilisé si shape est défini à "use"
         */
        xlink : null,
        /**
         * largeur des contrôles
         */
        width:10,
        /**
         * hauteur des contrôles
         */
        height:10,
        /**
         * Type de déplacement ("attributes" ou "transform" pour agir sur les attributs de mise en page ou sur la matrice de transformation)
         */
        type : 'attributes',
        /**
         * Indique si ce contrôle est actif dans le cas d'une sélection multiple
         */
        multiple : false,
        /**
         * Fonction(s) à exécuter à l'affichage des contrôles
         */
        onshow:null,
        /**
         * Fonction(s) à exécuter à la suppression des contrôles
         */
        onhide:null,
        /**
         * Fonction(s) à exécuter quand on prépare un déplacement (mousedown sur le contrôle)
         */
        onstart:null,
        /**
         * Fonction(s) à exécuter quand on commence un déplacement
         */
        ondragstart:null,
        /**
         * Fonction(s) à exécuter pendant le déplacement
         */
        ondrag:null,
        /**
         * Fonction(s) à exécuter en fin de déplacement
         */
        ondragend:null,
        /**
         * Fonction(s) à exécuter au relaéchement de la souris, qu'il y ait eu modification ou non
         */
        onend:null,
        /**
         * définit si l'élément est redimensionnable horizontalement
         */
        horizontal : true,
        /**
         * définit si l'élément est redimensionnable verticalement
         */
        vertical : true,
        /**
         * définit si le ratio doit etre conservé
         */
        keepRatio : false,
        /**
         * Permet de limiter le redimensionnement à l'intérieur de l'offsetParent (null pour annuler, valeur numérique négative pour aller au delà de l'offsetParent)
         */
        bounds : null,
        /**
         * Options supplémentaires pour le redimensionnement
         * @see {Resizable}
         */
        options : null,

        set : JSYG.StdConstruct.prototype.set,
        /**
         * Ajout d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Resize}
         */
        on : JSYG.StdConstruct.prototype.on,
        /**
         * Retrait d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Resize}
         */
        off : JSYG.StdConstruct.prototype.off,
        /**
         * Déclenche un événement customisé
         * @see JSYG.StdConstruct.prototype.trigger
         */
        trigger : JSYG.StdConstruct.prototype.trigger,
        /**
         * Indique si les contrôles sont activés ou non
         */
        enabled : false,
        /**
         * Indique si les contrôles sont affichés ou non
         */
        display : false,
        /**
         * Activation des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {Resize}
         */
        enable : function(opt) {
            this.hide(true);
            if (opt) this.set(opt);
            var container = this.editor.box.container;
            if (container && container.parentNode) this.show();
            this.enabled = true;
            return this;
        },
        /**
         * Désactivation des contrôles
         *  @returns {Resize}
         */
        disable : function() {
            this.hide();
            this.enabled = false;
            return this;
        },
        /**
         * Affichage des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {Resize}
         */
        show : function(opt,_preventEvent) {

            this.hide(true);

            if (opt) this.set(opt);

            var node = this.editor._target;
            if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();
            this.node = node;

            var jNode = new JSYG(node),
            isSVG = jNode.isSVG(),
            parent = isSVG ? this.editor.box.container : document.body;

            if (isSVG && this.container.tagName == 'DIV') {
                this.container = new JSYG('<g>')[0];
                this.shape = 'circle';
            } else if (!isSVG && this.container.tagName == 'g') {
                this.container = new JSYG('<div>')[0];
                this.shape = 'div';
            }

            new JSYG(this.container).appendTo(parent).addClass(this.className);

            var list = [],
            that = this,
            displayShadow = this.editor.box.displayShadow,
            backup,

            createShape = function() {
                var shape = new JSYG('<'+that.shape+'>').appendTo(that.container);
                if (that.xlink) { shape.href(that.xlink); }
                shape.setDim({x:0,y:0,width:that.width,height:that.height});
                return shape;
            },

            start = function(e) {
                new JSYG(that.container).appendTo(isSVG ? that.editor.box.container : document.body);
                backup = {
                    ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
                    ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
                };
                that.editor.trigger('start',node,e);
                that.trigger('start',node,e);
            },

            dragstart = function(e) {
                for (var n in backup) {
                    if (!backup[n]) continue;
                    new JSYG(that.editor[n].container).hide();
                    that.editor[n].display = false;
                }
                that.editor.box.displayShadow = false;
                that.editor.trigger('dragstart',node,e);
                that.trigger('dragstart',node,e);
            },

            drag = function(e){
                that.editor.update();
                that.editor.trigger('drag',node,e);
                that.trigger('drag',node,e);
            },

            dragend = function(e) {
                if (that.editor.isMultiSelection()) new Container(that.editor._target).applyTransform();
                that.editor.box.displayShadow = displayShadow;
                for (var n in backup){
                    if (!backup[n]) continue;
                    new JSYG(that.editor[n].container).show();
                    that.editor[n].display = true;
                }
                new JSYG(that.container).appendTo(parent); //pour que les controles restent au 1er plan
                that.editor.update();
                that.editor.trigger('dragend',node,e);
                that.editor.trigger('change',node,e);
                that.trigger('dragend',node,e);
            },

            end = function(e){
                that.editor.trigger('end',node,e);
                that.trigger('end',node,e);
            };

            jNode.resizable('set',{ //default options
                event:'mousedown',
                eventWhich:1,
                onstart:start,
                ondragstart:dragstart,
                ondrag:drag,
                ondragend:dragend,
                onend:end,
                keepRatio:this.keepRatio || false,
                keepRotation:true,
                type:this.type,
                bounds:this.bounds,
                inverse:false,
                method: isSVG ? 'fixedPoint' : 'normal',
                originX:'auto',
                originY:'auto'
            });

            if (this.stepsX) jNode.resizable('set',{stepsX:{list:this.stepsX}});
            if (this.stepsY) jNode.resizable('set',{stepsY:{list:this.stepsY}});

            if (this.options) jNode.resizable('set',this.options);

            if (this.horizontal && this.vertical) {

                var resizeFromCorner = function(e) {
                    jNode.resizable('enable',{horizontal:true,vertical:true,field:this,evt:e});
                };

                [0,1,2,3].forEach(function(i) {
                    list[i] = createShape().on('mousedown',resizeFromCorner)[0];
                });
            }

            if (!this.keepRatio) {

                if (this.horizontal) {

                    var horizontalResize = function(e) {
                        jNode.resizable('enable',{horizontal:true,vertical:false,field:this,evt:e});
                    };

                    [4,5].forEach(function(i) {
                        list[i] = createShape().on('mousedown',horizontalResize)[0];
                    });
                }

                if (this.vertical) {

                    var verticalResize = function(e) {
                        jNode.resizable('enable',{horizontal:false,vertical:true,field:this,evt:e});
                    };

                    [6,7].forEach(function(i) {
                        list[i] = createShape().on('mousedown',verticalResize)[0];
                    });
                }

                var jDoc = new JSYG(document);

                var documentFct = {
                    keydown:function(e) { if (e.keyCode === 17) { jNode.resizable('set',{keepRatio:true}); } },
                    keyup:function(e) { if (e.keyCode === 17) { jNode.resizable('set',{keepRatio:false}); } }
                };

                jDoc.data('svgeditor',documentFct);
                jDoc.on(documentFct);
            }

            this.list = list;

            this.display = true;

            this.update();

            if (!_preventEvent) this.trigger('show',node);

            return this;
        },
        /**
         * Masque les contrôles
         * @returns {Resize}
         */
        hide : function(_preventEvent) {

            if (this.container) new JSYG(this.container).empty().remove();

            this.list.splice(0,this.list.length);

            var jDoc = new JSYG(document);
            var documentFct = jDoc.data('svgeditor');
            if (documentFct) jDoc.off(documentFct);

            if (this.node) new JSYG(this.node).resizable('destroy');

            this.display = false;

            if (!_preventEvent) this.trigger('hide',this.node);

            return this;
        },
        /**
         * Met à jour les contrôles
         * @returns {Resize}
         */
        update : function() {

            if (!this.display) return this;

            var node = this.editor._target;
            if (!node) return this.hide();

            //il y a changemet des options, il faut réafficher tout
            if (!this.keepRatio && !this.list[4] || this.keepRatio && this.list[4]) { return this.show(); }

            var jNode = new JSYG(node),
            isSVG = jNode.isSVG(),
            b = jNode.getDim(),
            CTM = (function() {
                if (isSVG) return jNode.getMtx(jNode.offsetParent("farthest"));
                else {
                    var dimParent = jNode.offsetParent().getDim('page');
                    return new JSYG.Matrix().translate(dimParent.x,dimParent.y).multiply(jNode.getMtx());
                }
            }()),
            topleft = new JSYG.Vect(b.x,b.y).mtx(CTM),
            topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM),
            bottomleft = new JSYG.Vect(b.x,b.y+b.height).mtx(CTM),
            bottomright = new JSYG.Vect(b.x+b.width,b.y+b.height).mtx(CTM),
            angle = Math.atan2((topright.y-topleft.y)/2,(topright.x-topleft.x)/2),
            angleTest = Math.abs(angle % Math.PI),
            inverse = angleTest > Math.PI/4 && angleTest < Math.PI*3/4;

            new JSYG(this.list[0]).setCenter(topleft.x,topleft.y).css('cursor',(inverse ? 'n' : 's' ) + 'e-resize');
            new JSYG(this.list[1]).setCenter(topright.x,topright.y).css('cursor',(inverse ? 's' : 'n' ) + 'e-resize');
            new JSYG(this.list[2]).setCenter(bottomleft.x,bottomleft.y).css('cursor',(inverse ? 's' : 'n' ) + 'e-resize');
            new JSYG(this.list[3]).setCenter(bottomright.x,bottomright.y).css('cursor',(inverse ? 'n' : 's' ) + 'e-resize');

            if (!this.keepRatio) {

                new JSYG(this.list[4]).setCenter((topright.x+bottomright.x)/2,(topright.y+bottomright.y)/2).css('cursor',(inverse ? 'n' : 'e' ) + '-resize');
                new JSYG(this.list[5]).setCenter((topleft.x+bottomleft.x)/2,(topleft.y+bottomleft.y)/2).css('cursor',(inverse ? 'n' : 'e' ) + '-resize');
                new JSYG(this.list[6]).setCenter((topleft.x+topright.x)/2,(topleft.y+topright.y)/2).css('cursor',(inverse ? 'e' : 'n' ) + '-resize');
                new JSYG(this.list[7]).setCenter((bottomleft.x+bottomright.x)/2,(bottomleft.y+bottomright.y)/2).css('cursor',(inverse ? 'e' : 'n' ) + '-resize');
            }

            return this;
        }
    };

    /**
     * Edition de la rotation
     */
    function Rotate(editorObject) {
        /**
         * référence vers l'objet Editor parent
         */
        this.editor = editorObject;
        /**
         * liste des contrôles
         */
        this.list = [];
        /**
         * liste des paliers
         */
        this.steps = [0,90,180,270];
        /**
         * Conteneur des contrôles
         */
        this.container = new JSYG('<g>')[0];
    }

    Rotate.prototype = {

        constructor : Rotate,
        /**
         * Classe appliquée au conteneur des contrôles
         */
        className : 'rotate',
        /**
         * Forme utilisée pour les contrôles
         */
        shape : 'circle',
        /**
         * lien utilisé si shape est défini à "use"
         */
        xlink : null,
        /**
         * largeur des contrôles
         */
        width:10,
        /**
         * hauteur des contrôles
         */
        height:10,
        /**
         * Indique si ce contrôle est actif dans le cas d'une sélection multiple
         */
        multiple : false,
        /**
         * Curseur à appliquer à l'élément de contrôle
         */
        cursor: Rotatable.prototype.cursor,
        /**
         * Fonction(s) à exécuter à l'affichage des contrôles
         */
        onshow:null,
        /**
         * Fonction(s) à exécuter à la suppression des contrôles
         */
        onhide:null,
        /**
         * Fonction(s) à exécuter quand on prépare un déplacement (mousedown sur le contrôle)
         */
        onstart:null,
        /**
         * Fonction(s) à exécuter quand on commence un déplacement
         */
        ondragstart:null,
        /**
         * Fonction(s) à exécuter pendant le déplacement
         */
        ondrag:null,
        /**
         * Fonction(s) à exécuter en fin de déplacement
         */
        ondragend:null,
        /**
         * Fonction(s) à exécuter au relachement de la souris, qu'il y ait eu modification ou non
         */
        onend:null,
        /**
         * Options supplémentaires pour la rotation
         * @see {Rotatable}
         */
        options : null,

        set : JSYG.StdConstruct.prototype.set,
        /**
         * Ajout d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Rotate}
         */
        on : JSYG.StdConstruct.prototype.on,
        /**
         * Retrait d'écouteurs d'événements customisés
         * @see JSYG.StdConstruct.prototype.on
         * @returns {Rotate}
         */
        off : JSYG.StdConstruct.prototype.off,
        /**
         * Déclenche un événement customisé
         * @see JSYG.StdConstruct.prototype.trigger
         */
        trigger : JSYG.StdConstruct.prototype.trigger,
        /**
         * Indique si les contrôles sont activés ou non
         */
        enabled : false,
        /**
         * Indique si les contrôles sont affichés ou non
         */
        display : false,
        /**
         * Activation des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {Rotate}
         */
        enable : function(opt) {
            this.hide(true);
            if (opt) this.set(opt);
            var container = this.editor.box.container;
            if (container && container.parentNode) this.show();
            this.enabled = true;
        },
        /**
         * Désactivation des contrôles
         *  @returns {Rotate}
         */
        disable : function() {
            this.hide();
            this.enabled = false;
        },
        /**
         * Affichage des contrôles
         * @param opt optionnel, objet définissant les options
         * @returns {Rotate}
         */
        show : function(opt,_preventEvent) {

            this.hide(true);

            if (opt) this.set(opt);

            var node = this.editor._target;

            if (!node || this.editor.isMultiSelection() && !this.multiple) return this.hide();

            this.node = node;

            var jNode = new JSYG(node),
            isSVG = jNode.isSVG(),
            parent = isSVG ? this.editor.box.container : document.body,
            that = this;

            if (!isSVG) return this;

            if (isSVG && this.container.tagName == 'DIV') {
                this.container = new JSYG('<g>')[0];
                this.shape = 'circle';
            } else if (!isSVG && this.container.tagName == 'g') {
                this.container = new JSYG('<div>')[0];
                this.shape = 'div';
            }

            new JSYG(this.container).appendTo(parent).addClass(this.className);

            var shape = new JSYG('<'+this.shape+'>').appendTo(this.container);
            if (this.xlink) shape.href(this.xlink);
            shape.setDim({x:0,y:0,width:this.width,height:this.height});
            shape.css('cursor',this.cursor);

            this.list[0] = shape[0];

            var displayShadow = this.editor.box.displayShadow;

            var backup;

            var start = function(e) {
                backup = {
                    ctrlsMainPoints : that.editor.ctrlsMainPoints.enabled,
                    ctrlsCtrlPoints : that.editor.ctrlsCtrlPoints.enabled
                };
                that.editor.trigger('start',node,e);
                that.trigger('start',node,e);
            },

            dragstart = function(e) {
                for (var n in backup) {
                    if (!backup[n]) continue;
                    new JSYG(that.editor[n].container).hide();
                    that.editor[n].display = false;
                }
                that.editor.box.displayShadow = false;
                that.editor.trigger('dragstart',node,e);
                that.trigger('dragstart',node,e);
            },

            drag = function(e){
                that.editor.update();
                that.editor.trigger('drag',node,e);
                that.trigger('drag',node,e);
            },

            dragend = function(e){
                if (that.editor.isMultiSelection()) new Container(that.editor._target).applyTransform();
                that.editor.box.displayShadow = displayShadow;
                for (var n in backup){
                    if (!backup[n]) continue;
                    new JSYG(that.editor[n].container).show();
                    that.editor[n].display = true;
                }
                new JSYG(that.container).appendTo(parent); //pour remettre les controles au 1er plan
                that.editor.update();
                that.editor.trigger('dragend',node,e);
                that.editor.trigger('change',node,e);
                that.trigger('dragend',node,e);
            },

            end = function(e){
                that.editor.trigger('end',node,e);
                that.trigger('end',node,e);
            };

            jNode.rotatable('set',{
                event:'mousedown',
                eventWhich:1,
                field:this.list[0],
                onstart:start,
                ondragstart:dragstart,
                ondrag:drag,
                ondragend:dragend,
                onend:end,
                key:false,
                click:"left",
                cursor:this.cursor
            });

            if (this.steps) jNode.rotatable('set',{steps:{list:this.steps}});
            if (this.options) jNode.rotatable('set',this.options);

            jNode.rotatable('enable');

            this.display = true;

            this.update();

            if (!_preventEvent) this.trigger('show',node);

            return this;
        },
        /**
         * Masque les contrôles
         * @returns {Rotate}
         */
        hide : function(_preventEvent) {

            if (this.container) new JSYG(this.container).empty().remove();
            if (this.node) new JSYG(this.node).rotatable('destroy');
            this.list.splice(0,this.list.length);
            this.display = false;
            if (!_preventEvent) this.trigger('hide',this.node);
            return this;
        },
        /**
         * Met à jour les contrôles
         * @returns {Rotate}
         */
        update : function() {

            if (!this.display) return this;

            var node = this.editor._target;

            if (!node) return this.hide();
            this.node = node;

            var jNode = new JSYG(node),
            b = jNode.getDim(),
            CTM = (function() {
                if (jNode.isSVG()) return jNode.getMtx(jNode.offsetParent("farthest"));
                else {
                    var dimParent = jNode.offsetParent().getDim('page');
                    return new JSYG.Matrix().translate(dimParent.x,dimParent.y).multiply(jNode.getMtx());
                }
            }()),
            topleft = new JSYG.Vect(b.x,b.y).mtx(CTM),
            topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM),
            angle = Math.atan2((topright.y-topleft.y)/2,(topright.x-topleft.x)/2);

            new JSYG(this.list[0]).setCenter(
                (topleft.x+topright.x)/2 + 15 * Math.sin(angle),
            (topleft.y+topright.y)/2 - 15 * Math.cos(angle)
                );

            return this;
        }
    };

    JSYG.Editor = Editor;

    return Editor;
});
