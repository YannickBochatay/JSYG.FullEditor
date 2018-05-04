/*jshint forin:false, eqnull:true*/
/* globals JSYG,$,Promise*/

(function(root,factory) {
    
    if (typeof module == "object" && typeof module.exports == "object" ) {
      
      module.exports = factory(
          require("jsyg-wrapper"),
          require("jsyg-matrix"),
          require("jsyg-vect"),
          require("jsyg-point"),
          require("jsyg-strutils")
      );
    }
    if (typeof define == "function" && define.amd) {
      
    define("jsyg-utils",[
        "jsyg-wrapper",
        "jsyg-matrix",
        "jsyg-vect",
        "jsyg-point",
        "jsyg-strutils"
      ],factory);
    }
    else if (root.JSYG) {
        
        if (JSYG.Matrix && JSYG.Vect && JSYG.Point && JSYG.utf8encode) factory(JSYG,JSYG.Matrix,JSYG.Vect,JSYG.Point,JSYG);
        else throw new Error("Missing dependency");
    }
    else throw new Error("JSYG is needed");
    
})(this,function(JSYG,Matrix,Vect,Point,strUtils) {
    
    "use strict";
    
    var svg = JSYG.support.svg;

    function isWindow(obj) {
	    return obj != null && obj === obj.window;
	}
    
    /**
     * récupère ou fixe la valeur d'un attribut (au sens xml) dans un espace de noms donné.<br/><br/>
     * Pour définir rapidement plusieurs attributs, on peut passer en paramêtre un objet dont les clés sont les noms des attributs et les valeurs les valeurs à affecter.<br/> <br/>
     * @param ns espace de nom.
     * @param attr nom de l'attribut.
     * @param val si définie, fixe la valeur de l'attribut.
     * <br/><br/>
     * @example :<ul>
     * <li><strong>jsynObjet.attrNS('http://www.w3.org/2000/svg','name')</strong> : renvoie l'attribut name de l'élément.</li>
     * <li><strong>jsynObjet.attr('name','toto')</strong> : définit l'attribut name de l'élément.</li> 
     * </ul>
     * @returns {String,JSYG} valeur de l'attribut si val est indéfini, l'objet JSYG lui même si la méthode est appelée pour définir des valeurs.
     */
    JSYG.prototype.attrNS = function(ns,attr,val) {
        
        if (ns == null || attr == null) return this;
        
        if (typeof(attr) == 'object') {
            for (var n in attr) this.attrNS(ns,n,attr[n]);
            return this;
        }
        
        if (val == null) return this[0].getAttributeNS(ns,attr);
        else {				
            this.each(function() { this.setAttributeNS(ns,attr,val); });
        }
        return this;
    };
    
    /**
     * Suppression d'un ou plusieurs attributs des éléments de la collection dans un espace de noms donné.
     * @param ns espace de nom.
     * @param attr nom de l'attribut. Le nombre d'arguments n'est pas limité.
     * @returns {JSYG}
     */
    JSYG.prototype.removeAttrNS = function(ns,attr) {	
        
        var a=arguments,
        i,N=a.length;
        
        this.each(function() {
            for (i=1;i<N;i++) this.removeAttributeNS(ns,a[i]);
        });
        
        return this;
    };
    
    /**
     * Récupère ou définit le lien de l'élément DOM. Cette méthode est utile pour harmoniser le html et le svg.
     * Cette méthode permet de ce fait de définir l'attribut src des balises img.
     * @param val si défini, fixe la valeur du lien.
     * @returns {String,JSYG} valeur du lien si val est indéfini, l'objet JSYG lui-même sinon.
     */
    JSYG.prototype.href = function(val) {
        
        var srcTags = ['img','iframe','video','audio'],
        tag = this.getTag(),
        attr = (!this.isSVG() && srcTags.indexOf(tag) != -1) ? "src" : "href";
        
        return arguments.length >= 1 ? this.attr(attr,val) : this.attr(attr);
    };
    
    /**
     * Calcule la distance entre deux points
     * @param pt1 Point ou objet quelconque avec les propriétés x et y
     * @param pt2 Point ou objet quelconque avec les propriétés x et y
     * @return {Number} distance en pixels (non arrondi) 
     */
    JSYG.distance = function(pt1,pt2) {
    	return Math.sqrt( Math.pow(pt1.x-pt2.x,2) + Math.pow(pt1.y-pt2.y,2) );
    };
    
    /**
     * Renvoie un nombre borné aux limites spécifiées
     * @param nb nombre
     * @param min limite inférieure
     * @param max limite supérieure
     * @returns {Number}
     * @example
     * JSYG.clip(5,0,10) === 5;
     * JSYG.clip(50,0,10) === 10;
     * JSYG.clip(-50,0,10) === 0;
     */
    JSYG.clip = function(nb,min,max) {
        return nb < min ? min : (nb > max ? max : nb);
    };
    
    /**
     * Execute une fonction sur le noeud et récursivement sur tous les descendants (nodeType==1 uniquement)
     * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
     * @param node noeud parent
     */
    JSYG.walkTheDom = function(fct,node) {
        
        if (fct.call(node) === false) return false;
        
        node = node.firstChild;
        
        while (node) {
            if (node.nodeType == 1) {
            	if (JSYG.walkTheDom(fct,node) === false) return false;
            }
            node = node.nextSibling;
        }
    };
    
    /**
     * exécute une fonction sur la collection et récursivement sur tous les descendants
     * @param fct le mot clé this fait référence au noeud courant. Si la fonction renvoie false, on sort de la boucle
     * @returns {JSYG}
     */
    JSYG.prototype.walkTheDom = function(fct) {
        this.each(function() { return JSYG.walkTheDom(fct,this); });
        return this;
    };
    
    /**
     * Teste si le premier élément de la collection est enfant de l'élément passé en argument
     * @param arg argument JSYG
     * @returns {Boolean}
     */
    JSYG.prototype.isChildOf = function(arg) {
        
        var node = new JSYG(arg)[0],
        parent = this[0].parentNode;
        
        while (parent) {
            if (parent === node) return true;
            parent = parent.parentNode;
        }
        return false;
    };
    
    /**
     * récupère les coordonnées du centre de l'élément.
     * @param arg optionnel, 'screen','page' ou élément référent (voir JSYG.prototype.getDim pour les détails)
     * @returns {Vect}
     * @see JSYG.prototype.getDim
     */
    JSYG.prototype.getCenter = function(arg) {
        var rect = this.getDim(arg);
        return new Vect(rect.x+rect.width/2,rect.y+rect.height/2);
    };
    
    /**
     * définit les coordonnées du centre de l'élément par rapport au parent positionné, avant transformation.
     * On peut aussi passer en argument un objet contenant les propriétés x et y.
     * Il est possible de ne passer qu'une valeur sur les deux (ou null) pour centrer horizontalement ou verticalement uniquement.
     * @param x abcisse
     * @param y ordonnée
     * @returns {JSYG}
     */
    JSYG.prototype.setCenter = function(x,y) {
        
        if (x!=null && typeof x === 'object' && y == null) {
            y = x.y;
            x = x.x;
        }
        
        this.each(function() {
            
            var $this = new JSYG(this),
            rect = $this.getDim(),
            dim = {};
            
            if (x!=null) dim.x = x - rect.width/2;
            if (y!=null) dim.y = y - rect.height/2;
            
            $this.setDim(dim);
            
        });
        
        return this;
    };
    
    /**
     * récupère ou fixe les attributs de la viewBox d'un élément SVG (qui dispose de cet attribut, essentiellement les balise &lt;svg&gt;)
     * @param dim optionnel, objet, si défini fixe les attributs
     * @returns {JSYG} si dim est défini, objet avec propriétés x,y,width,height
     */
    JSYG.prototype.viewBox = function(dim) {
        
        var viewBoxElmts = ["svg","symbol","image","marker","pattern","view"],
        val;
        
        this.each(function() {
            
            if (viewBoxElmts.indexOf(this.tagName) == -1) throw new Error(this.tagName+" is not a valid element.");
            
            var viewBoxInit = this.viewBox.baseVal,
            viewBox = viewBoxInit || {},
            $this = new JSYG(this);
            
            if (dim == null) {
                
                val = {
                    x : viewBox.x || 0,
                    y : viewBox.y || 0,
                    width : viewBox.width || parseFloat($this.css('width')),
                    height : viewBox.height || parseFloat($this.css('height'))
                };
                
                return false;
            }
            else {
                
                for (var n in dim) {
                    if (["x","y","width","height"].indexOf(n)!=-1) viewBox[n] = dim[n];
                }
            }
            
            if (!viewBoxInit) this.setAttribute('viewBox', viewBox.x+" "+viewBox.y+" "+viewBox.width+" "+viewBox.height);
            
        });
        
        return val ? val : this;
    };
    
    /**
     * Style par défaut des éléments html
     */
    var defaultStyles = {};
    
    /**
     * Renvoie les propriétés de style par défaut du 1er élément de la collection
     * @returns {Object}
     */
    JSYG.prototype.getDefaultStyle = function() {
        
        var tag = this.getTag(),
        elmt,style,i,N,prop;
        
        if (tag == 'a' && this.isSVG()) tag = 'svg:a';
        
        if (!defaultStyles[tag]) {
            
            defaultStyles[tag] = {};
            
            elmt = new JSYG('<'+tag+'>');
            style = getComputedStyle(elmt[0]);
            
            for (i=0,N=style.length;i<N;i++) {
                prop = style.item(i);
                defaultStyles[tag][prop] = style.getPropertyValue(prop);
            }
        }
        
        return defaultStyles[tag];
    };
    
    /**
     * Ajoute tous les éléments de style possiblement définis en css comme attributs.<br/>
     * Cela est utile en cas d'export SVG, afin d'avoir le style dans les balises et non dans un fichier à part.<br/>
     * @param recursive si true applique la méthode à tous les enfants.
     * @returns {JSYG}
     */
    JSYG.prototype.style2attr = function(recursive) {
        
        var href = window.location.href.replace('#'+window.location.hash,'');
        
        function fct() {
            
            var jThis = new JSYG(this),
            isSVG = jThis.isSVG();
            
            if (isSVG && JSYG.svgGraphics.indexOf(this.tagName) == -1) return;
            
            var style = getComputedStyle(this),
            defaultStyle = jThis.getDefaultStyle(),
            styleAttr = '',
            name,value,
            i=0,N=style.length;
            
            for (;i<N;i++) {
                
                name = style.item(i);
                
                if (isSVG && JSYG.svgCssProperties.indexOf(name)===-1) continue;
                
                value = style.getPropertyValue(name);
                
                if (defaultStyle[name] != value) {
                    
                    //la fonction getPropertyValue renvoie url("http://monsite.fr/toto/#anchor") au lieu de url(#anchor)
                    if (value.indexOf(href) != -1) value = value.replace(href,'').replace(/"|'/g,'');
                    
                    if (isSVG) this.setAttribute(name,value);
                    else styleAttr+= name+':'+value+';';
                }
            }
            
            if (!isSVG) this.setAttribute('style',styleAttr);
        }
        
        if (recursive) this.walkTheDom(fct);
        else fct.call(this[0]);
        
        return this;
    };
    
    /**
     * Ajoute une règle de style css
     * @param str chaîne css
     * @example
     * JSYG.addStyle(".maClass { font-style:italic }");
     */
    JSYG.addStyle = function(str) {
        
        var head = document.getElementsByTagName('head').item(0),
        style = document.createElement('style'),
        rules = document.createTextNode(str);
        
        style.type = 'text/css';
        
        if (style.styleSheet) style.styleSheet.cssText = rules.nodeValue;
        else style.appendChild(rules);
        
        head.appendChild(style);
    };
    
    JSYG.getStyleRules = function() {
        
        var css = '';
        
        function addStyle(rule) { css+=rule.cssText; }
        
        JSYG.makeArray(document.styleSheets).forEach(function(styleSheet) {
            
            JSYG.makeArray(styleSheet.cssRules || styleSheet.rules).forEach(addStyle);
        });
        
        return css;
    };
    
    /**
     * Donne la valeur calculée finale de toutes les propriétés CSS sur le premier élément de la collection.
     * @returns {Object} objet CSSStyleDeclaration
     */
    function getComputedStyle(node) {
        
        return window.getComputedStyle && window.getComputedStyle(node) || node.currentStyle;
    }
    
    /**
     * Retire l'attribut de style "style" + tous les attributs svg concernant le style.
     */
    JSYG.prototype.styleRemove = function() {
        
        this.each(function() {
            
            var $this = new JSYG(this);
            
            $this.removeAttr('style');
            
            if ($this.isSVG()) JSYG.svgCssProperties.forEach(function(attr) { $this.removeAttr(attr); });
            
        });
        
        return this;		
    };
    
    /**
     * Sauvegarde le style pour être rétabli plus tard par la méthode styleRestore
     * @param id identifiant de la sauvegarde du style (pour ne pas interférer avec d'autres styleSave)
     * @returns {JSYG}
     */
    JSYG.prototype.styleSave = function(id) {
        
        var prop = "styleSaved";
        
        if (id) prop+=id;
        
        this.each(function() {
            
            var $this = new JSYG(this),
            attrs={},
            style;
            
            if ($this.isSVG()) {
                
                JSYG.svgCssProperties.forEach(function(attr) {
                    var val = $this.attr(attr);
                    if (val!= null) attrs[attr] = val;
                });
            }
            
            style = $this.attr('style');
            
            if (typeof style == 'object') style = JSON.stringify(style); //IE
            
            attrs.style = style;
            
            $this.data(prop,attrs);
            
        });
        
        return this;
    };
    
    /**
     * Restaure le style préalablement sauvé par la méthode styleSave.
     * Attention avec des éléments html et Google Chrome la méthode est asynchrone.
     * @param id identifiant de la sauvegarde du style (pour ne pas interférer avec d'autres styleSave)
     * @returns {JSYG}
     */
    JSYG.prototype.styleRestore = function(id) {
        
        var prop = "styleSaved";
        
        if (id) prop+=id;
        
        this.each(function() {
            
            var $this = new JSYG(this),
            attrs = $this.data(prop),
            style;
            
            if (!attrs) return;
            
            $this.styleRemove();
            
            if ($this.isSVG()) $this.attr(attrs);
            else {
                
                try {
                    style = JSON.parse(attrs.style);
                    for (var n in style) { if (style[n]) this.style[n] = style[n]; }
                }
                catch(e) { $this.attr('style',attrs.style); }
            }
            
            $this.removeData(prop);
            
        });
        
        return this;
    };
    
    /**
     * Applique aux éléments de la collection tous les éléments de style de l'élément passé en argument.
     * @param elmt argument JSYG
     * @returns {JSYG}
     */
    JSYG.prototype.styleClone = function(elmt) {
        
        elmt = new JSYG(elmt);
        
        var foreignStyle = getComputedStyle(elmt[0]),
        name,value,
        i=0,N=foreignStyle.length;
        
        this.styleRemove();
        
        this.each(function() {
            
            var $this = new JSYG(this),
            ownStyle = getComputedStyle(this),
            isSVG = $this.isSVG();
            
            for (i=0;i<N;i++) {
                
                name = foreignStyle.item(i);
                
                if (isSVG && JSYG.svgCssProperties.indexOf(name)===-1) continue;
                
                value = foreignStyle.getPropertyValue(name);
                //priority = foreignStyle.getPropertyPriority(name);
                
                if (ownStyle.getPropertyValue(name) !== value) {
                    //ownStyle.setProperty(name,value,priority); //-> Modifications are not allowed for this document (?)
                    $this.css(name,value);
                }
            }
            
        });
        
        return this;
    };
    
    function addTransform(rect,mtx) {
        
        if (!mtx.isIdentity()) {
            
            var hg = new Vect(0,0).mtx(mtx),
            hd = new Vect(rect.width,0).mtx(mtx),
            bg = new Vect(0,rect.height).mtx(mtx),
            bd = new Vect(rect.width,rect.height).mtx(mtx),
            
            xmin = Math.min(hg.x,hd.x,bg.x,bd.x),
            ymin = Math.min(hg.y,hd.y,bg.y,bd.y),
            xmax = Math.max(hg.x,hd.x,bg.x,bd.x),
            ymax = Math.max(hg.y,hd.y,bg.y,bd.y);
            
            return {
                x : Math.round(xmin + rect.x),
                y : Math.round(ymin + rect.y),
                width : Math.round(xmax - xmin),
                height : Math.round(ymax - ymin)
            };	
        }
        else return rect;
    }
    
    function getPos(type,node,ref) {
        var cpt=0,obj=node;
        do {cpt+=obj['offset'+type];} while ((obj = obj.offsetParent) && obj!==ref);
        return cpt;
    }
    
    function swapDisplay(jNode,callback) {
        
        var returnValue;
        
        jNode.styleSave('swapDisplay');				
        
        jNode.css({
            "visibility":"hidden",
            "position":"absolute",
            "display": jNode.originalDisplay()
        });
        
        try { returnValue = callback.call(jNode); }
        catch (e) {
            jNode.styleRestore('swapDisplay');
            throw new Error(e);
        }
        
        jNode.styleRestore('swapDisplay');
        
        return returnValue;
    }
    
    /**
     * Display par défaut des éléments
     */
    var elementDisplay = {};
	
    /**
     * Renvoie le display par défaut de l'élément. Tir� de zepto.js. Peut mieux faire.
     */
    function defaultDisplay(obj) {
	
        var element, display,
        nodeName = obj.getTag(),
        isSVG = obj.isSVG(),
        parent;
		
        if (!elementDisplay[nodeName]) {
			
            parent = (isSVG) ? new JSYG('<svg>').appendTo('body') : 'body';
			
            element = new JSYG('<'+nodeName+'>').appendTo(parent);
            display = element.css('display');
			
            if (isSVG) parent.remove();
            else element.remove();
			
            if (display == "none") display = "block";
			
            elementDisplay[nodeName] = display;
        }
		
        return elementDisplay[nodeName];
    }
    
    JSYG.prototype.originalDisplay = function(_value) {
		
        var prop = "originalDisplay";
		
        if (_value == null) return this.data(prop) || defaultDisplay(this);
        else { this.data(prop,_value); return this; }
    };
    
    /**
     * Récupération des dimensions de l'élément sous forme d'objet avec les propriétés x,y,width,height.
     * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
     * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'épaisseur du tracé (stroke-width)
     * @param type
     * <ul>
     * <li>null : dimensions avant toute transformation par rapport au parent positionné (viewport pour les éléments svg)</li>
     * <li>"page" : dimensions dans la page</li>
     * <li>"screen" : dimensions à l'écran</li>
     * <li>objet DOM : dimensions relativement à cet objet</li>
     * @returns {Object} objet avec les propriétés x,y,width,height
     */
    JSYG.prototype.getDim = function(type) {
        
        var node = this[0],
        dim=null,parent,box,boundingRect,
        hg,hd,bg,bd,
        x,y,width,height,
        viewBox,jWin,ref,dimRef,
        mtx,
        tag = this[0].tagName;
        
        if (node.nodeType == 1 && this.css("display") == "none") {
            
            return swapDisplay(this,function() { return this.getDim(); });
        }
        
        if (isWindow(node)) {
            
            dim = {
                x : node.pageXOffset || document.documentElement.scrollLeft,
                y : node.pageYOffset || document.documentElement.scrollTop,
                width : node.document.documentElement.clientWidth,
                height : node.document.documentElement.clientHeight
            };
        }
        else if (node.nodeType === 9) {
            
            dim = {
                x : 0,
                y : 0,
                width : Math.max(node.documentElement.scrollWidth,node.documentElement.clientWidth,node.body && node.body.scrollWidth || 0),
                height : Math.max(node.documentElement.scrollHeight,node.documentElement.clientHeight,node.body && node.body.scrollHeight || 0)
            };
        }
        else if (!node.parentNode) throw new Error(node+" : Il faut d'abord attacher l'élément au DOM.");
        else if (!type) {
            
            if (this.isSVG()) {
                
                if (tag == 'svg') {
                    
                    parent = this.parent();
                    
                    if (parent.isSVG()) {
                        
                        dim = {
                            x : parseFloat(this.attr('x')) || 0,
                            y : parseFloat(this.attr('y')) || 0,
                            width : parseFloat(this.attr('width')),
                            height : parseFloat(this.attr('height'))
                        };
                    }
                    else {
                        
                        if (parent.css('position') == 'static') parent = parent.offsetParent();
                        dim = this.getDim(parent);
                    }
                    
                }
                else {
                    
                    try { box = this[0].getBBox(); }
                    catch(e) { return null; }
                    
                    dim = { //box est en lecture seule
                        x : box.x,
                        y : box.y,
                        width : box.width,
                        height : box.height
                    };
                    
                    if (tag === 'use' && !JSYG.support.svgUseBBox) {
                        //bbox fait alors référence à l'élément source donc il faut ajouter les attributs de l'élément lui-même
                        dim.x += parseFloat(this.attr('x'))  || 0;
                        dim.y += parseFloat(this.attr('y')) || 0;
                    }
                    //}
                }
                
            } else {
                
                dim = this.getDim( this.offsetParent() );
            }
        }
        else if (type === 'page') {
            
            if (tag === 'svg') {
                
                x = parseFloat(this.css("left") || this.attr('x')) || 0;
                y = parseFloat(this.css("top") || this.attr('y')) || 0;
                width = parseFloat(this.css("width"));
                height = parseFloat(this.css("height"));
                
                viewBox = this.attr("viewBox");
                if (viewBox) this.removeAttr("viewBox");
                
                mtx = this.getMtx('screen');
                
                if (viewBox) this.attr("viewBox",viewBox);
                
                hg = new Vect(x,y).mtx(mtx);
                bd = new Vect(x+width,y+height).mtx(mtx);
                
                boundingRect = {
                    left : hg.x,
                    top : hg.y,
                    width: bd.x - hg.x,
                    height : bd.y - hg.y
                };
                
            } else {
                
                if (this.isSVG() && this.rotate() === 0) {
                    
                    //sans rotation, cette méthode est meilleure car getBoundingClientRect
                    //tient compte de l'épaisseur de tracé (stroke-width)
                    
                    mtx = this[0].getScreenCTM();
                    
                    box = this.getDim();
                    
                    hg = new Vect(box.x,box.y).mtx(mtx);
                    bd = new Vect(box.x+box.width,box.y+box.height).mtx(mtx);
                    
                    boundingRect = { left : hg.x, right : bd.x, top : hg.y, bottom : bd.y };
                    
                } else boundingRect = node.getBoundingClientRect();
            }
            
            jWin = new JSYG(window);
            
            x = boundingRect.left + jWin.scrollLeft() - document.documentElement.clientLeft;
            y = boundingRect.top + jWin.scrollTop() - document.documentElement.clientTop;
            width = boundingRect.width != null ? boundingRect.width : boundingRect.right - boundingRect.left;
            height = boundingRect.height != null ? boundingRect.height : boundingRect.bottom - boundingRect.top;
            
            dim = {
                x : x,
                y : y,
                width : width,
                height : height
            };
            
            if (!this.isSVG() && JSYG.support.addTransfForBoundingRect) { dim = addTransform(dim,this.getMtx()); } //FF
        }
        else if (type === 'screen' || isWindow(type) || (type instanceof $ && isWindow(type[0]) ) ) {
            
            jWin = new JSYG(window);
            dim = this.getDim('page');
            dim.x-=jWin.scrollLeft();
            dim.y-=jWin.scrollTop();
        }
        else if (type.nodeType!=null || type instanceof $) {
            
            ref = type.nodeType!=null ? type : type[0];
            
            if (this.isSVG()) {
                
                if (this.isSVGroot()) {
                    
                    dimRef = new JSYG(ref).getDim('page');
                    dim = this.getDim('page');
                    
                    dim.x -= dimRef.x;
                    dim.y -= dimRef.y;
                }
                else {
                    
                    box = this.getDim();
                    mtx = this.getMtx(ref);
                    
                    if (!mtx.isIdentity()) {
                        
                        hg = new Vect(box.x,box.y).mtx(mtx);
                        hd = new Vect(box.x+box.width,box.y).mtx(mtx);
                        bg = new Vect(box.x,box.y+box.height).mtx(mtx);
                        bd = new Vect(box.x+box.width,box.y+box.height).mtx(mtx);
                        
                        x = Math.min(hg.x,hd.x,bg.x,bd.x);
                        y = Math.min(hg.y,hd.y,bg.y,bd.y);
                        width = Math.max(hg.x,hd.x,bg.x,bd.x)-x;
                        height = Math.max(hg.y,hd.y,bg.y,bd.y)-y;
                        
                        dim = { x:x, y:y, width:width, height:height };
                        
                    } else { dim = box; }
                }
                
            } else {
                
                width = node.offsetWidth;
                height = node.offsetHeight;
                
                if (!width && !height) {
                    
                    width = parseFloat(this.css('border-left-width') || 0) + parseFloat(this.css('border-right-width') || 0);
                    height = parseFloat(this.css('border-top-width') || 0) + parseFloat(this.css('border-top-width') || 0);
                    
                    if (node.clientWidth || node.clientHeight) {
                        width+= node.clientWidth;
                        height+= node.clientHeight;
                    }
                    else if (node.width || node.height) {
                        width+= parseFloat(this.css('padding-left') || 0) + parseFloat(this.css('padding-right') || 0) + node.width;
                        height+= parseFloat(this.css('padding-top') || 0) + parseFloat(this.css('padding-bottom') || 0) + node.height;
                        height+= node.clientHeight;
                    }
                }
                
                dim = {
                    x : getPos('Left',node,ref),
                    y : getPos('Top',node,ref),
                    width : width,
                    height : height
                };
            }
            
        }
        else throw new Error(type+' : argument incorrect');
        
        return dim;
    };
    
    /**
     * Permet de savoir s'il s'agit d'une balise &lt;image&gt; faisant référence à  du contenu svg, car auquel cas elle
     * se comporte plus comme un conteneur (du moins avec firefox). 
     */
    function isSVGImage(elmt) {
        return elmt[0].tagName == 'image' && /(image\/svg\+xml|\.svg$)/.test(elmt.href());
    }
    
    
    function parseDimArgs(args,opt) {
        ['x','y','width','height'].forEach(function(prop,i) {
            if (args[i]!=null) { opt[prop] = args[i]; }
        });
    }
    
    
    function getPropNum(elmt,prop) {
        
        var val = elmt.css(prop);
        
        if (!val) return 0;
        else if (val != "auto") return parseFloat(val);
        else if (prop == "left" || prop == "top") return elmt.position()[prop];
        else return 0;
    }
    /**
     * définit les dimensions de la collection par rapport au parent positionné, avant transformation.
     * Pour les éléments HTML, Les dimensions prennent en compte padding, border mais pas margin.<br/><br/>
     * Pour les éléments SVG (balises &lt;svg&gt; comprises), ce sont les dimensions sans tenir compte de l'épaisseur du tracé (stroke-width).<br/><br/>
     * En argument, au choix :
     * <ul>
     * <li>1 argument : objet avec les propriétés parmi x,y,width,height.</li>
     * <li>2 arguments : nom de la propriété parmi x,y,width,height et valeur.</li>
     * <li>4 arguments : valeurs de x,y,width et height. On peut passer null pour ignorer une valeur.</li>
     * </ul>
     * @returns {JSYG}
     * @example <pre> new JSYG('#monElement').setDim({x:50,y:50,width:250,height:300});
     * 
     * //équivalent à :
     * new JSYG('#monElement').setDim("x",50).setDim("y",50).setDim("width",250).setDim("height",300);
     * 
     * //équivalent à :
     * new JSYG('#monElement').setDim(50,50,250,300);
     */
    JSYG.prototype.setDim = function() {
        
        var opt = {},
        n = null, a = arguments,
        ref;
        
        switch (typeof a[0]) {
            
            case 'string' : opt[ a[0] ] = a[1]; break;
            
            case 'number' : parseDimArgs(a,opt); break;
            
            case 'object' :
                
                if (a[0] == null) parseDimArgs(a,opt);
                else {
                    for (n in a[0]) opt[n] = a[0][n];
                }
                
                break;
            
            default : throw new Error("argument(s) incorrect(s) pour la méthode setDim"); 
        }
        
        ref = opt.from && new JSYG(opt.from);
        
        this.each(function() {
            
            var tag, dim, mtx, box, dec, decx, decy, position,
            $this = new JSYG(this),
            node = this;
            
            if (('keepRatio' in opt) && ('width' in opt || 'height' in opt)) {
                dim = $this.getDim();
                if (!('width' in opt)) opt.width = dim.width * opt.height / dim.height;
                else if (!('height' in opt)) opt.height = dim.height * opt.width / dim.width;
            }
            
            if (isWindow(node) || node.nodeType === 9) {
                $this.getWindow().resizeTo( parseFloat(opt.width) || 0, parseFloat(opt.height) || 0 );
                return;
            }
            
            tag = this.tagName;
            
            if ('from' in opt) {
                
                mtx = $this.getMtx(ref).inverse();
                dim = $this.getDim();
                
                var dimRef = $this.getDim(ref),
                
                x = (opt.x == null) ? 0 : opt.x,
                y = (opt.y == null) ? 0 : opt.y,
                xRef = (opt.x == null) ? 0 : dimRef.x,
                yRef = (opt.y == null) ? 0 : dimRef.y,
                
                width = (opt.width == null) ? 0 : opt.width,
                height = (opt.height == null) ? 0 : opt.height,
                widthRef = (opt.width == null) ? 0 : dimRef.width,
                heightRef = (opt.height == null) ? 0 : dimRef.height,
                
                pt1 = new Vect(xRef,yRef).mtx(mtx),
                pt2 = new Vect(x,y).mtx(mtx),
                pt3 = new Vect(widthRef,heightRef).mtx(mtx),
                pt4 = new Vect(width,height).mtx(mtx),
                
                newDim = {};
                
                if (tag == "g") mtx = $this.getMtx();
                
                if (opt.x!=null || opt.y!=null) {
                    newDim.x = dim.x + pt2.x - pt1.x;
                    newDim.y = dim.y + pt2.y - pt1.y;
                }
                
                if (opt.width!=null || opt.height!=null) {
                    newDim.width = dim.width + pt4.x - pt3.x;
                    newDim.height = dim.height + pt4.y - pt3.y;
                }
                                
                $this.setDim(newDim);
                
                if (tag == "g") $this.setMtx( mtx.multiply($this.getMtx()) );
                
                return;
            }
            
            switch (tag) {
                
                case 'circle' :
                    
                    if ("width" in opt) { 
                        node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('r') || 0)+opt.width/2);
                        node.setAttribute('r',opt.width/2);
                    }
                    if ("height" in opt) {
                        node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('r') || 0)+opt.height/2);
                        node.setAttribute('r',opt.height/2);
                    }
                    if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('r') || 0));
                    if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('r') || 0));
                    
                    break;
                
                case 'ellipse' :
                    
                    if ("width" in opt) {
                        node.setAttribute('cx',(node.getAttribute('cx') || 0)-(node.getAttribute('rx') || 0)+opt.width/2);
                        node.setAttribute('rx',opt.width/2);
                    }
                    if ("height" in opt) {
                        node.setAttribute('cy',(node.getAttribute('cy') || 0)-(node.getAttribute('ry') || 0)+opt.height/2);
                        node.setAttribute('ry',opt.height/2);
                    }
                    if ("x" in opt) node.setAttribute('cx',opt.x + parseFloat(node.getAttribute('rx') || 0));
                    if ("y" in opt) node.setAttribute('cy',opt.y + parseFloat(node.getAttribute('ry') || 0));
                    
                    break;
                
                case 'line' :
                case 'polyline' :
                case 'polygon' :
                case 'path' :
                    
                    if (!node.parentNode) throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
                    
                    mtx = new Matrix();
                    box = node.getBBox();
                    
                    if ("x" in opt) mtx = mtx.translate(opt.x-box.x,0);
                    if ("y" in opt) mtx = mtx.translate(0,opt.y-box.y);
                    if ("width" in opt && box.width!=0)	mtx = mtx.scaleX(opt.width/box.width,box.x,box.y);
                    if ("height" in opt && box.height!=0)	mtx = mtx.scaleY(opt.height/box.height,box.x,box.y);
                    
                    $this.mtx2attrs({mtx:mtx});
                    
                    break;
                
                case 'text' :
                case 'use' : //on peut répercuter x et y mais pas width ni height
                    
                    if (('x' in opt || 'y' in opt) && !this.parentNode) throw new Error("Pour fixer la position d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
                    
                    dim = node.getBBox();
                    mtx = $this.getMtx();
                    
                    if ('x' in opt) {
                        
                        if (tag == 'text') dec = (parseFloat($this.attr("x")) || 0) - dim.x;
                        else {
                            dec = -dim.x;
                            if (JSYG.support.svgUseBBox) dec += parseFloat($this.attr('x')) || 0;
                        }
                        
                        $this.attr('x',opt.x + dec);
                    }
                    
                    if ('y' in opt) {
                        
                        if (tag == 'text') dec = (parseFloat($this.attr("y")) || 0) - dim.y;
                        else {
                            dec = -dim.y;
                            if (JSYG.support.svgUseBBox) dec += parseFloat($this.attr('y')) || 0;
                        }
                        
                        $this.attr('y',opt.y + dec);
                    }
                    
                    if ('width' in opt && dim.width!=0 || 'height' in opt && dim.height!=0) {
                        
                        mtx = new Matrix();
                        
                        if ('width' in opt && dim.width!=0) {
                            mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
                        }
                        
                        if ('height' in opt && dim.height!=0) {
                            mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
                        }
                        
                        $this.mtx2attrs({mtx:mtx});
                    }
                    
                    break;
                
                case 'g' : //on ne peut rien répercuter
                    
                    if (!node.parentNode) throw new Error("Pour fixer les dimensions d'un élément \""+tag+"\", il faut d'abord l'attacher à l'arbre DOM");
                    
                    dim = $this.getDim();
                    mtx = $this.getMtx();
                    
                    var dimP = $this.getDim( node.parentNode );
                    
                    if ("x" in opt) mtx = new Matrix().translateX( opt.x - dimP.x ).multiply(mtx);
                    if ("y" in opt) mtx = new Matrix().translateY( opt.y - dimP.y ).multiply(mtx);
                    if ("width" in opt) mtx = mtx.scaleX( opt.width / dimP.width, dim.x, dim.y );
                    if ("height" in opt) mtx = mtx.scaleY( opt.height / dimP.height, dim.x, dim.y );
                    
                    $this.setMtx(mtx);
                    
                    break;
                
                case 'iframe' :
                case 'canvas' :
                    
                    if ("x" in opt) $this.css('left',opt.x+'px');
                    if ("y" in opt) $this.css('top',opt.y+'px');
                    if ("width" in opt) $this.attr('width',opt.width);
                    if ("height" in opt) $this.attr('height',opt.height);
                    
                    break;
                
                default :
                    
                    if ($this.isSVG() && !$this.isSVGroot()) {
                        
                        //les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
                        if (isSVGImage($this)) {
                            
                            if ('x' in opt) $this.attr('x',opt.x);
                            if ('y' in opt) $this.attr('y',opt.y);
                            
                            if ('width' in opt || 'height' in opt) {
                                
                                if (!node.parentNode) throw new Error("Pour fixer la position d'une image svg, il faut d'abord l'attacher à l'arbre DOM");
                                
                                dim = node.getBBox();
                                
                                mtx = new Matrix();
                                
                                if ('width' in opt && dim.width!=0)
                                    mtx = mtx.scaleNonUniform(opt.width/dim.width,1,dim.x,dim.y);
                                
                                if ('height' in opt && dim.height!=0)
                                    mtx = mtx.scaleNonUniform(1,opt.height/dim.height,dim.x,dim.y);
                                
                                $this.mtx2attrs({mtx:mtx});
                            }
                        }						
                        else $this.attr(opt);
                    }
                    else {
                        
                        position = $this.css('position');
                        
                        decx = getPropNum($this,'marginLeft');
                        decy = getPropNum($this,'marginTop');
                        
                        if ('x' in opt || 'y' in opt) {
                            
                            if (!position || position === 'static') {
                                
                                if (node.parentNode) {
                                    $this.css('position','relative');
                                    position = 'relative';
                                }
                                else $this.css('position','absolute');
                            }
                            
                            if (position == 'relative'){
                                
                                dim = $this.getDim();
                                
                                if ('x' in opt) decx = dim.x - getPropNum($this,'left');
                                if ('y' in opt) decy = dim.y - getPropNum($this,'top');
                            }
                        }
                        
                        if ("x" in opt) node.style.left = opt.x - decx + 'px';
                        if ("y" in opt) node.style.top = opt.y - decy + 'px';
                        
                        if ("width" in opt) {
                            
                            if (tag == 'svg') $this.css('width',opt.width);
                            else {
                                
                                node.style.width = Math.max(0,opt.width
                                    -getPropNum($this,'border-left-width')
                                    -getPropNum($this,'padding-left')
                                    -getPropNum($this,'border-right-width')
                                    -getPropNum($this,'padding-right'))+'px';
                            }
                        }
                        
                        if ("height" in opt) {
                            
                            if (tag == 'svg') $this.css('height',opt.height);
                            else {
                                node.style.height = Math.max(0,opt.height
                                    -getPropNum($this,'border-top-width')
                                    -getPropNum($this,'padding-top')
                                    -getPropNum($this,'border-bottom-width')
                                    -getPropNum($this,'padding-bottom'))+'px';
                            }
                        }
                    }
                    
                    break;
            }
            
        });
        
        return this;
    };
        
    JSYG.fit = function(dim,dimContainer) {
        
        var ratio = {
            x : dim.width / dimContainer.width,
            y : dim.height / dimContainer.height
        },
        width,height;
                
        if (ratio.x > ratio.y) {
            height = dim.height * dimContainer.width / dim.width;
            width = dimContainer.width;
        }
        else {
            width = dim.width * dimContainer.height / dim.height;
            height = dimContainer.height;
        }
        
        return {
            width:width,
            height:height
        };
    };
    
    /**
     * Adapte la taille des éléments au mieux sans déformation
     * @param {Object} dimContainer doit contenir les propriétés width et height. Si omis, prend les dimensions du premier parent positionné.
     * @returns {JSYG}
     */
    JSYG.prototype.fit = function(dimContainer) {
        
        return this.each(function() {
            
            var $this = JSYG(this),
            dim;
            
            if (!dimContainer) dimContainer = $this.offsetParent().getDim();
            
            if (dimContainer.keepRatio === false) dim = dimContainer;
            else dim = JSYG.fit($this.getDim(), dimContainer);

            dim.x = 0;
            dim.y = 0;

            $this.setDim(dim);
        });
    };
    
    /**
     * Utile plutot en interne ou pour la création de plugins.
     * récupère le décalage (pour les transformations) en pixels à partir d'arguments de types différents.
     * @param pivotX 'left','right','center', nombre ou pourcentage. Si non renseigné, l'origine par défaut de l'élément ("center")
     * @param pivotY 'top','bottom','center', nombre ou pourcentage. Si non renseigné, l'origine par défaut de l'élément ("center")
     * @returns {Vect}
     * @see JSYG.prototype.transfOrigin
     */
    JSYG.prototype.getShift = function(pivotX,pivotY) {
        
        var transfOrigin = null;
        
        if (pivotX == null || pivotY == null) transfOrigin = this.transfOrigin().split(/ +/);
        
        pivotX = (pivotX != null) ? pivotX : transfOrigin[0];
        pivotY = (pivotY != null) ? pivotY : transfOrigin[1];
        
        if (JSYG.isNumeric(pivotX) && JSYG.isNumeric(pivotY)) return new Vect(parseFloat(pivotX),parseFloat(pivotY));
        
        var box = this.getDim(), // dimensions réelles de l'élément (avant transformation(s))
        translX,translY, 
        pourcent = /^([0-9]+)%$/,
        execX = pourcent.exec(pivotX),
        execY = pourcent.exec(pivotY);
        
        if (execX) translX = box.width * execX[1] / 100;
        else {
            switch (pivotX) {
                case 'left' : translX = 0; break; 
                case 'right' : translX = box.width; break;
                default : translX = box.width/2; break;
            }
        }
        
        if (execY) translY = box.height * execY[1] / 100;
        else {
            switch (pivotY) {
                case 'top' : translY = 0; break; 
                case 'bottom' : translY = box.height; break;
                default : translY = box.height/2; break;
            }
        }
        
        if (!this.isSVG()) return new Vect(translX,translY);
        else return new Vect(box.x+translX,box.y+translY);
    };
    
    /**
     * récupère ou définit l'origine pour les transformations 2D (html et svg). On peut passer un seul argument avec l'origine en x et en y séparées
     * par des espaces ou deux arguments séparés. Pour les valeurs possibles, voir le lien ci-dessous.
     * @param x chaÃ®ne, origine horizontale
     * @param y chaÃ®ne, origine verticale
     * @link https://developer.mozilla.org/en/CSS/transform-origin
     * @returns {JSYG} si passé avec un ou des arguments, sinon renvoie une chaÃ®ne représentant l'origine en x et y.
     */
    JSYG.prototype.transfOrigin = function(x,y) {
        
        var value = null,
        a = arguments;
        
        this.each(function() {
            
            var $this = new JSYG(this),
            val,
            originX="50%",
            originY="50%";
            
            if (a[0] == null) {
                value = $this.data('transfOrigin') || originX+' '+originY;
                return false;
            }
            
            if (a.length === 1) { val = a[0].split(/ +/); }
            else if (a.length === 2) { val = [ a[0] , a[1] ]; }
            else throw new Error("nombre d'arguments incorrect");
            
            if (['top','bottom'].indexOf(val[0])!==-1 || val[1]!=null && ['left','right'].indexOf(val[1])!==-1) {
                if (val[1]!=null) { originX = val[1]; }
                if (val[0]!=null) { originY = val[0]; }
            }
            else {
                if (val[1]!=null) { originY = val[1]; }
                if (val[0]!=null) { originX = val[0]; }
            }
            
            $this.data('transfOrigin',originX+' '+originY);
            
            return null;
            
        });
        
        return a[0] == null ? value : this;
    };
    
    /**
     * Annule toutes les transformations 2D de la collection.
     * @returns {JSYG}
     */
    JSYG.prototype.resetTransf = function() {
        
        if (!svg) return this;
        
        this.each(function() {
            
            if (new JSYG(this).isSVG()) this.transform.baseVal.clear();
            else if (JSYG.support.twoDimTransf) this.style[JSYG.support.twoDimTransf] = '';			
        });
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon l'échelle spécifiée, ou récupère l'échelle en x du premier élément de la collection
     * @param scale si définie, transforme la collection
     * @returns {JSYG} si scale est définie, la valeur de l'échelle sinon
     */
    JSYG.prototype.scale = function(scale) {
        
        if (!svg) return scale == null ? null : this;
        
        if (scale == null) return this[0] && this.getMtx().scaleX();
        
        this.each(function() {
            
            var $this = new JSYG(this),
            dec = $this.getShift();
            
            $this.addMtx( new Matrix().scale(scale,dec.x,dec.y) );
            
        });
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon l'échelle en x spécifiée, ou récupère l'échelle en x du premier élément de la collection.
     * @param scale si définie, transforme la collection
     * @returns {JSYG} si scale est définie, la valeur de l'échelle en x sinon
     */
    JSYG.prototype.scaleX = function(scale) {
        
        if (!svg) return scale == null ? null : this;
        if (scale == null) return this[0] && this.getMtx().scaleX();
        this.scaleNonUniform(scale,1);
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon l'échelle en y spécifiée, ou récupère l'échelle en y du premier élément de la collection.
     * @param scale si définie, transforme la collection
     * @returns {JSYG} si scale est définie, la valeur de l'échelle en y sinon
     */
    JSYG.prototype.scaleY = function(scale) {
        
        if (!svg) return scale == null ? null : this;
        if (scale == null) return this[0] && this.getMtx().scaleY();
        this.scaleNonUniform(1,scale);
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon l'échelle non uniforme spécifiée, ou récupère l'échelle du premier élément de la collection.
     * @param scaleX
     * @param scaleY
     * @returns {JSYG} si scaleX et scaleY sont définis, sinon objet avec les propriétés scaleX et scaleY
     */
    JSYG.prototype.scaleNonUniform = function(scaleX,scaleY) {
        
        if (!svg) return (scaleX == null && scaleY == null) ? null : this;
        
        var mtx;
        
        if (scaleX == null && scaleY == null) {
            mtx = this.getMtx();
            return { scaleX : mtx.scaleX() , scaleY : mtx.scaleY() };
        }
        
        this.each(function() {
            
            var $this = new JSYG(this),
            dec = $this.getShift();
            
            $this.addMtx( new Matrix().scaleNonUniform(scaleX,scaleY,dec.x,dec.y) );
        });
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon la translation spécifiée, ou récupère la translation du premier élément de la collection.
     * @param x
     * @param y
     * @returns {JSYG} si x et y sont définis, sinon objet Vect
     */
    JSYG.prototype.translate = function(x,y) {
        
        if (!svg) return (x == null && y == null) ? null : this;
        
        var mtx;
        
        if (x == null && y == null) {
            mtx = this.getMtx();
            return new Vect(mtx.translateX(),mtx.translateY());
        }
        
        this.addMtx( new Matrix().translate(x,y) );
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon la translation horizontale spécifiée, ou récupère la translation horizontale du premier élément de la collection.
     * @param x
     * @returns {JSYG} si x est défini, valeur de la translation horizontale sinon
     */
    JSYG.prototype.translateX = function(x) {
        
        if (!svg) return x == null ? null : this;
        
        if (x == null) return this.getMtx().translateX();
        
        this.translate(x,0);
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon la translation verticale spécifiée, ou récupère la translation verticale du premier élément de la collection.
     * @param y
     * @returns {JSYG} si y est défini, valeur de la translation verticale sinon
     */
    JSYG.prototype.translateY = function(y) {
        
        if (!svg) return y == null ? null : this;
        
        if (y == null) return this.getMtx().translateY();
        
        this.translate(0,y);
        
        return this;
    };
    
    /**
     * Ajoute une transformation à la collection selon la rotation spécifiée, ou récupère la rotation du premier élément de la collection.
     * @param angle (degrés)
     * @returns {JSYG} si angle est défini, valeur de la rotation sinon
     */
    JSYG.prototype.rotate = function(angle) {
        
        if (!svg) return angle == null ? null : this;
        
        if (angle == null) return this.getMtx().rotate();
        
        this.each(function() {
            
            var $this = new JSYG(this),
            dec = $this.getShift(),
            mtx = $this.getMtx().decompose();
            
            $this.addMtx( new Matrix().translate(dec.x,dec.y)
                .scaleNonUniform(1/mtx.scaleX,1/mtx.scaleY)
                .rotate(angle)
                .scaleNonUniform(mtx.scaleX,mtx.scaleY)
                .translate(-dec.x,-dec.y)
                );
            
        });
        
        return this;
    };
    
    /**
     * Récupération de l'objet matrice du 1er élément de la collection, instance de Matrix.
     * Pour les éléments HTML, seule la transformation de l'élément lui-même est supporté
     * @param arg (éléments svg seulement)
     * <ul>
     * 		<li>null : transformation de l'élément lui-même</li>
     * 		<li>'ctm' : transformation de l'élément par rapport à son viewport (balise &lt;svg&gt;)</li>
     * 		<li>'screen' : transformation de l'élément par rapport à l'écran</li>
     * 		<li>'page' : transformation de l'élément par rapport ) la page (screen + scroll)</li>
     * 		<li>objet DOM SVG : transformation de l'élément par rapport ) cet objet</li>
     * </ul>
     * @returns {Matrix}
     * @see Matrix
     */
    JSYG.prototype.getMtx = function(arg) {
        
        var mtx = null,
        transf,regexp,coefs;
        
        if (!this[0]) return null;
        
        if (JSYG.isWindow(this[0]) || this[0].nodeType === 9) return new Matrix();
        
        if (this.isSVG()) {
            
            if (arg == null) {
                transf = this[0].transform && this[0].transform.baseVal.consolidate();
                mtx = transf && transf.matrix || svg.createSVGMatrix();
            }
            else if (JSYG.support.svgUseTransform && this.getTag() == "use") {
                
                //les matrices de transformation tiennent compte des attributs x et y 
                //getCTM, getScreenCTM, getTransformToElement, mais ne modifie pas l'attribut transform de l'élément 
                //(bug de firefox avant la version 12 ou 13)
                //donc on prend la matrice de l'élément parent et on multiplie par la matrice de l'attribut transform
                return this.parent().getMtx(arg).multiply(this.getMtx()); 
            }
            else if (typeof arg === 'string') {
                
                arg = arg.toLowerCase();
                
                if (arg === 'ctm') mtx = this[0].getCTM();
                else if (arg === 'screen') mtx = this[0].getScreenCTM();
                else if (arg === 'page') {
                    mtx = this[0].getScreenCTM();
                    mtx = svg.createSVGMatrix().translate(window.pageXOffset,window.pageYOffset).multiply(mtx);
                }
            }
            else if (arg.nodeType != null || arg instanceof JSYG) {
                
                if (arg instanceof JSYG) arg = arg[0];
                
                //mtx = this[0].getTransformToElement(arg[0] || arg); //bug avec chrome
                
                mtx = arg.getScreenCTM() || svg.createSVGMatrix();			
                mtx = mtx.inverse().multiply( this[0].getScreenCTM() );
                
                if (this.getTag() == 'svg') mtx = mtx.translate(-this.attr('x') || 0,-this.attr('y') || 0) ; //la matrice tient compte des attributs x et y dans ce cas...
            }
            
        } else {
            
            if (JSYG.support.twoDimTransf) {
                
                transf = this[0].style[JSYG.support.twoDimTransf];
                regexp = /matrix\((-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *, *(-?\d*\.?\d+) *\)/;
                coefs = regexp.exec(transf);
                mtx = svg.createSVGMatrix();
                
                if (coefs) {
                    mtx.a = coefs[1];
                    mtx.b = coefs[2];
                    mtx.c = coefs[3];
                    mtx.d = coefs[4];
                    mtx.e = coefs[5];
                    mtx.f = coefs[6];
                }
            }
        }
        
        return new Matrix(mtx);
    };
    
    /**
     * définit la matrice de transformation de l'élément
     * @param mtx instance de Matrix (ou SVGMatrix natif)
     * @returns {JSYG}
     */
    JSYG.prototype.setMtx = function(mtx) {
        
        var attr = JSYG.support.twoDimTransf;
        
        if (mtx instanceof Matrix) mtx = mtx.mtx;
        
        this.each(function() {
            
            var $this = new JSYG(this),
            list;
            
            if ($this.isSVG()) {
                
                list = this.transform.baseVal;
                list.initialize(list.createSVGTransformFromMatrix(mtx));
            }
            else if (attr) {
                
                this.style[attr+'Origin'] = '0 0';
                this.style[attr] = new Matrix(mtx).toString();
            }
            
        });
        
        return this;
    };
    
    /**
     * Ajoute une transformation sous forme d'objet matrice (multiplication de la matrice avec la matrice courante)
     * @param mtx instance de Matrix (ou SVGMatrix natif)
     * @returns {JSYG}
     */
    JSYG.prototype.addMtx = function(mtx) {
        
        if (mtx instanceof Matrix) mtx = mtx.mtx;
        
        var attr = JSYG.support.twoDimTransf;
        
        this.each(function() {
            
            var $this = new JSYG(this),
            list, newMtx;
            
            if ($this.isSVG()) {
                
                list = this.transform.baseVal;
                list.appendItem(list.createSVGTransformFromMatrix(mtx));
                list.consolidate();	
            }
            else if (attr) {
                
                newMtx = $this.getMtx().multiply(mtx);
                $this.setMtx(newMtx);
            }
            
        });
        
        return this;
    };
    
    /**
     * répercute les transformations sur les attributs (autant que possible).<br/>
     * Le type de transformations répercutable est variable selon les éléments.
     * La rotation ne l'est pas sauf pour les chemins (path,line,polyline,polygone).
     * Pour les conteneurs (&lt;g&gt;), aucune ne l'est. etc.
     * @param opt si indéfini, répercute la matrice de transformation propre à l'élément.
     * Si défini, il est un objet contenant les propriétés possibles suivantes :
     * <ul>
     * <li>mtx : instance Matrix pour répercuter les transformations de celle-ci plutot que de la matrice propre à l'élément</li>
     * <li>keepRotation : pour les éléments permettant de répercuter la rotation sur les attributs ('circle','line','polyline','polygon','path'),
     * le choix est donné de le faire ou non</li>
     * </ul>
     * @returns {JSYG}
     * @example new JSYG('&lt;rect&gt;').attr({x:0,y:0,width:100,height:100}).translate(50,50).mtx2attrs().attr("x") === 50
     */
    JSYG.prototype.mtx2attrs = function(opt) {
        
        if (opt instanceof Matrix) opt = {mtx:opt};
        else opt = JSYG.extend({},opt);
        
        this.each(function() {
            
            var $this = new JSYG(this),
            mtx = opt.mtx || $this.getMtx(),
            keepRotation = opt.keepRotation || false,
            shift = $this.getShift(),
            d = mtx.decompose(shift.x,shift.y),
            dim = $this.getDim(),
            tag = $this.getTag(),
            tagsChoixRotation = ['circle','line','polyline','polygon','path'],
            pt,pt1,pt2,
            hg,bg,bd,
            list,
            jPath,seg,letter,
            x,y,
            i,N;
            
            if (!dim) return;
            
            if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
                
                mtx = mtx.rotate(-d.rotate,shift.x,shift.y);
            }
            
            //les images dont l'url est un fichier svg se comportent plus comme des conteneurs (du moins avec ff)
            if (isSVGImage($this)) tag = "use";
            
            switch(tag) {
                
                case 'circle' :
                    
                    pt = new Vect($this.attr('cx'),$this.attr('cy')).mtx(mtx);
                    
                    $this.attr({
                        'cx':pt.x,
                        'cy':pt.y,
                        'r':$this.attr('r')*d.scaleX
                    });
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    break;
                
                case 'ellipse' :
                    
                    pt = new Vect($this.attr('cx'),$this.attr('cy')).mtx(mtx);
                    
                    $this.attr({
                        'cx':pt.x,
                        'cy':pt.y,
                        'rx':$this.attr('rx')*d.scaleX,
                        'ry':$this.attr('ry')*d.scaleY
                    });
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    $this.setMtx( $this.getMtx().rotate(d.rotate,pt.x,pt.y) );
                    
                    break;
                
                case 'line' : 
                    
                    pt1 = new Vect($this.attr('x1'),$this.attr('y1')).mtx(mtx),
                    pt2 = new Vect($this.attr('x2'),$this.attr('y2')).mtx(mtx);
                    
                    $this.attr({'x1':pt1.x,'y1':pt1.y,'x2':pt2.x,'y2':pt2.y});
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    break;
                
                case 'polyline' :
                case 'polygon' :  
                    
                    list = $this[0].points;
                    i=0;N=list.numberOfItems;
                    
                    for (;i<N;i++) {
                        list.replaceItem(list.getItem(i).matrixTransform(mtx.mtx),i);
                    }
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    break;
                
                case 'path' :
                    
                    if (!JSYG.Path) throw new Error("Il faut inclure le module JSYG.Path pour pouvoir utiliser la méthode mtx2attrs sur les chemins");
                    
                    jPath = new JSYG.Path(this).rel2abs();
                    list = this.pathSegList;
                    i=0,N=list.numberOfItems;
                    
                    for (;i<N;i++) {
                        
                        seg = list.getItem(i);
                        letter = seg.pathSegTypeAsLetter;
                        
                        ['','1','2'].forEach(function(ind) {
                            
                            if (seg['x'+ind] == null && seg['y'+ind] == null) return;
                            
                            if (seg['x'+ind] != null) x = seg['x'+ind];
                            if (seg['y'+ind] != null) y = seg['y'+ind];
                            
                            if (x!=null && y!=null) {
                                var point = new Vect(x,y).mtx(mtx);
                                seg['x'+ind] = point.x;
                                seg['y'+ind] = point.y;
                            }
                        });
                        
                        if (keepRotation && letter === 'A') {
                            seg.r1 *= mtx.scaleX();
                            seg.r2 *= mtx.scaleY();
                        }
                        
                        jPath.replaceSeg(i,seg);
                    }
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    break;
                
                case 'g' :
                    
                    opt.mtx && $this.addMtx(mtx);
                    break;
                
                case 'use' :
                    
                    hg = new Vect($this.attr('x') || 0, $this.attr('y') || 0).mtx(mtx);
                    
                    $this.attr({'x':hg.x,'y':hg.y});
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    $this.setMtx($this.getMtx()
                        .translate(hg.x,hg.y)
                        .scaleNonUniform(d.scaleX,d.scaleY)
                        .rotate(d.rotate)
                        .translate(-hg.x,-hg.y)
                        );
                    
                    break;
                
                case 'text' :
                    
                    x = parseFloat($this.attr("x") || 0);					
                    y = parseFloat($this.attr("y")) || 0;
                    
                    pt = new Vect(x,y).mtx(mtx);
                    
                    $this.attr({'x':pt.x,'y':pt.y});
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    $this.setMtx($this.getMtx()
                        .translate(pt.x,pt.y)
                        .scaleNonUniform(d.scaleX,d.scaleY)
                        .rotate(d.rotate)
                        .translate(-pt.x,-pt.y)
                        );
                    
                    break;
                
                case 'rect' :
                    
                    hg = new Vect(dim.x,dim.y).mtx(mtx),
                    bg = new Vect(dim.x,dim.y+dim.height).mtx(mtx),
                    bd = new Vect(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
                    
                    $this.attr({
                        'x' : hg.x,
                        'y' : hg.y,
                        'width' : JSYG.distance(bd,bg),
                        'height' : JSYG.distance(bg,hg),
                        'rx' : $this.attr('rx') * d.scaleX,
                        'ry' : $this.attr('ry') * d.scaleY
                    });
                    
                    if (!opt.mtx) $this.resetTransf();
                    
                    $this.setMtx( $this.getMtx().rotate(d.rotate,hg.x,hg.y) );
                    
                    break;
                
                default :
                    
                    if (!$this.isSVG()) {
                        
                        hg = new Vect(0,0).mtx(mtx),
                        bg = new Vect(0,dim.height).mtx(mtx),
                        bd = new Vect(dim.width,dim.height).mtx(mtx);
                        
                        $this.setDim({
                            'x' : dim.x + hg.x,
                            'y' : dim.y + hg.y,
                            'width' : JSYG.distance(bd,bg),
                            'height' : JSYG.distance(bg,hg)
                        });
                        
                        if (!opt.mtx) $this.resetTransf();
                        
                        $this.setMtx($this.getMtx().rotate(d.rotate));
                        
                    }
                    else {
                        
                        hg = new Vect(dim.x,dim.y).mtx(mtx),
                        bg = new Vect(dim.x,dim.y+dim.height).mtx(mtx),
                        bd = new Vect(dim.x+dim.width,dim.y+dim.height).mtx(mtx);
                        
                        $this.attr({
                            'x' : hg.x,
                            'y' : hg.y,
                            'width' : JSYG.distance(bd,bg),
                            'height' : JSYG.distance(bg,hg)
                        });
                        
                        if (!opt.mtx) $this.resetTransf();
                        
                        $this.setMtx( $this.getMtx().rotate(d.rotate,hg.x,hg.y) );
                    }
            }
            
            if (keepRotation && tagsChoixRotation.indexOf(tag)!==-1) {
                
                shift = $this.getShift();
                
                $this.setMtx($this.getMtx().rotate(d.rotate,shift.x,shift.y));
            }
            
        });
        
        return this;
    };
    
    /**
     * Renvoie les transformations du 1er élément de la collection
     * @returns objet avec les propriétés "scaleX","scaleY","rotate","translateX","translateY"
     */
    JSYG.prototype.getTransf = function() {
        
        var shift = this.getShift(),
        transf = this.getMtx().decompose(shift.x,shift.y);
        
        delete transf.skew;
        
        return transf;
    };
    
    /**
     * Renvoie la position du pointeur de la souris relativement à l'élément, sous forme d'objet point Point
     * @param evt objet Event
     * @param ref argument JSYG (noeud DOM, chaîne css, etc) 
     * @returns {Point}
     * @see Point
     */
    JSYG.getCursorPos = function(evt,ref) {
        
        var mtx,rect;
        
        if (evt instanceof JSYG.Event) evt = evt.originalEvent;
        
        if (ref && !(ref instanceof JSYG)) ref = new JSYG(ref);
        
        if (ref.isSVG()) {
            
            mtx = ref.getMtx('screen').inverse();
            
            return new Point(evt.clientX,evt.clientY).mtx(mtx);
        }
        else {
            
            rect = ref && ref.getDim('page') || {x:0,y:0};
            
            return new Point(
                evt.pageX - rect.x,
            evt.pageY - rect.y
                );
            
        }
    };
    
    JSYG.isOver = function(dim1,dim2,typeOver) {
        
        var test = { x : false , y : false };
        
        typeOver = typeOver || 'full';
        
        if (typeOver === 'full') {
            
            if (dim1.width < dim2.width) {
                test.x = dim1.x > dim2.x && dim1.x+dim1.width<=dim2.x+dim2.width;
            } else {
                test.x = dim1.x <= dim2.x && dim1.x+dim1.width>=dim2.x+dim2.width;
            }
            
            if (dim1.height < dim2.height) {
                test.y = dim1.y > dim2.y && dim1.y+dim1.height<=dim2.y+dim2.height;
            } else {
                test.y = dim1.y <= dim2.y && dim1.y+dim1.height>=dim2.y+dim2.height;
            }
        }
        else if (typeOver === 'partial') {
            
            test.x = dim1.x > dim2.x && dim1.x <= dim2.x+dim2.width || dim1.x+dim1.width > dim2.x && dim1.x+dim1.width <= dim2.x+dim2.width;
            if (dim1.width > dim2.width && test.x === false) {
                test.x = dim1.x <= dim2.x && dim1.x+dim1.width >= dim2.x+dim2.width;
            }
            
            test.y = dim1.y > dim2.y && dim1.y <= dim2.y+dim2.height || dim1.y+dim1.height > dim2.y && dim1.y+dim1.height <= dim2.y+dim2.height;
            if (dim1.height > dim2.height && test.y === false) {
                test.y = dim1.y <= dim2.y && dim1.y+dim1.height >= dim2.y+dim2.height;
            }
            
        } else if (typeOver === 'center') {
            
            var center = { x : dim2.x+dim2.width/2, y : dim2.y+dim2.height/2 };
            test.x = center.x > dim1.x && center.x < dim1.x+dim1.width;
            test.y = center.y > dim1.y && center.y < dim1.y+dim1.height;
        }
        
        return test.x && test.y;
    };
    
    /**
     * Teste si le premier element de la collection est au dessus de l'élément passé en argument
     * @param node argument JSYG
     * @param type 'full','partial','center'
     * <ul>
     * 	<li>full : l'élément est entièrement au dessus de l'autre</li>
     *  <li>partial : les deux éléments se chevauchent</li>
     *  <li>center : l'élément recouvre le centre de l'élément argument</li>
     * </ul>
     * @returns {Boolean}
     */
    JSYG.prototype.isOver = function(node,type) {
        
        var dim1 = this.getDim('screen'),
        dim2 = new JSYG(node).getDim('screen');
        
        return JSYG.isOver(dim1,dim2,type);
    };
    
    /**
     * Renvoie la position du pointeur de la souris relativement à l'élément, sous forme d'objet vecteur Point
     * @param e objet Event
     * @returns {Point}
     */
    JSYG.prototype.getCursorPos = function(e) {
        return JSYG.getCursorPos(e,this);
    };
    
    /**
     * Remplit la collection de la couleur spécifiée, ou récupère la couleur du premier élément. Cette méthode est plutot réservée aux tests, il est préférable de jouer sur les classes, pour laisser les styles à part.
     * @param color couleur html (ou objet JSYG.Color). Si non définie, renvoie la couleur du premier élément.
     * @returns {String,JSYG} l'objet JSYG si color est définie, la valeur sinon
     */
    JSYG.prototype.fill = function(color) {
        
        if (color == null) return this.css( this.isSVG() ? 'fill' : 'background-color');
        
        this.each(function() {
            
            var $this = new JSYG(this);
            
            if ($this.isSVG()) {
                $this.css('fill', color == 'transparent' ? 'none' : color);
            } else {
                $this.css('background-color', color == 'none' ? 'transparent' : color);
            }
            
        });
        
        return this;
    };
    
    /**
     * Borde la collection selon la valeur spécifiée. Cette méthode est plutot réservée aux tests, il est préférable de jouer sur les classes, pour laisser les styles à part.
     * Elle permet de définir rapidement, comme en html (attribut css border) la bordure des éléments SVG.
     * @param val définition de la bordure ("1px solid black", "2px dashed gray", etc) ou objet JSYG.Color
     * @returns {String,JSYG} l'objet JSYG si color est définie, la valeur sinon
     */
    JSYG.prototype.stroke = function(val) {
        
        var onlyColor = null;
        
        if (val == null) return this.css( this.isSVG() ? 'stroke' : 'border' );
        
        try { new JSYG.Color(val); onlyColor = true; }
        catch(e) {}
        
        this.each(function() {
            
            var props, $this = new JSYG(this), px;
            
            if (!$this.isSVG()) { onlyColor && $this.css('border-color',val) || $this.css('border',val); }
            else {
                if (onlyColor) $this.css('stroke',val);
                else {
                    
                    props = val.split(/ +/);
                    props[0] && $this.css('stroke-width',props[0]);
                    px = parseInt(props[0],10);
                    
                    switch(props[1]) {
                        case 'dotted' : $this.css('stroke-dasharray',px+','+px); break;
                        case 'dashed' : $this.css('stroke-dasharray',px*4+','+px*4); break;
                        case 'none' : $this.css('stroke','none'); break;
                    }
                    
                    props[2] && $this.css('stroke',props[2]);
                }
            }
            
        });
        
        
        return this;
    };
    
    
    function createFakeDragFunction($nodes) {
        
        return function(e) {
            
            var hasMoved = false,
            
            posInit = {x:e.clientX,y:e.clientY};
            
            function mousemoveFct(e) {
                
                if (hasMoved === false) {
                    
                    var pos = {x:e.clientX,y:e.clientY};
                    
                    if (JSYG.distance(posInit,pos) > 0) {
                        e.type = "drag:start";
                        $nodes.trigger(e);
                        hasMoved = true;
                    }
                }
                else {
                    e.type = "drag:drag";
                    $nodes.trigger(e);
                }
            }
            
            
            function mouseupFct(e) {
                
                if(hasMoved === true) {
                    e.type = "drag:end";
                    $nodes.trigger(e);
                }
                
                $nodes.off("mousemove",mousemoveFct);
                new JSYG(document).off("mouseup",mouseupFct);
            }
            
            e.preventDefault();
            
            $nodes.on("mousemove",mousemoveFct);
            new JSYG(document).on("mouseup",mouseupFct);
        };
    }
    
    /**
     * Active/désactive les évènements drag:start, drag:drag et drag:end
     * @param {undefined|String} method sans argument, active les évènements, si "destroy" désactive les évènements
     * @example <pre>var jDiv = new JSYG('#maDiv');
     * jDiv.dragEvents().on("drag:start",function() { console.log("start dragging !"); });
     */
    JSYG.prototype.dragEvents = function(method) {
        
        var fct = this.data("fakedrag");
        
        if (!fct && (!method || method == "enable")) {
            
            fct = createFakeDragFunction(this);
            
            this.on("mousedown",fct).data("fakedrag",fct);
        }
        else if (fct && (method == "destroy" || method == "disable")) {
            
            this.off("mousedown",fct).removeData("fakedrag",fct);
        }
        
        return this;
    };
    
    /**
     * Renvoie un nombre entier aléatoire entre min et max, ou une valeur aléatoire d'un tableau
     * @param min valeur plancher, ou tableau de données
     * @param max valeur plafond
     * @returns {Number} entier, ou valeur du tableau
     */
    JSYG.rand = function(min,max) {
        if (Array.isArray(min)) return min[ JSYG.rand(0,min.length-1) ];
        else if (typeof min === 'string') return min.charAt(JSYG.rand(0,min.length-1)); // min[ind] ne fonctionne pas avec IE7
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    
    JSYG.support.twoDimTransf = (function() {
        
        var node = document.createElement('div'),
        attr,attributs = ['','Moz','Webkit','O','ms'];
        
        for (var i=0;i<attributs.length;i++) {
            attr = attributs[i]+'Transform';
            if (node.style && node.style[attr]!=null) return attr;
        }
        return false;
        
    })();
    
    
    //http://jointjs.com/blog/get-transform-to-element-polyfill.html
    SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
        return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
    };
    
    JSYG(function() {
        
        if (!svg || typeof document === "undefined") return false;
        
        var defs,use,
        id = 'rect'+ Math.random().toString().replace( /\D/g, "" );
        
        defs = new JSYG('<defs>');
        defs.appendTo(svg);
        
        new JSYG('<rect>')
            .attr({"id":id,x:10,y:10,width:10,height:10})
            .appendTo(defs);
        
        use = new JSYG('<use>').attr({id:"use",x:10,y:10,href:'#'+id}).appendTo(svg);
        
        document.body.appendChild(svg);
        
        JSYG.support.svgUseBBox = use[0].getBBox().x === 20;
        
        JSYG.support.svgUseTransform = use[0].getTransformToElement(svg).e !== 0;
        
        use.remove();
        defs.remove();			
        document.body.removeChild(svg);
        
        
        //firefox ne répercute pas les transformations 2D d'éléments HTML sur la méthode getBoundingClientRect
        JSYG.support.addTransfForBoundingRect = (function() {
            
            if (!JSYG.support.twoDimTransf) return false;
            
            var jDiv = new JSYG('<div>').text('toto').css('visibility','hidden').appendTo(document.body),
            node = jDiv[0],
            rect1,rect2;
            
            rect1 = node.getBoundingClientRect();
            jDiv.rotate(30);
            rect2 = node.getBoundingClientRect();
            
            if (rect1.left === rect2.left) return true;
            
            jDiv.remove();
            
            return false;
            
        })();
        
    });
    
    
    var cptPlugin = 0;
    
    /**
     * Permet d'attacher un plugin aux instances JSYG, qui fonctionne ensuite selon la philosophie jQuery.
     * @param Construct constructeur
     * @link http://docs.jquery.com/Plugins/Authoring#Plugin_Methods
     * @returns {Function}
     */
    JSYG.bindPlugin = function(Construct) {
        
        var name = 'dataPlugin' + cptPlugin,
        slice = Array.prototype.slice;
        
        cptPlugin++;
        
        return function(method) {
            
            var args = arguments,
            value;
            
            this.each(function() {
                
                var $this = new JSYG(this),
                plugin = $this.data(name);
                
                if (!plugin) {
                    plugin = new Construct(this);
                    $this.data(name,plugin);
                }
                
                if (method == 'get') {
                    value = plugin[args[1]];
                    if (typeof value == "function") value = plugin[args[1]]();
                    return false;
                }
                else if (method === 'destroy') {
                    plugin.disable();
                    $this.removeData(name);
                }
                else if (typeof method === 'object' || !method) {
                    if (plugin.enable) plugin.enable.apply(plugin,args);
                    else {
                        throw new Error("Ce plugin n'a pas de méthode enable,'" +
                            "il faut donc préciser en premier argument la méthode désirée");
                    }
                }
                else if (typeof method === 'string' && plugin[method]) {
                    if (method.substr(0,1) === '_')	throw new Error("La méthode " +  method + " est privée.");
                    else plugin[method].apply(plugin,slice.call(args,1));
                }
                else throw new Error("La méthode " +  method + " n'existe pas ");
                
                return null;
            });
            
            return method == 'get' ? value : this;
        };
    };
    
    /**
     * Renvoit la matrice de transformation équivalente à la viewbox
     */
    function viewBox2mtx(svgElmt) {
        
        var viewBox = svgElmt.viewBox.baseVal,
        mtx = new Matrix(),
        scaleX,scaleY,ratio;
        
        if (!viewBox) return mtx;
        
        if (viewBox.width && viewBox.height) {
            
            scaleX = svgElmt.getAttribute('width')/viewBox.width;
            scaleY = svgElmt.getAttribute('height')/viewBox.height;
            ratio = svgElmt.getAttribute("preserveAspectRatio");
            
            if (ratio && ratio!="none") throw new Error(ratio+" : désolé, la méthode ne fonctionne pas avec une valeur de preserveAspectRatio différente de 'none'.");
            
            mtx = mtx.scaleNonUniform(scaleX,scaleY);
        }
        
        mtx = mtx.translate(-viewBox.x,-viewBox.y);
        
        return mtx;
    }
    
    /**
     * Transforme les éléments &lt;svg&gt; de la collection en conteneurs &lt;g&gt;.
     * Cela peut être utile pour insérer un document svg dans un autre et éviter d'avoir des balises svg imbriquées.
     * @returns {JSYG} objet JSYG contenant la collection des éléments g.
     */
    JSYG.prototype.svg2g = function() {
        
        var list = [];
        
        this.each(function() {
            
            var $this = new JSYG(this);
            
            if ($this.getTag() != "svg") throw new Error($this.getTag()+" : la méthode ne concerne que les balises svg");
            
            var g = new JSYG('<g>'),
            mtx = new Matrix();
            
            while (this.firstChild) g.append(this.firstChild);
            
            mtx = mtx.translate( $this.attr("x")||0 , $this.attr("y")||0);
            
            mtx = mtx.multiply( viewBox2mtx(this) );
            
            g.setMtx(mtx).replace(this);
            
            list.push(g[0]);
            
        });
        
        return new JSYG(list);
    };
    
    /**
     * Parse une chaîne svg en renvoit l'objet JSYG correspondant
     * @param svgString chaîne svg
     * @returns {JSYG}
     */
    JSYG.parseSVG = function(svgString) {
        
        var parser = new DOMParser(),
        doc = parser.parseFromString(svgString, "image/svg+xml"),
        node = doc.documentElement;
        
        return new JSYG(node);
    };
    
    
    
    
    
    /**
     * Sérialise le noeud sous forme de chaîne de caractère svg 
     * @param node noeud a représenter
     * @returns {String}
     * Le résultat représente un fichier svg complet
     */
    JSYG.serializeSVG = function(node,_dim) {
        
        var serializer = new XMLSerializer(),
        jNode = new JSYG(node),
        tag = jNode.getTag(),
        isSVG = jNode.isSVG(),
        str,entete;
        
        if (tag == "svg") jNode.attr("xmlns",'http://www.w3.org/2000/svg'); //chrome
        
        str = serializer.serializeToString(jNode[0]),
        
        entete = '<?xml version="1.0" encoding="UTF-8"?>' +
            "\n" +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
            "\n";
        
        //sans ça, la conversion en pdf avec rsvg pose parfois des problèmes
        str = str.replace(/ \w+:href=/g,' xlink:href=');
        str = str.replace(/ xmlns:\w+="http:\/\/www\.w3\.org\/1999\/xlink"/g,'');
        
        if (tag === 'svg') {
            
            if (!/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/.test(str)) { //rsvg toujours
                str = str.replace(/^<svg /,'<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
            }
            str = entete + str;
        }
        else {
            
            if (!_dim) _dim = jNode.getDim();
            
            entete+= '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
            if (_dim) entete+=' width="'+_dim.width+'" height="'+_dim.height+'"';
            entete+= '>\n';
            
            if (!isSVG) {
                str = "<foreignObject width='100%' height='100%'>" +
                    //+ "<style>"+JSYG.getStyleRules()+"</style>"
                str +
                    "</foreignObject>";
            }
            
            str = entete + str + "\n" + "</svg>";
        }
        
        return str;
    };
    
    /**
     * Convertit le 1er élément de la collection en chaîne de caractères correspondant directement à un fichier SVG.
     * L'élément lui-même n'est pas impacté.
     * @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
     * et les images seront intégrées au document (plutôt que liées).
     * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
     * @returns {Promise}
     */
    JSYG.prototype.toSVGString = function(standalone,imagesQuality) {
        
        var jNode = this.clone(),
        dim = this.getTag() != 'svg' && this.getDim(),
        promise;
        
        jNode.find('script').remove();
        
        if (standalone && this.isSVG()) {
            jNode.walkTheDom(function() {
                var $this = new JSYG(this);
                $this.style2attr();
                if (JSYG.svgGraphics.indexOf($this.getTag()) != -1) $this.removeAttr("style");
            });
        }
        
        if (standalone) promise = jNode.url2data(true,null,imagesQuality);
        else promise = Promise.resolve();
        
        return promise.then(function() {
            return JSYG.serializeSVG(jNode,dim);
        });
    };
    
    /**
     * Convertit la collection en images sous forme d'url.
     * L'élément lui-même n'est pas impacté.
     * @param {Boolean} standalone si true, copiera en temps qu'attribut les propriétés de style définies en css,
     * et les images seront intégrées au document (plutôt que liées).
     * @param imagesQuality optionnel, qualité de 0 à 100 pour les images. Utile uniquement si standalone est à true.
     * @returns {Promise}  
     * @example <pre>new JSYG('#monSVG").toDataURL().then(function(src) {
     * 
     *     new JSYG("<img>").href(src).appendTo('body');
     *     
     *     //ou en javascript pur :
     *     var img = new Image();
     *     img.src = src;
     *     document.body.appendChild(img);
     * 
     *     //afficher le résultat dans une nouvelle fenêtre :
     *     window.open(src);
     * });
     *  
     */
    JSYG.prototype.toDataURL = function(standalone,imagesQuality) {
        
        return this.toSVGString(standalone,imagesQuality).then(function(svg) {
            return "data:image/svg+xml;base64," + strUtils.base64encode(svg);
        });
    };
    
    /**
     * Transforme les liens des images de la collection par le contenu de celles-ci.
     * Utile pour exporter du svg en intégrant les images (sinon le svg reste dépendant des fichiers images).
     * @param {Boolean} recursive si true cherche dans les descendants de la collection
     * @param format optionnel, "png", "jpeg" ("png" par défaut)
     * @param quality optionnel, qualité de 0 à 100
     * @returns {Promise}
     * @example <pre>//envoi du contenu svg cété serveur :
     * new JSYG("svg image").url2data().then(function() {
     *   fetch("sauve_image.php",{
     *   	method:"post",
     *   	body:"img="+new JSYG('svg').toSVGString()
     *   });
     * });
     */
    JSYG.prototype.url2data = function(recursive,format,quality) {
        
        var regURL = /^url\("(.*?)"\)/,
        promises = [];
        
        format = format || 'png';
        
        if (quality!=null) quality /= 100;
        
        function url2data() {
            
            var node = this,
            jNode = new JSYG(this),
            tag = jNode.getTag(),
            isImage = ['image','img'].indexOf(tag) != -1,
            matches = null,
            href;
            
            if (!isImage) {
                
                matches = jNode.css("background-image").match(regURL);
                href = matches && matches[1];
            }
            else href = jNode.href();
            
            if (!href || /^data:/.test(href)) return;
            
            promises.push( new Promise(function(resolve,reject) {
                
                var img = new Image(),
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
                
                img.crossOrigin = '';
                
                img.onload = function() {
                    
                    var data;
                    
                    canvas.width = this.width;
                    canvas.height = this.height;
                    ctx.drawImage(this,0,0);
                    
                    try {
                        
                        data = canvas.toDataURL("image/"+format,quality);
                        
                        if (isImage) jNode.href(data); 
                        else jNode.css("background-image",'url("'+data+'")');
                        
                        resolve(node);
                    }
                    catch(e) {
                        /*security error for cross domain */
                        reject(e);
                    }
                };
                
                img.onerror = reject;
                
                img.src = href;
                
            }) );
        }
        
        if (recursive) this.each(function() { JSYG.walkTheDom(url2data,this); });
        else this.each(url2data);
        
        return Promise.all(promises);
    };
    
    /**
     * Convertit le 1er élément de la collection en élément canvas.
     * L'élément lui-même n'est pas impacté.
     * @return {Promise}
     * @example <pre>new JSYG('#monSVG").toCanvas().then(function(canvas) {
     *   new JSYG(canvas).appendTo("body");
     * });
     */
    JSYG.prototype.toCanvas = function() {
        
        var dim = this.getDim( this.offsetParent() ),
        canvas = document.createElement("canvas"),
        node = this[0],
        ctx = canvas.getContext('2d'),
        tag = this.getTag(),
        promise;
        
        canvas.width = dim.width;
        canvas.height = dim.height;
        
        if (tag == "img" || tag == "image") promise = Promise.resolve( this.href() );
        else promise = this.toDataURL(true);
        
        return promise.then(function(src) {
            
            return new Promise(function(resolve,reject) {
                
                function onload() {
                    
                    try {
                        ctx.drawImage(this,0,0,dim.width,dim.height);
                        resolve(canvas);
                    }
                    catch(e) { reject(new Error("Impossible de dessiner le noeud "+tag)); }
                }
                
                if (tag == 'canvas') return onload.call(node);
                
                var img = new Image();
                img.onload = onload;
                img.onerror = function() { reject( new Error("Impossible de charger l'image "+src) ); };
                img.src = src;
            });
        });
    };
    
    /**
     * Move back each element before his previous sibling
     * @returns {JSYG}
     */
    JSYG.prototype.moveBackwards = function() {
        
        return this.each(function() {
            
            var $this = new JSYG(this);
            
            $this.insertBefore( $this.prev() );
        });
    };
    
    /**
     * Move back each element before his parent first child
     * @returns {JSYG}
     */
    JSYG.prototype.moveBack = function() {
        
        return this.each(function() {
            
            new JSYG(this).parent().prepend(this);
        });
    };
    
    /**
     * Move each element after his next sibling
     * @returns {JSYG}
     */
    JSYG.prototype.moveForwards = function() {
        
        return this.each(function() {
            
            var $this = new JSYG(this);
            
            $this.insertAfter( $this.next() );
        });
    };
    
    /**
     * Move each element after his parent last child
     * @returns {JSYG}
     */
    JSYG.prototype.moveFront = function() {
        
        return this.each(function() {
            
            new JSYG(this).parent().append(this);
        });
    };
    
    
    JSYG.prototype.getUniqueSelector = function () {
        
        var path;
        
        var $node = this;
        /*Include only names and IDs since you can always programmatically add/remove classes*/
        var uniqueTags = ['name', 'id'];
        
        while ($node.length) {
            
            var realNode = $node[0],
            name = realNode.localName,
            parent,
            uniqueIdentifierFound,
            i,tag,tagValue,sameTagSiblings,allSiblings,index;
            
            if (!name) break;
            
            name = name.toLowerCase();
            parent = $node.parent();
            uniqueIdentifierFound = false;
            
            for (i=uniqueTags.length-1 ; i>= 0 ; i--) {
                
                tag = uniqueTags[i];
                tagValue = $node.attr(tag);
                
                if (tagValue && (tagValue.trim !== '')) {
                    
                    name = '[' + tag + '=\"' + tagValue + '\"]';
                    uniqueIdentifierFound = true;
                    break;
                }
            }
            
            if (!uniqueIdentifierFound) {
                sameTagSiblings = parent.children(name);
                
                if (sameTagSiblings.length > 1) {
                    
                    allSiblings = parent.children();
                    index = allSiblings.index(realNode) + 1;
                    name += ':nth-child(' + index + ')';
                }
                
                path = name + (path ? '>' + path : '');
                $node = parent;
                
            }
            else {
                path = name + (path ? '>' + path : '');
                break; //exit while loop
            }
        }
        
        return path;
    };

(function add2JSYG() {
    
    for (var n in strUtils) JSYG[n] = strUtils[n];
    
    JSYG.Matrix = Matrix;
    JSYG.Vect = Vect;
    JSYG.Point = Point;
    
}());

return JSYG;
});