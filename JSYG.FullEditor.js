/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof module == "object" && typeof module.exports == "object") {
      
      module.exports = factory(
        require("jsyg"),
        require("jsyg-editor"),
        require("jsyg-texteditor"),
        require("jsyg-zoomandpan"),
        require("jsyg-pathdrawer"),
        require("jsyg-polylinedrawer"),
        require("jsyg-shapedrawer"),
        require("jsyg-undoredo"),
        require("jquery.hotkeys")
      );
    }
    else if (typeof define != "undefined" && define.amd) {
      
      define("jsyg-fulleditor",[
        "jsyg",
        "jsyg-editor",
        "jsyg-texteditor",
        "jsyg-zoomandpan",
        "jsyg-pathdrawer",
        "jsyg-polylinedrawer",
        "jsyg-shapedrawer",
        "jsyg-undoredo",
        "jquery.hotkeys"
      ],factory);
    }
    else if (typeof JSYG != "undefined") {
        
        var deps = ["Editor","TextEditor","ZoomAndPan","PathDrawer","PolylineDrawer","ShapeDrawer","UndoRedo"];
        
        deps = deps.map(function(dep) {
            if (!JSYG[dep]) throw new Error("JSYG."+dep+" is missing");
            return JSYG[dep];
        });
        
        deps.unshift(JSYG);
        
        factory.apply(null,deps);
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG,Editor,TextEditor,ZoomAndPan,PathDrawer,PolylineDrawer,ShapeDrawer,UndoRedo) {
    
    "use strict";
    
    var slice = Array.prototype.slice;
    
    function FullEditor(node,opt) {
        
        this._bindFunctions();
        
        this._init();
        
        this._keyShortCuts = {};
        
        if (node) this.setNode(node);
        
        if (opt) this.enable(opt);
    }
    
    FullEditor._plugins = [];
    
    FullEditor.prototype = Object.create(JSYG.StdConstruct.prototype);
    
    FullEditor.prototype.constructor = FullEditor;
    
    //events
    [
        'onload',
        'ondrag',
        'ondraw',
        'oninsert',
        'onremove',
        'onchange',
        'onzoom',
        'onchangetarget',
        'ondisableedition'
        
    ].forEach(function(event) { FullEditor.prototype[event] = null; });
    
    FullEditor.prototype.idContainer = "containerDoc";
    
    FullEditor.prototype._initPlugins = function() {
        
        FullEditor._plugins.forEach(this._createPlugin.bind(this));
        
        this._applyMethodPlugins("init");
        
        return this;
    };
    
    FullEditor.prototype._init = function() {
        
        this._initUndoRedo();
        
        this._initShapeEditor();
        
        this._initZoomAndPan();
        
        this._initTextEditor();
        
        this._initShapeDrawer();
        
        this._initPlugins();
        
        return this;
    };    
    
    
    FullEditor.prototype._bindFunctions = function() {
        
        for (var n in this) {
            
            if (typeof(this[n]) == "function" && n.charAt(0) != '_') this[n] = this[n].bind(this);
        }
        
        return this;
    };
    
    /**
     * Register a key shortcut
     * @param {string} key jquery hotkeys syntax (example : "ctrl+i")
     * @param {function} fct callback called when key or combination keys are pressed
     * @returns {JSYG.FullEditor}
     * @description You can also pass an object with several key shortcuts as keys/values
     */
    FullEditor.prototype.registerKeyShortCut = function(key,fct) {
        
        if (JSYG.isPlainObject(key)) {
            for (var n in key) this.registerKeyShortCut(n,key[n]);
            return this;
        }
        
        if (this._keyShortCuts[key]) this._disableKeyShortCut(key);
        
        this._keyShortCuts[key] = fct;
        
        if (this.enabled) this._enableKeyShortCut(key,fct);
        
        return this;
    };
    
    /**
     * Unregister a key shortcut
     * @param {string} key jquery hotkeys syntax (example : "ctrl+i")
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.unregisterKeyShortCut = function(key) {
        
        var that = this;
        
        if (Array.isArray(key) || arguments.length > 1 && (key = [].slice.call(arguments))) {
            key.forEach(that.unregisterKeyShortCut);
            return this;
        }
        
        this._disableKeyShortCut(key,this._keyShortCuts[key]);
        
        delete this._keyShortCuts[key];
        
        return this;
    };
    
    /**
     * Select all editable elements in document
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.selectAll = function() {
        
        this.disableEdition();
        this.enableSelection();
        this.shapeEditor.selection.selectAll();
        
        return this;
    };
    
    /**
     * Deselect all editable elements
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.deselectAll = function() {
        
        var isEnabled = this.shapeEditor.enabled;
        
        if (!isEnabled) this.shapeEditor.enable();
        
        this.shapeEditor.selection.deselectAll();
        
        if (!isEnabled) this.shapeEditor.disable();
        
        return this;
    };
    
    FullEditor.prototype._enableKeyShortCut = function(key,fct) {
        
        if (typeof fct != 'function') throw new Error(typeof fct + " instead of function expected");
        
        new JSYG(document).on('keydown',null,key,fct);
        
        return this;
    };
    
    FullEditor.prototype._disableKeyShortCut = function(key,fct) {
        
        if (typeof fct != 'function') throw new Error(typeof fct + " instead of function expected");
        
        new JSYG(document).off('keydown',fct);
        
        return this;
    };
    
    /**
     * Enable all key shorcuts registered by registerKeyShortCut method
     * @returns {JSYG.FullEditor}
     * @see JSYG.prototype.registerKeyShortCut
     */
    FullEditor.prototype.enableKeyShortCuts = function() {
        
        var keys = this._keyShortCuts;
        
        for (var n in keys) this._enableKeyShortCut(n,keys[n]);
        
        return this;
    };
    
    /**
     * Disable all key shorcuts registered by registerKeyShortCut method
     * @returns {JSYG.FullEditor}
     * @see JSYG.prototype.registerKeyShortCut
     */
    FullEditor.prototype.disableKeyShortCuts = function() {
        
        var keys = this._keyShortCuts;
        
        for (var n in keys) this._disableKeyShortCut(n,keys[n]);
        
        return this;
    };
    
    FullEditor.prototype._editText = true;
    
    /**
     * @property {boolean} editText set if text elements can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editText',{
        get : function() {
            return this._editText;
        },
        set:function(value) {
            this._editText = !!value;
            if (!value) this.textEditor.hide();
        }
    });
    
    /**
     * @property {boolean} editPosition set if elements position can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editPosition',{
        get : function() {
            return this.shapeEditor.ctrlsDrag.enabled;
        },
        set:function(value) {
            this.shapeEditor.ctrlsDrag[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} editSize set if elements size can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editSize',{
        get : function() {
            return this.shapeEditor.ctrlsResize.enabled;
        },
        set:function(value) {
            this.shapeEditor.ctrlsResize[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} editRotation set if elements rotation can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editRotation',{
        get : function() {
            return this.shapeEditor.ctrlsRotate.enabled;
        },
        set:function(value) {
            this.shapeEditor.ctrlsRotate[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} editPathMainPoints set if main points of paths can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editPathMainPoints',{
        get : function() {
            return this.shapeEditor.ctrlsMainPoints.enabled;
        },
        set:function(value) {
            this.shapeEditor.ctrlsMainPoints[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} editPathCtrlPoints set if control points of paths can be edited or not
     */
    Object.defineProperty(FullEditor.prototype,'editPathCtrlPoints',{
        get : function() {
            return this.shapeEditor.ctrlsCtrlPoints.enabled;
        },
        set:function(value) {
            this.shapeEditor.ctrlsCtrlPoints[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} canvasResizable set if the editor can be resized or not
     */
    Object.defineProperty(FullEditor.prototype,'canvasResizable',{
        get:function() {
            return this.zoomAndPan.resizable.enabled;  
        },
        set:function(value) {
            this.zoomAndPan.resizable[ (value ? 'en' : 'dis') + 'able']();
        }
    });
    
    /**
     * @property {boolean} keepShapesRatio set if ratio must be kept when resizing
     */
    Object.defineProperty(FullEditor.prototype,'keepShapesRatio',{
        get:function() {
            return this.shapeEditor.ctrlsResize.keepRatio;  
        },
        set:function(value) {
            value = !!value;
            this.shapeEditor.ctrlsResize.keepRatio = value;
            this._keepShapesRatio = value;
            if (this.shapeEditor.display) this.shapeEditor.update();
        }
    });
    
    /**
     * @property {string} drawingPathMethod "freehand" or "point2point". Set method of drawing paths
     */
    Object.defineProperty(FullEditor.prototype,'drawingPathMethod',{
        get:function() {
            return this.pathDrawer.type;  
        },
        set:function(value) {
            
            if (value != 'freehand' && value != 'point2point')
                throw new Error("Only 'freehand' and 'point2point' are allowed");
            
            this.pathDrawer.type = value;
        }
    });
    
    /**
     * @property {boolean} autoSmoothPaths set if paths must be smoothed automatically when drawing
     */
    Object.defineProperty(FullEditor.prototype,'autoSmoothPaths',{
        get:function() {
            return this.shapeEditor.ctrlsMainPoints.autoSmooth;
        },
        set:function(value) {
            
            this.shapeEditor.ctrlsMainPoints.autoSmooth = value;
        }
    });
    
    /**
     * @property {boolean} useTransformAttr set if transform attribute must be affected when editing size and position, instead
     * of position and size attributes
     */
    Object.defineProperty(FullEditor.prototype,'useTransformAttr',{
        
        get:function() {
            
            var dragType = this.shapeEditor.ctrlsDrag.type;
            var resizeType = this.shapeEditor.ctrlsResize.type;
            
            if (dragType!=resizeType) throw new Error("dragType and resizeType are not the same");
            
            return dragType;
        },
        
        set:function(value) {
            
            var oldValue = this.useTransformAttr;
            
            if (value != oldValue) {
                
                this.shapeEditor.ctrlsDrag.type = value ? 'transform' : 'attributes';
                if (this.shapeEditor.ctrlsDrag.enabled) this.shapeEditor.ctrlsDrag.disable().enable();
                
                this.shapeEditor.ctrlsResize.type = value ? 'transform' : 'attributes';
                if (this.shapeEditor.ctrlsResize.enabled) this.shapeEditor.ctrlsResize.disable().enable();
            }
        }
    });
    
    FullEditor.prototype._nbLayers = 0;
    
    FullEditor.prototype._currentLayer = null;
    
    /**
     * @property {number} currentLayer set current layer of edition
     */
    Object.defineProperty(FullEditor.prototype,'currentLayer',{
        
        get : function() {
            return this._currentLayer;
        },
        
        set : function(value) {
            
            var $node;
            
            if (value != null) {
                
                $node = new JSYG( this._getDocumentSelector() + ' #layer' + value );
                                
                if (!$node.length) throw new Error("Invalid value for currentLayer. No node found.");
            }
            
            this._currentLayer = value;
            
            this.hideEditors();
            
            this.editableShapes = this.editableShapes; //on force la valeur pour l'actualiser
        }
    });
    
    /**
     * Get all layers defined
     * @returns {JSYG}
     */
    FullEditor.prototype.getLayers = function() {
        
        return new JSYG(this._getDocumentSelector()).find(".layer");
    };
    
    /**
     * Add and use a new layer
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.addLayer = function() {
        
        var nb = ++this._nbLayers,
            id = "layer"+nb,
            g = new JSYG('<g>').addClass("layer").attr("id",id).appendTo( this._getDocumentSelector() );
        
        this.currentLayer = nb;
        
        this.triggerChange();
                
        return this;
    };
    
    /**
     * Remove a layer
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.removeLayer = function() {
        
        if (!this.currentLayer) throw new Error("No layer selected");
        
        new JSYG(this._getLayerSelector()).remove();
        
        this._actuLayers();
        
        this.currentLayer = null;
        
        this.triggerChange();
                
        return this;
    };
    
    FullEditor.prototype._getLayerSelector = function() {
                
        return this._getDocumentSelector() + (this.currentLayer ? ' #layer'+this.currentLayer : '')+' ';
    };
    
    /**
     * Get document as a DOM node
     * @returns {Element}
     */
    FullEditor.prototype.getDocument = function() {
        
        return document.querySelector( this._getDocumentSelector() );
    };
    
    FullEditor.prototype._initUndoRedo = function() {
        
        var that = this;
        
        this.undoRedo = new UndoRedo();
        
        this.undoRedo.on("change",function() {
            //that.hideEditors();
            that.trigger("change", that, that.getDocument() );
        });
    };
    
    /**
     * Hide shape and text editors
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.hideEditors = function() {
        
        this.shapeEditor.hide();
        this.textEditor.hide();
        
        return this;
    };
    
    /**
     * Enable mouse pointer selection
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.enableSelection = function() {
        
        var target = this.shapeEditor.display && this.shapeEditor.target();
        
        this.disableEdition();
        this.shapeEditor.enable();
        
        if (target) this.shapeEditor.target(target).show();
        
        return this;
    };
    
    /**
     * Disable mouse pointer selection
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.disableSelection = function() {
        
        this.hideEditors();
        
        if (this.shapeEditor.enabled) this.shapeEditor.disable();
        
        return this;
    };
    
    /**
     * Disable mouse pointer insertion
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.disableInsertion = function() {
        
        this.disableInsertElement();
        
        this.disableShapeDrawer();
        
        return this;
    };
    
    /**
     * Register a plugin
     * @param {object} plugin
     * @returns {JSYG.FullEditor}
     */
    FullEditor.registerPlugin = function(plugin) {
        
        if (!plugin.name) throw new Error("Plugin must have a name property");
        
        if (this._plugins.some(function(otherPlugin) { return otherPlugin.name == plugin.name }))
            throw new Error(plugin.name+" plugin already exists");
        
        this._plugins.push(plugin);
        
        return this;
    };
    
    function isPrivate(name) {
        
        return name.charAt(0) == '_';
    }
    
    FullEditor.prototype._createPlugin = function(plugin) {
        
        plugin = Object.create(plugin);
        
        plugin.set = JSYG.StdConstruct.prototype.set;
        
        plugin.editor = this;
        
        this[plugin.name] = function(method) {
            
            var args = slice.call(arguments,1);
            var returnValue;
            var prop;
            
            if (!method || JSYG.isPlainObject(method)) {
                args = [method];
                method = "enable";
            }
            
            if (method == "get") {
                
                prop = args[0];
                
                if (isPrivate(prop)) throw new Error("property "+prop+" is private");
                
                return plugin[args[0]];
            }
            
            if (!plugin[method]) throw new Error("method "+method+" does not exist");
            
            if (isPrivate(method)) throw new Error("method "+method+" is private");
            
            returnValue = plugin[method].apply(plugin,args);
            
            return returnValue || this;
        };
    };
    
    FullEditor.prototype._applyMethodPlugins = function(method) {
        
        var that = this;
        
        FullEditor._plugins.forEach(function(plugin) {
            
            try { that[plugin.name](method); }
            catch(e) {}
        });
    };
    
    /**
     * Enable edition functionalities
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.disableEdition = function() {
        
        this.disableInsertion();
        
        this.disableMousePan();
        
        this.disableSelection();
        
        this.trigger("disableedition",this);
        
        return this;
    };
    
    ["copy","cut","paste"].forEach(function(action) {
        
        FullEditor.prototype[action] = function() {
            
            if (action!=="paste" && !this.shapeEditor.display) return;
            
            this.shapeEditor.clipBoard[action]();
            
            return this;
        };
    });
    
    /**
     * Duplicate selected element
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.duplicate = function() {
        
        var cb = this.shapeEditor.clipBoard,
        buffer = cb.buffer;
        
        cb.copy();
        cb.paste();
        cb.buffer = buffer;
        
        return this;
    };
    
    
    ["undo","redo"].forEach(function(action) {
        
        FullEditor.prototype[action] = function() {
            
            this.hideEditors();
            
            this.undoRedo[action]();
            
            return this;
        };
        
    });
    
    ["Front","Backwards","Forwards","Back"].forEach(function(type) {
        
        var methode = "move"+type;
        
        FullEditor.prototype[methode] = function() {
            
            var target = this.shapeEditor._target;
            
            if (target) {
                new JSYG(target)[methode]();
                this.triggerChange();
            }
            
            return this;
        };
    });
    
    ["Horiz","Verti"].forEach(function(type) {
        
        var methode = "move"+type;
        
        FullEditor.prototype[methode] = function(value) {
            
            var target = this.shapeEditor.target();
            var dim;
            
            if (target && target.length) {
                
                dim = target.getDim();
                
                target.setDim( type == "Horiz" ? {x:dim.x+value} : {y:dim.y+value} );
                this.shapeEditor.update();
                
                this.triggerChange();
            }
            
            return this;
        };
    });
    
    var regOperator = /^\s*(\+|-|\*|\/)=(\d+)\s*$/;
    
    function parseValue(newValue,oldValue) {
        
        var matches = regOperator.exec(newValue);
        
        if (!matches) return newValue;
        
        switch (matches[1]) {
            case '+' : return oldValue + Number(matches[2]);
            case '-' : return oldValue - Number(matches[2]);
            case '*' : return oldValue * Number(matches[2]);
            case '/' : return oldValue / Number(matches[2]);
        }
    }
    
    /**
     * Get or set dimensions of element selected
     * @param {string} prop x, y , width or height
     * @param {number} value
     * @returns {number,JSYG.FullEditor}
     * @description You can also pass an object
     */
    FullEditor.prototype.dim = function(prop,value) {
        
        if (JSYG.isPlainObject(prop) || value != null) return this._setDim(prop,value);
        else return this._getDim(prop,value);
    };
    
    FullEditor.prototype._getDim = function(prop) {
        
        var target = this.shapeEditor.target();
        var doc = this.getDocument();
        var dim;
        
        if (!target || !target.length) return null;
        
        dim = target.getDim(doc);
                
        return (prop == null) ? dim : dim[prop];
    };
    
    FullEditor.prototype._setDim = function(prop,value) {
        
        var target = this.shapeEditor.target();
        var change = false;
        var doc = this.getDocument();
        var n,newDim,oldDim;
        
        if (!target || !target.length) return this;
        
        if (JSYG.isPlainObject(prop)) newDim = JSYG.extend({},prop);
        else {
            newDim = {};
            newDim[prop] = value;
        }
        
        oldDim = target.getDim(doc);
            
        for (n in newDim) {
                        
            newDim[n] = parseValue(newDim[n],oldDim[n]);
            
            if (newDim[n] != oldDim[n]) change = true;
        }
        
        if (change) {
            
            newDim.from = doc;
            newDim.keepRatio = this.keepShapesRatio;
            
            target.setDim(newDim);
            this.shapeEditor.update();
            this.triggerChange();
        }
        
        return this;
    };
    
    /**
     * Rotate selected element
     * @param {number} value angle in degrees
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.rotate = function(value) {
        
        var target = this.target(),
        oldValue = target && target.rotate();
        
        if (!target) return (value == null) ? null : this;
        
        if (value == null) return oldValue;
        
        value = parseValue(value,oldValue) - oldValue;
        
        if (oldValue != value) {
            
            target.rotate(value);
            this.shapeEditor.update();
            this.triggerChange();
        }
        
        return this;
    };
    
    /**
     * Get or set css property
     * @param {string} prop name of css property
     * @param {string,number} value
     * @returns {number,string,JSYG.FullEditor}
     */
    FullEditor.prototype.css = function(prop,value) {
        
        if (JSYG.isPlainObject(prop)) {
            for (var n in prop) this.css(n,prop[n]);
            return this;
        }
        
        var target = this.target(),
        oldValue = target && target.css(prop);
        
        if (!target) return (value == null) ? null : this;
        
        if (value == null) return oldValue;
        
        value = parseValue(value,oldValue);
        
        if (oldValue != value) {
            
            target.css(prop,value);
            this.shapeEditor.update();
            this.triggerChange();
        }
        
        return this;
    };
    
    /**
     * Trigger change event
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.triggerChange = function() {
        
        this.undoRedo.saveState();
        
        this.trigger("change", this, this.getDocument() );
        
        return this;
    };
    
    FullEditor.prototype._insertFrame = function() {
        
        var mainFrame = this.zoomAndPan.innerFrame,
        content = new JSYG(mainFrame).children().detach();
        
        this._frameShadow = new JSYG("<rect>")
            .attr({x:2,y:2})
            .addClass("jsyg-doc-shadow")
            .appendTo(mainFrame)[0];
        
        this._frame = new JSYG("<rect>")
            .attr({x:0,y:0})
            .addClass("jsyg-doc-frame")
            .appendTo(mainFrame)[0];
        
        this.containerDoc = new JSYG("<g>")
            .attr("id",this.idContainer)
            .append(content)
            .appendTo(mainFrame)
        [0];
        
        this._adjustSize();
        
        return this;
    };
    
    /**
     * @property {string} cursorDrawing name of css cursor when drawing is active
     */
    FullEditor.prototype.cursorDrawing = "copy";
    
    FullEditor.prototype._removeFrame = function() {
        
        var container = new JSYG(this.containerDoc),
        content = container.children();
        
        new JSYG(this._frame).remove();
        new JSYG(this._frameShadow).remove();
        container.remove();
        
        content.appendTo(this.zoomAndPan.innerFrame);
        
        return this;
    };
    
    FullEditor.prototype._initShapeDrawer = function() {
        
        this.pathDrawer = this._initDrawer(new PathDrawer);
        this.polylineDrawer = this._initDrawer(new PolylineDrawer);
        this.shapeDrawer = this._initDrawer(new ShapeDrawer);
        
        return this;
    };
    
    FullEditor.prototype._initDrawer = function(drawer) {
        
        var that = this;
        
        drawer.on({
            
            draw : function(e) { that.trigger("draw",that,e,this); },
            
            end : function(e) {
                
                if (!this.parentNode) return;
                
                that.trigger("insert",that,e,this);
                
                that.triggerChange();
                
                if (that.autoEnableSelection) that.shapeEditor.target(this).show();
            }
        });
        
        return drawer;
    };
    
    FullEditor.prototype._setCursorDrawing = function() {
        
        if (this.cursorDrawing) this.zoomAndPan.node.style.cursor = this.cursorDrawing;
    };
    
    FullEditor.prototype._removeCursorDrawing = function() {
        
        if (this.cursorDrawing) this.zoomAndPan.node.style.cursor = null;
    };
    
    /**
     * @property {object} shapeDrawerModel dom node to clone when starting drawing
     */
    Object.defineProperty(FullEditor.prototype,"shapeDrawerModel",{
        
        get:function() {
            return this._shapeDrawerModel;
        },
        
        set:function(value) {
            
            var jNode = new JSYG(value);     
            
            if (jNode.length != 1) throw new Error("Shape model incorrect");
            
            if (JSYG.svgShapes.indexOf(jNode.getTag()) == -1)
                throw new Error(jNode.getTag()+" is not a svg shape");
            
            this._shapeDrawerModel = jNode[0];
        }
    });
    
    /**
     * Draw one shape
     * @param {type} modele
     * @returns {Promise}
     */
    FullEditor.prototype.drawShape = function(modele) {
        
        var that = this;
        
        return new Promise(function(resolve,reject) {
            
            that.enableShapeDrawer(modele,function() {
                
                var target = that.target();
                
                that.disableShapeDrawer();
                
                if (target) resolve(target[0]);
                else reject(new Error("No shape was drawn"));
            });
        });
    }
    
    
    FullEditor.prototype.enableShapeDrawer = function(modele,_callback) {
        
        var frame = new JSYG(this.zoomAndPan.innerFrame),
        that = this;
        
        this.disableEdition();
        
        if (modele) this.shapeDrawerModel = modele;
        
        function onmousedown(e) {
            
            if (that.pathDrawer.inProgress || that.polylineDrawer.inProgress || that.shapeDrawer.inProgress || e.which != 1) return;
            
            e.preventDefault();
            
            var modele = that.shapeDrawerModel;
            if (!modele) throw new Error("You must define a model");
            
            var shape = new JSYG(modele).clone().appendTo( that._getLayerSelector() );
            var tag = shape.getTag();
            var drawer;
            
            switch(tag) {
                
                case "polyline": case "polygon" : drawer = that.polylineDrawer; break;
                
                case "path" : drawer = that.pathDrawer; break;
                
                default : drawer = that.shapeDrawer; break;
            }
            
            drawer.area = frame;
            drawer.draw(shape,e);
            
            if (_callback) drawer.one("end",_callback);
        }
        
        frame.on("mousedown",onmousedown).data("enableDrawingShape",onmousedown);
        
        this._setCursorDrawing();
        
        return this;
    };
    
    FullEditor.prototype.disableShapeDrawer = function() {
        
        var frame = new JSYG(this.zoomAndPan.innerFrame),
        fct = frame.data("enableDrawingShape");
        
        if (!fct) return this;
        
        frame.off("mousedown",fct);
        
        this._removeCursorDrawing();
        
        return this;
    };
    
    FullEditor.prototype.autoEnableSelection = true;
        
    Object.defineProperty(FullEditor.prototype,"insertElementModel",{
        
        get:function() {
            return this._insertElementModel;
        },
        
        set:function(value) {
            
            var jNode = new JSYG(value);     
            
            if (jNode.length != 1) throw new Error("element model incorrect");
            
            if (JSYG.svgGraphics.indexOf(jNode.getTag()) == -1)
                throw new Error(jNode.getTag()+" is not a svg graphic element");
            
            this._insertElementModel = jNode[0];
        }
    });
    
    FullEditor.prototype.is = function(type,_elmt) {
        
        _elmt = _elmt || this.target();
        
        var list = "svg"+JSYG.ucfirst(type)+"s";
        var types = ["container","graphic","shape","text"];
        
        if (types.indexOf(type) == -1) throw new Error(type+" : type incorrect ("+types+" required)");
              
        return JSYG[list].indexOf( JSYG(_elmt).getTag() ) != -1;
    };
   
    FullEditor.prototype.mouseInsertElement = function(modele) {
        
        var that = this;
        
        return new Promise(function(resolve) {
            
            that.enableInsertElement(modele,function() {
                
                var target = that.target();
                
                that.disableInsertElement();
                
                if (target) resolve(target[0]);
                else reject(new Error("No element inserted"));
            });
        });
    }
    
    FullEditor.prototype.enableInsertElement = function(modele,_callback) {
        
        var frame = new JSYG(this.zoomAndPan.innerFrame),
        that = this;
        
        this.disableEdition();
        
        if (modele) this.insertElementModel = modele;
        
        function onmousedown(e) {
            
            if (e.which != 1) return;
            
            e.preventDefault();
            
            var modele = that.insertElementModel;
            if (!modele) throw new Error("You must define a model");
            
            var shape = new JSYG(modele).clone(),
            isText = JSYG.svgTexts.indexOf(shape.getTag()) !== -1;
            
            that.insertElement(shape,e,isText);
            
            if (that.autoEnableSelection) {
                
                new JSYG(that.node).one('mouseup',function() {
                                      
                    that.shapeEditor.target(shape);
                    
                    if (that.editText && isText) {
                        that.textEditor.target(shape).show();
                        that.textEditor.one("validate",_callback);
                    }
                    else {
                        that.shapeEditor.show();
                        if (_callback) _callback();
                    }
                    
                });
            }
        }
        
        frame.on("mousedown",onmousedown).data("enableInsertElement",onmousedown);
        
        this._setCursorDrawing();
        
        return this;
    };
    
    FullEditor.prototype.disableInsertElement = function() {
        
        var frame = new JSYG(this.zoomAndPan.innerFrame),
        fct = frame.data("enableInsertElement");
        
        if (!fct) return this;
        
        frame.off("mousedown",fct);
        
        this._removeCursorDrawing();
        
        return this;
    };
    
    FullEditor.prototype.marqueeZoom = function(opt) {
        
        var that = this;
        
        return new Promise(function(resolve) {
            
            that.enableMarqueeZoom(opt,function() {
                that.disableMarqueeZoom();
                resolve();
            });
        });
    };
    
    FullEditor.prototype.disableMarqueeZoom = function() {
        
        this.zoomAndPan.marqueeZoom.disable();
        
        return this;
    };
    
    FullEditor.prototype.enableMarqueeZoom = function(opt,_callback) {
        
        if (this.zoomAndPan.marqueeZoom.enabled && !opt) return this;
        
        this.disableEdition();
        
        this.zoomAndPan.marqueeZoom.enable(opt);
        
        if (_callback) this.zoomAndPan.marqueeZoom.one("end",_callback);
        
        return this;
    };
    
    FullEditor.prototype.zoom = function(percent) {
        
        this.zoomAndPan.scale( 1 + (percent/100) );
        
        this.trigger("zoom",this,this.getDocument());
        
        return this;
    };
    
    FullEditor.prototype.zoomTo = function(percentage) {
        
        if (percentage == "canvas") this.zoomAndPan.fitToCanvas().scale(0.95);
        else if (JSYG.isNumeric(percentage)) this.zoomAndPan.scaleTo( percentage/100 );
        else throw new Error("argument must be numeric or 'canvas' string");
        
        this.trigger("zoom",this,this.getDocument());
        
        return this;
    };
    
    FullEditor.prototype.fitToDoc = function() {
        
        var dim = new JSYG(this.getDocument()).getDim("screen"),
        overflow = this.zoomAndPan.overflow;
        
        this.zoomAndPan.size({
            width : dim.width + (overflow!="hidden" ? 10 : 0),
            height : dim.height + (overflow!="hidden" ? 10 : 0)
        });
        
        return this;
    };
    
    
    FullEditor.prototype._initZoomAndPan = function() {
        
        var that = this;
        
        this.zoomAndPan = new ZoomAndPan();
        this.zoomAndPan.overflow = "auto";
        this.zoomAndPan.scaleMin = 0;
        
        this.zoomAndPan.resizable.keepViewBox = false;
        this.zoomAndPan.resizable.keepRatio = false;
        
        this.zoomAndPan.mouseWheelZoom.key = "ctrl";
        
        this.zoomAndPan.on("change",function() {
            that._updateBoundingBoxes();
            that.shapeEditor.update();
            that.textEditor.update();
        });
        
        return this;
    };
    
    
    FullEditor.prototype._initShapeEditor = function() {
        
        var editor = new Editor();
        var that = this;
        
        editor.selection.multiple = true;
        
        new JSYG(editor.container).on("dblclick",function(e) {
            
            var target = editor.target();
            
            if (!that.editText || JSYG.svgTexts.indexOf( target.getTag() ) == -1) return;
            
            that.textEditor.target(target).show();
            that.textEditor.cursor.setFromPos(e);
        });
        
        editor.selection.on("beforedeselect beforedrag",function(e) {
            
            if (e.target == that.textEditor.container || new JSYG(e.target).isChildOf(that.textEditor.container)) return false;
        });
        
        editor.on({
            
            show : function() {
                that.textEditor.hide();
            },
            
            change : this.triggerChange,
            
            drag : function(e) {
                that.trigger("drag", that, e, editor._target);
            },
            
            changetarget : function() {
                that.trigger("changetarget",that,editor._target);
            }
        });
        
        //editor.ctrlsDrag.bounds = 0;
        //editor.ctrlsResize.bounds = 0;
        
        this.shapeEditor = editor;
        
        return this;
    };
    
    FullEditor.prototype._initTextEditor = function() {
        
        var that = this;
        
        this.textEditor = new TextEditor();
        
        this.textEditor.on({
            show : function() {
                that.shapeEditor.hide();
            },
            hide : function() {
                var target = that.textEditor.target();
                if (!target.text()) target.remove();
                else that.shapeEditor.target(target).show();
            },
            validate : function() {
                that.triggerChange();
            }
        });
        
        return this;
    };
    
    FullEditor.prototype.setNode = function() {
        
        JSYG.StdConstruct.prototype.setNode.apply(this,arguments);
        
        this.zoomAndPan.setNode(this.node);
        
        this.shapeEditor.setNode(this.node);
        
        this.textEditor.setNode(this.node);
        
        return this;
    };
    
    FullEditor.prototype._getDocumentSelector = function() {
        
        return "#" + this.idContainer + " > svg ";
    };
    
    FullEditor.prototype._editableShapes = "*";
    
    Object.defineProperty(FullEditor.prototype,'editableShapes',{
        
        get : function() {
            return this._editableShapes;
        },
        
        set : function(value) {
            
            this._editableShapes = value;
            this.shapeEditor.list = this._getLayerSelector()+value;
        }
    });
    
    
    FullEditor.prototype.enableMousePan = function(opt) {
        
        if (!this.zoomAndPan.mousePan.enabled) {
            
            this.disableEdition();
            
            this.zoomAndPan.mousePan.enable(opt);
        }
        
        return this;
    };
    
    FullEditor.prototype.disableMousePan = function() {
        
        if (this.zoomAndPan.mousePan.enabled) {
            
            this.zoomAndPan.mousePan.disable();
        }
        
        return this;
    };
    
    FullEditor.prototype.enableMouseWheelZoom = function(opt) {
        
        if (!this.zoomAndPan.mouseWheelZoom.enabled) {
            
            this.zoomAndPan.mouseWheelZoom.enable(opt);
        }
        
        return this;
    };
    
    FullEditor.prototype.disableMouseWheelZoom = function() {
        
        if (this.zoomAndPan.mouseWheelZoom.enabled) {
            
            this.zoomAndPan.mouseWheelZoom.disable();
        }
        
        return this;
    };
    
    FullEditor.prototype.canMoveBackwards = function() {
        
        var shapes = new JSYG(this.shapeEditor.list),
        target = this.shapeEditor.target();
        
        return shapes.index(target) > 0 && shapes.length > 1;
    };
    
    FullEditor.prototype.canMoveForwards = function() {
        
        var shapes = new JSYG(this.shapeEditor.list),
        target = this.shapeEditor.target();
        
        return shapes.index(target) < shapes.length-1 && shapes.length > 1;
    };
    
    FullEditor.prototype.isGroup = function() {
        
        return this.shapeEditor.isGroup();
    };
    
    Object.defineProperty(FullEditor.prototype,'overflow',{
        
        get : function() { return this.zoomAndPan.overflow; },
        
        set : function(value) {
            
            var displayShapeEditor = this.shapeEditor.display,
            displaytextEditor = this.textEditor.display;
            
            if (displayShapeEditor) this.shapeEditor.hide();
            if (displaytextEditor) this.textEditor.hide();
            
            this.zoomAndPan.overflow = value;
            
            if (displayShapeEditor) this.shapeEditor.show();
            if (displaytextEditor) this.textEditor.show();
        }
    });
    
    FullEditor.prototype.enable = function(opt) {
        
        this.disable();
        
        if (opt) this.set(opt);
        
        if (!this.node) throw new Error("node is not defined");
        
        this.zoomAndPan.enable();
        
        this._insertFrame();
        
        //on force les valeurs pour exécuter les fonctions définies dans Object.defineProperty
        if (this._editPathCtrlPoints) this._editPathCtrlPoints = true;
        if (this._resizable) this._resizable = true;
        this.editableShapes = this.editableShapes;
        
        this.shapeEditor.enableCtrls('drag','resize','rotate','mainPoints');
        
        if (this.autoEnableSelection) this.shapeEditor.enable();
        
        this.enableKeyShortCuts();
        
        this.enabled = true;
        
        return this;
    };
    
    FullEditor.prototype.disable = function() {
        
        this.disableEdition();
        
        this._removeFrame();
        
        this.zoomAndPan.disable();
        
        this.undoRedo.disable();
        
        this.disableKeyShortCuts();
        
        this.enabled = false;
        
        return this;
    };
    
    /**
     * Aligne les éléments sélectionnés
     * @param {String} type (top,middle,bottom,left,center,right)
     * @returns {undefined}
     */
    FullEditor.prototype.align = function(type) {
        
        this.shapeEditor.align(type);
        
        return this;
    };
    
    FullEditor.prototype.target = function(value) {
        
        if (value == null) {
            
            if (this.textEditor.display) return this.textEditor.target();
            else return this.shapeEditor.target();
        }
        else {
            
            this.shapeEditor.target( new JSYG(this.getDocument()).find(value) ).show();
        }
        
        return this;
    };
    
    FullEditor.prototype.editTextElmt = function(elmt) {
        
        if (elmt == null) elmt = this.target();
        
        this.textEditor.target(elmt).show();
        
        return this;
    };
    
    FullEditor.prototype.dimDocument = function(dim) {
        
        var doc = new JSYG( this.getDocument() );
        var oldDim = doc.getDim();
        
        if (dim == null) return oldDim;
        
        if (dim.width && dim.width != oldDim.width || dim.height && dim.height != oldDim.height) {
            
            doc.setDim(dim);
            
            this.triggerChange();
            
            this._adjustSize();
        }
        
        return this;
    };
    
    FullEditor.prototype.isMultiSelection = function() {
        
        return this.shapeEditor.isMultiSelection();
    };
    
    FullEditor.prototype._adjustSize = function() {
        
        var contenu = new JSYG( this.getDocument() ),
        dim = contenu.length && contenu.getDim() || {width:0, height:0};
        
        new JSYG(this._frameShadow).add(this._frame).attr({
            width:dim.width,
            height:dim.height
        });
        
        if (dim.width && dim.height) this.zoomTo('canvas');
        
        if (!this.shapeEditor.ctrlsDrag.options) this.shapeEditor.ctrlsDrag.options = {};
        if (!this.shapeEditor.ctrlsResize.options) this.shapeEditor.ctrlsResize.options = {};
        
        this.shapeEditor.ctrlsDrag.options.guides = {
            list : [{x:0},{x:dim.width},{y:0},{y:dim.height}]
        };
        
        this.shapeEditor.ctrlsResize.options.stepsX = {
            list : [0,dim.width]
        };
        
        this.shapeEditor.ctrlsResize.options.stepsY = {
            list : [0,dim.height]
        };
        
        return this;
    };
    
    FullEditor.prototype.createImage = function(src) {
        
        var image = new JSYG('<image>').attr('href',src),
        that = this;
        
        return new Promise(function(resolve,reject) {
            
            var img = new Image();
            
            img.onload = function() {
                
                var dimDoc = JSYG(that.getDocument()).viewBox(),
                height = this.height,
                width = this.width;
                
                if (width > dimDoc.width) {
                    height = height * dimDoc.width / width;
                    width = dimDoc.width;
                }
                
                if (height > dimDoc.height) {
                    width = width * dimDoc.height / height;
                    height = dimDoc.height;                    
                }
                
                image.attr({width:width,height:height});
                
                resolve(image[0]);
            };
            
            img.onerror = reject;
            
            img.src = src;
        });
    };
    
    FullEditor.prototype.insertElement = function(elmt,pos,_preventEvent) {
        
        var textNode;
        
        elmt = new JSYG(elmt);
        
        elmt.appendTo( this._getLayerSelector() );
        
        if (JSYG.svgTexts.indexOf(elmt.getTag())!=-1 && !elmt.text()) {
            textNode = document.createTextNode("I");
            elmt.append(textNode);
        }
        
        if (pos instanceof JSYG.Event) elmt.setCenter( elmt.getCursorPos(pos) );
        else {
            
            elmt.setDim({
                x : pos && pos.x || 0,
                y : pos && pos.y || 0
            });
        }
        
        if (textNode) new JSYG(textNode).remove();
        
        if (!_preventEvent) {
            
            this.trigger("insert", this, this.getDocument(), elmt );
            this.triggerChange();
        }
        
        return this;
    };
    
    function stopEvents(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    FullEditor.prototype.lang = "en";
    
    FullEditor.prototype.importSVGAs = "image";
    
    FullEditor.prototype.enableDropFiles = function() {
        
        var that = this;
        
        var fcts = {
            
            dragenter : stopEvents,
            dragover : stopEvents,
            
            drop : function(e) {

                stopEvents(e);

                var dt = e.originalEvent.dataTransfer;
                var file, str;

                if (!dt) return;

                if (dt.files  && dt.files.length) {

                  file = dt.files[0];

                  if (/svg/i.test(file.type) && that.importSVGAs.toLowerCase() == "svg") that.insertSVGFile(file,e);
                  else that.insertImageFile(file,e);

                } else {

                  str = dt.getData("text")

                  if (str) {

                    that.importImage(str)
                    .then(function(img) { that.insertElement(img,e); that.target(img); })
                    .catch(function() {})

                  }

                }
            }
        }
        
        JSYG(this.zoomAndPan.innerFrame).on(fcts);
        
        this.disableDropFiles = function() {
            
            JSYG(this.zoomAndPan.innerFrame).off(fcts);
        };
        
        return this;
    };
    
    FullEditor.prototype.disableDropFiles = function() { return this; };
    
    FullEditor.prototype.insertImageFile = function(file,e) {
        
        var that = this;
        
        return this.importImage(file)
            .then(function(img) {
                that.insertElement(img,e);
            that.shapeEditor.target(img).show();
        });
    };
    
    FullEditor.prototype.insertSVGFile = function(file,e) {
        
        var that = this;
        
        return this.readFile(file,"text")
            .then(JSYG.parseSVG)
            .then(function(svg) {
                that.insertElement(svg,e);
            that.shapeEditor.target(svg).show();
        });
    };
    
    FullEditor.prototype.importImage = function(arg) {
        
        var promise;
        
        if (arg instanceof File) {
            
            if (!arg.type.match(/image/)) return Promise.reject(new TypeError(arg.name + " is not an image file"));
            
            promise = this.readFile(arg,'dataURL');
        }
        else {
            
            if (arg.src) arg = arg.src; //DOMElement
            else if (arg instanceof jQuery) {
                
                arg = JSYG(arg);
                arg = arg.attr( arg.isSVG() ? 'href' : 'src' );
                
                if (!arg) throw new TypeError("no src/href attribute found");
            } 
            else if (typeof arg != "string") throw new TypeError("argument incorrect"); //URL or dataURL
            
            promise = Promise.resolve(arg);
        }
        
        return promise.then(this.createImage);
    };
    
    FullEditor.prototype.chooseFile = function() {
        
        var that = this;
        
        return new Promise(function(resolve,reject) {
            
            JSYG("<input>").attr("type","file").on("change",function() {
                
                resolve(this.files[0]);
            })
                .trigger("click");
        });
    };
    
    FullEditor.prototype.loadImageAsDoc = function(arg) {
        
        var that = this;
        
        return this.importImage(arg).then(function(img) {
            
            var dim;
            
            that.insertElement(img);
            
            dim = JSYG(img).getDim();
            
            that.newDocument(dim.width,dim.height);
            that.insertElement(img);
            that.addLayer();
            
            that.undoRedo.clear();
            
            return img;
        });         
    };
    
    /**
     * Load a document from a file, an url, a xml string or a xml node
     * @param {File, string, DOMElement} arg
     * @returns {Promise}
     */
    FullEditor.prototype.load = function(arg) {
        
        if (arg instanceof File) return this.loadFile(arg);
        else if (typeof arg == "string") {
            if (arg.indexOf("<?xml") == 0 || arg.indexOf("<svg") == 0)
                return Promise.resolve(this.loadString(arg));
            else return this.loadURL(arg);
        }
        else return Promise.resolve(this.loadXML(arg));
    };
    
    /**
     * Load a document from a svg string
     * @param {string} str
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.loadString = function(str) {
        
        return this.loadXML( JSYG.parseSVG(str) );
    };
    
    /**
     * Read a File instance
     * @param {File} file
     * @param {string} readAs optional, "DataURL" or "Text" ("Text" by default)
     * @returns {Promise}
     */
    FullEditor.prototype.readFile = function(file,readAs) {
        
        return new Promise(function(resolve,reject) {
            
            if (!window.FileReader) throw new Error("your navigator doesn't implement FileReader");
            
            if (!(file instanceof File)) throw new Error("file argument incorrect");
            
            var reader = new FileReader();
            
            readAs = JSYG.ucfirst(readAs || 'text');
            
            if (['DataURL','Text'].indexOf(readAs) == -1) throw new Error("format incorrect");
            
            reader.onload = function(e) {
		resolve(e.target.result);
            };
            
            reader.onerror = function(e) {
		reject(new Error("Impossible de charger le fichier"));
            };
            
            reader['readAs'+readAs](file);
        });
    };
    
    /**
     * Load a document from a File instance
     * @param {File} file
     * @returns {Promise}
     */
    FullEditor.prototype.loadFile = function(file) {
        
        if (!file.type || !file.type.match(/svg/)) throw new Error("file format incorrect. SVG file is required.");
        
        return this.readFile(file).then(this.loadString.bind(this));
    };
    
    /**
     * Load a document from an url
     * @param {string} url
     * @returns {Promise}
     */
    FullEditor.prototype.loadURL = function(url) {
        
        return fetch(url).then(function(response) {

            if (!response.ok) throw new Error(response.statusText);

            return response.text();
        })
            .then(this.loadString.bind(this));
    };
    
    FullEditor.prototype._actuLayers = function(svg) {
        
        var layers = this.getLayers();
        
        layers.each(function(i) {
            
            this.id = "layer"+(i+1);
        });
        
        this._nbLayers = layers.length;
    };
    
    /**
     * Load a document from a xml node
     * @param {DOMElement} svg
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.loadXML = function(svg) {
        
        var container;
        
        this.shapeEditor.hide();
        this.textEditor.hide();
        this._clearBoundingBoxes();
        
        container = new JSYG('#'+this.idContainer);
        
        container.empty().append(svg);
        
        this._adjustSize();
        
        this.currentLayer = null;
        this._actuLayers();
        
        this.undoRedo.disable().setNode(svg).enable();
        
        this.trigger("load",this,svg);
        
        return this;
    };
    
    /**
     * Create a new document
     * @param {number} width
     * @param {number} height
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.newDocument = function(width,height) {
        
        var dim;
        
        if (!width || !height) {
            
            dim = this.dimDocument();
            
            if (dim) {
                if (!width) width = dim.width;
                if (!height) height = dim.height;
            }
            else throw new Error("You need to specify width and height");    
        }
        
        var svg = new JSYG('<svg>').setDim( {width:width,height:height} );
        
        return this.loadXML(svg);
    };
    
    FullEditor.prototype._updateBoundingBoxes = function() {
        
        new JSYG(this.shapeEditor.list).each(function() {
            var $this = new JSYG(this);
            if ($this.boundingBox("get","display")) $this.boundingBox("update");
        });
    };
    
    FullEditor.prototype._clearBoundingBoxes = function() {
        
        new JSYG(this.shapeEditor.list).boundingBox("hide");
    };
    
    /**
     * Convert document to a canvas element
     * @returns {Promise}
     */
    FullEditor.prototype.toCanvas = function() {
        
        return new JSYG(this.getDocument()).toCanvas();
    };
    
    /**
     * Convert document to a SVG string (keep links)
     * @param {object} opt options (for the moment only "standalone" as boolean, to converts links to dataURLs)
     * @returns {Promise}
     * @example fullEditor.toSVGString({standalone:true})
     */
    FullEditor.prototype.toSVGString = function(opt) {
        
        return new JSYG(this.getDocument()).toSVGString(opt && opt.standalone);
    };
       
    /**
     * Convert document to a SVG data url
     * @returns {Promise}
     */
    FullEditor.prototype.toSVGDataURL = function() {
        
        return new JSYG(this.getDocument()).toDataURL(true);
    };
    
    /**
     * Convert document to a PNG data url
     * @returns {Promise}
     */
    FullEditor.prototype.toPNGDataURL = function(format) {
        
        return this.toCanvas().then(function(canvas) {
            
            return canvas.toDataURL();
        });
    };
    
    FullEditor.prototype._checkExportFormat = function(format) {
        
        var exportFormats = ['svg','png'];
        
        if (exportFormats.indexOf(format) == -1) throw new Error(format+" : incorrect format ("+exportFormats.join(' or ')+" required)");
    };
    
    /**
     * Convert document to data URL
     * @param {string} format "svg" or "png"
     * @returns {Promise}
     */
    FullEditor.prototype.toDataURL = function(format) {
        
        if (!format) format = 'svg';
        
        this._checkExportFormat(format);
        
        var method = "to"+format.toUpperCase()+"DataURL";
        
        return this[method]();
    };
    
    /**
     * Print document
     * @returns {Promise}
     */
    FullEditor.prototype.print = function() {
        
        return this.toSVGDataURL().then(function(url) {
          
            return new Promise(function(resolve) {
                var win = window.open(url);
                win.onload = function() { win.print(); resolve(); };
            })
        });
    };
    
    /**
     * Download document as PNG
     * @returns {Promise}
     */
    FullEditor.prototype.downloadPNG = function() {
        
        return this.download("png");
    };
    
    /**
     * Download document as SVG
     * @returns {Promise}
     */
    FullEditor.prototype.downloadSVG = function() {
        
        return this.download("svg");
    };

    /**
     * Download document
     * @param {string} format "png" or "svg"
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.download = function(format) {
        
        if (!format) format = 'svg';
        
        return this.toDataURL(format).then(function(url) {
            
            var a = new JSYG('<a>').attr({
                href:url,
                download:"file."+format
            }).appendTo('body');
            
            a[0].click();
            a.remove();
        });
    };
    
    /**
     * Remove selection
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.remove = function() {
        
        if (!this.shapeEditor.display) return this;
        
        var target = this.shapeEditor.target();
        
        this.shapeEditor.hide();
        
        this._clearBoundingBoxes();
        
        target.remove();
        
        this.trigger("remove", this, this.getDocument(), target);
        
        this.triggerChange();
        
        return this;
    };
    
    /**
     * Group selected elements
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.group = function() {
        
        this.shapeEditor.group();
        
        this.triggerChange();
        
        return this;
    };
    
    /**
     * Ungroup selection
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.ungroup = function() {
        
        this.shapeEditor.ungroup();
        
        this.triggerChange();
        
        return this;
    };
    
    /**
     * Center selected elements
     * @param {string} orientation "vertical" or "horizontal"
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.center = function(orientation) {
        
        var doc = this.getDocument(),
        dimDoc = new JSYG(doc).getDim(),
        target = this.target(),
        dim = target.getDim(doc),
        isVerti = orientation.toLowerCase().indexOf("verti") == 0,
        newX = (dimDoc.width - dim.width) / 2,
        newY = (dimDoc.height - dim.height) /2;
        
        if (isVerti && dim.x != newX) target.setDim({x:newX});
        else if (!isVerti && dim.y != newY) target.setDim({y:newY});
        else return this;
        
        if (this.shapeEditor.display) this.shapeEditor.update();
        else if (this.textEditor.display) this.textEditor.update();
        
        this.triggerChange();
        
        return this;
    };
    
     /**
     * Center selected elements vertically
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.centerVertically = function() {
        
        return this.center("vertically");
    };
    
    /**
     * Center selected elements horizontally
     * @returns {JSYG.FullEditor}
     */
    FullEditor.prototype.centerHorizontally = function() {
        
	return this.center("horizontally");
    };
    
    
    JSYG.FullEditor = FullEditor;
    
    return FullEditor;
    
});
