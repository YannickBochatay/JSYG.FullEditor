/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-container",["jsyg","jsyg-path"],factory);
    else if (typeof JSYG != "undefined") {
        
        if (JSYG.Path) factory(JSYG);
        else throw new Error("JSYG.Path is needed");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    function Container(arg) {
        
        if (!(this instanceof Container)) return new Container(arg);
        
        if (!arg) arg = '<g>';
        
        JSYG.call(this,arg);
        
        if (this.getTag() != "g") throw new Error("L'argument ne fait pas référence à un conteneur g.");
    }
    
    Container.prototype = Object.create(JSYG.prototype);
    
    Container.prototype.constructor = Container;
    
    Container.prototype.onadditem = null;
    Container.prototype.onfreeitem = null;
    Container.prototype.onchange = null;
    
    Container.prototype.addItems = function(elmt) {
        
        var that = this,
        mtx = this.getMtx().inverse();
        
        JSYG.makeArray(arguments).forEach(function(elmt) {
            
            new JSYG(elmt).each(function() {
                
                var $this = new JSYG(this);
                
                try { $this.addMtx(mtx); } //éléments non tracés
                catch(e){}
                
                $this.appendTo(that[0]);
                
                that.trigger('additem',that[0],this);
                that.trigger('change');
                
            });
            
        });
        
        return this;
    };
    
    Container.prototype.applyTransform = function() {
        
        var mtx = this.getMtx(),
        that = this;
        
        this.children().each(function() {
            var $this = new JSYG(this);
            $this.setMtx( mtx.multiply($this.getMtx(that)) );
        });
        
        this.resetTransf();
        
        return this;
    };
    
    Container.prototype.freeItems = function(elmt) {
        
        var parent = this.parent()[0],
        mtx = this.getMtx(),
        that = this,
        args = JSYG.makeArray( arguments.length === 0 ? this.children() : arguments);
        
        args.reverse().forEach(function(elmt) {
            
            new JSYG(elmt).each(function() {
                
                var $this = new JSYG(this);
                
                if (!$this.isChildOf(that)) return;
                
                try { $this.setMtx( mtx.multiply($this.getMtx(that)) ); }
                catch(e) {}
                
                $this.insertAfter(that[0]);
                
                that.trigger('freeitem',that[0],this);
                that.trigger('change');
                
            });
        });
        
        return this;
    };
        
    
    JSYG.Container = Container;
    
    return Container;
    
});