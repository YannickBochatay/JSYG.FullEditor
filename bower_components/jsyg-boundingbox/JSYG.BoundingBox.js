/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-boundingbox",["jsyg","jsyg-path"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Path) factory(JSYG,JSYG.Path);
        else throw new Error("JSYG.Resizable is needed");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    /**
     * <strong>nécessite le module BoundingBox</strong><br/><br/>
     * Affichage d'un rectangle aux dimensions de l'élément
     * @param arg argument JSYG faisant référence à l'élément
     * @param {Object} opt optionnel, objet définissant les options. Si défini, la bounding box est affichée implicitement
     */
    function BoundingBox(arg,opt) {
        
        if (arg) this.setNode(arg);
        else this._setType(this._type);
        
        if (opt) this.show(opt);
    }
    
    BoundingBox.prototype = new JSYG.StdConstruct();
    
    BoundingBox.prototype.constructor = BoundingBox;
    
    /**
     * conteneur (&lt;div&gt; pour éléments html, &lt;g&gt; pour éléments svg)
     * @type {Object} objet DOM
     */
    BoundingBox.prototype.container = null;
    /**
     * pour les éléments svg, chemin traçant le contour de la boîte (élement &lt;path&gt;)
     */
    BoundingBox.prototype.pathBox = null;
    /**
     * pour les éléments svg, chemin traçant le contour de l'élément (élement &lt;path&gt;)
     */
    BoundingBox.prototype.pathShadow = null;
    /**
     * Classe appliquée au conteneur
     */
    BoundingBox.prototype.className = 'strokeBox';
    /**
     * Classe appliquée au chemin traçant le contour de l'élément (svg uniquement)
     */
    BoundingBox.prototype.classNameShadow = 'shadow';
    /**
     * Booléen pour afficher ou non le contour de l'élément (svg uniquement)
     */
    BoundingBox.prototype.displayShadow = false;
    /**
     * Booléen pour garder ou non la rotation (si false, le rectangle sera toujours un rectangle droit,
     * si true il aura la même rotation que l'élément)
     */
    BoundingBox.prototype.keepRotation = true;
    /**
     * Fonctions à exécuter à l'affichage de la boîte
     */
    BoundingBox.prototype.onshow=null;
    /**
     * Fonctions à exécuter à la suppression de la boîte
     */
    BoundingBox.prototype.onhide=null;
    /**
     * Fonctions à exécuter à la mise à jour de la boîte
     */
    BoundingBox.prototype.onupdate=null;
    /**
     * Type de l'élément (svg ou html)
     */
    BoundingBox.prototype._type = 'svg';
    /**
     * Indique si la boîte est affichée ou non
     */
    BoundingBox.prototype.display = false;
    /**
     * Met à jour les dimensions de la boîte pour les éléments svg
     */
    BoundingBox.prototype._updatesvg = function(opt) {
        
        if (opt) { this.set(opt); }
        
        var jNode = new JSYG(this.node),
        ref = new JSYG(this.container).offsetParent(),
        CTM = jNode.getMtx(ref),
        rect,b,d, topleft,topright,bottomleft,bottomright;
        
        if (this.keepRotation === false) {	
            rect = jNode.getDim(ref);
            new JSYG(this.pathBox).attr('d','M'+rect.x+','+rect.y+ 'L'+(rect.x+rect.width)+','+(rect.y)+'L'+(rect.x+rect.width)+','+(rect.y+rect.height)+ 'L'+rect.x+','+(rect.y+rect.height)+ 'L'+rect.x+','+rect.y);
        }
        else {
            
            b = jNode.getDim();
            topleft = new JSYG.Vect(b.x,b.y).mtx(CTM);
            topright = new JSYG.Vect(b.x+b.width,b.y).mtx(CTM);
            bottomleft = new JSYG.Vect(b.x,b.y+b.height).mtx(CTM);
            bottomright = new JSYG.Vect(b.x+b.width,b.y+b.height).mtx(CTM);
            
            new JSYG(this.pathBox).attr('d','M'+topleft.x+','+topleft.y+ 'L'+topright.x+','+topright.y+'L'+bottomright.x+','+bottomright.y+ 'L'+bottomleft.x+','+bottomleft.y+ 'L'+topleft.x+','+topleft.y);
        }
        
        new JSYG(this.container).addClass(this.className);
        
        if (this.displayShadow) {
            
            d = jNode.clonePath({normalize:true}).attr('d');
            
            if (!this.pathShadow) this.pathShadow = new JSYG('<path>').addClass(this.classNameShadow).appendTo(this.container)[0];
            
            new JSYG(this.pathShadow).attr('d',d).setMtx(CTM).mtx2attrs();
            
        } else if (this.pathShadow) {
            
            new JSYG(this.pathShadow).remove();
            this.pathShadow = null;
        }
        
        return this;
    };
    
    /**
     * Met à jour les dimensions de la boîte pour les éléments html
     */
    BoundingBox.prototype._updatehtml = function(opt) {
        
        if (opt) this.set(opt);
        
        var jNode = new JSYG(this.node),
        rect = jNode.getDim('page');
        
        new JSYG(this.container).addClass(this.className).css('position','absolute').setDim(rect);
        
        return this;
    };
    
    /**
     * Met à jour les dimensions de la boîte
     * @param {Object} opt optionnel, objet définissant les options
     * @returns {BoundingBox}
     */
    BoundingBox.prototype.update = function(opt) {
        
        if (!this.node || !this.display) return this;
        this['_update'+this._type](opt);
        this.trigger('update');
        return this;
    };
    
    /**
     * Affiche la boîte
     * @param {Object} opt optionnel, objet définissant les options
     * @returns {BoundingBox}
     */
    BoundingBox.prototype.show = function(opt) {
        
        if (!this.node) return this;
        new JSYG(this.container).appendTo(new JSYG(this.node).offsetParent('farthest'));
        this.display = true;
        this.update(opt);
        this.trigger('show');
        return this;
    };
    
    /**
     * Suppression de la boîte du DOM
     * @returns {BoundingBox}
     */
    BoundingBox.prototype.hide = function() {
        new JSYG(this.container).detach();
        this.display = false;
        this.trigger('hide');
        return this;
    };
    
    /**
     * Affiche ou masque la box
     * @returns {BoundingBox}
     */
    BoundingBox.prototype.toggle = function() {
        
        this[ this.display ? "hide" : "show" ]();
        return this;
    };
    
    /**
     * définit les conteneurs en fonction du type de l'élément
     * @param {String} type type de l'élément (svg ou html)
     * @returns {BoundingBox}
     */
    BoundingBox.prototype._setType = function(type) {
        
        if (type === 'svg' && (this._type!=='svg' || !this.container || !this.hasOwnProperty('container') /*obligatoire pour les constructeurs qui héritent de boundingBox (Editable)*/)) {
            
            this.container = new JSYG('<g>')[0];
            this.pathBox = new JSYG('<path>').appendTo(this.container)[0];
            this.pathShadow = null;
            
        } else if (type === 'html' && (this._type!=='html' || !this.container  || !this.hasOwnProperty('container'))) {
            
            this.container = new JSYG('<div>')[0];
            this.pathBox = null;
            this.pathShadow = null;
        }
        
        this._type = type;
        
        return this;
    };
    
    /**
     * définition de l'élément cible
     * @param arg argument JSYG
     * @returns {BoundingBox}
     */
    BoundingBox.prototype.setNode = function(arg) {
        
        var display = this.display;
        
        if (display) this.hide();
        
        this.node = new JSYG(arg)[0];
        
        this._setType( new JSYG(this.node).isSVG() ? "svg" : "html" );
        
        if (display) this.show();
        
        return this;
    };
    
    
    var boundingBox = JSYG.bindPlugin(BoundingBox);
    /**
     * Affichage d'une boîte aux dimensions de l'élément. 1er argument obligatoire ('show','hide' ou 'update' en général).<br/><br/>
     * @returns {JSYG}
     * @see JSYGBoundingBox pour une utilisation détaillée.
     * @example new JSYG('#maDiv').boundingBox('show');
     */	
    JSYG.prototype.boundingBox = function() { return boundingBox.apply(this,arguments); };
    
    JSYG.BoundingBox = BoundingBox;
    
    return BoundingBox;
});