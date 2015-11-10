/*jshint forin:false, eqnull:true*/
/* globals JSYG, Promise*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-canvas",["jsyg"],factory);
    else if (typeof JSYG != "undefined") factory(JSYG);
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    /**
     * <strong>nécessite le module Canvas</strong><br/><br/>
     * Manipulation de l'élément canvas. Expérimental.<br/><br/>
     * @param arg optionnel, référence vers un élément canvas, ou création d'un nouveau si non défini.
     * @returns {Canvas}
     */
    function Canvas(arg) {
	
        if (!arg) arg = '<canvas>';
        
        JSYG.call(this,arg);
        
        this.ctx = this[0].getContext('2d');
        this.mtx = new JSYG.Matrix();
    }
    
    Canvas.prototype = Object.create(JSYG.prototype);
    
    Canvas.prototype.constructor = Canvas;
    
    /**
     * Clone l'élément canvas
     * @returns {Canvas}
     */
    Canvas.prototype.clone = function() {
        return new Canvas( new JSYG(this[0]).clone() );
    };
    
    /**
     * Exporte le contenu du canvas
     * @param type
     * <ul>
     * <li>canvas : élément DOM Canvas</li>
     * <li>file : objet File</li>
     * <li>url : fichier traitable comme une url</li>
     * <li>html : élément DOM Image</li>
     * <li>svg : élément DOM SVG Image</li>
     * </ul>
     * @param quality 0 à 100 (pas forcément implémenté dans les navigateurs)
     * @param format 'png', 'jpeg' 'webp'
     */
    Canvas.prototype.exportTo = function(type,quality,format) {
        
        type = type || 'html';
        format = format || 'png';
        quality = quality/100;
        
        var node = this[0];
        var promise;
        
        switch (type) {
            
            case 'canvas' : return Promise.resolve(node);
            
            case 'file' :
                                
                if (node.toBlob) {
                    
                    promise = new Promise(function(resolve) {
                        node.toBlob(resolve,'image/'+format,quality);
                    });
                }
                else if (node.mozGetAsFile) {
                    
                    promise = Promise.resolve( node.mozGetAsFile("peuimporte",'image/'+format,quality) );
                }
                else throw new Error("Fonctionnalité non implémentée dans ce navigateur");
                
                return promise;
            
            case 'url' : return Promise.resolve( node.toDataURL('image/'+format,quality) );
            
            case 'html' :
            case 'svg' :
                
                return this.exportTo('url',quality,format).then(function(url) {
                    var tag = (type == "svg") ? "image" : "img";
                    return new JSYG('<'+tag+'>').href('src',url)[0];
                });
            
            default : throw new Error(type + " : type d'export incorrect");
        }
    };
    
    function parseArgument(arg,ref) {
        
        if (JSYG.isNumeric(arg)) return arg;
        else if (typeof arg == "string" && arg.charAt( arg.length -1 ) == '%') return ref * parseFloat(arg) / 100;
        else throw new Error(typeof arg + " : type incorrect");
    }
    
    /**
     * Rogne l'image et renvoie un nouvel objet Canvas
     * @param x 
     * @param y 
     * @param width
     * @param height
     * @returns {Canvas}
     */
    Canvas.prototype.crop = function(x,y,width,height)  {
        
        var canvas = this.clone(),
        cWidth = this.attr("width"),
        cHeight = this.attr("height");
        
        x = parseArgument(x,cWidth);
        y = parseArgument(y,cHeight);
        width = parseArgument(width,cWidth);
        height = parseArgument(height,cHeight);
        
        canvas.attr('width',width);
        canvas.attr('height',height);
        canvas.ctx.drawImage(this[0],x,y,width,height,0,0,width,height);
        
        return canvas;
    };
    
    /**
     * Redimensionne l'image et renvoie un nouvel objet Canvas
     * @param width
     * @param height
     * @returns
     */
    Canvas.prototype.resize = function(width,height)  {
        
        if (width != null) {
            
            width = parseArgument(width,this.attr("width"));
            
            if (height == null) height = Math.round(this.attr('height') * width / this.attr('width'));
            
        } else if (height != null) {
            
            height = parseArgument(height,this.attr("height"));
            
            width = Math.round(this.attr('width') * height / this.attr('height'));
            
        } else {
            
            height = this.attr('height');
            width = this.attr('width');
        }
        
        var canvas = this.clone();
        canvas.attr('width',width);
        canvas.attr('height',height);
        
        canvas.ctx.drawImage(this[0],0,0,width,height);
        
        return canvas;
    };
    
    /**
     * récupère la matrice de transformation courante
     * @param mtx
     * @returns {JSYG.Matrix}
     */
    Canvas.prototype.getMtx = function() {
        return this.mtx;
    };
    
    /**
     * Fixe la matrice courante
     * @param mtx objet JSYG.Matrix (ou SVGMatrix)
     * @returns {Canvas}
     */
    Canvas.prototype.setMtx = function(mtx) {
        
        if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
        this.ctx.setTransform(mtx.a,mtx.b,mtx.c,mtx.d,mtx.e,mtx.f);
        this.mtx = new JSYG.Matrix(mtx);
        
        return this;
    };
    
    /**
     * Multiplie la matrice courante par une autre matrice 
     * @param mtx objet JSYG.Matrix (ou SVGMatrix)
     * @returns {Canvas}
     */
    Canvas.prototype.addMtx = function(mtx) {
        
        if (mtx instanceof JSYG.Matrix) mtx = mtx.mtx;
        this.ctx.transform(mtx.a,mtx.b,mtx.c,mtx.d,mtx.e,mtx.f);
        this.mtx = this.mtx.multiply(mtx);
        
        return this;
    };
    
    /**
     * Réinitialise les transformations
     * @returns {Canvas}
     */
    Canvas.prototype.resetTransf = function() {
        this.setMtx(new JSYG.Matrix());
        return this;
    };
    
    /**
     * définit une série de propriétés du contexte canvas
     * @param obj
     * @returns {Canvas}
     * @example var canvas = new Canvas();
     * canvas.set({
     * 	font : "15px arial",
     * 	textBaseline : "middle",
     * 	fillStyle : "black",
     * 	textAlign : "center"
     * });					
     */
    Canvas.prototype.set = function(obj) {
        for (var n in obj) {
            if (this.ctx[n]) this.ctx[n] = obj[n];
        }
        return this;
    };
    
    /**
     * Convertit l'image en niveaux de gris
     * @returns {Canvas}
     */
    Canvas.prototype.toGrayScale = function() {
        
        if (!JSYG.Color) throw new Error("JSYG.Color is needed for this feature");
        
        var width = parseInt(this.attr("width"),10),
        height = parseInt(this.attr("height"),10),
        imageData = this.ctx.getImageData(0,0,width,height),
        data = imageData.data,
        i=0,N=data.length,
        color;
        
        for(;i<N;i+=4) {
            color = new JSYG.Color({r:data[i],g:data[i+1],b:data[i+2]});
            data[i] = data[i+1] = data[i+2] = color.brightness();
        }
        
        this.ctx.putImageData(imageData,0,0);
        
        return this;
    };
    
    JSYG.Canvas = Canvas;
    
    return Canvas;
    
});