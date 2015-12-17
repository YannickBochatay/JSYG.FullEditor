/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(root,factory) {

    if (typeof define != "undefined" && define.amd) define("jsyg-undoredo",["jquery","jsyg-stdconstruct","jquery-hotkeys"],factory);
    else if (typeof jQuery == "undefined") throw new Error("jQuery is needed");
    else if (typeof JSYG != "undefined" && JSYG.StdConstruct) factory(jQuery,JSYG.StdConstruct);
    else if (typeof StdConstruct != "undefined") root.UndoRedo = factory(jQuery,StdConstruct);
    else throw new Error("JSYG.StdConstruct is needed");

})(this,function($,StdConstruct) {

    "use strict";

    /**
     * Constructeur permettant la gestion de fonctions annuler/refaire.<br/>
     * A chaque fois que la méthode saveState est appelée, le noeud est cloné et stocké dans une pile.<br/>
     * Quand on appelle les méthodes undo ou redo, le noeud est remplacé par le clone adéquat.<br/>
     * Ailleurs dans le code il faut donc faire attention à ne pas faire référence directement à ce noeud, car celui-ci change.
     * Il vaut mieux utiliser un selecteur css pour retrouver le bon élément à chaque fois.
     */
    function UndoRedo(arg,opt) {

        /**
         * Pile contenant les noeuds clonés
         */
        this.stack = [];
        
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);

        if (arg) this.setNode(arg);

        if (opt) this.enable(opt);
    };

    UndoRedo.prototype = new StdConstruct();

    UndoRedo.prototype.constructor = UndoRedo;

    /**
     * Activation automatique ou non des raccourcis clavier
     */
    UndoRedo.prototype.autoEnableKeyShortCuts = false;
    
    /**
     * Raccourci clavier pour annuler
     * @type {String} touche ou combinaison de touches ou null pour pas de raccourci
     */
    UndoRedo.prototype.keyShortCutUndo = "ctrl+z";
    
    /**
     * Raccourci clavier pour refaire
     * @type {String} touche ou combinaison de touches ou null pour pas de raccourci
     */
    UndoRedo.prototype.keyShortCutRedo = "ctrl+y";
    
    /**
     * Activation automatique ou non des champs
     */
    UndoRedo.prototype.autoEnableFields = false;
    
    /**
     * Champ annuler (optionnel, pour faciliter la création d'un bouton)
     * @type argument JSYG
     */
    UndoRedo.prototype.fieldUndo = null;

    /**
     * Champ refaire (optionnel, pour faciliter la création d'un bouton)
     * @type argument JSYG
     */
    UndoRedo.prototype.fieldRedo = null;
    
    /**
     * Classe à appliquer aux champs annuler ou refaire quand ils sont inactifs (en bout de pile)
     */
    UndoRedo.prototype.classInactive = 'disabled';

    /**
     * Nombre d'états que l'on conserve en mémoire
     * @type {Number}
     */
    UndoRedo.prototype.depth = 10;

    /**
     * Indice de l'état courant
     */
    UndoRedo.prototype.current = 0;
    
    /**
     * Fonctions à exécuter à chaque fois qu'on annule une action
     */
    UndoRedo.prototype.onundo = null;
    
    /**
     * Fonctions à exécuter à chaque fois qu'on rétablit une action
     */
    UndoRedo.prototype.onredo = null;

    /**
     * Fonctions à exécuter à chaque fois qu'on annule ou refait une action
     */
    UndoRedo.prototype.onchange = null;

    /**
     * Fonctions à exécuter à chaque fois qu'on sauve l'état courant
     */
    UndoRedo.prototype.onsave = null;

    /**
     * Indique si le module est actif ou non
     */
    UndoRedo.prototype.enabled = null;

    /**
     * Change le noeud par le noeud situé dans la pile à l'indice passé en argument
     */
    UndoRedo.prototype.change = function(indice) {

        if (this.stack[indice] == null) return;

        var clone = $(this.stack[indice].node).clone();

        clone.replaceAll(this.node);

        this.node = clone[0];

        this.current = indice;

        if (this.fieldUndo) {
            if (this.stack.length > 1 && this.current < this.stack.length-1) $(this.fieldUndo).removeClass(this.classInactive);
            else $(this.fieldUndo).addClass(this.classInactive);
        }

        if (this.fieldRedo) {
            if (this.stack.length > 1 && this.current > 0) $(this.fieldRedo).removeClass(this.classInactive);
            else $(this.fieldRedo).addClass(this.classInactive);
        }

        this.trigger('change',this.node);

        return this;
    };

    /**
     * Sauve l'état courant
     * @param label optionnel, intitulé de l'action effectuée
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.saveState = function(label,_preventEvent) {

        //on vide le début du tableau si on avait annulé quelque chose
        while (this.current>0) { this.stack.shift(); this.current--; }

        var clone = $(this.node).clone();

        if (!clone.length) return this;

        this.stack.unshift( { "label":label, "node" : clone[0] } );

        if (this.stack.length > this.depth) this.stack.pop();

        if (this.fieldRedo) $(this.fieldRedo).addClass(this.classInactive);
        if (this.fieldUndo) $(this.fieldUndo).removeClass(this.classInactive);

        if (!_preventEvent) this.trigger('save',this.node);

        return this;
    };

    /**
     * Définit si on peut annuler
     */
    UndoRedo.prototype.hasUndo = function() {
        return this.current < this.stack.length-1;
    };

    /**
     * Définit si on peut refaire
     */
    UndoRedo.prototype.hasRedo = function() {
        return this.current >= 1;
    };
    /**
     * Annule l'action précédente (remplace le noeud par le dernier état sauvegardé)
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.undo = function() {

        if (!this.hasUndo()) return;

        this.change(++this.current);

        this.trigger('undo',this.node);

        return this;
    };

    /**
     * Rétablit l'action précédente (remplace le noeud par l'état suivant dans la pile).
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.redo = function() {

        if (!this.hasRedo()) return;

        this.change(--this.current);

        this.trigger('redo',this.node);

        return this;
    };

    /**
     * Vide la pile
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.clear = function(_preventEvent) {

        this.current=0;

        this.stack.splice(0,this.stack.length);

        this.fieldRedo && $(this.fieldRedo).addClass(this.classInactive);

        this.saveState(null,_preventEvent);

        this.fieldUndo && $(this.fieldUndo).addClass(this.classInactive);

        return this;
    };
    
    UndoRedo.prototype.enableFields = function() {
        
        if (!this.enabled) return this;
      
        if (this.fieldUndo) new JSYG(this.fieldUndo).on('click',this.undo).addClass(this.classInactive);
        
        if (this.fieldRedo) new JSYG(this.fieldRedo).on('click',this.redo).addClass(this.classInactive);
        
        return this;
    };
    
    UndoRedo.prototype.disableFields = function() {
        
        if (!this.enabled) return this;
      
        if (this.fieldUndo) new JSYG(this.fieldUndo).off('click',this.undo).removeClass(this.classInactive);
        
        if (this.fieldRedo) new JSYG(this.fieldRedo).off('click',this.redo).removeClass(this.classInactive);
        
        return this;
    };

    UndoRedo.prototype.enableKeyShortCuts = function() {
        
        if (!this.enabled) return this;
        
        var $doc = $(document);
        
        if (this.keyShortCutUndo) $doc.on("keydown",null,this.keyShortCutUndo,this.undo);
        if (this.keyShortCutRedo) $doc.on("keydown",null,this.keyShortCutRedo,this.redo);
        
        return this;
    };
    
    UndoRedo.prototype.disableKeyShortCuts = function() {
        
        if (!this.enabled) return this;
        
        var $doc = $(document);
        
        if (this.keyShortCutUndo) $doc.off("keydown",this.undo);
        if (this.keyShortCutRedo) $doc.off("keydown",this.redo);
        
        return this;
    };
    /**
     * Sauve l'état courant et active les fonctions si les propriétés fieldUndo et/ou fieldRedo ont été définies.
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.enable = function(opt) {

        this.disable();

        if (opt) this.set(opt);

        this.saveState(null,true);
        
        this.enabled = true;
        
        if (this.autoEnableFields) this.enableFields();
        
        if (this.autoEnableKeyShortCuts) this.enableKeyShortCuts();

        return this;
    };

    /**
     * Vide la pile et désactive les fonctions.
     * @returns {UndoRedo}
     */
    UndoRedo.prototype.disable = function() {
        
        this.clear(true);

        this.stack.splice(0,this.stack.length);
            
        this.disableFields();
        
        this.disableKeyShortCuts();
        
        this.enabled = false;

        return this;
    };


    if (typeof JSYG != "undefined") JSYG.UndoRedo = UndoRedo;

    return UndoRedo;

});
