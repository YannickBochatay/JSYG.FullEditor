;(function() {
    
    "use strict";
    
    var slice = Array.prototype.slice;
    
    function isPlainObject(obj) {
        if (typeof obj !== "object" || obj.nodeType || obj != null && obj === obj.window) return false;
        if (obj.constructor && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf")) return false;
        return true;
    }
    /**
     * Constructeur standard définissant une liste de fonctions utiles pour les plugins
     * @returns {Events}
     */
    function Events() { }
    
    Events.prototype = {
	
        constructor : Events,
        /**
         * Ajout d'un écouteur d'événement.<br/>
         * Cela permet d'ajouter plusieurs fonctions, elles seront conservées dans un tableau.<br/>
         * Les doublons sont ignorés (même événement même fonction).<br/>
         * On peut passer en argument un objet avec les événements en clés et les fonctions en valeur.<br/>
         * @param {String} events type(s) d'événement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
         * @param {Function} fct fonction à exécuter lors du déclenchement de l'événement
         * @returns {Events}
         */
        on : function(events,fct) {
            
            var p,i,n,N;
            
            if (isPlainObject(events) && fct==null) {
                for (n in events) this.on(n,events[n]);
                return this;
            }
            
            if (typeof fct!== 'function') return this;
            
            events = events.split(/\s+/);
            
            for (i=0,N=events.length;i<N;i++) {
                
                p = this['on'+events[i]];
                
                if (p===undefined) throw new Error(events[i]+" n'est pas un événement connu");
                else if (p === false || p === null) p = [fct];
                else if (typeof p == "function") { if (p!==fct) p = [p,fct]; }
                else if (Array.isArray(p)) { if (p.indexOf(fct)===-1)  p.push(fct); }
                else throw new Error(typeof p + "Type incorrect pour la propriété on"+events[i]);
                
                this['on'+events[i]] = p;
            }
            
            return this;
        },
        
        /**
         * Suppression d'un ou plusieurs écouteur d'événement (Event Listener) de la liste.<br/>
         * On peut passer en argument un objet avec les événements en clés et les fonctions en valeur.
         * @param {String} events type(s) d'événement (propre à chaque module, 'click', 'start', 'end', etc) séparés par des espaces.
         * @param {Function} fct fonction à supprimer. Si pas de fonction, tous les écouteurs liés à l'événement sont supprimés.
         * @returns {Events}
         */
        off : function(events,fct) {
            
            var p,i,n,N;
            
            if (isPlainObject(events) && fct == null) {
                for (n in events) this.off(n,events[n]);
                return this;
            }
            
            if (fct && typeof fct!== 'function') return this;
            
            events = events.split(/\s+/);
            
            for (i=0,N=events.length;i<N;i++) {
                
                p = this['on'+events[i]];
                
                if (fct == null) { this['on'+events[i]] = null; continue; }
                
                if (p===undefined) throw new Error(events[i]+" n'est pas un événement connu");
                else if ((typeof p == "function") && p === fct) p = null;
                else if (Array.isArray(p)) p.splice(p.indexOf(fct),1);
                else if (p!==null) throw new Error(typeof p + "Type incorrect pour la propriété on"+events[i]);
            }
            
            return this;
        },
        
        /**
         * Ajout d'un écouteur d'événement pour une fonction qui ne sera exécutée qu'une seule fois
         * @param {type} events
         * @param {type} fct
         * @returns {JSYG.Events_L1.Events.prototype}
         */
        one : function(events,fct) {
            
            var that=this;
                              
            function offFct() {
                that.off(events,fct);
                that.off(events,offFct);
            }
            
            this.on(events,fct);
            this.on(events,offFct);
            
            return this;
        },
        
        /**
         * Execution d'un événement donné
         * @memberOf Events
         * @param {String} event nom de l'événement
         * @param {Object} context optionnel, objet référencé par le mot clef "this" dans la fonction.
         * Les arguments suivants sont les arguments passés à la fonction (nombre non défini)
         * @returns {Events}
         */
        trigger : function(event,context) {
            
            context = context || this.node || this;
            
            var p = this['on'+event],
            returnValue = true,
            i,N;
            
            if (!('on'+event in this)) throw new Error(event+" is not a existing event");
            else if (p instanceof Function) returnValue = p.apply(context,slice.call(arguments,2));
            else if (Array.isArray(p)) {
                for (i=0,N=p.length;i<N;i++) {
                    if (p[i].apply(context,slice.call(arguments,2)) === false) returnValue = false;
                }
            } 
            else if (p!==null && p!==false) throw new Error(typeof p + "Type incorrect pour la propriété on"+event);
            
            return returnValue;
        }
        
    };
    
    if (typeof JSYG != "undefined") JSYG.Events = Events;
    
    if (typeof module == "object" && typeof module.exports == "object" ) module.exports = Events;
    else if (typeof define == 'function' && define.amd) define("jsyg-events",function() { return Events; });
    else this.Events = Events;
    
}).call(this);