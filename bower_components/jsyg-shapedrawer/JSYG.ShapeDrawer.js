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
     * Aire minimale en dessous de laquelle la forme ne sera pas conservée
     */
    ShapeDrawer.prototype.minArea = 2;
    
    /**
     * Options supplémentaires pour le redimensionnement de la forme
     */
    ShapeDrawer.prototype.options = null;
    
    /**
     * Indique si un tracé est en cours
     */
    ShapeDrawer.prototype.inProgress = false;
    
    /**
     * Tracé d'une ligne (cas particulier)
     * @param {JSYG} line élément line à tracer
     * @param {Event} e événement mousedown
     * @returns {ShapeDrawer.prototype}
     */
    ShapeDrawer.prototype.drawLine = function(line,e) {
        
        line = new JSYG(line);
        
        var pos = line.getCursorPos(e),
        that = this;
        
        line.attr({"x1":pos.x,"y1":pos.y,"x2":pos.x,"y2":pos.y});
        
        function mousemoveFct(e) {
            
            var pos = line.getCursorPos(e);
            
            line.attr({"x2":pos.x,"y2":pos.y});
            
            that.trigger("draw",line[0],e,line[0]);
        }
        
        function mouseupFct(e) {
            
            new JSYG(document).off({
                'mousemove':mousemoveFct,
                'mouseup':mouseupFct
            });
            
            that.trigger("end",line[0],e,line[0]);
            
            that.inProgress = false;
        }
        
        new JSYG(document).on({
            'mousemove':mousemoveFct,
            'mouseup':mouseupFct
        });
        
        this.inProgress = true;
        
        return this;
    };
    /**
     * Commence le tracé de la forme
     * @param {SVGElement} élément à dessiner
     * @param {Event} e objet Event (événement mousedown).
     * @returns
     */
    ShapeDrawer.prototype.drawShape = function(shape,e) {
        
        shape = new JSYG(shape);
        
        var pos = shape.getCursorPos(e),
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
            
            inverse : true,
            
            ondrag : function(e) {
                that.trigger("draw",shape[0],e,shape[0]);
            }
        });
        
        if (this.options) resizer.set(this.options);
        
        resizer.on("end",function(e) {
            
            var dim = shape.getDim();
            
            if (that.minArea != null && dim.width * dim.height < that.minArea) shape.remove();
            
            that.trigger("end",shape[0],e,shape[0]);
            
            that.inProgress = false;
        });
        
        this.inProgress = true;
        
        resizer.start(e);
        
        return this;
    };
    
    ShapeDrawer.prototype.draw = function(shape,e) {
        
        shape = new JSYG(shape);
        
        var tag = shape.getTag();
        
        return (tag == "line") ? this.drawLine(shape,e) : this.drawShape(shape,e);
    };
    
    
    JSYG.ShapeDrawer = ShapeDrawer;
    
    return ShapeDrawer;
    
});