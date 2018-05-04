(function(root,factory) {
     
    if (typeof module == "object" && typeof module.exports == "object") {
       module.exports = factory( require("jquery") , require("jsyg-events") );
    }
    else if (typeof define == 'function' && define.amd) {
      
      define("jsyg-stdconstruct",["jquery","jsyg-events"],factory);
    }
    else {
        
        if (typeof jQuery == "undefined") throw new Error("jQuery is needed");
        
        if (typeof JSYG != "undefined") {
            
            if (JSYG.Events) factory(jQuery,JSYG.Events);
            else throw new Error("You need JSYG.Events module");
        }
        else if (typeof Events != "undefined") root.StdConstruct = factory(jQuery,Events);
        else throw new Error("You need Events module");
    }
    
    
})(this,function($,Events) {
    
    "use strict";
    
    /**
     * Constructeur standard définissant une liste de fonctions utiles pour les plugins
     * @returns {StdConstruct}
     */
    function StdConstruct() { };
    
    StdConstruct.prototype = new Events;
    
    StdConstruct.prototype.constructor = StdConstruct;
    
    /**
     * Permet de définir les propriétés de l'objet et des sous-objets de manière récursive, sans écraser les objets existants
     * (seules les propriétés précisées sont mises à jour)
     * @param opt objet contenant les propriétés à modifier
     * @param _cible en interne seulement pour appel r�cursif
     * @returns {Events}
     */
    StdConstruct.prototype.set = function(opt,_cible) {
        
        var cible = _cible || this;
        
        if (!$.isPlainObject(opt)) return cible;
        
        for (var n in opt) {
            if (n in cible) {
                if ($.isPlainObject(opt[n]) && cible[n]) this.set(opt[n],cible[n]);
                else if (opt[n] !== undefined) cible[n] = opt[n];
            }
        }
        
        return cible;
    };
    
    /**
     * Changement du noeud sur lequel s'applique le plugin
     * @param arg argument JSYG
     * @returns {StdConstruct}
     */
    StdConstruct.prototype.setNode = function(arg) {
        
        var node = $(arg)[0];
        if (!node) throw new Error(arg+" n'est pas un argument correct pour la méthode setNode : aucun élément DOM renvoyé.");
        
        var enabled = (this.enabled === true);
        if (enabled) this.disable();
        
        this.node = node;
        
        if (enabled) this.enable();
        
        return this;
    };
    
    /**
     * réinitialisation de toutes les propriétés du plugin
     * @returns {StdConstruct}
     */
    StdConstruct.prototype.reset = function() {
        
        var ref = Object.getPrototypeOf ? Object.getPrototypeOf(this) : this.__proto__ ? this.__proto__ : this.constructor.prototype; 
        
        for (var n in ref) {
            if (typeof ref[n] !== 'function') this[n] = ref[n];
        }
        
        return this;
    };
    
    /**
     * Indique si le plugin est actif ou non
     */
    StdConstruct.prototype.enabled = false;
    
    /**
     * Active le plugin
     */
    StdConstruct.prototype.enable = function() {
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactive le plugin
     */
    StdConstruct.prototype.disable = function() {
        
        this.enabled = false;
        
        return this;
    };
    
    /**
     * Active ou désactive le plugin 
     * @param opt
     */
    StdConstruct.prototype.toggle = function(opt) {
        if (this.enabled) this.disable();
        else this.enable(opt);
        return this;
    },
    
    /**
     * Désactive le plugin et réinitialise les propriétés.
     */
    StdConstruct.prototype.destroy = function() {
        
        this.disable();
        this.reset();
        return this;
    };
    
    if (typeof JSYG != "undefined") JSYG.StdConstruct = StdConstruct;
    
    return StdConstruct;
    
});