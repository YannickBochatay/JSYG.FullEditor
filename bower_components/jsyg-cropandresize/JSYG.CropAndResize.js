/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-cropandresize",["jsyg","jsyg-editor","jsyg-canvas"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Editor && JSYG.Canvas) factory(JSYG,JSYG.Editor,JSYG.Canvas);
        else throw new Error("Dependency is missing");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG,Editor,Canvas) {
	
    "use strict";

    function Box() {
        this.x = 0;
        this.y = 0;
        this.width = 160;
        this.height = 90;
    };
	
    /**
     * Recadrage et redimensionnement d'une image (en SVG et canvas) ou d'un noeud SVG (expérimental et incomplet)
     * @param arg argument JSYG faisant référence à l'élément à recadrer
     * @param opt optionnel, objet définissant les options. Si défini, le recadrage sera implicitement activé.
     * @returns {CropAndResize}
     */
    function CropAndResize(arg,opt) {
        /**
         * dimensions initiales du rectangle de recadrage (si keepRatio == true, height sera écrasé par la valeur proportionnelle)
         */
        this.boxInit = new Box();
		
        /**
         * Objet Editable
         */
        this.editor = new Editor(arg);
        /**
         * Masque pour ombrer ce qui n'est pas sélectionné
         */
        this.mask = new JSYG('<rect>')[0];
        /**
         * Cadre de sélection
         */
        this.selection = new JSYG('<rect>')[0];
        /**
         * Element pattern
         */
        this.pattern = new JSYG('<pattern>')[0];
		
        if (arg) this.setNode(arg);
		
        if (opt) this.enable(opt);
    };
	
    CropAndResize.prototype = {
	
        constructor : CropAndResize,

        /**
         * Garde ou non le ratio
         */
        keepRatio : false,
					
        set : JSYG.StdConstruct.prototype.set,
        setNode : JSYG.StdConstruct.prototype.setNode,
		
        /**
         * Indique si le module est actif ou non
         */
        enabled : false,
			
        /**
         * Exporte la sélection sous forme d'objet Canvas
         * @param width optionnel, largeur de l'image
         * @param height optionnel, hauteur de l'image
         * @returns {Promise}
         * @see Canvas
         */
        toCanvas : function(width,height) {
				
            var box = this.selection.getBBox();
						
            return JSYG(this.node).toCanvas()
            .then(function(canvas) {
				
                var maxWidth = canvas.getAttribute("width"),
                maxHeight = canvas.getAttribute("height"),
                x = Math.max(0,box.x),
                y = Math.max(0,box.y),
                boxWidth =  Math.min(maxWidth,box.width),
                boxHeight = Math.min(maxHeight,box.height);
				
                canvas = new Canvas(canvas);
									
                canvas = canvas.crop(x,y,boxWidth,boxHeight);
				
                if (width != null || height != null) canvas = canvas.resize(width,height);
				
                return canvas[0];
            });
        },
				
        update : function() {
			
            if (!this.enabled) return this;
			
            var jNode = new JSYG(this.node),
            svg = jNode.offsetParent(),
            dim = jNode.getDim(svg),
            mtx = jNode.getMtx(svg),
            pattern = new JSYG(this.pattern);
			
            pattern.find('g').setMtx(mtx);
            pattern.find('rect').setDim(dim);
            pattern.setDim(dim);
					
            new JSYG(this.mask).setDim(dim);
							
            this.editor.update();
			
            return this;
        },
        /**
         * Active le recadrage
         * @param opt optionnel, objet définissant les options
         * @returns {CropAndResize}
         */
        enable : function(opt) {
			
            this.disable();
			
            if (opt) this.set(opt);
			
            var jNode = new JSYG(this.node),
            dim = jNode.getDim(),
            color = jNode.fill(),
            svg = jNode.offsetParent(),
            id = 'idpattern'+JSYG.rand(0,5000),
            g,rect,selection;
													
            if (!color || color == 'transparent' || color == 'none') color = 'white';
			
            rect = new JSYG('<rect>').fill(color);
            g = new JSYG('<g>').append(rect).append(jNode.clone());
			
            new JSYG(this.pattern)
                .attr({id:id,patternUnits:'userSpaceOnUse'})
                .append(g).appendTo(svg);
						
            new JSYG(this.mask)
                .css('fill-opacity',0.5)
                .appendTo(svg);
			
            if (this.keepRatio) this.boxInit.height = dim.height * this.boxInit.width / dim.width;
			
            selection = new JSYG(this.selection)
                .attr(this.boxInit)
                .attr('fill',"url(#"+id+")")
                .appendTo(svg);
									
            this.editor.target(selection);
            this.editor.displayShadow = false;
						
            new JSYG(this.editor.pathBox).css('fill-opacity',0);
			
            this.editor.ctrlsDrag.enable({
                bounds:0
            });
			
            this.editor.ctrlsResize.enable({
                keepRatio : this.keepRatio,
                bounds : 0
            });
			
            this.editor.show();
						
            this.enabled = true;
			
            this.update();
			
            return this;
        },
		
        /**
         * Désactive le recadrage
         * @returns {CropAndResize}
         */
        disable : function() {
			
            this.editor.hide();
						
            new JSYG(this.pattern).remove();
            new JSYG(this.mask).remove();
            new JSYG(this.selection).remove();
						
            this.enabled = false;
			
            return this;
        }
			
    };
    
    JSYG.CropAndResize = CropAndResize;
	
    return CropAndResize;
	
});
