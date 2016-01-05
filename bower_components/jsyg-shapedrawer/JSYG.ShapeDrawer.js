/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-shapedrawer",["jsyg","jsyg-resizable"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Resizable) factory(JSYG,JSYG.Resizable);
        else throw new Error("You need JSYG.Resizable");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG,Resizable) {
    
    "use strict";
    
    function ShapeDrawer(opt) {
        
        if (opt) this.set(opt);
    }
    
    ShapeDrawer.prototype = new JSYG.StdConstruct();
    
    ShapeDrawer.prototype.constructor = ShapeDrawer;
    
    /**
     * fonction(s) à éxécuter pendant le tracé
     */
    ShapeDrawer.prototype.ondraw = false;
    
    /**
     * fonction(s) à éxécuter à la fin du tracé
     */
    ShapeDrawer.prototype.onend = false;
    
    /**
     * Largeur minimale en dessous de laquelle la forme ne sera pas conservée
     */
    ShapeDrawer.prototype.minWidth = 2;
    
    /**
     * Hauteur minimale en dessous de laquelle la forme ne sera pas conservée
     */
    ShapeDrawer.prototype.minHeight = 2;
    
    /**
     * Options supplémentaires pour le redimensionnement de la forme
     */
    ShapeDrawer.prototype.options = null;
    
    /**
     * Indique si un tracé est en cours
     */
    ShapeDrawer.prototype.inProgress = false;

    /**
     * Commence le tracé de la forme
     * @param {SVGElement} élément à dessiner
     * @param {Event} e objet Event (événement mousedown).
     * @returns
     */
    ShapeDrawer.prototype.draw = function(shape,e) {
        
        shape = new JSYG(shape);
        
        var doc = shape.offsetParent("farthest"),
            pos = shape.getCursorPos(e),
            tag = shape.getTag(),
            resizer = new JSYG.Resizable(shape),
            that = this;
                				
	shape.setDim({
            x : pos.x-1,
            y : pos.y-1,
            width:1,
            height:1
        });
			
	resizer.set({
            
            originX: tag == 'rect' ? 'left' : 'center',
            
            originY: tag == 'rect' ? 'top' : 'center',
            
            keepRatio : tag == 'circle' ? true : false,
            
            cursor : false,
            
            ondrag : function(e) {
                that.trigger("draw",shape[0],e,shape[0]);
            }
        });
        
        if (this.options) resizer.set(this.options);
        
        resizer.on("end",function(e) {

            var dim = shape.getDim();

            if (dim.width < that.minWidth || dim.height < that.minHeight) shape.remove();
                
            that.trigger("end",shape[0],e,shape[0]);
            
            that.inProgress = false;
        });
        
        this.inProgress = true;

        resizer.start(e);
        
        return this;
    };
    
       
    JSYG.ShapeDrawer = ShapeDrawer;
    
    return ShapeDrawer;
    
});