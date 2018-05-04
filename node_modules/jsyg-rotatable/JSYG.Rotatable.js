(function(root,factory) {
    
    if (typeof module == "object" && typeof module.exports == "object") {
      module.exports = factory( require("jsyg") );
    }
    else if (typeof define != "undefined" && define.amd) {
      define("jsyg-rotatable",["jsyg"],factory);
    }
    else if (typeof JSYG != "undefined") {
        if (JSYG.Matrix && JSYG.StdConstruct) factory(JSYG);
        else throw new Error("Dependency is missing");
    }
    else throw new Error("JSYG is needed");
    
})(this,function(JSYG) {
    
    "use strict";
    
    /**
     * paliers pour "aimanter" la rotation
     */
    function Steps(list,strength) {
        /**
         * Tableau des paliers en degrés
         */
        this.list = list || [];
        /**
         * Force de l'aimantation en degrés
         */
        this.strength = JSYG.isNumeric(strength) ? strength : 3;
    };
    
    /**
     * <strong>nécessite le module Rotatable</strong>
     * Rotation de l'élément. Fonctionne bien avec les éléments SVG. Les réactions sont un peu bizarres avec les éléments HTML, à éviter.<br/><br/>
     * @param arg argument JSYG faisant référénce à l'élément
     * @param opt optionnel, objet définissant les options. Si défini, la rotation est activée
     * @returns {Rotatable}
     */
    function Rotatable(arg,opt) {
        
        /**
         * Paliers "aimantés" lors de la rotation, en degrés
         */
        this.steps = new Steps();
        
        if (arg) {
            
            this.setNode(arg);
            this.field = this.node;
            
            if (opt) this.enable(opt);
        }
        else if (opt) this.set(opt);
    };
    
    Rotatable.prototype = new JSYG.StdConstruct();
    
    Rotatable.prototype.constructor = Rotatable;
    /**
     * Champ(s) sur le(s)quel(s) on clique pour déclencher la rotation. Par défaut l'élément lui-même.
     */
    Rotatable.prototype.field = null;
    /**
     * Evenement pour déclencher la rotation 
     */
    Rotatable.prototype.event = 'mousedown';
    /**
     * Restriction à un bouton de la souris (1 bouton gauche, 2 bouton du milieu, 3 bouton droit)
     */
    Rotatable.prototype.eventWhich = 1;
    /**
     * Classe appliquée à l'élément pendant la rotation
     */
    Rotatable.prototype.className = false;
    /**
     * Fonction(s) à exécuter quand on prépare un déplacement (mousedown sur le controle)
     */
    Rotatable.prototype.onstart=null;
    /**
     * Fonction(s) à exécuter quand on commence la rotation
     */
    Rotatable.prototype.ondragstart=null;
    /**
     * Fonction(s) à exécuter pendant la rotation
     */
    Rotatable.prototype.ondrag=null;
    /**
     * Fonction(s) à exécuter à la fin de la rotation
     */
    Rotatable.prototype.ondragend=null;
    /**
     * Fonction(s) à exécuter au relâchement du bouton souris (qu'il y ait eu rotation ou non)
     */
    Rotatable.prototype.onend=null;
    /**
     * Indique si la rotation est activée ou non
     */
    Rotatable.prototype.enabled = false;
    /**
     * Curseur à utiliser pendant la rotation
     */
    Rotatable.prototype.cursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACqUlEQVRIia2UsU8UQRTGZ97su73dvWOzu3d73Ibl+AOgxEZ7Q6UklhYWlMaGioLEyguFoTJYEQuNsSFiJ0b+ACxsjZAYqcAEK/E4IPfZ7Oi6uwd7hJdMtfO933zzvR0hShSS8jxvZnd39zYAlNGVKt08juNZwzAObduO8K+619K80+nM12q1vmEYmJqa2rQsa2VnZ+ddCnQ1R4kQRNQnIkgp/1umafbGxsZWS4OyGwEgDMP7RNQXQqBoEREcxzlg5huXQpKPjEzV6/V5y7L6zAxmfub7/pbjOCfM/BdUrVZ/hWF4M5G4Q09v2/bnIAgeZiEAkA3Z87wnSqkBEWknP4e6AADXdZcMwwAzo16vP09vBIBKpTLjeZ6bBZumOdDX1el0NnKA1OkPiAhKKTQajddZQFGYSU7LSikQESqVylnOBQDMzc3dk1JCKQVmPr00sAzYNM19pZQ+3GIO0Gw2uzqwIAg+lWme1tdqtTUighACYRhu5ABEtKIBzPx0VMDk5OQjKaWequ0LAUKIlVEBvu8vpPR5gGVZXSEEpJRwXXcrudr8PBc0B4Dx8fE17aDdbr/PAeI4vqufAMuyTkYJWQghHcf5pp8Tz/OWcoAkqJ7+aTzP65YFTExMLBiGgWSKznq93tfCf8H3/VWlFKSUYOZBdu7Pz8/fHB8fvwXwKq2TUm6mRvRDIrlVeJeO4xwIIaCUgmmag0ajsZwGTU9PnyJTURTZrVbrY7Va/b2+vn5nqHMAYOZZpdSRnmkiAjPvB0HwYm9v74tt233DMA6FEDNZUKq+DwUk9FnLso6klNDB6SdEPwlE9KPsIBRCAKDdbr9k5jPtJr2klAO9fSRAESgMw8VWq7UhpdyWUvaZeRBF0eMrObgIBADNZrMXx/GDa2leBEszy2j+AL5S5bW3LnfHAAAAAElFTkSuQmCC) 12 12, auto';
    
    /**
     * Débute la rotation (fonction déclenché sur mousedown) 
     * @param e évènement Event
     * @returns {Rotatable}
     */
    Rotatable.prototype.start = function(e) {
        
        e.preventDefault();
        
        var that = this,
        jNode = new JSYG(this.node),
        cursor = this.cursor;
        
        if (cursor) {
            new JSYG(this.field).each(function() {
                var field = new JSYG(this);
                field.data('cursorInit',field.css('cursor'));
                field.css('cursor',cursor);
            });
        }
        
        if (that.className) jNode.classAdd(that.className);
        
        var mtxInit = jNode.getMtx(),
        mtxScreenInit = (function() {
            var mtx = jNode.getMtx('screen');
            if (!jNode.isSVG()) {
                var dim = jNode.getDim('page');
                mtx = new JSYG.Matrix().translate(dim.x,dim.y).multiply(mtx);
            }
            return mtx;
        })(),
        scaleX = mtxInit.scaleX(),
        scaleY = mtxInit.scaleY(),
        dec = jNode.getShift(),
        screenDec = dec.mtx(mtxScreenInit),
        angleInit = mtxScreenInit.rotate(),
        angleMouseInit = Math.atan2(e.clientX-screenDec.x,e.clientY-screenDec.y) * 180 / Math.PI,
        
        hasChanged = false,
        triggerDragStart = false;
        
        function mousemoveFct(e) {
            
            if (!triggerDragStart) {
                that.trigger('dragstart',that.node,e);
                triggerDragStart = true;
            }
            
            var newAngle = angleInit + angleMouseInit - Math.atan2(e.clientX-screenDec.x,e.clientY-screenDec.y) * 180 / Math.PI;
            
            if (that.steps.list.length > 0) {
                that.steps.list.forEach(function(step) {
                    if (Math.abs(newAngle-step) < that.steps.strength || Math.abs(Math.abs(newAngle-step)-360) < that.steps.strength) {newAngle = step;}
                });
            }
            
            var mtx = mtxInit.translate(dec.x,dec.y)
                .scaleNonUniform(1/scaleX,1/scaleY)
                .rotate(-angleInit).rotate(newAngle)
                .scaleNonUniform(scaleX,scaleY)
                .translate(-dec.x,-dec.y);
            
            jNode.setMtx(mtx);
            
            hasChanged = true;
            that.trigger('drag',that.node,e);
        }
        
        function remove(e) {
            
            if (that.className) jNode.classRemove(that.className);
            
            new JSYG(that.field).each(function() {
                var field = new JSYG(this);
                field.css('cursor',field.data('cursorInit'));
            });
            
            new JSYG(this).off({
                'mousemove':mousemoveFct,
                'mouseup':remove
            });
            
            if (hasChanged) {
                if (that.type!=='transform' && that.shape === 'noAttribute') jNode.mtx2attrs();
                that.trigger('dragend',that.node,e);
            }
            that.trigger('end',that.node,e);
        };
        
        new JSYG(document).on({
            'mousemove':mousemoveFct,
            'mouseup':remove
        });
        
        this.trigger('start',that.node,e);
        
        return this;
    };
    
    /**
     * Activation de la rotation
     * @param opt optionnel, objet définissant les options
     * @returns {Rotatable}
     */
    Rotatable.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
        
        var that = this,
        evt = opt && opt.evt;
        
        function start(e) {
            if (that.eventWhich && e.which != that.eventWhich) return;
            that.start(e);
        }
        
        new JSYG(this.field).each(function() {
            var field = new JSYG(this);
            field.on(that.event,start);
        });
        
        this.disable = function() {
            new JSYG(this.field).each(function() {
                var field = new JSYG(this);
                field.off(that.event,start);
            });
            this.enabled = false;
            return this;
        };
        
        this.enabled = true;
        
        if (evt) { this.start(evt); }
        
        return this;
    };
    
    /**
     * Désactivation de la rotation
     * @returns {Rotatable}
     */
    Rotatable.prototype.disable = function() { return this; };
    
    
    JSYG.Rotatable = Rotatable;
    
    
    var plugin = JSYG.bindPlugin(Rotatable);
    /**
     * <strong>nécessite le module Rotatable</strong><br/><br/>
     * Rotation de l'élément par drag&drop souris.<br/>
     * Fonctionne bien avec les éléments SVG. Les réactions sont un peu bizarres avec les éléments HTML, à éviter.<br/><br/>
     * @returns {JSYG}
     * @see Rotatable pour une utilisation détaillée
     * @example <pre>new JSYG('#myShape').draggable();
     * 
     * //utilisation avancée
     * new JSYG('#myShape').draggable({
     * 	steps : {
     * 		list : [0,90,180,270]
     *	},
     *	event:'ctrl-left-mousedown',
     *	ondragend:function() {
     *		alert("Rotation de l'élément : "+ new JSYG(this).rotate() + "°");
     *	}
     *});
     */
    JSYG.prototype.rotatable = function() { return plugin.apply(this,arguments); };
    
    return Rotatable;
    
});