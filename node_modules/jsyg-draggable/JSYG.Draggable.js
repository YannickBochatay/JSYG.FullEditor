(function(root,factory) {
    
    if (typeof module == "object" && typeof module.exports == "object") {
      
      module.exports = factory( require("jsyg") );
    }
    else if (typeof define != "undefined" && define.amd) {
      
      define("jsyg-draggable",["jsyg"],factory);
    }
    else if (typeof JSYG != "undefined") {
        if (JSYG.Matrix && JSYG.StdConstruct && JSYG.Vect) factory(JSYG);
        else throw new Error("Dependency is missing");
    }
    else throw new Error("JSYG is needed");
    
})(this,function(JSYG) {
            
    "use strict";
    
    /**
     * Aimants vers lesquels l'objet sera attiré
     * @returns {Guides}
     */
    function Guides() {};
    
    Guides.prototype = new JSYG.StdConstruct();
    
    Guides.prototype.constructor = Guides;
    /**
     * Liste des aimants : liste d'objets de coordonnées (propriété(s) <strong>x</strong> et/ou <strong>y</strong>)
     */
    Guides.prototype.list = null;
    /**
     * Nombre de pixels pour lesquels l'élément DOM sera attiré vers l'aimant
     */
    Guides.prototype.strength = 10;
    /**
     * Abcisses(s) de référence de l'élément séparés par un espace
     */
    Guides.prototype.originX = 'left center right';
    /**
     * Ordonnées(s) de référence de l'élément séparés par un espace
     */
    Guides.prototype.originY = 'top center bottom';
    /**
     * Exige que l'élément soit déposé sur un guide (sinon il retournera à sa place)
     * @type {Boolean}
     */
    Guides.prototype.require = false;
    /**
     * Classe à appliquer à l'élément lorsqu'il est en contact avec un aimant
     */
    Guides.prototype.className = 'aimant';
    /**
     * Fonction(s) à exécuter lorsque l'élément entre en intéraction avec un aimant.
     */
    Guides.prototype.onreach = null;
    /**
     * Fonction(s) à exécuter lorsque l'élément quitte un aimant.
     */
    Guides.prototype.onleave = null;
    /**
     * Fonction(s) à exécuter lorsque l'élément est relaché sur un aimant.
     */
    Guides.prototype.onsuccess = null;
    /**
     * Fonction(s) à exécuter lorsque l'élément est relaché hors de portée d'un aimant.
     */
    Guides.prototype.onfail = null;
    
    /**
     * <strong>nécessite le module Draggable</strong><br/><br/>
     * Drag&drop d'un élément DOM 
     * @param arg argument JSYG faisant référence à l'élément
     * @param opt optionnel, objet définissant les options. Si défini le drag&drop est activé implicitement. 
     * @returns {Draggable}
     */
    function Draggable(arg,opt) {
        
        /**
         * Aimants vers lesquels l'objet sera attiré
         */
        this.guides = new Guides();
        
        if (arg) {
            
            this.setNode(arg);
            this.field = this.node;
            
            if (opt) this.enable(opt);
        }
        else if (opt) this.set(opt);
    };
    
    function shape(node) {
        return ['path','polyline','polygon','g','text'].indexOf(node.tagName) !== -1 ?  'noAttribute' : 'shape';
    };
    
    function rap(dec) {
        if (dec == null || dec === 'center') return 0.5;
        else if (dec === 'top' || dec === 'left') return 0;
        else if (dec === 'bottom' || dec === "right") return 1;
    };
        
    Draggable.prototype = new JSYG.StdConstruct();
    
    Draggable.prototype.constructor = Draggable;
    
    /**
     * Champ(s) sur le(s)quel(s) on clique pour déclencher le drag&drop. Par défaut l'élément lui-même.
     */
    Draggable.prototype.field = null;
    /**
     * Restriction à un bouton de la souris (1 bouton gauche, 2 bouton du milieu, 3 bouton droit)
     */
    Draggable.prototype.eventWhich = 1;
    /**
     * Classe à appliquer pendant le drag&drop
     */
    Draggable.prototype.className = null;
    /**
     * Déplacement horizontal
     */
    Draggable.prototype.horizontal = true;
    /**
     * Déplacement vertical
     */
    Draggable.prototype.vertical = true;
    /**
     * 'attributes' ou 'transform'. Agit sur les attrobuts de mise en page
     * ou sur la matrice de transformation
     */
    Draggable.prototype.type = 'attributes';
    /**
     * Garde ou non la rotation à la conversion de la matrice en attributs
     * de mise en page (si type=="attributes")
     */
    Draggable.prototype.keepRotation = false;
    /**
     * Permet de fixer automatiquement les valeurs minLeft,maxRight,minTop,maxBottom par rapport au offsetParent
     * (valeur positive ou nulle pour brider à l'intérieur du offsetParent, valeur négative pour brider au delà du offsetParent
     **/
    Draggable.prototype.bounds = null;
    /**
     * abcisse minimale
     */
    Draggable.prototype.minLeft = null;
    /**
     * ordonnée minimale
     */
    Draggable.prototype.minTop = null;
    /**
     * abcisse maximale
     */
    Draggable.prototype.maxRight = null;
    /**
     * ordonnée maximale
     */
    Draggable.prototype.maxBottom = null;
    
    /**
     * Scrolle ou non automatiquement si on sort de la fenêtre
     */
    Draggable.prototype.autoScroll = false;
    /**
     * type de curseur à appliquer pendant le drag& drop.
     * La valeur 'auto' permet un curseur adapté aux options définies.
     */
    Draggable.prototype.cursor = 'auto';
    /**
     * fonction(s) à exécuter à la préparation d'un déplacement (événement mousedown)
     */			
    Draggable.prototype.onstart = null;
    /**
     * fonction(s) à exécuter au début du déplacement
     */
    Draggable.prototype.ondragstart = null;
    /**
     * fonction(s) à exécuter pendant le déplacement
     */
    Draggable.prototype.ondrag = null;
    /**
     * fonction(s) à exécuter à la fin du déplacement
     */
    Draggable.prototype.ondragend = null;
    /**
     * fonction(s) à exécuter au relachement de la souris qu'il y ait eu déplacement ou non
     */
    Draggable.prototype.onend = null;
    /**
     * Indique si le drag&drop est actif ou non
     */
    Draggable.prototype.enabled = false;
    
    /**
     * Démarrage du drag&drop. méthode exécutée sur l'événement "mousedown".
     * @param {Object} e : objet Event.
     */
    Draggable.prototype.start = function(e) {
        
        e.preventDefault();
        
        var jNode = new JSYG(this.node),
        parent = jNode.offsetParent();
        
        if (JSYG.isNumeric(this.bounds)) {
            
            var dimParent = parent.getDim();
            this.minLeft = - this.bounds;
            this.minTop = - this.bounds;
            this.maxRight = dimParent.width + this.bounds;
            this.maxBottom = dimParent.height + this.bounds;
        }
        
        var that = this,
        isSvg = jNode.isSVG(),
        mtxScreenInitInv = jNode.getMtx("screen").inverse(),
        mtxInit = jNode.getMtx(),
        mouseInit = new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInitInv),
        dimInit = jNode.getDim(),
        mtxScreenParent = parent.getMtx('screen'),
        bornes = (this.minLeft!=null || this.minTop!=null || this.maxRight!=null || this.maxBottom!=null) ? true : false,
        guides = this.guides,
        hasChanged = false,
        triggerDragStart = false,
        dimWin = new JSYG(window).getDim(),
        cursor,
        fcts = {};
        
        if (this.cursor === 'auto') {
            
            if (this.horizontal && this.vertical) cursor = 'move';
            else if (this.horizontal) cursor = 'e-resize';
            else cursor = 'n-resize';
        }
        else cursor = this.cursor;
        
        if (cursor) {
            
            new JSYG(this.field).each(function() {
                var field = new JSYG(this);
                field.data('cursorInit',field.css('cursor'));
                field.css('cursor',cursor);
            });
        }
        
        if (this.className) jNode.addClass(this.className);
        
        if (guides.list && guides.list.length > 0) {
            
            guides.offsetX = (function() {
                var tab = guides.originX.trim().split(/ +/),
                dec = [];
                tab.forEach(function(origin) { dec.push(rap(origin)); });
                return dec;
            })();
            
            guides.offsetY = (function() {
                var tab = guides.originY.trim().split(/ +/),
                dec = [];
                tab.forEach(function(origin) { dec.push(rap(origin)); });
                return dec;
            })();
        }
        
        function mousemoveFct(e) {
            
            if (!triggerDragStart) {
                that.trigger('dragstart',that.node,e);
                triggerDragStart = true;
            }
            
            var oldOk = false,
            mtxScreenInv,
            mtxScreenParentInv,
            magnet,guide,ref,
            i,j,k,N,M,P,
            mtx,dim,rect,
            x,y,
            pt1,pt2,
            mouse,
            reachedX=false,
            reachedY=false,
            dimFromWin,
            scrollX=0,scrollY=0;
            
            function applyMagnet(pt1,pt2) {
                
                mtx = mtx.translate(pt2.x-pt1.x,pt2.y-pt1.y);
                
                if (that.type !== 'transform' && that._shape !== 'noAttribute') {
                    dim.x+= pt2.x-pt1.x;
                    dim.y+= pt2.y-pt1.y;
                    jNode.setDim(dim);
                }
                else { jNode.setMtx(mtx); }
                
                jNode.addClass(guides.className);
                
                guides.ok = true;
                
                if (!oldOk) guides.trigger('reach',that.node,e);
            }
            
            mouse = new JSYG.Vect(e.clientX,e.clientY).mtx(mtxScreenInitInv);
            
            mtx = mtxInit.translate(that.horizontal ? mouse.x - mouseInit.x : 0, that.vertical ? mouse.y - mouseInit.y : 0);
            
            dim = {
                x : !that.horizontal ? dimInit.x : dimInit.x + mouse.x - mouseInit.x,
                y : !that.vertical ? dimInit.y : dimInit.y + mouse.y - mouseInit.y
            };
            
            if (guides) {
                oldOk = guides.ok;
                guides.ok = false;
                if (guides.className) { jNode.removeClass(guides.className); }
            }
            
            if (that.type !== 'transform' && that._shape !== 'noAttribute') jNode.setDim(dim);
            else jNode.setMtx(mtx);
            
            if (bornes) {
                
                rect = jNode.getDim(isSvg ? 'screen' : null);
                mtxScreenParentInv = mtxScreenParent.inverse();
                pt1 = new JSYG.Vect(rect.x,rect.y).mtx(mtxScreenParentInv);
                pt2 = new JSYG.Vect(rect.x+rect.width,rect.y+rect.height).mtx(mtxScreenParentInv);
                
                x=0;y=0;
                
                if (that.horizontal) {
                    if (that.minLeft!=null && pt1.x < that.minLeft) { x = that.minLeft - pt1.x;}
                    else if (that.maxRight!=null && pt2.x > that.maxRight) { x = that.maxRight - pt2.x;}
                }
                
                if (that.vertical) {
                    if (that.minTop!=null && pt1.y < that.minTop) { y = that.minTop - pt1.y;}
                    else if (that.maxBottom!=null && pt2.y > that.maxBottom) { y = that.maxBottom - pt2.y;}
                }
                
                if (x!==0 || y!==0) {
                    
                    mtx = new JSYG.Matrix().translate(x,y).multiply(mtx);
                    
                    if (that.type !== 'transform' && that._shape !== 'noAttribute') {
                        pt1 = new JSYG.Vect(0,0).mtx(mtxInit.inverse());
                        pt2 = new JSYG.Vect(x,y).mtx(mtxInit.inverse());
                        dim.x+= pt2.x-pt1.x;
                        dim.y+= pt2.y-pt1.y;
                        jNode.setDim(dim);
                    }
                    else jNode.setMtx(mtx);
                }
            }
            
            if (guides.list && guides.list.length > 0) {
                
                rect = jNode.getDim(isSvg ? 'screen' : null);
                mtxScreenInv = jNode.getMtx("screen").inverse();
                
                for (i=0,N=guides.list.length;i<N;i++) {
                    
                    guide = guides.list[i];
                    
                    magnet = new JSYG.Vect(
                        guide.x != null ? guide.x : 0,
                    guide.y != null ? guide.y : 0
                        )
                        .mtx(mtxScreenParent);
                    
                    if (guide.x != null && guide.y != null && !reachedX && !reachedY) {
                        
                        loop : 
                            
                            for (j=0,M=guides.offsetX.length;j<M;j++) {
                                
                                ref = {};
                            ref.x = rect.x + rect.width * guides.offsetX[j];
                            
                            for (k=0,P=guides.offsetY.length;k<P;k++) {
                                
                                ref.y = rect.y + rect.height * guides.offsetY[k];
                                
                                if (JSYG.distance(magnet,ref) < guides.strength) {
                                    pt1 = new JSYG.Vect(ref).mtx(mtxScreenInv);
                                    pt2 = new JSYG.Vect(magnet).mtx(mtxScreenInv);
                                    applyMagnet(pt1,pt2);
                                    reachedX = reachedY = true;
                                    break loop;
                                }
                            }
                        }
                    }
                    else if (guide.x != null && !reachedX) {
                        
                        for (j=0,M=guides.offsetX.length;j<M;j++) {
                            
                            ref = rect.x + rect.width * guides.offsetX[j];
                            
                            if (Math.abs(magnet.x - ref) < guides.strength) {
                                pt1 = new JSYG.Vect(ref,0).mtx(mtxScreenInv);
                                pt2 = new JSYG.Vect(magnet.x,0).mtx(mtxScreenInv);
                                applyMagnet(pt1,pt2);
                                reachedX = true;
                                break;
                            }
                        }
                    }
                    else if (guide.y != null && !reachedY) {
                        
                        for (j=0,M=guides.offsetY.length;j<M;j++) {
                            
                            ref = rect.y + rect.height * guides.offsetY[j];
                            
                            if (Math.abs(magnet.y - ref) < guides.strength) {
                                pt1 = new JSYG.Vect(0,ref).mtx(mtxScreenInv);
                                pt2 = new JSYG.Vect(0,magnet.y).mtx(mtxScreenInv);
                                applyMagnet(pt1,pt2);
                                reachedY = true;
                                break;
                            }
                        }
                    }
                    
                    if (reachedX && reachedY) break;
                }
                
                if (oldOk && !guides.ok) guides.trigger('leave',that.node,e);
            }
            
            if (that.autoScroll) {
                
                dimFromWin = jNode.getDim(window);
                
                if (dimFromWin.x < 0) scrollX = dimFromWin.x;
                else if (dimFromWin.x + dimFromWin.width > dimWin.width) {
                    scrollX = dimFromWin.x + dimFromWin.width - dimWin.width;
                }
                
                if (dimFromWin.y < 0) scrollY = dimFromWin.y;
                else if (dimFromWin.y + dimFromWin.height > dimWin.height) {
                    scrollY = dimFromWin.y + dimFromWin.height - dimWin.height;
                }
                
                window.scrollBy(scrollX,scrollY);
            }
            
            hasChanged = true;
            that.trigger('drag',that.node,e);
        };
        
        function remove(e) {

            if (cursor) {
                new JSYG(that.field).each(function() {
                    var field = new JSYG(this);
                    field.css('cursor',field.data('cursorInit'));
                });
            }
            
            if (guides) {
                
                if (guides.className) jNode.removeClass(guides.className);
                if (that.className) jNode.removeClass(that.className);
                if (guides.ok) guides.trigger('success',that.node,e);
                else if (guides.require) {
                    
                    var to;
                    //var backupTransf = null;
                    
                    if (that.type!=='transform') {
                        
                        if (that._shape === 'noAttribute') jNode.mtx2attrs({keepRotation:that.keepRotation});
                        to = (jNode.isSVG()) ? {x:dimInit.x,y:dimInit.y} : {'left':dimInit.x+'px','top':dimInit.y+'px'};
                        
                    } else {
                        to = mtxInit;
                        /*backupTransf = jNode.transfOrigin();
						jNode.transfOrigin(0,0);*/
                    }
                    
                    if (!JSYG.Animation) {
                        
                        if (that.type!=='transform') jNode.setDim({x:dimInit.x,y:dimInit.y});
                        else jNode.setMtx(mtxInit);						
                    }
                    else {
                        
                        jNode.animate({
                            to:to,
                            easing:'swing',
                            callback:function() {
                                /*if (backupTransf) {
									jNode.transfOrigin(backupTransf);
								}*/
                                guides.trigger('fail',that.node,e);
                            }
                        });
                    }
                }
            }
            
            if (hasChanged && that.type!=='transform' && that._shape === 'noAttribute') jNode.mtx2attrs({keepRotation:that.keepRotation});
            
            new JSYG(document).off(fcts);
            
            if (hasChanged) that.trigger('dragend',that.node,e);
            
            that.trigger('end',that.node,e);
        }

        fcts.mousemove = mousemoveFct 
        fcts.mouseup = remove 
                
        new JSYG(document).on(fcts);
        
        this.trigger('start',this.node,e);
    };
    
    /**
     * Activation de la mobilité
     * @param opt optionnel, objet définissant les options
     */
    Draggable.prototype.enable = function(opt) {	
        
        this.disable(); //si plusieurs appels
        
        if (opt) this.set(opt);
        
        var evt = opt && opt.evt,
        jNode= new JSYG(this.node),
        that = this;
        
        function start(e) {
            if (that.eventWhich && e.which && e.which != that.eventWhich) return;
            that.start(e);
        }
        
        if (!this.field) this.field = this.node;
        
        this._shape = shape(this.node);
        
        new JSYG(this.field).each(function() {
            var field = new JSYG(this);
            field.data('draggableUnselect',this.unselectable);
            this.unselectable = 'on'; //IE
            field.on("mousedown",start);
        });
        
        this.disable = function() {
            new JSYG(this.field).each(function() {
                var field = new JSYG(this);
                field.off("mousedown",start);
                this.unselectable = field.data('draggableUnselect');
            });
            jNode.removeData('draggable');
            this.enabled = false;
            return this;
        };
        
        this.enabled = true;
        
        // pour commencer tout de suite
        if (evt) this.start(evt);
        
        return this;
    };
    
    /**
     * Désactivation de la mobilité
     */
    Draggable.prototype.disable = function() { return this; }; //définie lors de l'appel de la méthode on() car on a besoin du contexte
    
    
    JSYG.Draggable = Draggable;
    
    var plugin = JSYG.bindPlugin(Draggable);
    /**
     * Elément déplaçable
     * @returns {JSYG}
     * @see Draggable pour une utilisation détaillée
     * @example <pre>new JSYG('#maDiv').draggable();
     * 
     * //utilisation avancée
     * new JSYG('#maDiv').draggable({
     * 	minLeft:0,
     * 	maxRight:500,
     * 	vertical:false,
     * 	type:'transform',
     * 	ondragend:function() { alert('translation horizontale : '+new JSYG(this).translateX(); }
     * });
     */
    JSYG.prototype.draggable = function() { return plugin.apply(this,arguments); };
    
    return Draggable;
    
});