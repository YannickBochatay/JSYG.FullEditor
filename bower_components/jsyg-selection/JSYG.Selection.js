/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-selection",["jsyg","jsyg-resizable","jquery-hotkeys"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Resizable) factory(JSYG,JSYG.Resizable);
        else throw new Error("JSYG.Resizable is needed");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG,Resizable) {
    
    "use strict";
    
    /**
     * Sélection d'éléments par tracé d'un cadre avec la souris<br/><br/>
     * @param arg optionnel, argument JSYG, conteneur sur lequel s'applique la selection (si non défini, ce sera window.document)
     * @param opt optionnel, objet définissant les options. Si défini, le tracé de sélection est activé implicitement
     * @returns {Selection}
     * @example <pre>var select = new Selection();
     * select.list = ".selectable"; //liste des éléments sélectionnables
     * select.on("selectedlist",function(e,liste) {
     * 	alert("j'ai sélectionné "+liste.length+" éléments");
     * });
     * select.enable();
     */
    function Selection(arg,opt) {
        /**
         * Liste des éléments sélectionnés
         */
        this.selected = [];
        /**
         * Liste des éléments survolés
         */
        this.selectedOver = [];
        /**
         * élément div de tracé de sélection
         */
        this.container = document.createElement('div');
        
        if (arg) this.setNode(arg);
        if (opt) this.enable(opt);
    }
    
    Selection.prototype = new JSYG.StdConstruct();
    
    Selection.prototype.constructor = Selection;
    
    /**
     * id appliqué à l'élément de tracé de sélection (this.container)
     */
    Selection.prototype.id = 'Selection';
    /**
     * argument JSYG définissant les objets sélectionnables
     */
    Selection.prototype.list = null;
    /**
     * Autorise ou non la sélection multiple (par tracé ou ctrl+clic)
     */
    Selection.prototype.multiple = true;
    /**
     * Type de recouvrement pour considéré l'élément comme sélectionné.
     * 'full' : la sélection doit recouvrir entièrement l'élément,
     * 'partial' : la sélection doit chevaucher l'élément
     * 'center' : la sélection doit chevaucher le centre de l'élément
     * @see JSYG.isOver
     */
    Selection.prototype.typeOver = 'full';
    
    /**
     * Raccourci clavier pour tout sélectionner
     */
    Selection.prototype.shortCutSelectAll = 'ctrl+a';
    /**
     * Fonction(s) à exécuter avant le début du tracé (renvoyer false pour l'empêcher)
     */
    Selection.prototype.onbeforedrag = null;
    
    Selection.prototype.onbeforeselect = null;
    Selection.prototype.onbeforedeselect = null;
    /**
     * Fonction(s) à exécuter au début du tracé
     */
    Selection.prototype.ondragstart = null;
    /**
     * Fonction(s) à exécuter pendant tracé
     */
    Selection.prototype.ondrag = null;
    /**
     * Fonction(s) à exécuter à la fin du tracé
     */
    Selection.prototype.ondragend = null;
    /**
     * Fonction(s) à exécuter sur chaque élément nouvellement recouvert par la sélection
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : l'élément survolé
     * 2ème argument : évènement Event
     */
    Selection.prototype.onselectover = null;
    /**
     * Fonction(s) à exécuter sur chaque élément recouvert pendant le tracé de la sélection
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : l'élément survolé
     * 2ème argument : évènement Event
     */
    Selection.prototype.onselectmove = null;
    /**
     * Fonction(s) à exécuter sur chaque élément qui sort du tracé de la sélection
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : l'élément survolé
     * 2ème argument : évènement Event
     */
    Selection.prototype.onselectout = null;
    /**
     * Fonction(s) à exécuter sur chaque élément sélectionné (au relachement de la souris)
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : l'élément survolé
     * 2ème argument : évènement Event
     */
    Selection.prototype.onselect = null;
    /**
     * Fonction(s) à exécuter sur chaque élément désélectionné (début d'une nouvelle sélection)
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : l'élément survolé
     * 2ème argument : évènement Event
     */
    Selection.prototype.ondeselect = null;
    /**
     * Fonction(s) à exécuter sur la liste des éléments sélectionnés (au relachement de la souris)
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : tableau des éléments sélectionnés
     * 2ème argument : évènement Event
     */
    Selection.prototype.onselectedlist = null;
    /**
     * Fonction(s) à exécuter sur la liste des éléments désélectionnés (début d'une nouvelle sélection)
     * this fait référence au conteneur sur lequel s'applique la selection (ou undefined si non défini)
     * 1er argument : tableau des éléments sélectionnés
     * 2ème argument : évènement Event
     */
    Selection.prototype.ondeselectedlist = null;
    /**
     * Indique si la sélection est active ou non
     */
    Selection.prototype.enabled = false;
    /**
     * Classe à appliquer aux éléments sélectionnés
     */
    Selection.prototype.classSelected = 'selected';
    /**
     * Classe à appliquer aux éléments sélectionnables survolés
     */
    Selection.prototype.classOver = 'selectOver';
    
    /**
     * Options du plugin Resizable à ajouter (pour le tracé souris)
     */
    Selection.prototype.resizableOptions = null;
    
    /**
     * sélectionne un élément
     * @param item argument JSYG à ajouter à la sélection
     * @param e Event (dans le cas à la méthode est appelée depuis un évènement)
     */
    Selection.prototype.addElmt = function(elmt,e) {
        
        var node = new JSYG(elmt).addClass(this.classSelected)[0];
        
        if (new JSYG(this.list).index(elmt) == -1) throw new Error("L'élément n'est pas sélectionnable");
        
        if (this.selected.indexOf(node) != -1) throw new Error("L'élément est déjà dans la liste");
        
        if (!node.parentNode) throw new Error("L'élément n'est pas attaché au DOM");
        
        this.selected.push(node);
        
        this.trigger('select',this.node,e,node);
    };
    
    /**
     * Supprime un élément de la sélection
     * @param item argument JSYG à ajouter à la sélection
     * @param e Event (dans le cas à la méthode est appelée depuis un évènement)
     */
    Selection.prototype.removeElmt = function(elmt,e) {
        
        var node = new JSYG(elmt).removeClass(this.classSelected)[0];
        
        var ind = this.selected.indexOf(node);
        
        if (ind == -1) throw new Error("L'élément n'est pas dans la liste");
        
        this.selected.splice(ind,1);
        
        this.trigger('deselect',this.node,e,node);
    };
    
    /**
     * définit la sélection
     * @param arg argument JSYG faisant référence à la sélection
     * @param e Event (dans le cas à la méthode est appelée depuis un évènement)
     * @returns {Selection}
     */
    Selection.prototype.setSelection = function(arg,e) {
        
        var that = this;
        
        this.deselectAll(e);
        
        new JSYG(arg).each(function() { that.addElmt(this,e); });
        
        if (this.selected.length > 0) this.trigger('selectedlist',this.node,e,this.selected);
        
        return this;
    };
    
    /**
     * Supprime la sélection
     * @param e Event (dans le cas à la méthode est appelée depuis un évènement)
     * @returns {Selection}
     */
    Selection.prototype.deselectAll = function(e) {
        
        var that = this,
            selected = this.selected.slice();
        
        new JSYG(this.list).removeClass(this.classSelected,this.classOver); //par précaution
        
        while (this.selected.length > 0) this.removeElmt(this.selected[0],e);
        
        this.trigger('deselectedlist',this.node,e,selected);
        
        this.selectedOver.forEach(function(elmt) {
            elmt = new JSYG(elmt).removeClass(that.classSelected);
            that.trigger('selectout',that.node,e,elmt[0]);
        });
        
        this.selected = [];
        this.selectedOver = [];
        
        return this;
    };
    
    Selection.prototype._draw = function(e) {
               
        var list = new JSYG(this.list),
        container = new JSYG(this.container),
        resize = new Resizable(container),
        that = this;
        
        container.attr('id',this.id)
        .appendTo(document.body)
        .setDim({
            x:e.pageX,
            y:e.pageY,
            width:1,
            height:1
        });
        
        resize.set({
            keepRatio:false,
            type:'attributes',
            originY:'top',
            originX:'left',
            cursor:false,
            inverse:true
        });
        
        if (this.resizableOptions) resize.set(this.resizableOptions);
        
        resize.on('dragstart',function(e) {
            
            list.each(function() {
                
                var dim,
                $this = new JSYG(this);
                try {
                    dim = $this.getDim('screen');
                    $this.data("dimSelection",dim);
                }
                catch(e) {
                    //éléments n'ayant pas de dimensions (exemple balise defs)
                }
                
            });
            
            that.trigger('dragstart',that.node,e);
        });
        
        resize.on('drag',function(e) {
            
            var div = new JSYG(this),
            dimDiv = div.getDim('screen');
            
            list.each(function() {
                
                var elmt = new JSYG(this),
                dimElmt = elmt.data("dimSelection"),
                indOver = dimElmt && that.selectedOver.indexOf(this),
                isNewElmt = (indOver === -1);
                
                if (!dimElmt) return;
                
                if (JSYG.isOver(dimDiv,dimElmt,that.typeOver)) {
                    
                    if (isNewElmt) {
                        
                        elmt.addClass(that.classOver);
                        that.trigger('selectover',that.node,e,this);
                        that.selectedOver.push(this);
                    }
                    else that.trigger('selectmove',that.node,e,this);
                }
                else {
                    
                    if (!isNewElmt) {
                        elmt.removeClass(that.classOver);
                        that.trigger('selectout',that.node,e,this);
                        that.selectedOver.splice(indOver,1);
                    }
                }
            });
            
            that.trigger('drag',that.node,e,this);
        });
        
        resize.on('dragend',function(e) {
            
            var elmts = [];
            
            list.each(function() {
                
                var indOver = that.selectedOver.indexOf(this);
                
                if (indOver !== -1) {
                    
                    that.trigger('selectout',that.node,e,this);
                    
                    if (that.trigger("beforeselect",that.node,e,this)) elmts.push(this);
                }
            });
            
            that.setSelection(elmts,e);
            
            that.trigger('dragend',that.node,e,this);
            
            new JSYG(this).remove();
        });
        
        resize.on('end',function() { new JSYG(this).remove(); });
        
        resize.start(e);
        
        return this;
        
    };
    
    Selection.prototype._getTarget = function(e) {
        
        var list = new JSYG(this.list);
        
        if (list.index(e.target) !== -1) return e.target;
        
        var child = new JSYG(e.target),
        target = null;
        
        list.each(function() {
            if (child.isChildOf(this)) { target = this; return false; }
        });
        
        return target;
    };
    
    Selection.prototype._isIn = function(e) {
        
        return e.target == this.node || new JSYG(e.target).isChildOf(this.node);
    };
    
    /**
     * Activation du tracé de sélection
     * @param opt optionnel, objet définissant les options
     * @returns {Selection}
     */
    Selection.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
        
        var that = this,
        
        drawing = false,
        
        $doc = new JSYG(document),
        
        $canvas = this.node && new JSYG(this.node) || $doc,
                
        fcts = {
            
            "mousedown" : function(e) {
                                
                if (e.which != 1) return;
                                
                if ((!e.ctrlKey || !that.multiple) && that.trigger("beforedeselect",that.node,e)!==false) that.deselectAll(e);
                
                var cible = that._getTarget(e);
                                
                if (cible) {
                    
                    if (that.trigger("beforeselect",that.node,e,cible)!==false) {
                        that.setSelection( that.selected.concat(cible), e);
                    }
                }
                else if (!that.node || that._isIn(e)) drawing = true;
            },
            
            "drag:start" : function(e) {
                                
                if (that.multiple && that.trigger("beforedrag",that.node,e) !== false) that._draw(e);
                else drawing = false;
            },
            
            "mousemove" : function(e) {
                
                if (drawing) return;
                
                var lastOver = that.selectedOver[0] || null,
                cible = that._getTarget(e);
                
                if (lastOver && lastOver !== cible) {
                                        
                    new JSYG(lastOver).removeClass(that.classOver);
                    that.trigger('selectout',that.node,e,lastOver);
                    that.selectedOver = [];
                }
                
                if (cible) {
                    
                    if (lastOver === cible) that.trigger('selectmove',that.node,e,lastOver);
                    else {
                        that.trigger('selectover',that.node,e,cible);
                        new JSYG(cible).addClass(that.classOver);
                    }
                    that.selectedOver = [cible];
                }
            },
            
            "mouseout" : function(e) {
                
                if (drawing) return;
                                
                var lastOver = that.selectedOver[0];
                
                if (lastOver) {
                    
                    new JSYG(lastOver).removeClass(that.classOver);
                    that.trigger('selectout',that.node,e,lastOver);
                    that.selectedOver = [];
                }
            }
        };
        
        function mouseup() { drawing = false; }
        
        function shortCutSelectAll(e) {
            e.preventDefault();
            that.setSelection(that.list,e);
        }
        
        if (this.shortCutSelectAll) $doc.on("keydown",null,this.shortCutSelectAll,shortCutSelectAll);
        
        $doc.on("mouseup",mouseup);
        
        $canvas.dragEvents().on(fcts);
        
        this.enabled = true;
        
        this.disable = function() {
            
            $canvas.off(fcts).dragEvents("destroy");
            if (this.shortCutSelectAll) $doc.off("keydown",null,this.shortCutSelectAll,shortCutSelectAll);
            this.enabled = false;
            return this;
        };
        
        return this;
    };
    
    /**
     * Désactivation du tracé de sélection
     * @returns {Selection}
     */
    Selection.prototype.disable = function() { return this; };
    
    JSYG.Selection = Selection;
    
    return Selection;
});