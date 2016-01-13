/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-magnifyingglass",["jsyg"],factory);
    else if (typeof JSYG != "undefined") factory(JSYG);
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    /**
     * Loupe qui s'affiche au survol de l'élément. Fonctionne uniquement avec les images pour IE<9.
     * @param arg argument JSYG sur lequel appliquer la loupe
     * @param opt optionnel, objet définissant les options. Si défini, la loupe est activée implicitement
     * @returns {MagnifyingGlass}
     */
    function MagnifyingGlass(arg,opt) {
        /**
         * Conteneur de la loupe (élément div)
         */
        this.container = document.createElement('div');
        
        if (arg) this.setNode(arg);
        if (opt) this.enable(opt);
    };
    
    MagnifyingGlass.prototype = new JSYG.StdConstruct();
    
    MagnifyingGlass.prototype.constructor = MagnifyingGlass;
    
    /**
     * Noeud sur lequel on applique la loupe
     */
    MagnifyingGlass.prototype.node = null;
    
    /**
     * Classe appliquée au conteneur
     */
    MagnifyingGlass.prototype.className = 'magnifyingGlass';
    /**
     * Taille du conteneur
     */
    MagnifyingGlass.prototype.size = 200;
    /**
     * Forme du conteneur. "circle" ne fonctionne bien qu'avec Firefox (pas du tout avec IE<9, et pas bien avec Chrome ou Opera,
     * ce qui dépasse de border-radius n'est pas masqué).
     * Toute autre valeur que circle affiche un rectangle.
     */
    MagnifyingGlass.prototype.shape = 'circle';
    /**
     * Coefficient du zoom
     */
    MagnifyingGlass.prototype.coef = 3;
    /**
     * Indique si la loupe est active ou non
     */
    MagnifyingGlass.prototype.enabled = false;
    /**
     * Indique si la loupe est affichée ou non
     */
    MagnifyingGlass.prototype.display = false;
    /**
     * Fonction(s) à exécuter à l'affichage de la loupe
     */
    MagnifyingGlass.prototype.onshow = null;
    /**
     * Fonction(s) à exécuter quand on masque la loupe
     */
    MagnifyingGlass.prototype.onhide = null;
    /**
     * Fonction(s) à exécuter pendant qu'on bouge la loupe
     */
    MagnifyingGlass.prototype.onmove = null;
    
    
    function createThumb(jNode) {
        
        if (!jNode.attr("id")) jNode.attr("id",'thumb'+JSYG.rand(0,999999));
        
        var dim = jNode.getDim();
        dim.x = dim.y = 0;
                
        return new JSYG('<svg>')
            .viewBox(dim)
            .setDim({width:dim.width,height:dim.height})
            .append( new JSYG('<use>').attr("href",'#'+jNode.attr("id")) );
        
        return svg;
    }
    /**
     * Affiche la loupe
     * @param {Number} x abcisse relativement au noeud
     * @param {Number} y ordonnée relativement au noeud
     * @example 0,0 affichera la loupe dans le coin supérieur gauche du noeud.
     */
    MagnifyingGlass.prototype.show = function(x,y) {
        
        var jCont = new JSYG(this.container).appendTo(document.body),
        jNode = new JSYG(this.node),
        clone = jNode.clone(),
        child,dimNode,dimCont;
        
        //FF merdoie avec les dimensions des conteneurs svg
        if (clone.getTag() === 'svg') clone = new JSYG('<div>').append( createThumb(jNode) );
        
        clone.find('.'+this.className).remove();//pour pas mélanger la loupe du reste
        
        child = jCont.children(1);
        
        if (child.length > 0) clone.replaceAll(jCont.children(0));
        else clone.insertBefore(jCont.children(0));
        
        dimNode = jNode.getDim('page');
        
        if (clone.getTag() === 'img') {
            
            clone.setDim({
                width: dimNode.width * this.coef,
                height: dimNode.height * this.coef
            });
            
        } else {
            clone.setDim(dimNode).transfOrigin('top','left').scale(this.coef);
        }
        
        dimCont = jCont.getDim('page');
        
        this._dim = {
            node : dimNode,
            cont : dimCont,
            clone : clone.getDim('page')
        };
                
        jCont.setDim({
            x : dimNode.x + x - dimCont.width/2,
            y : dimNode.y - dimCont.height/2
        });
        
        this.display = true;
        
        this.trigger('show',this.node);
        
        return this;
    };
    
    /**
     * Masque la loupe
     * @returns {MagnifyingGlass}
     */
    MagnifyingGlass.prototype.hide = function() {
                
        new JSYG(this.container).detach();
        this.display = false;
        this.trigger('hide',this.node);
        return this;
    };
    
    /**
     * Met à jour la position par rapport à la souris
     * @private
     * @param {JSYG.Event} e 
     * @returns {MagnifyingGlass}
     */
    MagnifyingGlass.prototype._update = function(e) {
        
        if (!this.container || !this._dim || !this.display) return this;
        
        var jCont = new JSYG(this.container),
        posCursor = new JSYG(this.node).getCursorPos(e),
        dim = this._dim,
        x = dim.cont.width/2 - posCursor.x * dim.clone.width / dim.node.width,
        y = dim.cont.height/2 - posCursor.y * dim.clone.height / dim.node.height,
        clone = jCont.children(0),
        jCont,dimCont;
        
        if (dim.clone.width + x < dim.cont.width/2 || dim.clone.height + y < dim.cont.height/2 || x > dim.cont.width/2 || y > dim.cont.height/2) {
            return this.hide();
        }
        
        clone.setDim({x:x,y:y});
        
        jCont = new JSYG(this.container);
        dimCont = jCont.getDim();
        
        jCont.setDim({
            x : e.clientX - dimCont.width/2,
            y : e.clientY - dimCont.height/2
        });
        
        this.trigger('move',this.node,e);
        
        return this;
    };
    
    /**
     * Activation de la loupe au survol de l'élément
     * @param opt optionnel, objet définissant les options
     * @returns {MagnifyingGlass}
     */
    MagnifyingGlass.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
        
        var jNode = new JSYG(this.node),
        jCont = new JSYG(this.container).addClass(this.className),
        show,hide,update;
        
        jCont.setDim({ width:this.size , height:this.size });
        
        jCont.css({ 'overflow':'hidden', 'position':'fixed' });
        
        if (this.shape === 'circle') jCont.css('border-radius',this.size/2 +'px');
        
        show = function(e) {
            this.show(e.clientX,e.clientY);
            this._update(e);
        }.bind(this);
        
        hide = this.hide.bind(this);
        
        update = this._update.bind(this);
                
        new JSYG('<div>')
            .css({width:'100%',height:'100%',position:'absolute',opacity:0,left:0,top:0})
            .appendTo(jCont);
        
        jCont.on("mousemove",update);
        
        jNode.on({
            'mouseover':show,
            'mousemove':update
        });
                
        this.disable = function() {
            
            this.hide();
            
            jNode.off({
                'mouseover':show,
                'mousemove':update
            });
            
            new JSYG(this.container).empty().off("mousemove",update);
                        
            this._dim = null;
            
            this.enabled = false;
            
            return this;
        };
        
        this.enabled = true;
        
        return this;		
    };
    /**
     * Désactivation de la loupe au survol de l'élément
     * @returns {MagnifyingGlass}
     */
    MagnifyingGlass.prototype.disable = function() { return this; };
    
    var plugin = JSYG.bindPlugin(MagnifyingGlass);
    
    /**
     * Loupe qui s'affiche au survol de l'élément. Fonctionne uniquement avec les images pour IE<9.
     * @returns {JSYG}
     * @see MagnifyingGlass pour une utilisation détaillée
     * @example <pre>new JSYG('#maDiv').magnifyingGlass();
     * 
     * //utilisation avancée :
     * new JSYG('#maDiv').magnifyingGlass({
     * 	coef : 4,
     * 	size : 400,
     * 	onmove : function(e) { console.log(e.pageX,e.pageY); }  
     * });
     * </pre>
     */
    JSYG.prototype.magnifyingGlass = function() { return plugin.apply(this,arguments); };
    
    
    JSYG.MagnifyingGlass = MagnifyingGlass;
    
    return MagnifyingGlass;
    
});