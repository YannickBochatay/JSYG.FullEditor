/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {

    if (typeof define != "undefined" && define.amd) define("jsyg-fulleditor",["jsyg","jsyg-editor","jsyg-texteditor","jsyg-zoomandpan","jsyg-pencil","jsyg-shapedrawer","jsyg-undoredo","jquery-hotkeys","jsyg-fetch"],factory);
    else if (typeof JSYG != "undefined") {

        var deps = ["Editor","TextEditor","ZoomAndPan","Pencil","ShapeDrawer","UndoRedo","fetch"];

        deps = deps.map(function(dep) {
            if (!JSYG[dep]) throw new Error("JSYG."+dep+" is missing");
            return JSYG[dep];
        });

        deps.unshift(JSYG);

        factory.apply(null,deps);
    }
    else throw new Error("JSYG is needed");

})(function(JSYG,Editor,TextEditor,ZoomAndPan,Pencil,ShapeDrawer,UndoRedo) {

    "use strict";

    function FullEditor(node,opt) {

        this._initUndoRedo();

        this._initShapeEditor();

        this._initZoomAndPan();

        this._initTextEditor();

        this._initPathDrawer();

        this._initShapeDrawer();

        this.removeSelection = this.removeSelection.bind(this);

        if (node) this.setNode(node);
        if (opt) this.enable(opt);
    }

    FullEditor.prototype = Object.create(JSYG.StdConstruct.prototype);

    FullEditor.prototype.constructor = FullEditor;

    FullEditor.prototype.idContainer = "containerDoc";

    FullEditor.prototype.getDocument = function() {

        return document.querySelector("#"+this.idContainer+' > svg');
    };

    FullEditor.prototype._initUndoRedo = function() {

        this.undoRedo = new UndoRedo();
    };
    
    FullEditor.prototype._hideEditors = function() {
        
        this.shapeEditor.hide();
        this.textEditor.hide();
    };
    
    FullEditor.prototype.undo = function() {
        
        if (this.undoRedo.hasUndo()) {
            this._hideEditors();
            this.undoRedo.undo();
        }
        
        return this;
    };
    
    FullEditor.prototype.redo = function() {
        
        if (this.undoRedo.hasRedo()) {
            this._hideEditors();
            this.undoRedo.redo();
        }
        
        return this;
    };
    
    FullEditor.prototype.moveTargetFront = function() {
        
       var target = this.shapeEditor.target();
       
       if (target.length == 1) {
           
           target.moveFront();
           this.undoRedo.saveState();
       }
        
        return this;
    };
    
    FullEditor.prototype.moveTargetBack = function() {
        
       var target = this.shapeEditor.target();
       
       if (target.length == 1) {
           
           target.moveBack();
           this.undoRedo.saveState();
       }
        
        return this;
    };
    
    FullEditor.prototype.moveTargetToFront = function() {
        
       var target = this.shapeEditor.target();
       
       if (target.length == 1) {
           
           target.moveToFront();
           this.undoRedo.saveState();
       }
        
        return this;
    };
    
    FullEditor.prototype.moveTargetToBack = function() {
        
       var target = this.shapeEditor.target();
       
       if (target.length == 1) {
           
           target.moveToBack();
           this.undoRedo.saveState();
       }
        
        return this;
    };

    FullEditor.prototype._insertFrame = function() {

        var mainFrame = this.zoomAndPan.innerFrame,
            content = new JSYG(mainFrame).children().detach();

        this._frameShadow = new JSYG("<rect>")
            .attr({x:2,y:2})
            .attr("id","frameShadowDoc")
            .appendTo(mainFrame)[0];

        this._frame = new JSYG("<rect>")
            .attr({x:0,y:0})
            .attr("id","frameDoc")
            .appendTo(mainFrame)[0];

        this.containerDoc = new JSYG("<g>")
            .attr("id",this.idContainer)
            .append(content)
            .appendTo(mainFrame)
            [0];

        this._adjustSize();

        return this;
    };

    FullEditor.prototype.repeatDrawing = false;

    FullEditor.prototype.cursorDrawing = null;

    FullEditor.prototype._removeFrame = function() {

        var container = new JSYG(this.containerDoc),
            content = container.children();

        new JSYG(this._frame).remove();
        new JSYG(this._frameShadow).remove();
        container.remove();

        content.appendTo(this.zoomAndPan.innerFrame);

        return this;
    };

    FullEditor.prototype._initPathDrawer = function() {

        var that = this;

        this.pathDrawer = new Pencil();

        this.pathDrawer.on("end",function() {

            that.undoRedo.saveState();

            if (that.repeatDrawing) return;

            that.disablePathDrawer();

            that.shapeEditor.target(this).show();
        });
    };

    FullEditor.prototype._initShapeDrawer = function() {

        var that = this;

        this.shapeDrawer = new ShapeDrawer();

        this.shapeDrawer.on("end",function() {

            that.undoRedo.saveState();

            if (that.repeatDrawing) return;

            that.disableShapeDrawer();

            that.shapeEditor.target(this).show();
        });
    };

    FullEditor.prototype.enableShapeDrawer = function(modele) {

        var frame = new JSYG(this.zoomAndPan.innerFrame),
            that = this;

        this.disableShapeDrawer();

        function onmousedown(e) {

            e.preventDefault();

            var shape = new JSYG(modele).clone().appendTo( that.getDocument() );

            that.shapeDrawer.draw(e,shape);
        }

        this.disablePathDrawer();

        if (this.shapeEditor.enabled) this.shapeEditor.disable();

        frame.on("mousedown",onmousedown).data("enableDrawingShape",onmousedown);

        if (this.cursorDrawing) frame.css("cursor",this.cursorDrawing);

        return this;

    };

    FullEditor.prototype.disableShapeDrawer = function() {

        var frame = new JSYG(this.zoomAndPan.innerFrame),
            fct = frame.data("enableDrawingShape");

        if (fct) {
            frame.off("mousedown",fct).css("cursor","default");
        }

        if (!this.shapeEditor.enabled) this.shapeEditor.enable();

        return this;
    };

    FullEditor.prototype.enablePathDrawer = function(modele) {

        var frame = new JSYG(this.zoomAndPan.innerFrame),
            that = this;

        this.disablePathDrawer();

        function onmousedown(e) {

            if (that.pathDrawer.inProgress) return;

            e.preventDefault();

            var path = modele ? new JSYG(modele).clone() : new JSYG("<path>");

            path.appendTo( that.getDocument() );

            that.pathDrawer.setNode(path);

            that.pathDrawer.draw(e);
        }

        this.disableShapeDrawer();

        if (this.shapeEditor.enabled) this.shapeEditor.disable();

        frame.on("mousedown",onmousedown).data("enablePathDrawer",onmousedown);

         if (this.cursorDrawing) frame.css("cursor",this.cursorDrawing);

        return this;
    };

    FullEditor.prototype.disablePathDrawer = function() {

        var frame = new JSYG(this.zoomAndPan.innerFrame),
            fct = frame.data("enablePathDrawer");

        if (fct) {
            frame.off("mousedown",fct).css("cursor","default");
        }

        if (!this.shapeEditor.enabled) this.shapeEditor.enable();

        return this;
    };

    FullEditor.prototype._initZoomAndPan = function() {

        this.zoomAndPan = new ZoomAndPan();
        this.zoomAndPan.overflow = "auto";
        this.zoomAndPan.scaleMin = 0;

        this.zoomAndPan.resizable.keepViewBox = false;
        this.zoomAndPan.resizable.keepRatio = false;

        this.zoomAndPan.mouseWheelZoom.key = "ctrl";

        this.zoomAndPan.on("change",this.shapeEditor.update.bind(this.shapeEditor));

        return this;
    };

    FullEditor.prototype._initShapeEditor = function() {

        var editor = new Editor();
        var that = this;

        editor.selection.multiple = true;

        new JSYG(editor.container).on("dblclick",function(e) {

            var target = editor.target();

            if (JSYG.svgTexts.indexOf( target.getTag() ) == -1) return;

            that.textEditor.target(target).show();
            that.textEditor.cursor.setFromPos(e);
        });

        editor.on("show",function() {
           that.textEditor.hide();
        });

        editor.selection.on("beforedeselect beforedrag",function(e) {

            if (e.target == that.textEditor.container || new JSYG(e.target).isChildOf(that.textEditor.container)) return false;
        });

        editor.on("dragend",function() {
          that.undoRedo.saveState();
        });

        //editor.ctrlsDrag.bounds = 0;
        //editor.ctrlsResize.bounds = 0;

        this.shapeEditor = editor;

        return this;
    };

    FullEditor.prototype._initTextEditor = function() {

        var that = this;

        this.textEditor = new TextEditor();

        this.textEditor.on("show",function() {
            that.shapeEditor.hide();
        });

        this.textEditor.on("change",function() {
          that.undoRedo.saveState();
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

    FullEditor.prototype.setEditableShapes = function(selector) {

        this.shapeEditor.list = "#" + this.idContainer + " " + selector;
    };

    FullEditor.prototype._enableKeyShortCuts = function() {

        new JSYG(document).on('keydown',null,'del',this.removeSelection);

    };


    FullEditor.prototype._disableKeyShortCuts = function() {

        new JSYG(document).off('keydown',null,'del',this.removeSelection);

    };


    FullEditor.prototype.enable = function(opt) {

        this.disable();

        if (opt) this.set(opt);

        if (!this.node) throw new Error("node is not defined");

        this.zoomAndPan.enable();
        //this.zoomAndPan.scaleTo(1);

        this._insertFrame();

        this.zoomAndPan.mouseWheelZoom.enable();
        //this.zoomAndPan.resizable.enable();

        if (!this.shapeEditor.list) this.setEditableShapes("svg *");

        this.shapeEditor.enableCtrls();
        this.shapeEditor.enable();

        this.textEditor.enable();

        this._enableKeyShortCuts();

        return this;
    };

    FullEditor.prototype.disable = function() {

        this._removeFrame();

        this.zoomAndPan.disable();

        this.shapeEditor.disable();

        this.textEditor.disable();

        return this;
    };

    /**
     * Aligne les éléments sélectionnés
     * @param {String} type (top,middle,bottom,left,center,right)
     * @returns {undefined}
     */
    FullEditor.prototype.alignSelection = function(type) {

        if (!this.shapeEditor.isMultiSelection()) return;

        this.shapeEditor.target().align(type);

        return this;
    };

    FullEditor.prototype.target = function(value) {

        return this.shapeEditor.target(value);
    };

    FullEditor.prototype._adjustSize = function() {

        var contenu = new JSYG( this.getDocument() ),
            dim = contenu.length && contenu.getDim() || {width:0, height:0};

        new JSYG(this._frameShadow).add(this._frame).attr({
            width:dim.width,
            height:dim.height
        });

        if (dim.width && dim.height) this.zoomAndPan.fitToCanvas().scale(0.9);

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

    FullEditor.prototype.load = function(arg) {

        if (arg instanceof File) return this.loadFile(arg);
        else if (typeof arg == "string") {
            if (arg.indexOf("<?xml") == 0 || arg.indexOf("<svg") == 0)
                return this.loadString(arg);
            else return this.loadURL(arg);
        }
        else return this.loadXML()
    };

    FullEditor.prototype.loadString = function(str) {

        return this.loadXML( JSYG.parseSVG(str) );
    };

    FullEditor.prototype.loadFile = function(file) {

        return new Promise(function(resolve,reject) {

            if (!window.FileReader) throw new Error("your navogator doesn't implement FileReader");

            if (!(file instanceof File)) throw new Error("file argument incorrect");

            var reader = new FileReader();

            reader.onload = function(e) {
		resolve(e.target.result);
            };

            reader.onerror = function(e) {
		reject(new Error("Impossible de charger le fichier"));
            };

            reader['readAsText'](file);
        })
        .then(this.loadString.bind(this));
    };

    FullEditor.prototype.loadURL = function(url) {

        return JSYG.fetch(url).then(function(response) {
            return response.text();
        })
        .then(this.loadString.bind(this));
    };

    FullEditor.prototype.loadXML = function(svg) {

        this.shapeEditor.hide();
        this.textEditor.hide();
        this._clearBoundingBoxes();

        var container = new JSYG('#'+this.idContainer);

        container.empty().append(svg);

        this._adjustSize();

        this.undoRedo.disable().setNode(svg).enable();

        return this;
    };

    FullEditor.prototype._clearBoundingBoxes = function() {

        new JSYG(this.shapeEditor.list).boundingBox("hide");
    };


    FullEditor.prototype.toDataURL = function() {

        return new JSYG(this.getDocument()).toDataURL(true);
    };

    FullEditor.prototype.toCanvas = function() {

        return new JSYG(this.getDocument()).toCanvas();
    };

    FullEditor.prototype.removeSelection = function() {

        var target = this.shapeEditor.target();

        if (target) {
            this.shapeEditor.hide();
            target.remove();
            this.undoRedo.saveState();
        }

        return this;
    };


    JSYG.FullEditor = FullEditor;

    return FullEditor;

});
