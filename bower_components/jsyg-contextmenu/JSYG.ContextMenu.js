/*jshint forin:false, eqnull:true*/
/* globals jQuery*/

(function(root,factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-contextmenu",["jquery","jsyg-menu"],factory);
    else if (typeof jQuery != "undefined") {
        
        if (typeof JSYG!= "undefined" && typeof JSYG.Menu != "undefined") factory(jQuery,JSYG.Menu);
        else if (typeof JMenu != "undefined") {
            if (root.ContextMenu !== undefined) throw new Error("conflict with JMenu variable");
            root.ContextMenu = factory(jQuery,JMenu);
        }
        else throw new Error("JMenu dependency is missing");
    }
    else throw new Error("jQuery is needed");
    
})(this,function($,Menu) {
    
    "use strict";
    
    function ContextMenu(arg,opt) {
        
        if (arg) this.setNode(arg);
        
        Menu.call(this);
        
        if (opt) this.enable(opt);
    }
        
    ContextMenu.prototype = Object.create(Menu.prototype);
    
    ContextMenu.prototype.constructor = ContextMenu;
    
    ContextMenu.prototype.node = null;
    /**
     * Fonctions à exécuter avant l'affichage du menu (renvoyer false pour l'empêcher)
     */
    ContextMenu.prototype.onbeforeshow = null;
    
    ContextMenu.prototype.enabled = false;
    
    ContextMenu.prototype.show = function(x,y) {
                
        ContextMenu.list.forEach(function(menu){ menu.hide(); });
        
        var jCont = $(this.container);
        jCont.css('visibility','hidden');
        
        Menu.prototype.show.call(this);
                
        var $win = $(window),
        widthCont = jCont.width(),
        heightCont = jCont.height(),
        widthWin = $win.innerWidth(),
        heightWin = $win.innerHeight();
        
        if (x  + widthCont > widthWin) {
            x-= widthCont;
            if (x < 0) x = widthWin - widthCont;
        }
        
        if (y + heightCont > heightWin) {
            y-= heightCont;
            if (y < 0) y = heightWin - heightCont;
        }
        
        jCont.css({left:x,top:y}).css('visibility','visible');
                
        return this;
    };
    
    ContextMenu.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
	
        var jNode = $(this.node),
        
        backup = {
            title : this.node.title,
            alt : this.node.alt
        },
        
        that = this,
        
        fcts = {
            
            contextmenu : function(e) { e.preventDefault(); },
            
            mousedown : function(e) {
                
                if (e.which!=3) return;
                
                e.stopPropagation();
                
                if (that.trigger("beforeshow",that.node,e)!==false) that.show(e.pageX,e.pageY);
            }
        },
        
        hide = this.hide.bind(this);
        
        jNode.on(fcts);
                
        $(document).on('mousedown',hide);
        $(window).on('blur',hide);
        
        this.disable = function() {
            
            this.hide();
            this._clear();
            
            jNode.off(fcts);
            
            $(document).off('mousedown',hide);
            $(window).off('blur',hide);
            
            jNode.attr(backup);
            
            this.enabled = false;
            
            var ind = ContextMenu.list.indexOf(this);
            ContextMenu.list.splice(ind,1);
            
            return this;
        };
        
        this.create();
        
        this.enabled = true;
        
        ContextMenu.list.push(this);
        
        return this;
    };
    
    ContextMenu.prototype.disable = function() {
        
        this.hide();
        this._clear();
        
        return this;
    };
    
    ContextMenu.list = [];
    
    if (typeof JSYG != "undefined") {
        
        JSYG.ContextMenu = ContextMenu;
        
        var plugin = JSYG.bindPlugin(ContextMenu);
        $.fn.contextMenu = function() { return plugin.apply(this,arguments); };
    }
    else {
        
        $.fn.contextMenu = function() {
            
            var args = arguments;
            
            this.each(function() {
                
                var $this = $(this),
                jMenu = $this.data("jContextMenu"),
                arg0 = args[0],
                arg1 = args[1];
                
                if (!jMenu) {
                    jMenu = new ContextMenu(this);
                    $this.data("jContextMenu",jMenu);
                }
                
                if (typeof arg0 == "string") jMenu[arg0](arg1);
                else if (Array.isArray(arg0) || $.isPlainObject(arg0)) {
                    jMenu.set(arg0);
                    jMenu.enable();
                }
                
            });
            
            return this;
        };
        
    }
    
    return ContextMenu;
    
});