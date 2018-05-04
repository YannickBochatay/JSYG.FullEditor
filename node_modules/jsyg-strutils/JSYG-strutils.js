(function(root,factory) {
    
    if (typeof module == "object" && typeof module.exports == "object" ) module.exports = factory();
    else if (typeof define == "function" && define.amd) define("jsyg-strutils",factory);
    else if (typeof JSYG != "undefined") factory();
    else root.strUtils = factory();
    
})(this,function() {
    
    function regexpTag(tag) { return new RegExp("<("+tag+")\\b[^>]*>([\\s\\S]*?)<\\/\\1>","gi");};
    
    var rTags = /<\/?([a-z]\w*)\b[^>]*>/gi;
    
    var strUtils = {
        /**
        * Encode une chaîne en base 64.
        * @param input chaîne à encoder
        * @returns {String}
        */
        base64encode : function(input) { return window.btoa( this.utf8encode(input) ); },
	
        /**
         * Décode une chaîne codée en base 64.
         * @param input chaîne à décoder
         * @returns {String}
         */
        base64decode : function(input) { return this.utf8decode( window.atob(input) ); },
        
        /**
         * Formate une chaîne pour transmission par chaîne de requête
         * @param str chaîne à formater
         * @returns {String}
         */
        urlencode : function(str) {
            return window.encodeURIComponent(str);
        },
        
        /**
         * Decode une chaîne après transmission par chaîne de requête
         * @param str chaîne à décoder
         * @returns {String}
         */
        urldecode : function(str) {
            return window.decodeURIComponent(str);
        },
        
        /**
         * Encodage d'une chaîne au format UTF8
         * @param string
         * @returns {String}
         */
        utf8encode : function(string) {
            //Johan Sundstr�m
            return window.unescape( this.urlencode( string ) );
        },
        
        /**
         * Décodage d'une chaîne UTF8 en ISO-8859-1
         * @param string
         * @returns {String}
         */
        utf8decode : function(string) {
            //Johan Sundstr�m
            return this.urldecode( window.escape(string) );
        },
	
        /**
         * Détecte si la chaîne est encodée en UTF8 ou non
         * @param string
         * @returns {Boolean}
         * @link https://github.com/wayfind/is-utf8
         */
        isUtf8 : function(string) {
            
            var i = 0;
            while(i < string.length)
            {
                if(     (// ASCII
                string[i] == 0x09 ||
                    string[i] == 0x0A ||
                    string[i] == 0x0D ||
                    (0x20 <= string[i] && string[i] <= 0x7E)
                    )
                    ) {
                    i += 1;
                    continue;
                }
                
                if(     (// non-overlong 2-byte
                (0xC2 <= string[i] && string[i] <= 0xDF) &&
                    (0x80 <= string[i+1] && string[i+1] <= 0xBF)
                    )
                    ) {
                    i += 2;
                    continue;
                }
                
                if(     (// excluding overlongs
                string[i] == 0xE0 &&
                    (0xA0 <= string[i + 1] && string[i + 1] <= 0xBF) &&
                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF)
                    ) ||
                    (// straight 3-byte
                ((0xE1 <= string[i] && string[i] <= 0xEC) ||
                    string[i] == 0xEE ||
                    string[i] == 0xEF) &&
                    (0x80 <= string[i + 1] && string[i+1] <= 0xBF) &&
                    (0x80 <= string[i+2] && string[i+2] <= 0xBF)
                    ) ||
                    (// excluding surrogates
                string[i] == 0xED &&
                    (0x80 <= string[i+1] && string[i+1] <= 0x9F) &&
                    (0x80 <= string[i+2] && string[i+2] <= 0xBF)
                    )
                    ) {
                    i += 3;
                    continue;
                }
                
                if(     (// planes 1-3
                string[i] == 0xF0 &&
                    (0x90 <= string[i + 1] && string[i + 1] <= 0xBF) &&
                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
                    (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
                    ) ||
                    (// planes 4-15
                (0xF1 <= string[i] && string[i] <= 0xF3) &&
                    (0x80 <= string[i + 1] && string[i + 1] <= 0xBF) &&
                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
                    (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
                    ) ||
                    (// plane 16
                string[i] == 0xF4 &&
                    (0x80 <= string[i + 1] && string[i + 1] <= 0x8F) &&
                    (0x80 <= string[i + 2] && string[i + 2] <= 0xBF) &&
                    (0x80 <= string[i + 3] && string[i + 3] <= 0xBF)
                    )
                    ) {
                    i += 4;
                    continue;
                }
                
                return false;
            }
            
            return true;
        },
        
        /**
         * Met la première lettre de la chaîne en majuscule
         * @param str chaîne à analyser
         * @returns {String}
         */
        ucfirst : function(str) {
            
            return str.charAt(0).toUpperCase() + str.substr(1);
        },
        
        /**
         * Met la première lettre de la chaîne en minuscule
         * @param str chaîne à analyser
         * @returns {String}
         */
        lcfirst : function(str) {
            
            return str.charAt(0).toLowerCase() + str.substr(1);
        },
        
        /**
         * Met la première lettre de chaque mot en majuscule
         * @param str chaîne à analyser
         * @returns {String}
         */
        ucwords : function(str) {
            return str.replace(/\b[a-z]/g,function(s){ return s.toUpperCase(); });
        },
        
        /**
         * Retire les accents de la chaîne
         * @param str chaîne à analyser
         * @returns {String}
         */
        stripAccents : function(str) {
            
            var accent = [
                /[\300-\306]/g, /[\340-\346]/g, // A, a
                /[\310-\313]/g, /[\350-\353]/g, // E, e
                /[\314-\317]/g, /[\354-\357]/g, // I, i
                /[\322-\330]/g, /[\362-\370]/g, // O, o
                /[\331-\334]/g, /[\371-\374]/g, // U, u
                /[\321]/g, /[\361]/g, // N, n
                /[\307]/g, /[\347]/g // C, c
            ];
            
            var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
            
            for(var i = 0; i < accent.length; i++) str = str.replace(accent[i], noaccent[i]);
            
            return str;
        },
        
        /**
         * Retire les balises de la chaîne
         * @param str chaîne à analyser
         * @param allowed balise autorisée. Le nombre d'arguments n'est pas limité.
         * @returns {String}
         * @example JSYG.stripTags('&lt;tata&gt;toto&lt;/tata&gt;','br','span') == 'toto';
         * @see stripTagsR
         */
        stripTags : function(str,allowed) {
            
            allowed = slice.call(arguments,1);
            
            return str.replace(rTags, function (s, s1) { return allowed.indexOf(s1.toLowerCase()) !== -1 ? s : '';});
        },
        
        /**
         * Retire les balises de la chaîne.
         * A la différence de stripTags, cette méthode fonction avec une liste noire plutôt qu'une liste blanche.
         * @param str chaîne à analyser
         * @param forbidden balise à retirer. Le nombre d'arguments n'est pas limité.
         * @returns {String}
         * @see stripTags
         */
        stripTagsR : function(str,forbidden) {
            
            forbidden = slice.call(arguments,1);
            
            return str.replace(rTags, function (s, s1) { return forbidden.indexOf(s1.toLowerCase()) !== -1 ? '' : s;});
        },
        
        /**
         * Retire les attributs des balises
         * @param str chaîne à analyser 
         * @returns {String}
         */
        stripAttributes : function(str) {
            
            return str.replace('/<([a-z]\w*)\b[^>]*>/i', function(s) { return '<'+s+'>'; });
        },
        
        /**
         * Récupère le(s) contenu(s) d'une balise donnée sous forme de tableau de chaînes
         * @param str chaîne à analyser 
         * @param tag nom de la balise dont on veut récupèrer le contenu
         * @returns {Array} chaque élément du tableau est le contenu d'une balise tag
         */
        getTagContent : function(str,tag) {
            
            var regexp = regexpTag(tag),
            occ = str.match(regexp),
            i,N;
            
            if (occ===null) return null;
            
            for (i=0,N=occ.length;i<N;i++) occ[i] = occ[i].replace(regexp,function(str,p1) { return p1; });
            
            return occ;
        },
        
        /**
         * Retire les balises et leur contenu
         * @param {String} str chaîne à analyser 
         * @param {String} tag nom de la balise à supprimer
         * @param {Array} content tableau qui sera rempli par le contenu des balises trouvées (les tableaux passent par référence)
         * @@returns {String}
         */
        stripTagAndContent : function(str,tag,content) {
            return str.replace(regexpTag(tag),function(str,p1,p2) { content && content.push(p2); return ''; });
        },
        
        /**
         * Transforme la chaîne en chaîne de type camelCase (style javascript, les majuscules remplacent les espaces/tirets/underscores)
         * @param str chaîne à analyser 
         * @returns {String}
         */
        camelize : function(str) {
            return str.replace(/(-|_|\s+)([a-z])/ig,function(str,p1,p2){ return p2.toUpperCase();});
        },
        
        /**
         * Remplace les majuscules d'une chaîne camelCase par un tiret
         * @param str chaîne à analyser 
         * @returns {String}
         */
        dasherize : function(str) {
            return str.replace(/[A-Z]/g,function(str){ return '-'+str.toLowerCase();});
        }
    };
    
    if (typeof JSYG != "undefined") {
        
        for (var n in strUtils) JSYG[n] = strUtils[n];
    }
    
    return strUtils;
});