/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-zoomandpan",["jsyg","jsyg-resizable","js-cookie","jquery-mousewheel"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Resizable && typeof Cookies != "undefined" && typeof jQuery != "undefined" && jQuery.fn.mousewheel) factory(JSYG,JSYG.Resizable,Cookies);
        else throw new Error("Dependency is missing");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG,Resizable,cookies) {
    
    "use strict";
    
    /**
     * liste des plugins associés au zoomAndPan
     */
    var plugins = ['mouseWheelZoom','marqueeZoom','resizable','mousePan'];
    
    /**
     * <strong>nécessite le module ZoomAndPan</strong><br/><br/>
     * Gestion du zoom et panoramique d'un canvas SVG.<br/><br/>
     * @param arg argument JSYG référence au canvas SVG
     * @param opt optionnel, objet définissant les propriétés. S'il est précisé, le module sera implicitement activé. Si les modules ("mouseWheelZoom",
     * "marqueeZoom","resizable","mousePan") sont définis à true, il seront activés avec les options par défaut.
     * @example <pre>var zap = new ZoomAndPan("svg");
     * zap.overflow = "auto";
     * zap.enable();
     * zap.mouseWheelZoom.key = "ctrl";
     * zap.mouseWheelZoom.enable();
     * zap.mousePan.enable();
     * 
     * //Equivalent à
     * new ZoomAndPan("svg",{
     *    overflow:"auto",
     *    mouseWheelZoom:{key:"ctrl"},
     *    mousePan:true
     * });
     * </pre>
     * @returns {ZoomAndPan}
     */
    function ZoomAndPan(arg,opt) {
        /**
         * Gestion du zoom par la molette de la souris
         */
        this.mouseWheelZoom = new MouseWheelZoom(this);
        /**
         * Gestion du zoom par tracé d'un cadre
         */
        this.marqueeZoom = new MarqueeZoom(this);
        /**
         * Gestion de la taille du canvas SVG
         */
        this.resizable = new ZapResizable(this);
        /**
         * déplacement dans le canvas avec la souris
         */
        this.mousePan = new MousePan(this);
        /**
         * gestion du cookie pour mémoriser zoom et position
         */
        this.cookie = new Cookie(this);
        /**
         * Element g permettant de gérer le zoom
         */
        this.innerFrame = new JSYG('<g>')[0];
        /**
         * Element div permettant de gérer les ascenceurs (si overflow!="hidden")
         */
        this.outerFrame = new JSYG('<div>')[0];
	
        if (arg) this.setNode(arg);
        if (opt) this.enable(opt);
    }
    
    ZoomAndPan.prototype = new JSYG.StdConstruct();
    
    ZoomAndPan.prototype.constructor = ZoomAndPan;
    
    /**
     * définitions des options
     * @param options
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.set = function(options) {
        
        for (var n in options) {
            if (options.hasOwnProperty(n) && (n in this)) {
                if (plugins.indexOf(n) !== -1) { this[n].set(options[n]); }
                else { this[n] = options[n]; }
            }
        }
        
        return this;
    };
    
    /**
     * définition du canvas SVG
     * @param arg argument JSYG
     */
    ZoomAndPan.prototype.setNode = function(arg) {
        
        var enabled = this.enabled,
        jNode = new JSYG(arg);
        
        if (enabled) this.disable();
        
        if (this.node) new JSYG(this.node).removeData('zoomandpan');
        
        this.node = jNode[0];
        
        jNode.data('zoomandpan',{});
        
        if (enabled) this.enable();
    };
    
    /**
     * module actif ou non
     */
    ZoomAndPan.prototype.enabled = false;
    /**
     * Gestion du contenu dépassant du canvas de visualisation
     * 'hidden' ou 'auto' ou 'scroll' (scroll-x,scroll-y)
     */
    ZoomAndPan.prototype.overflow = 'hidden';
    /**
     * conteneur (g) qui gère le zoom et la position du contenu
     */
    ZoomAndPan.prototype.innerFrame = null;
    /**
     * conteneur (div) auquel est attaché le canvas SVG (si overflow!='hidden').
     * Cela permet de gérer des ascenceurs, qui n'existent pas en SVG.
     */
    ZoomAndPan.prototype.outerFrame = null;
    /**
     * effet d'animation ou non pour le zoom et le déplacement
     * Attention, cela nécessite une bonne carte graphique
     */
    ZoomAndPan.prototype.animate = false;
    /**
     * Options supplémentaires d'animation
     */
    ZoomAndPan.prototype.animateOptions = null;
    /**
     * Echelle minimale. Si = "canvas", l'échelle minimale correspond à la taille du canvas (en tenant compte des bornes définies
     * par la propriétés bounds ou les propriétés minLeft,maxRight,minTop,maxBottom).
     */
    ZoomAndPan.prototype.scaleMin = "canvas";
    /**
     * Echelle maximale. Si = "canvas", l'échelle minimale correspond à la taille du canvas (en tenant compte des bornes définies
     * par la propriétés bounds ou les propriétés minLeft,maxRight,minTop,maxBottom).
     */
    ZoomAndPan.prototype.scaleMax = null;
    /**
     * Abcisse minimale au delà de laquelle on ne peut plus naviguer
     */
    ZoomAndPan.prototype.minLeft = null;
    /**
     * Abcisse maximale au delà de laquelle on ne peut plus naviguer
     */
    ZoomAndPan.prototype.maxRight = null;
    /**
     * Ordonnée minimale au delà de laquelle on ne peut plus naviguer
     */
    ZoomAndPan.prototype.minTop = null;
    /**
     * Ordonnée maximale au delà de laquelle on ne peut plus naviguer
     */
    ZoomAndPan.prototype.maxBottom = null;
    /**
     * permet de définir les abcisses et ordonnées extrêmes de navigation à x pixels du bord du contenu
     * (si la valeur est positive, on peut aller au delà du contenu).
     */
    ZoomAndPan.prototype.bounds = null;
    /**
     * largeur minimale du canvas
     */
    ZoomAndPan.prototype.minWidth = 5;
    /**
     * hauteur minimale du canvas
     */
    ZoomAndPan.prototype.minHeight = 5;
    /**
     * largeur maximale du canvas
     */
    ZoomAndPan.prototype.maxWidth = 3000;
    /**
     * hauteur maximale du canvas
     */
    ZoomAndPan.prototype.maxHeight = 3000;
    /**
     * Fonction(s) à exécuter à tout changment de zoom
     */
    ZoomAndPan.prototype.onscale = null;
    /**
     * Fonction(s) à exécuter à tout changment de position
     */
    ZoomAndPan.prototype.ontranslate = null;
    /**
     * Fonction(s) à exécuter à tout changment de taille du canvas
     */
    ZoomAndPan.prototype.onresize = null;
    /**
     * Fonction(s) à exécuter à tout changement
     */
    ZoomAndPan.prototype.onchange = null;
    /**
     * Fonction(s) à exécuter pendant les animations
     */
    ZoomAndPan.prototype.onanimate = null;
    /**
     * Renvoie la taille du contenu de la navigation (contenu + bornes définies)
     * @param ctm optionnel, si true renvoie la taille en tenant compte de la matrice de transformation
     */
    ZoomAndPan.prototype._getBounds = function(ctm) {
        
        var initDim = new JSYG(this.innerFrame).getDim();
        
        var bounds = {
            left : this.minLeft == null ? initDim.x - this.bounds : this.minLeft,
            right : this.maxRight == null ? initDim.x + initDim.width + this.bounds : this.maxRight,
            top : this.minTop == null ? initDim.y - this.bounds : this.minTop,
            bottom : this.maxBottom == null ? initDim.y + initDim.height + this.bounds : this.maxBottom
        };
        
        if (ctm) {
            
            var mtx = new JSYG(this.innerFrame).getMtx(),
            hg = new JSYG.Vect(bounds.left,bounds.top).mtx(mtx),
            bd = new JSYG.Vect(bounds.right,bounds.bottom).mtx(mtx);
            
            bounds.left = hg.x;
            bounds.top = hg.y;
            bounds.right = bd.x;
            bounds.bottom = bd.y;
        }
        
        bounds.width = bounds.right - bounds.left;
        bounds.height = bounds.bottom - bounds.top;
        
        return bounds;
    };
    
    /**
     * Active la gestion du zoom et panoramique.
     * Cette méthode insère un conteneur (propriété innerFrame) à la racine du canvas
     * et tout le contenu y est déplacé. Les éléments créés ensuite doivent donc etre
     * attachés à "innerFrame" et non à l'élément svg lui-meme (sauf si cela est voulu),
     * sinon ils ne suivront pas le zoom et panoramique avec le reste.
     * Si la propriété "overflow" est différente de "hidden", un conteneur (propriété
     * outerFrame) div est inséré et le canvas y est attaché afin de gérer le scroll
     * (les ascenseurs n'existent pas en SVG). 
     * @param opt optionnel, objet définissant les options
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
        
        if (['auto','hidden'].indexOf(this.overflow) === -1 && this.overflow.indexOf('scroll')===-1) {
            throw new Error(this.overflow + ' : valeur incorrecte pour la propriété overflow');
        }
        
        if (!this.node) throw new Error("Il faut d'abord définir la propriété node par la méthode setNode");
        
        var jSVG = new JSYG(this.node),
        backup = jSVG.data('zoomandpan') || {},
        hidden = this.overflow == "hidden",
        dim = jSVG.getDim(),
        width = jSVG.attr("width") || dim.width,
        height = jSVG.attr("height") || dim.height,
        that = this,
        n;
        
        backup.dimInit = {
            width:width,
            height:height
        };
                
        ///////////////////////////////////////////////////
        //INNERFRAME			
        var viewBox = this.node.viewBox.baseVal,
        exclude = {
            tags :['switch','defs'],
            list : []
        },
        child,
        innerFrame = new JSYG(this.innerFrame).transfOrigin('left','top'),
        mtx = new JSYG.Matrix();
        
        while (this.node.firstChild) {
            child = this.node.firstChild;
            if (exclude.tags.indexOf(child.tagName)!==-1) {
                this.node.removeChild(child);
                exclude.list.push(child);
            }
            else innerFrame.append(child);
        }
        
        jSVG.append(exclude.list).append(innerFrame);
        
        if (viewBox && viewBox.width && viewBox.height) {
            
            mtx = mtx.scaleNonUniform(
                dim.width/viewBox.width,
            dim.height/viewBox.height
                );
        }
        
        if (hidden && viewBox) mtx = mtx.translate(-viewBox.x,-viewBox.y);
        
        jSVG.removeAttr('viewBox');
        backup.viewBoxInit = viewBox;
        
        innerFrame.setMtx(mtx);
        
        //////////////////////////////////////////////
        // OUTERFRAME
        
        if (!hidden) {
            
            var outerFrame = new JSYG(this.outerFrame),
            position = jSVG.css('position'),
            bounds = this._getBounds("ctm"),
            origin,
            left = jSVG.css('left'),
            top = jSVG.css('top'),
            margin = jSVG.css('margin');
            
            outerFrame.css({
                width : width,
                height : height,
                overflow : this.overflow,
                padding : '0px',
                margin : margin,
                display : 'inline-block',
                left : left,
                top : top,
                visibility : jSVG.css('visibility'),
                position : position === "static" ? "relative" : position,
                border : jSVG.css('border'),
                backgroundColor : jSVG.css('backgroundColor')
            });
            
            backup.cssInit = {
                left : left,
                top : top,
                margin : margin,
                position : position
            };
            
            jSVG.css({
                "left":0,
                "top":0,
                "margin":0,
                "position":"absolute",
                "width":width,
                "height":height
            });
            
            mtx = new JSYG.Matrix().translate(-bounds.left,-bounds.top).multiply(mtx);
            innerFrame.setMtx(mtx);
            
            origin = new JSYG.Vect(viewBox && viewBox.x || 0 , viewBox && viewBox.y || 0).mtx(mtx);
            
            outerFrame
                .replaceAll(this.node)
                .append(this.node)
                .scrollLeft(origin.x)
                .scrollTop(origin.y);
        }
        
        function majCanvas() {
            that.transform( that.transform() );
        }
        
        if (/%/.test(width)) {
            
            JSYG(window).on("resize",majCanvas);
            backup.majCanvas = majCanvas;
            majCanvas();
        }
                
        this.enabled = true;
        
        if (backup.plugins) {
            for (n in backup.plugins) this[n].enable();
        }
        
        if (opt) {
            for (n in opt) {
                if (plugins.indexOf(n) !== -1) this[n].enable(opt[n]);
            }
        }
        
        jSVG.data('zoomandpan',backup);
        
        return this;			
    };
    
    /**
     * Désactivation de la gestion du zoom et panoramique
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.disable = function() {
        
        if (!this.enabled || !this.node) return this;
        
        var jSVG = new JSYG(this.node),
        plugins = {},
        backup = jSVG.data('zoomandpan') || {},
        viewBox = backup.viewBoxInit;
        
        if (this.mouseWheelZoom.enabled) { plugins.mouseWheelZoom = true; this.mouseWheelZoom.disable(); }
        if (this.marqueeZoom.enabled) { plugins.marqueeZoom = true; this.marqueeZoom.disable(); }
        if (this.resizable.enabled) { plugins.resizable = true; this.resizable.disable(); }
        if (this.mousePan.enabled) { plugins.mousePan = true; this.mousePan.disable(); }
        
        backup.plugins = plugins;
        
        while (this.innerFrame.firstChild) jSVG.append(this.innerFrame.firstChild);
        new JSYG(this.innerFrame).remove();
        
        if (this.outerFrame.parentNode) {
            jSVG.replaceAll(this.outerFrame);
            new JSYG(this.outerFrame).remove();
        }
        
        if (viewBox && viewBox.width && viewBox.height) {
            jSVG.attr('viewBox',viewBox.x+' '+viewBox.y+' '+viewBox.width+' '+viewBox.height);
        }
        
        delete backup.viewBoxInit;
        
        if (backup.cssInit) {
            jSVG.css(backup.cssInit);
            delete backup.cssInit;
        }
        
        if (backup.dimInit) {
            jSVG.css(backup.dimInit);
            delete backup.dimInit;
        }
                
        if (backup.majCanvas) {
            JSYG(window).off("resize",backup.majCanvas);
        }
        
        this.enabled = false;
        
        return this;
    };
    
    /**
     * Ajustement nécessaire du aux ascenceurs
     * @returns {Number}
     */
    ZoomAndPan.prototype._getAdd = function() {
        return (this.overflow == "hidden") ? 0 : (this.overflow == "auto" ? 2 : 20);
    };
    
    /**
     * Renvoie (appel sans argument) ou définit la taille du canvas
     * @param width optionnel, largeur du canvas. Si non défini, largeur proportionnelle à la hauteur définie
     * @param height optionnel, hauteur du canvas. Si non défini, hauteur proportionnelle à la largeur définie
     * @param keepViewBox booléen optionnel, si true garde le cadrage après redimensionnement.
     * @returns {ZoomAndPan} si appelé avec arguments, objet avec les propriétés width et height sinon.
     */
    ZoomAndPan.prototype.size = function(width,height,keepViewBox) {
        
        var hidden = this.overflow == "hidden",
        canvas = new JSYG( hidden ? this.node : this.outerFrame),
        innerWidth = canvas.innerWidth(),
        innerHeight = canvas.innerHeight(),
        mtx, that = this,
        keepRatio = width == null || height == null,
        widthTest,heightTest,
        animate = this.animate,
        opt,
        pt;
        
        if (width == null && height == null) return { width : innerWidth, height : innerHeight };
        
        if (JSYG.isPlainObject(width)) {
            opt = width;
            keepViewBox = opt.keepViewBox || height;
            height = opt.height;
            width = opt.width;
        }
        
        if (width == null) width = innerWidth * height / innerHeight;
        else if (height == null) height = innerHeight * width / innerWidth;
        
        widthTest = JSYG.clip(width,this.minWidth,this.maxWidth);
        heightTest = JSYG.clip(height,this.minHeight,this.maxHeight);
        
        if (keepRatio && widthTest!=width) return this.size(widthTest,null,keepViewBox);
        else width = widthTest;
        
        if (keepRatio && heightTest!=height) return this.size(null,heightTest,keepViewBox);
        else height = heightTest;
        
        canvas.setDim({width:width,height:height});
        
        mtx = this.transform();
        
        if (keepViewBox) {
            
            pt = new JSYG.Vect(0,0).mtx(mtx.inverse());
            mtx = mtx.scaleNonUniform(width/innerWidth,height/innerHeight,pt.x,pt.y);
        }
        
        this.animate = false;
        
        this.transform(mtx,function() {
            that.trigger('resize');
            that.animate = animate;
        });
        
        return this;
    };
    
    /**
     * Applique une transformation au contenu du canvas
     * @param mtx objet JSYG.Matrix, matrice de transformation à appliquer
     * @param callback fonction à exécuter à la fin (équivalent à l'évènement onchange)
     * @returns
     */
    ZoomAndPan.prototype.transform = function(mtx,callback) {
        
        var innerFrame =  new JSYG(this.innerFrame),
        hidden = this.overflow == "hidden",
        outerFrame = !hidden && new JSYG(this.outerFrame),
        scrollLeft = outerFrame && outerFrame.scrollLeft(),
        scrollTop = outerFrame && outerFrame.scrollTop();
        
        if (mtx == null) {
            mtx = innerFrame.getMtx();
            return hidden ? mtx : new JSYG.Matrix().translate(-scrollLeft,-scrollTop).multiply(mtx);
        }
        
        var transf = mtx.decompose(),
        scaleX = transf.scaleX,
        scaleY = transf.scaleY,
        translX = transf.translateX,
        translY = transf.translateY,
        mtxInv = mtx.inverse(),
        bounds = this._getBounds();
        
        if (!hidden) {
            
            mtx = mtx.translate(scrollLeft,scrollTop).translate(-bounds.left,-bounds.top);
            mtxInv = mtx.inverse();
        }
        
        var options = Object.create(this.animateOptions),
        that = this,
        
        outerDim = this.size(),
        add = this._getAdd(),
        
        jSVG = new JSYG(this.node),
        
        centerIn = innerFrame.getCenter(),
        centerOut = new JSYG.Vect((outerDim.width-add)/2,(outerDim.height-add)/2).mtx(mtxInv),
        
        hg = new JSYG.Vect(0,0).mtx(mtxInv),
        bd = new JSYG.Vect(outerDim.width-add,outerDim.height-add).mtx(mtxInv);
        
        //le contenu est moins large que le cadre, on centre le contenu
        if (bounds.width * scaleX + add < outerDim.width) {
            
            mtx = mtx.translateX(centerOut.x - centerIn.x);
            
            //on étend le canvas svg à la largeur exterieure
            if (!hidden) jSVG.css("width",outerDim.width-add);  
        }
        else {
            
            if (!hidden) {
                jSVG.css("width",bounds.width*scaleX);
                mtx = mtx.translateX(hg.x - bounds.left);
            }
            else {
                //on empêche de sortir du cadre
                if (hg.x < bounds.left) mtx = mtx.translateX( hg.x - bounds.left);
                else if (bd.x > bounds.right) mtx = mtx.translateX(bd.x - bounds.right);
            }
        }
        
        //le contenu est moins haut que le cadre, on centre le contenu
        if (bounds.height * scaleY + add < outerDim.height) {
            
            mtx = mtx.translateY(centerOut.y - centerIn.y);
            
            //on étend le canvas svg à la hauteur exterieure
            if (!hidden) jSVG.css("height",outerDim.height-add);  
        }
        else {
            
            if (!hidden) {
                jSVG.css("height",bounds.height*scaleY);
                mtx = mtx.translateY(hg.y - bounds.top);
            }
            else {
                //on empeche de sortir du cadre
                if (hg.y < bounds.top) mtx = mtx.translateY( hg.y - bounds.top);
                else if (bd.y > bounds.bottom) mtx = mtx.translateY( bd.y - bounds.bottom);				
            }
        }
        
        if (!hidden) {
            transf = mtx.decompose();
            outerFrame.scrollLeft( Math.round(transf.translateX - translX) );
            outerFrame.scrollTop( Math.round(transf.translateY - translY) );
        }
        
        if (!this.animate || !hidden) {
            
            innerFrame.setMtx(mtx);
            this.trigger('change');
            if (callback) callback.call(this.node);
        }
        else {
            
            innerFrame.animate(
                JSYG.extend(options,{
                    to:{mtx:mtx},
                onanimate : function() { that.trigger('animate'); },
                onend: function() {
                    that.trigger('change');
                    if (callback) callback.call(that.node);
                }
            })
                );
        }
        
        return this;
    };
    
    /**
     * Renvoie ou applique l'échelle (si la méthode est appelée avec des arguments).
     * @param scale optionnel, si défini facteur de l'échelle (multiplie l'échelle courante, ne la remplace pas).
     * @param originX optionnel, abcisse du point fixe (centre du canvas par défaut)
     * @param originY optionnel, ordonnee du point fixe (centre du canvas par défaut)
     * @param callback optionnel, fonction à exécuter une fois le zoom effectué (équivalent à l'évènement onscale)
     * @returns {Number,ZoomAndPan} l'échelle si la méthode est appelée sans argument, l'objet lui-meme sinon.
     */
    ZoomAndPan.prototype.scale = function(scale,originX,originY,callback) {
        
        var mtx = this.transform(),
        transf = mtx.decompose();
        
        if (scale == null) return transf.scaleX;
        
        var size = this.size(),
        bounds = this._getBounds(),
        add = this._getAdd(),
        scaleTest = mtx.scale(scale).scaleX(),
        scaleCanvas = Math.min( (size.width-add) / bounds.width , (size.height-add) / bounds.height),
        scaleMin = (this.scaleMin == 'canvas') ? scaleCanvas : this.scaleMin,
        scaleMax = (this.scaleMax == 'canvas') ? scaleCanvas : this.scaleMax,
        origin,
        that = this;
        
        if (scaleMin && scaleTest < scaleMin) scale = scaleMin / transf.scaleX;
        if (scaleMax && scaleTest > scaleMax) scale = scaleMax / transf.scaleX;
        
        originX = (originX!=null) ? originX : size.width/2;
        originY = (originY!=null) ? originY : size.height/2;
        origin = new JSYG.Vect(originX,originY).mtx(mtx.inverse());
        
        mtx = mtx.scale(scale,origin.x,origin.y);
        
        this.transform(mtx,function() {
            that.trigger("scale");
            if (callback) callback.call(that.node);
        });
        
        return this;
    };
    
    /**
     * Renvoie ou applique le déplacement dans le canvas (unités initiales).
     * @example Si l'échelle est de 2, un déplacement horizontal de 1 déplacera visuellement le contenu de 2 pixels.
     * @param x déplacement horizontal
     * @param y déplacement vertical
     * @param callback, optionnel, fonction à exécuter une fois la translation effectuée (équivalent à l'évènement ontranslate)
     * @returns {ZoomAndPan,JSYG.Vect} un vecteur si appelé sans argument, l'objet lui-meme sinon.
     */
    ZoomAndPan.prototype.translate = function(x,y,callback) {
        
        var mtx = this.transform(),
        that = this;
        
        if (x == null && y == null) return new JSYG.Vect(0,0).mtx( mtx.inverse() );
        
        x*=-1;
        y*=-1;
        
        mtx = mtx.translate(x,y);
        
        this.transform(mtx,function() {
            that.trigger('translate',that.node);
            if (callback) callback.call(that.node);
        });
        
        return this;
    };
    
    /**
     * déplacement dans le canvas (en pixels écran).
     * @example Si l'échelle est de 2, un déplacement horizontal de 1 déplacera visuellement le contenu de 1 pixel.
     * @param x déplacement horizontal
     * @param y déplacement vertical
     * @param callback optionnel, fonction à exécuter une fois la translation effectuée (équivalent à l'évènement ontranslate)
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.screenTranslate = function(x,y,callback) {
        
        var transf = this.transform().decompose();
        
        if (x == null && y == null) return new JSYG.Vect(transf.translateX,transf.translateY);
        
        this.translate(x/transf.scaleX,y/transf.scaleY,callback);
        
        return this;
    };
    /**
     * Fixe la valeur de l'échelle
     * @param scale valeur de l'échelle
     * @param originX optionnel, abcisse du point fixe (centre par défaut)
     * @param originY optionnel, ordonnée du point fixe (centre par défaut)
     * @param callback optionnel, fonction à exécuter une fois le zoom effectué (équivalent à l'évènement onscale)
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.scaleTo = function(scale,originX,originY,callback) {
        
        this.scale(
            scale / this.scale(),
        originX,originY,callback
            );
        
        return this;
    };
    
    /**
     * Adapte le contenu à la taille du canvas
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.fitToCanvas = function() {
        
        var bounds = this._getBounds("ctm"),
        outerDim = this.size(),
        add = this._getAdd(),
        rapX = (outerDim.width - add) / bounds.width,
        rapY = (outerDim.height - add) / bounds.height;
        
        this.scale( Math.min(rapX,rapY) );
        
        return this;
    };
    
    /**
     * Fixe les valeurs de la translation (point supérieur gauche)
     * @param x abcisse
     * @param y ordoonée
     * @param callback optionnel, fonction à exécuter une fois la translation effectuée (équivalent à l'évènement ontranslate)
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.translateTo = function(x,y,callback) {
        
        var transl = this.translate();
        this.translate(x-transl.x,y-transl.y,callback);
        return this;
    };
    
    /**
     * définit ou fixe la position du centre du canvas (si appelé avec arguments)
     * @param x abcisse
     * @param y ordoonée
     * @param callback optionnel, fonction à exécuter une fois la translation effectuée (équivalent à l'évènement ontranslate)
     * @returns {ZoomAndPan}
     */
    ZoomAndPan.prototype.center = function(x,y,callback) {
        
        if (x==null && y==null) {
            
            var size = this.size(),
            mtx = this.transform();
            
            return new JSYG.Vect(size.width/2,size.height/2).mtx( mtx.inverse() );
        }
        else {
            
            var center = this.center();
            
            this.translate(x-center.x,y-center.y,callback);
            return this;
        }
    };
    
    Object.defineProperty(ZoomAndPan.prototype,"overflow",{
        
        get : function() { return this._overflow || "hidden"; },
        
        set : function(val) {
            
            if (['hidden','auto','scroll'].indexOf(val) === -1)
                throw new Error(val+" : valeur incorrecte pour la propriété overflow");
            
            if (val == this._overflow) return;
            
            var enabled = this.enabled,
            scale, translate, size;
            
            if (enabled) {
                
                scale = this.scale();
                translate = this.translate();
                size = this.size();
                this.disable();
            }
            
            this._overflow = val;
            
            if (enabled) {
                
                this.enable().scale(scale).translateTo(translate.x,translate.y).size(size.width,size.height);
            }
        }
    });
    
    /**
     * Gestion du cookie pour conservation de l'état
     */
    function Cookie(zoomAndPanObject) {
        this.zap = zoomAndPanObject;
    }
    
    /**
     * expiration du cookie:  nombre de jours à partir de la date courante, ou null pour session courante.
     */
    Cookie.prototype.expires = null;
    /**
     * Lit le cookie et positionne le canvas en conséquence
     * @returns {Cookie}
     */
    Cookie.prototype.read = function() {
        
        var zap = this.zap,
        node = zap.node;
        
        if (!node.id) throw new Error("Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies");
        
        var cookie = cookies.get(node.id);
        
        if (!cookie) return this;
        
        cookie = cookie.split(';');
        
        var css = { 'width' : cookie[0], 'height' : cookie[1] },
        newmtx = cookie[2],
        overflow = cookie[3];
    
        if (overflow != zap.overflow) throw new Error("Overflow property is different than in cookie value.");
        
        new JSYG(node).css(css);
        
        new JSYG(zap.innerFrame).css(css).attr('transform',newmtx);
               
        if (overflow != "hidden" && cookie[4] && cookie[5] && cookie[6]!=null && cookie[7]!=null) {
            
            new JSYG(zap.outerFrame)
                .css({ width : cookie[4], height : cookie[5] })
                .scrollLeft(cookie[6])
                .scrollTop(cookie[7]);
        }
                
        return this;
    };
    
    /**
     * Ecrit un cookie pour mémoriser l'état du canvas SVG
     * @returns {Cookie}
     */
    Cookie.prototype.write = function() {
        
        var zap = this.zap,
        node = zap.node;
        
        if (!node.id) throw new Error("Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies");
        
        var jSVG = new JSYG(node),
        valcookie = "",
        outerFrame;
        
        valcookie+= parseFloat(jSVG.css('width'))+';'+parseFloat(jSVG.css('height'))+';';
        valcookie+= new JSYG(zap.innerFrame).getMtx().toString();
        valcookie+=';'+zap.overflow;
        
        if (zap.overflow !== 'hidden') {
            
            outerFrame = new JSYG(zap.outerFrame);
            valcookie+=';'+outerFrame.css('width')+';'+outerFrame.css('height')+';';
            valcookie+= outerFrame.scrollLeft()+';'+outerFrame.scrollTop();
        }
        
        cookies.set(node.id,valcookie, this.expires ? { expires: this.expires } : undefined);
        
        return this;
    };
    
    /**
     * Supprime le cookie
     * @returns {Cookie}
     */
    Cookie.prototype.remove = function() {
        
        cookies.remove(this.zap.node.id);
        return this;
    };
    
    /**
     * Active le cookie
     * @returns {Cookie}
     */
    Cookie.prototype.enable = function() {
        
        var zap = this.zap,
        node = zap.node,
        unloadFct;
        
        if (!node.id) throw new Error("Il faut définir un id pour la balise SVG pour pouvoir utiliser les cookies");
        
        this.disable();
        
        unloadFct = this.write.bind(this);
        
        new JSYG(window).on('unload',unloadFct);
        
        this.disable = function() {
            
            new JSYG(window).off("unload",unloadFct);
            
            cookies.remove(node.id);
            
            this.enabled = false;
            
            return this;
        };
        
        //this.read();
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactive le cookie
     * @returns {Cookie}
     */
    Cookie.prototype.disable = function() {
        return this;
    };
    
    
    /**
     * Gestion du zoom par molette de la souris (+ une touche spéciale éventuellement).
     * Attention, google chrome ne permet pas d'annuler l'action par défaut pour ctrl+molette
     * @link http://code.google.com/p/chromium/issues/detail?id=111059
     */
    function MouseWheelZoom(zoomAndPanObject) {
        this.zap = zoomAndPanObject;
    }
    
    MouseWheelZoom.prototype = new JSYG.StdConstruct();
    
    MouseWheelZoom.prototype.constructor = MouseWheelZoom;
    /**
     * Touche spéciale à maintenir enfoncée pour rendre le zoom actif ("ctrl","shift","alt")
     */
    MouseWheelZoom.prototype.key = null;
    /**
     * Pas du zoom à chaque coup de molette
     */
    MouseWheelZoom.prototype.step = 0.1;	
    /**
     * Fonction(s) à exécuter avant de zoomer
     */
    MouseWheelZoom.prototype.onstart = null;
    /**
     * Fonction(s) à exécuter après avoir zoomé
     */
    MouseWheelZoom.prototype.onend = null;
    /**
     * Module actif ou non
     */
    MouseWheelZoom.prototype.enabled = false;
    /**
     * Fonction exécutée sur évènement mouseWheel
     */
    MouseWheelZoom.prototype.wheel = function(e) {
        
        var innerFrame = new JSYG(this.zap.innerFrame),
        scale = 1 + this.step * e.deltaY,
        animate = this.zap.animate,
        origin;
        
        if (animate === true && innerFrame.animate("get","inProgress")) return;
        
        e.preventDefault();
        
        this.trigger('start',this.zap.node,e);
        
        origin = (this.zap.overflow == 'hidden') ?
        innerFrame.getCursorPos(e).mtx(innerFrame.getMtx('ctm')) :
            new JSYG(this.zap.outerFrame).getCursorPos(e);
        
        this.zap.animate = false;
        
        this.zap.scale(scale,origin.x,origin.y);
        
        this.zap.animate = animate;
        
        this.trigger('end',this.zap.node,e);
    };
    
    /**
     * Activation du module
     * @param opt optionnel, objet définissant les options.
     * @returns {MouseWheelZoom}
     */
    MouseWheelZoom.prototype.enable = function(opt) {
        
        var that = this,
        cible = new JSYG( this.zap.overflow === 'hidden' ? this.zap.node : this.zap.outerFrame );
        
        if (!this.zap.enabled) this.zap.enable();
        
        this.disable();
        
        if (opt) this.set(opt);
        
        this.disable(); //par précaution si plusieurs appels
        
        function mousewheelFct(e) {
            if (that.key && !e[that.key] && !e[that.key+'Key']) return;
            that.wheel(e);
        }
        
        cible.on('mousewheel',mousewheelFct);
        
        this.disable = function() {
            cible.off('mousewheel',mousewheelFct);
            this.enabled = false;
            return this;
        }; 
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactivation du module
     * @returns {MouseWheelZoom}
     */
    MouseWheelZoom.prototype.disable = function() { return this; };
    
    /**
     * définition du zoom par tracé d'un rectangle
     */
    function MarqueeZoom(zoomAndPanObject) {
        
        this.zap = zoomAndPanObject;
        
        /**
         * Element SVG rect dessinant le tracé
         */
        this.container = new JSYG("<rect>")[0];
    }
    
    MarqueeZoom.prototype = new JSYG.StdConstruct();
    
    MarqueeZoom.prototype.constructor = MarqueeZoom;
    /**
     * Evenement déclenchant le tracé
     */
    MarqueeZoom.prototype.event = 'mousedown';
    /**
     * Restriction à un bouton de la souris (1 bouton gauche, 2 bouton du milieu, 3 bouton droit)
     */
    MarqueeZoom.prototype.eventWhich = 1;
    /**
     * Fonction(s) à exécuter au début du tracé
     */
    MarqueeZoom.prototype.onstart = null;
    /**
     * Fonction(s) à exécuter pendant le tracé
     */
    MarqueeZoom.prototype.ondrag = null;
    /**
     * Fonction(s) à exécuter à la fin du tracé
     */
    MarqueeZoom.prototype.onend = null;
    /**
     * Classe à appliquer au conteneur
     */
    MarqueeZoom.prototype.className = 'marqueeZoom';
    /**
     * Module actif ou non
     */
    MarqueeZoom.prototype.enabled = false;
    
    /**
     * Fonction exécutée sur l'évènement event
     */
    MarqueeZoom.prototype.start = function(e) {
        
        var node = this.zap.node,
        jSVG = new JSYG(node),
        pos = jSVG.getCursorPos(e),
        that = this,
        resize = new Resizable(this.container);
        
        new JSYG(this.container).addClass(this.className)
            .setDim({
                x:Math.round(pos.x)-1,
            y:Math.round(pos.y)-1,
            width:1,
            height:1
        })
            .appendTo(node);
        
        resize.set({
            keepRatio:false,
            type:'attributes',
            originY:'top',
            originX:'left',
            cursor:false,
            inverse:true
        });
        
        if (this.onstart) { resize.on('start',function(e) {that.trigger('start',node,e);}); }
        if (this.ondrag) { resize.on('drag',function(e) {that.trigger('draw',node,e);}); }
        
        resize.on('end',function(e) {
            
            var size = that.zap.size(),
            dim = new JSYG(this).getDim(),
            coef = Math.min( size.width/dim.width , size.height/dim.height ),
            mtx = new JSYG(that.zap.innerFrame).getMtx(),
            pt1 = new JSYG.Vect(dim.x,dim.y).mtx(mtx.inverse()),
            pt2;
            
            if (coef < 20 ) {
                
                mtx = mtx.scale(coef,pt1.x,pt1.y);
                pt1 = new JSYG.Vect(0,0).mtx(mtx.inverse());
                pt2 = new JSYG.Vect(dim.x,dim.y).mtx(mtx.inverse());
                mtx = mtx.translate(pt1.x-pt2.x,pt1.y-pt2.y);
                
                that.zap.transform(mtx);
                that.trigger("end",node,e);
            }
            
            new JSYG(this).remove();
        });
        
        resize.start(e);
    };
    
    /**
     * Activation du module
     * @param opt optionnel, objet définissant les options
     * @returns {MarqueeZoom}
     */
    MarqueeZoom.prototype.enable = function(opt) {
        
        this.disable(); //par précaution si plusieurs appels
        
        if (opt) this.set(opt);
        
        if (!this.zap.enabled) this.zap.enable();
        
        var that = this;
        
        function start(e) {
            if (that.eventWhich && e.which != that.eventWhich) return;
            that.start(e);
        }
        
        new JSYG(this.zap.node).on(this.event,start);
        
        this.disable = function() {
            new JSYG(this.zap.node).off(this.event,start);
            this.enabled = false;
            return this;
        }; 
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactivation du module
     * @returns {MarqueeZoom}
     */
    MarqueeZoom.prototype.disable = function() { return this;};
    
    /**
     * Gestion du panoramique (navigation façon googlemaps)
     */
    function MousePan(zoomAndPanObject) {
        this.zap = zoomAndPanObject;
    }
    
    MousePan.prototype = new JSYG.StdConstruct();
    
    MousePan.prototype.constructor = MousePan;
    
    /**
     * Evènement déclenchant le panoramique
     */
    MousePan.prototype.event = 'mousedown';
    /**
     * Restriction à un bouton de la souris (1 bouton gauche, 2 bouton du milieu, 3 bouton droit)
     */
    MousePan.prototype.eventWhich = 1;
    /**
     * Classe à appliquer quand le module est actif.
     */
    MousePan.prototype.className = 'MousePanOpenHand';
    /**
     * Classe à appliquer pendant le cliquer/glisser.
     */
    MousePan.prototype.classDrag = 'MousePanClosedHand';
    /**
     * déplacement horizontal
     */
    MousePan.prototype.horizontal = true;
    /**
     * déplacement vertical
     */
    MousePan.prototype.vertical = true;
    /**
     * Fonction(s) à exécuter au début du cliquer/glisser
     */
    MousePan.prototype.onstart = null;
    /**
     * Fonction(s) à exécuter pendant le cliquer/glisser
     */
    MousePan.prototype.ondrag = null;
    /**
     * Fonction(s) à exécuter à la fin du cliquer/glisser
     */
    MousePan.prototype.onend = null;
    /**
     * Module actif ou non
     */
    MousePan.prototype.enabled = false;
    /**
     * Teste si un déplacement est possible ou non (selon l'échelle)
     */
    MousePan.prototype._canMove = function() {
        
        var bounds = this.zap._getBounds("ctm"),
        size = this.zap.size();
        
        return this.horizontal && Math.round(size.width) < Math.round(bounds.width) || this.vertical && Math.round(size.height) < Math.round(bounds.height);
    };
    
    /**
     * Fonction exécutée sur l'évènement défini
     * @param e Event
     */
    MousePan.prototype.start = function(e) {
        
        if (!this._canMove()) return;
        
        
        e.preventDefault();
        
        var jSVG = new JSYG(this.zap.node),
        
        lastX = e.clientX,
        lastY = e.clientY,
        
        animate = this.zap.animate,
        
        that = this,
        
        jDoc = new JSYG(document);
        
        function mousemoveFct(e) {
            that.zap.screenTranslate(that.horizontal && lastX-e.clientX, that.vertical && lastY-e.clientY);
            lastX = e.clientX;
            lastY = e.clientY;
            that.trigger('drag',that.zap.node,e);
        }
        
        function remove(e) {
            that.zap.animate = animate;
            jSVG.off('mousemove',mousemoveFct).removeClass(that.classDrag).addClass(that.className);
            jDoc.off('mouseup',remove);
            that.trigger('end',e);
        }
        
        this.zap.animate = false;
        
        jSVG.addClass(this.classDrag).removeClass(this.className);
        
        jSVG.on('mousemove',mousemoveFct);
        jDoc.on('mouseup',remove);
        
        this.trigger('start',this.zap.node,e);
    };
    
    /**
     * Activation du module
     * @param opt optionnel, objet définissant les options
     * @returns {MousePan}
     */
    MousePan.prototype.enable = function(opt) {
        
        if (opt) this.set(opt);
        
        this.disable();
        
        if (!this.zap.enabled) this.zap.enable();
        
        var jSVG = new JSYG(this.zap.node),
        that = this;
        
        function setClassName() {
            if (that.className) jSVG[ (that._canMove() ? 'add' : 'remove') + 'Class' ](that.className);
        }
        
        function start(e) {
            if (that.eventWhich && e.which != that.eventWhich) return;
            that.start(e);
        }
        
        jSVG.on(this.event,start);
        
        this.zap.on("scale",setClassName);
        setClassName();
        
        this.disable = function() {
            jSVG.removeClass(this.className).off(this.event,start);
            this.zap.off("scale",setClassName);
            this.enabled = false;
            return this;
        };
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactivation du module
     * @returns {MousePan}
     */
    MousePan.prototype.disable = function() { return this; };
    
    
    /**
     * Redimensionnement du canvas à la souris
     */
    function ZapResizable(zoomAndPanObject) {
        this.zap = zoomAndPanObject;
    }
    
    ZapResizable.prototype = new JSYG.StdConstruct();
    
    ZapResizable.prototype.constructor = ZapResizable;
    /**
     * Evènement déclenchant le redimensionnement
     */
    ZapResizable.prototype.event = 'mousedown';
    /**
     * Elément déclenchant le redimensionnement. La valeur "defaut" insère une image dans le coin inférieur droit.
     */
    ZapResizable.prototype.field = 'default';
    /**
     * Curseur à appliquer à l'élément pendant le cliquer/glisser
     */
    ZapResizable.prototype.cursor = 'auto';
    /**
     * Redimensionnement horizontal
     */
    ZapResizable.prototype.horizontal = true;
    /**
     * Redimensionnement vertical
     */
    ZapResizable.prototype.vertical = true;
    /**
     * Maintien des proportions
     */
    ZapResizable.prototype.keepRatio = true;
    /**
     * Maintien de la partie visible
     */
    ZapResizable.prototype.keepViewBox = true;
    /**
     * Fonction(s) à exécuter au début du cliquer/glisser
     */
    ZapResizable.prototype.onstart = null;
    /**
     * Fonction(s) à exécuter pendant cliquer/glisser
     */
    ZapResizable.prototype.onresize = null;
    /**
     * Fonction(s) à exécuter à la fin du cliquer/glisser
     */
    ZapResizable.prototype.onend = null;
    /**
     * Module actif ou non
     */
    ZapResizable.prototype.enabled = false;
    /**
     * Fonction exécutée sur l'évènement défini
     */
    ZapResizable.prototype.start = function(e) {
        
        e.preventDefault();
        
        var fields = (this.field === 'default') ? this._field : new JSYG(this.field),
        that = this,
        cursor = null,
        xInit = e.clientX,
        yInit = e.clientY,
        size = this.zap.size(),
        
        fcts = {
            
            "mousemove" : function(e) {
                
                var width = size.width + (that.horizontal ? e.clientX - xInit : 0),
                height = size.height + (that.vertical ? e.clientY - yInit : 0);
                
                if (that.keepRatio) height = null;
                
                that.zap.size(width, height, that.keepViewBox);
                that.trigger('resize',that.zap.node,e);
            },
            
            "mouseup" : function(e) {
                
                new JSYG(window).off(fcts);
                
                if (cursor) {
                    fields.each(function() {
                        var $this = new JSYG(this);
                        $this.css('cursor',$this.data('svgresizable'));
                    });
                }
                
                that.trigger('end',that.zap.node,e);
            }
        };
        
        new JSYG(window).on(fcts);
        
        if (this.cursor === 'auto') {
            if (this.horizontal === false) cursor = 'n';
            else if (this.vertical === false) cursor = 'e';
            else cursor = 'se';
            cursor+='-resize';
        }
        else if (this.cursor) cursor = that.cursor;
        
        if (cursor) {
            fields.each(function() {
                var $this = new JSYG(this);
                $this.data('svgresizable',$this.css('cursor')).css('cursor',cursor);
            });
        }
        
        this.trigger('start',this.zap.node,e);
    };
    
    /**
     * Activation du module
     * @param opt optionnel, objet définissant les options
     * @returns {ZapResizable}
     */
    ZapResizable.prototype.enable = function(opt) {
        
        var start = this.start.bind(this),
        fields,
        that = this;
        
        this.disable();
        
        if (opt) { this.set(opt); }
        
        if (!this.zap.enabled) { this.zap.enable(); }
        
        if (this.horizontal === false || this.vertical === false) this.keepRatio = false;
        
        if (this.field === 'default') {
            
            this._field = new JSYG('<div>').addClass('SVGResize')
                .insertAfter(this.zap.overflow == "hidden" ? this.zap.node : this.zap.outerFrame);
            
            fields = this._field;
        }
        else fields = new JSYG(this.field);
        
        fields.each(function() { new JSYG(this).on(that.event,start); });
        
        this.disable = function() {
            
            fields.each(function() {  new JSYG(this).off(that.event,start); });
            
            if (this.field === 'default') this._field.remove();
            
            this.enabled = false;
            return this;
        };
        
        this.enabled = true;
        
        return this;
    };
    
    /**
     * Désactivation du module
     */
    ZapResizable.prototype.disable = function() {};
    
    
    JSYG.ZoomAndPan = ZoomAndPan;
    
    return ZoomAndPan;
    
});