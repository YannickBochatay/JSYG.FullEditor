/*jshint forin:false, eqnull:true*/
/* globals jQuery*/

(function(root,factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-contextmenu",["jquery","jsyg-menu"],factory);
    else if (typeof jQuery != "undefined") {
        
        if (typeof JSYG!= "undefined" && typeof JSYG.Menu != "undefined" && typeof JSYG.StdConstruct != "undefined") factory(jQuery,JSYG.Menu,JSYG.StdConstruct);
        else if (typeof JMenu != "undefined" && typeof StdConstruct != "undefined") {
            if (root.ContextMenu !== undefined) throw new Error("conflict with JMenu variable");
            root.ContextMenu = factory(jQuery,JMenu,StdConstruct);
        }
        else throw new Error("dependency(ies) missing");
    }
    else throw new Error("jQuery is needed");
    
})(this,function($,Menu,StdConstruct) {
    
    "use strict";
    
    function MenuBar(arg,opt) {
        
        this.list = [];
        
        if (arg) this.setNode(arg);
        
        if (opt) this.enable(opt);
    };
    
    MenuBar.prototype = new StdConstruct();
    
    MenuBar.prototype.constructor = MenuBar;
    
    MenuBar.prototype.set = function(opt,_cible) {
        
        var cible = _cible || this,
        that = this;
        
        if (Array.isArray(opt)) {
            this.clear();
            opt.forEach(function(menu) { that.addMenu(menu); });
            return cible;
        }
        
        if (!$.isPlainObject(opt)) return cible;
        
        for (var n in opt) {
            
            if (n in cible) {
                if (($.isPlainObject(opt[n])) && cible[n] || n == 'list' && Array.isArray(opt[n])) this.set(opt[n],cible[n]);
                else cible[n] = opt[n];
            }
        }
        
        return cible;
    };
    
    MenuBar.prototype.className = "menuBar";
    
    MenuBar.prototype.classDisabled = "disabled";
    
    MenuBar.prototype.current = -1;
    
    MenuBar.prototype.enabled = false;
    
    MenuBar.prototype.addMenu = function(menu,ind) {
        
        if (ind == null) ind = this.list.length;
        
        if (menu instanceof Menu) {
            
            if (this.list.indexOf(menu) === -1) {
                if (!menu.title) throw new Error("Il faut définir la propriété title du menu");
                this.list.splice(ind,0,menu);
            }
            else throw new Error("Le menu existe déjà");
        }
        else return this.addMenu(new Menu(menu), ind);
        
        return this;
    };
    
    MenuBar.prototype.getMenu = function(menu) {
        
        if (menu instanceof Menu && this.list.indexOf(menu) != -1) return menu;
        else if ($.isNumeric(menu) && this.list[menu]) return this.list[menu];
        else if (menu && typeof menu == 'string') {
            var i = this.list.length;
            while (i--) {
                if (this.list[i].name == menu || this.list[i].title == menu) return this.list[i];
            }
        }
        
        return null;
    };
    
    MenuBar.prototype.getItem = function(item,recursive) {
        
        var menuItem;
        
        for (var i=0,N=this.list.length;i<N;i++) {
            
            menuItem = this.list[i].getItem(item,recursive);
            if (menuItem) return menuItem;
        }
        
        return null;
    };
    
    MenuBar.prototype.removeMenu = function(menu) {
        
        menu = this.getMenu(menu);
        
        if (!menu) throw new Error(menu+' : indice ou element incorrect');
        
        menu.hide();
        
        this.list.splice(i,1);
        
        return this;
    };
    
    
    MenuBar.prototype.create = function() {
        
        var ul = $(this.node).empty().addClass(this.className);
        
        var that = this;
        
        this.list.forEach(function(menu,i) {
                        
            menu.create();
            
            menu.on('hide',function() { that.display = false; that.current = -1; });
            
            var li = $('<li>')		
                .text(menu.title);
            
            if (menu.disabled) li.addClass(that.classDisabled);
            else {
                li.on({
                    "mouseover" : function(e) {
                        if (that.current!=-1) that.showMenu(menu);
                    },
                    "mousedown" : function(e) {
                        if (that.current == i) that.hideMenus();
                        else that.showMenu(menu);
                    }
                });
            }
            
            li.appendTo(ul);
            
            menu.node = li[0]; 
        });
        
        return this;
    };
    
    MenuBar.prototype.clear = function() {
        
        this.hideMenus();
        while (this.list.length) this.removeMenu(0);
        return this;
    };
    
    MenuBar.prototype.hideMenus = function() {
        
        this.list.forEach(function(menu) { menu.hide(); });
        
        this.display = false;
        this.current = -1;
        
        return this;
    };
    
    MenuBar.prototype.showMenu = function(menu) {
        
        menu = this.getMenu(menu);
        
        if (!menu) return this;
                
        var jCont = $(menu.container),
            jNode = $(menu.node),
            pos;
        
        this.hideMenus();
        
        jCont.css('visibility','hidden');
        
        menu.parent = jNode.offsetParent();
        
        if (menu.parent[0].tagName == 'HTML') menu.parent = document.body;
        
        menu.show();
        
        pos = jNode.position();
        
        jCont.css({
            left : pos.left,
            top : pos.top+jNode.outerHeight(),
            visibility:'visible'
        });
                                
        this.current = this.list.indexOf(menu);
        
        return this;
    };
    
    MenuBar.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) { this.set(opt); }
        
        this.create();
        
        var that = this;
        
        function hide(e) {
            var test = true;
            that.list.forEach(function(menu) {
                if (menu.node == e.target) test = false;
            });
            test && that.hideMenus();
        };
        
        $(document).on('mousedown',hide);
        $(window).on('blur',hide);
        
        this.disable = function() {
            
            $(document).off('mousedown',hide);
            $(window).off('blur',hide);
            
            this.enabled = false;
            
            return this;
        };
        
        this.enabled = true;
        
        return this;
    };
    
    MenuBar.prototype.disable = function() { return this; };
    
    if (typeof JSYG != "undefined") {
        
        JSYG.MenuBar = MenuBar;
        
        var plugin = JSYG.bindPlugin(MenuBar);
        
        $.fn.menuBar = function() { return plugin.apply(this,arguments); };
    }
    else {
        
        $.fn.menuBar = function() {
            
            var args = arguments;
            
            this.each(function() {
                
                var $this = $(this),
                jMenu = $this.data("jMenuBar"),
                arg0 = args[0],
                arg1 = args[1];
                
                if (!jMenu) {
                    jMenu = new MenuBar(this);
                    $this.data("jMenuBar",jMenu);
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
    
    return MenuBar;
    
});