;(function(){
	
    "use strict";
	
    /**
     * Constructeur de couleurs
     * @param arg types possibles
     * <ul>
     * 	<li> chaîne
     * 		<ul>
     * 			<li>hexa sur 3 caractères : "#333" </li>
     * 			<li>hexa sur 6 caractères : "#3E3E3E" </li>
     * 			<li>rgb : "rgb(15,15,15)" </li>
     * 			<li>rgba : "rgba(15,15,15,1)" </li>
     * 		</ul>
     * </li>
     * <li> objet
     * 		<ul>
     * 			<li>rgb : propriétés r,g,b de 0 à 255</li>
     * 			<li>rgba : propriétés r,g,b de 0 à 255 et a de 0 à 1</li>
     * 			<li>hsv : propriétés h de 0 à 360, s de 0 à 100, v de 0 à 100</li>
     *			<li>hsl : propriétés h de 0 à 360, s de 0 à 100, l de 0 à 100</li>
     * 			<li>cmyk : propriétés c, m, y, k de 0 à 100</li>
     * 		</ul>
     * </li>
     * </ul>
     * @returns {Color}
     */
    function Color(arg) {
		
        if (typeof arg == 'string') this.parse(arg);
        else if (arguments.length >= 3) {
            this.r = arguments[0];
            this.g = arguments[1];
            this.b = arguments[2];
            if (arguments[3] != null) this.a = arguments[3];
        }
        else if (arg) {
			
            if ('r' in arg && 'g' in arg && 'b' in arg) {
                this.r = arg.r;
                this.g = arg.g;
                this.b = arg.b;
                if ('a' in arg) { this.a = arg.a; }
            }
            else if ('h' in arg && 's' in arg && 'v' in arg) {
                return new Color( Color.hsv2rgb(arg.h,arg.s,arg.v) );
            }
            else if ('h' in arg && 's' in arg && 'l' in arg) {
                return new Color( Color.hsl2rgb(arg.h,arg.s,arg.l) );
            }
            else if ('c' in arg && 'm' in arg && 'y' in arg && 'k' in arg) {
                return new Color( Color.cmyk2rgb(arg.c,arg.m,arg.y,arg.k) );
            }
            else throw new Error(arg+" : argument incorrect");
        }
    }
	
    //plus de méthodes disponibles sur https://github.com/harthur/color/blob/master/color.js
	
    Color.prototype = {
		
        constructor : Color,
		
        /**
         * composante rouge 0 à 255
         */
        r : null,
        /**
         * composante verte 0 à 255
         */
        g : null,
        /**
         * composante bleue 0 à 255
         */
        b : null,
        /**
         * composante opacité 0 à 1
         */
        a : 1,
		
        /**
         * définit les composantes r,g,b,a en fonction de la chaîne de caractères passée en argument
         * @param {String} str chaînes autorisées :
         * <ul>
         * <li>rgba : "rgba(0,0,0,0.5)"</li>
         * <li>rgb : "rgb(0,0,0)"</li>
         * <li>hexa sur 3 ou 6 chiffres : "#000", "#000000"</li>
         * <li>couleur html : "blue"</li>
         * </ul>
         * @returns {Color}
         * @see Color.htmlCodes
         */
        parse : function(str) {
			
            var string = str.replace(/\s/g,''),
            reg;
			
            //RGBA
            reg = /^rgba\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3}),([0-9]?\.?[0-9]?)\)$/.exec(string);
			
            if (reg) {
				
                this.r = reg[1];
                this.g = reg[2];
                this.b = reg[3];
                this.a = reg[4];
				
            } else {
			
                //RGB
                reg = /^rgb\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\)$/.exec(string);
				
                if (reg) {
					
                    this.r = reg[1];
                    this.g = reg[2];
                    this.b = reg[3];
					
                } else {
				
                    //hexa sur 3 caractères
                    reg = /^#?([0-9A-F]{1})([0-9A-F]{1})([0-9A-F]{1})$/i.exec(string);
					
                    if (reg) {
						
                        this.r = parseInt(reg[1]+reg[1],16);
                        this.g = parseInt(reg[2]+reg[2],16);
                        this.b = parseInt(reg[3]+reg[3],16);
						
                    } else {
						
                        //hexa sur 6 caractères
                        reg = /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i.exec(string);
						
                        if (reg) {
                            this.r = parseInt(reg[1],16);
                            this.g = parseInt(reg[2],16);
                            this.b = parseInt(reg[3],16);
                        }
                        else {
							
                            //nom de la couleur
                            reg = /^\w{3,}$/.exec(string);
							
                            if (reg) {
								
                                string = Color.htmlCodes[string.toLowerCase()];
								
                                if (string) {
                                    string = string.split(',');
                                    this.r = string[0];
                                    this.g = string[1];
                                    this.b = string[2];
                                }
                            }
							
                            if (!reg || !string) throw new Error("Impossible de parser la chaîne : "+str);
                        }
                    }
                }
            }
			
            return this;
        },
		
        /**
         * Attribue des nombres aléatoires aux composantes r,g et b de la couleur.
         * @returns {Color}
         */
        random : function() {
			
            this.r = rand(0,255);
            this.g = rand(0,255);
            this.b = rand(0,255);
			
            return this;
        },
	
        /**
         * Renvoie un objet avec les propriétés r,g,b,a
         * @returns {Object}
         */
        toRGBA : function() {
            return {r:this.r,g:this.g,b:this.b,a:this.a};
        },
		
        /**
         * Renvoie un objet avec les propriétés r,g,b
         * @returns {Object}
         */
        toRGB : function() {
            return {r:this.r,g:this.g,b:this.b};
        },
		
        /**
         * Renvoie un objet avec les propriétés h,s,v (teinte, saturation, valeur)
         * @returns {Object}
         */
        toHSV : function() {
            return Color.rgb2hsv(this.r,this.g,this.b);
        },
		
        /**
         * Renvoie un objet avec les propriétés h,s,l (teinte, saturation, lumière)
         * @returns {Object}
         */
        toHSL : function() {
            var hsv = Color.rgb2hsv(this.r,this.g,this.b);
            return Color.hsv2hsl(hsv.h,hsv.s,hsv.v);
        },
		
        /**
         * Renvoie la chaîne hexadecimale sur 6 chiffres (sans le #)
         * @returns {String}
         */
        toHEX : function() {
            return Color.rgb2hex(this.r,this.g,this.b);
        },
		
        /**
         * Renvoie un objet avec les composantes cyan,magenta,jaune,noir
         * @returns {Object}
         */
        toCMYK : function() {
            return Color.rgb2cmyk(this.r,this.g,this.b);
        }, 
		
        /**
         * Convertit la couleur en chaîne
         * @param {String} format rgb,rgba,hex,name (rgb par défaut)
         * @returns {String}
         */
        toString : function(format) {
						
            if (this.r == null || this.g == null || this.b == null) { return null; }
			
            this.r = Math.round(this.r);
            this.g = Math.round(this.g);
            this.b = Math.round(this.b);
			
            format = format && format.toLowerCase();
			
            if (!format || format === 'rgb') { return 'rgb('+this.r+','+this.g+','+this.b+')'; }
            else if (format === 'rgba') { return 'rgba('+this.r+','+this.g+','+this.b+','+this.a+')'; }
            else if (format && format === 'hex') { return '#'+this.toHEX(); }
            else if (format && format === 'name') {
			
                var codes = Color.htmlCodes, rgb;
				
                for (var n in codes) {
                    if (codes.hasOwnProperty(n)) {
                        rgb = codes[n].split(/,/);
                        if (this.r == rgb[0] && this.g == rgb[1] && this.b == rgb[2]) { return n; }
                    }
                }
				
                return null;
            }
			
            return null;
        },
        /**
         * Renvoie le brillant de la couleur (niveau de gris)
         * @link http://www.w3.org/TR/AERT#color-contrast
         * @returns {Number} 0 à 255
         */
        brightness : function() {
            return ((this.r * 299) + (this.g * 587) + (this.b * 114)) / 1000;
        },
		
        /**
         * Renvoie la luminosité relative de la couleur
         * @link http://www.w3.org/TR/WCAG20/#relativeluminancedef
         */
        luminosity : function() {
			
            var lum = [],
            composantes = ['r','g','b'],
            i, chan;
			
            for (i=0;i<3;i++) {
                chan = this[composantes[i]] / 255;
                lum[i] = (chan <= 0.03928) ? chan / 12.92 : Math.pow(((chan + 0.055) / 1.055), 2.4);
            }
			
            return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
        },
        /**
         * Renvoie la couleur équivalente en niveau de gris
         * @returns {Color} nouvelle instance
         */
        grayScale : function() {
			
            var brightness = this.brightness();
			
            return new Color({
                r:brightness,
                g:brightness,
                b:brightness
            });
        },
		
        /**
         * Renvoie la couleur éclaircie d'une valeur donnée
         * @param val valeur de l'éclaircissement à ajouter (négatif pour assombrir la couleur). La valeur de luminosité est comprise
         * entre 0 et 100.
         * @returns {Color}
         */
        lighten : function(val) {
			
            var hsl = this.toHSL();
            hsl.l = clip( hsl.l + parseInt(val,10),0,100);
            return new Color(hsl);
        },
		
        rotate: function(deg) {
			
            var hsv = this.toHSV();
            hsv.h = (hsv.h + deg) % 360;
            if (hsv.h < 0) hsv.h += 360;
            return new Color(hsv);
        },
		
        /**
         * Renvoie la différence avec une autre couleur
         * @param color objet Color ou chaîne à parser
         * @returns {Number}
         * @link http://www.w3.org/TR/AERT#color-contrast
         */
        difference : function(color) {
            color = new Color(color);
            return (Math.max(this.r,color.r) - Math.min(this.r,color.r)) + (Math.max(this.g,color.g) - Math.min(this.g,color.g)) + (Math.max(this.b,color.b) - Math.min(this.b,color.b));
        },
		
        /**
         * Détermine si la couleur assure une bonne visibilité par rapport à la couleur passée en argument. 
         * @param color objet Color ou chaîne à parser
         * @returns {Number}
         * @link http://www.w3.org/TR/AERT#color-contrast
         */
        isGoodVisibility : function(color) {
            color = new Color(color);
            return Math.abs(this.brightness()-color.brightness()) > 125 && this.difference(color) > 500;
        },
		
        /**
         * Indique si la couleur est un niveau de gris
         */
        isGray : function() {
            return this.r == this.g == this.b;
        },
		
        /**
         * Renvoie la couleur complémentaire
         * @returns {Color} nouvelle instance
         */
        complementary : function() {
			
            var hsv = this.toHSV();
            hsv.s/=100;
            hsv.v/=100;
			
            return new Color({
                h : hsv.h + (hsv.h >= 180 ? -180 : 180),
                s : (hsv.v * hsv.s / ( hsv.v * (hsv.s - 1) + 1)) * 100,
                v : (hsv.v * (hsv.s - 1) + 1) * 100
            });
        }
    };
	
    function rand(min,max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
	
    function clip(nb,min,max) { return nb < min ? min : (nb > max ? max : nb); }
	
    /**
     * Liste des couleurs html prédéfinies
     */
    Color.htmlCodes = {'aliceblue':'240,248,255','antiquewhite':'250,235,215','aqua':'0,255,255','aquamarine':'127,255,212','azure':'240,255,255','beige':'245,245,220','bisque':'255,228,196','black':'0,0,0','blanchedalmond':'255,235,205','blue':'0,0,255','blueviolet':'138,43,226','brown':'165,42,42','burlywood':'222,184,135','cadetblue':'95,158,160','chartreuse':'127,255,0','chocolate':'210,105,30','coral':'255,127,80','cornflowerblue':'100,149,237','cornsilk':'255,248,220','crimson':'220,20,60','cyan':'0,255,255','darkblue':'0,0,139','darkcyan':'0,139,139','darkgoldenrod':'184,134,11','darkgray':'169,169,169','darkgrey':'169,169,169','darkgreen':'0,100,0','darkkhaki':'189,183,107','darkmagenta':'139,0,139','darkolivegreen':'85,107,47','darkorange':'255,140,0','darkorchid':'153,50,204','darkred':'139,0,0','darksalmon':'233,150,122','darkseagreen':'143,188,143','darkslateblue':'72,61,139','darkslategray':'47,79,79','darkslategrey':'47,79,79','darkturquoise':'0,206,209','darkviolet':'148,0,211','deeppink':'255,20,147','deepskyblue':'0,191,255','dimgray':'105,105,105','dimgrey':'105,105,105','dodgerblue':'30,144,255','firebrick':'178,34,34','floralwhite':'255,250,240','forestgreen':'34,139,34','fuchsia':'255,0,255','gainsboro':'220,220,220','ghostwhite':'248,248,255','gold':'255,215,0','goldenrod':'218,165,32','gray':'128,128,128','grey':'128,128,128','green':'0,128,0','greenyellow':'173,255,47','honeydew':'240,255,240','hotpink':'255,105,180','indianred ':'205,92,92','indigo ':'75,0,130','ivory':'255,255,240','khaki':'240,230,140','lavender':'230,230,250','lavenderblush':'255,240,245','lawngreen':'124,252,0','lemonchiffon':'255,250,205','lightblue':'173,216,230','lightcoral':'240,128,128','lightcyan':'224,255,255','lightgoldenrodyellow':'250,250,210','lightgray':'211,211,211','lightgrey':'211,211,211','lightgreen':'144,238,144','lightpink':'255,182,193','lightsalmon':'255,160,122','lightseagreen':'32,178,170','lightskyblue':'135,206,250','lightslategray':'119,136,153','lightslategrey':'119,136,153','lightsteelblue':'176,196,222','lightyellow':'255,255,224','lime':'0,255,0','limegreen':'50,205,50','linen':'250,240,230','magenta':'255,0,255','maroon':'128,0,0','mediumaquamarine':'102,205,170','mediumblue':'0,0,205','mediumorchid':'186,85,211','mediumpurple':'147,112,219','mediumseagreen':'60,179,113','mediumslateblue':'123,104,238','mediumspringgreen':'0,250,154','mediumturquoise':'72,209,204','mediumvioletred':'199,21,133','midnightblue':'25,25,112','mintcream':'245,255,250','mistyrose':'255,228,225','moccasin':'255,228,181','navajowhite':'255,222,173','navy':'0,0,128','oldlace':'253,245,230','olive':'128,128,0','olivedrab':'107,142,35','orange':'255,165,0','orangered':'255,69,0','orchid':'218,112,214','palegoldenrod':'238,232,170','palegreen':'152,251,152','paleturquoise':'175,238,238','palevioletred':'219,112,147','papayawhip':'255,239,213','peachpuff':'255,218,185','peru':'205,133,63','pink':'255,192,203','plum':'221,160,221','powderblue':'176,224,230','purple':'128,0,128','red':'255,0,0','rosybrown':'188,143,143','royalblue':'65,105,225','saddlebrown':'139,69,19','salmon':'250,128,114','sandybrown':'244,164,96','seagreen':'46,139,87','seashell':'255,245,238','sienna':'160,82,45','silver':'192,192,192','skyblue':'135,206,235','slateblue':'106,90,205','slategray':'112,128,144','slategrey':'112,128,144','snow':'255,250,250','springgreen':'0,255,127','steelblue':'70,130,180','tan':'210,180,140','teal':'0,128,128','thistle':'216,191,216','tomato':'255,99,71','turquoise':'64,224,208','violet':'238,130,238','wheat':'245,222,179','white':'255,255,255','whitesmoke':'245,245,245','yellow':'255,255,0','yellowgreen':'154,205,50'};
	
    /**
     * Affiche la liste des couleurs html prédéfinies
     */
    Color.showHTMLColors = function() {
		
        if (typeof document === "undefined") throw new Error("Cette méthode n'est valable que dans le contexte d'un navigateur");
		
        var div;
		
        for (var n in Color.htmlCodes) {
			
            div = document.createElement('div');
            div.style.backgroundColor = n;
            div.textContent = n;
            document.body.appendChild(div);
        }
    };
	
    /**
     * Conversion rvb en hexadecimal
     * @param r rouge (0 à 255)
     * @param g vert (0 à 255)
     * @param b bleu (0 à 255)
     * @returns {String}
     */
    Color.rgb2hex = function(r,g,b){ return (0x1000000 | b | (g << 8) | (r << 16)).toString(16).slice(1); };
	
    /**
     * Conversion hexadecimal en rvb
     * @param hex
     * @returns {Object} avec les propriétés r,g,b (0 à 255)
     */
    Color.hex2rgb = function(hex){
        return { r : parseInt(hex.substr(0,2),16), g : parseInt(hex.substr(2,2),16), b : parseInt(hex.substr(4,2),16) };
    };
	
    /**
     * Conversion hsv en rgb
     * @param h teinte (0 à 360)
     * @param s saturation (0 à 100)
     * @param v valeur (0 à 100)
     * @returns {Object} avec les propriétés r,g,b (0 à 255)
     */
    Color.hsv2rgb = function(h, s, v) {
		
        var r,g,b,i,f,p,q;
		
        h/= 360;
        s/= 100;
        v/= 100;
		
        if (v === 0) r = g = b = 0;
        else {
			
            i = Math.floor(h * 6);
            f = (h * 6) - i;
            p = v * (1 - s);
            q = v * (1 - s*f);
            h = v * (1 - s*(1-f));
				
            switch (i) {
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = h; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = h; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
                case 6: case 0: r = v; g = h; b = p; break;
            }
        }

        return {
            'r' : Math.round(r*255),
            'g' : Math.round(g*255),
            'b' : Math.round(b*255)
        };
    };

    /**
     * Conversion rgb en hsv
     * @param r rouge (0 à 255)
     * @param g vert (0 à 255)
     * @param b bleu (0 à 255)
     * @returns {Object} avec les propriétés h (0 à 360), s (0 à 100), v  (0 à 100) 
     */
    Color.rgb2hsv = function(r,g,b) {

        r/=255;g/=255;b/=255;

        var max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        h,s,v = max,
        delta = max - min;

        if (max == min) h = s = 0;
        else {

            s = delta / max;

            if (r == max) h = (g - b) / delta;
            else if (g == max) h = 2 + (b - r) / delta;
            else h = 4 + (r - g) / delta;

            h*= 60;
            h = h % 360;
            if( h <0 ) h+=360;
        }

        return {
            h: Math.round(h),
            s: Math.round(s*100),
            v: Math.round(v*100)
        };
    };

    /**
     * Conversion rgb en cmyk
     * @param r rouge (0 à 255)
     * @param g vert (0 à 255)
     * @param b bleu (0 à 255)
     * @returns {Object} avec les propriétés c, m ,y, k (de 0 à 100) 
     */
    Color.rgb2cmyk = function(r,g,b) { 

        var c = 1 - ( r / 255 ),
        m = 1 - ( g / 255 ),
        y = 1 - ( b / 255 ),
        k = 1;

        if (c < k) k = c;
        if (m < k) k = m;
        if (y < k) k = y;

        //noir
        if (k == 1 ) c = m = y = 0;
        else  {
            c = (c-k) / (1-k);
            m = (m-k) / (1-k);
            y = (y-k) / (1-k);
        }

        return {
            c : Math.round(c*100),
            m : Math.round(m*100),
            y : Math.round(y*100),
            k : Math.round(k*100)
        };
    };

    /**
     * Conversion cmyk en rgb
     * @param c cyan (0 à 100)
     * @param m magenta (0 à 100)
     * @param y jaune (0 à 100)
     * @param y noir (0 à 100)
     * @returns {Object} avec les propriétés r, g, b (de 0 à 255) 
     */
    Color.cmyk2rgb = function(c,m,y,k) {

        c/= 100;
        m/= 100;
        y/= 100;
        k/= 100;

        c = ( c * ( 1 - k ) + k );
        m = ( m * ( 1 - k ) + k );
        y = ( y * ( 1 - k ) + k );

        return {
            r : Math.round((1-c) * 255),
            g : Math.round((1-m) * 255),
            b : Math.round((1-y) * 255)
        };
    };

    /**
     * Conversion hsv en hsl
     * @param h teinte (0 à 360)
     * @param s saturation (0 à 100)
     * @param v valeur (0 à 100)
     * @returns {Object} avec les propriétés h (0 à 360), s (0 à 100), l  (0 à 100)
     */
    Color.hsv2hsl = function(h,s,v) {

        s/=100;
        v/=100;

        var l = (2-s)*v,
        sl = s*v / (l <= 1 ? l : 2 - l) || 0;

        l /= 2;

        return {h:h,s:sl*100,l:l*100};
    };

    /**
     * Conversion hsl en rgb
     * @param h teinte (0 à 360)
     * @param s saturation (0 à 100)
     * @param l lumière (0 à 100)
     * @returns {Object} avec les propriétés r, g, b (de 0 à 255)
     */
    Color.hsl2rgb = function(h,s,l) {

        var hsv = Color.hsl2hsv(h,s,l);
        return Color.hsv2rgb(hsv.h,hsv.s,hsv.v);
    };

    /**
     * Conversion hsl en hsv
     * @param h teinte (0 à 360)
     * @param s saturation (0 à 100)
     * @param l lumière (0 à 100)
     * @returns {Object} avec les propriétés h (0 à 360), s (0 à 100), v (0 à 100)
     */
    Color.hsl2hsv = function(h,s,l) {

        s/=100;
        l/=100;

        var sv, v;

        l *= 2;
        s *= (l <= 1) ? l : 2 - l;
        v = (l + s) / 2;
        sv = (2 * s) / (l + s);

        return {h:h,s:sv*100,v:v*100};
    };


    /**
     * Renvoie une couleur au hasard sous forme de chaîne de caractères
     */
    Color.random = function() {
        return new Color().random().toString();
    };

    if (typeof JSYG != "undefined") JSYG.Color = Color;

    if (typeof module === "object" && typeof module.exports === "object") module.exports = Color;
    else if (typeof define == 'function' && define.amd) define("jsyg-color",function() { return Color; });
    else if (typeof JSYG == "undefined") this.Color = Color;

}).call(this);
