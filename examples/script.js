$(function() {
    
    $('.collapse').collapse({parent:"#accordion"});
    
    window.svgEditor = new JSYG.FullEditor('svg');
    
    svgEditor.editableShapes = "> *";
    
    svgEditor.enable();
    
    
    ["left","center","right","top","middle","bottom"].forEach(function(type) {
        
        $('#align'+JSYG.ucfirst(type)).on("click",function() {
            svgEditor.align(type);
        })
    });
    
    ["Front","Back","ToFront","ToBack"].forEach(function(type) {
        
        $('#move'+type).on("click",function() {
            svgEditor["moveTarget"+type]();
        });
    });
    
    $("#insertElmt").on("click",function() {
        var elmt = new JSYG("<rect>").addClass("perso").setDim({width:200,height:100});
        svgEditor.enableInsertElement(elmt);
    });
    
    $("#insertText").on("click",function() {
        var text = new JSYG("<text>").text("Bonjour le monde");
        svgEditor.enableInsertText(text);
        new JSYG(this).trigger("blur");
    });
    
    $("#newDocument").on("click",function() {
        svgEditor.newDocument( $('#width').val(), $('#height').val() );
    });
    
    $("#openDocument").on("click",function() {
        $("#uploadFile").trigger("click");
    });
    
    $("#uploadFile").on("change",function() {
        svgEditor.loadFile(this.files[0])
            .catch(alert);
    });
    
    $('#openExample').on("click",function() {
        $('#exampleChoice').modal();
    });
    
    $('#confirmExample').on("click",function() {
        $('#exampleChoice').modal("hide");
        svgEditor.loadURL($('#examples').val() + '.svg');
    });
    
    svgEditor.on("load",function() {
        var dim = svgEditor.getDimDocument();
        $('#width').val(dim.width);
        $('#height').val(dim.height);
    });
    
    $('#width').on("change",function() {
        svgEditor.setDimDocument({width:this.value});
    });
    
    $('#height').on("change",function() {
        svgEditor.setDimDocument({height:this.value});
    });
    
    
    $("#drawPath").on("click",function() {
        svgEditor.enablePathDrawer( new JSYG.Path().addClass("perso") );
    });
    
    $("#drawShape").on("click",function() {
        var tag = $('#shape').val();
        var shape = new JSYG("<"+tag+">").addClass("perso") 
        svgEditor.enableShapeDrawer(shape);
    });
    
    $('#drawingPathMethod').on("change",function() {
        svgEditor.drawingPathMethod = this.value;
    }).trigger("change");
    
    
    $('#marqueeZoom').on("click",function() {
        svgEditor.enableMarqueeZoom();
    });
    
    $('#fitToCanvas').on("click",function() {
        svgEditor.zoomTo('canvas');
    });
    
    $('#realSize').on("click",function() {
        svgEditor.zoomTo(100);
    });
    
    $('#zoomIn').on("click",function() {
        svgEditor.zoom(+10);
    });
    
    $('#zoomOut').on("click",function() {
        svgEditor.zoom(-10);
    });
    
    $('[name=mousePan]').on("change",function() {
        if (!this.checked) return;
        var method = this.value + 'MousePan';
        svgEditor[method]();
    });
    
    svgEditor.on({
        enablemousepan:function() {
            $('[name=mousePan][value=enable]')[0].checked = true;
        },
        disablemousepan:function() {
            $('[name=mousePan][value=disable]')[0].checked = true;
        }
    });
    
    $('[name=mousePan]:checked').trigger("change");
    
    $('[name=overflow]').on("change",function() {
       if (!this.checked) return;
       svgEditor.overflow = this.value;
    });
    
    $('[name=overflow]:checked').trigger("change");
    
    
    ["remove","copy","cut","paste","undo","redo","group","ungroup"].forEach(function(action) {
        
        $('#'+action).on("click",function() {
            svgEditor[action]();
        });
    });
    
    ["resizable","editPathMainPoints","editPathCtrlPoints","keepShapesRatio","autoSmoothPaths","useTransformAttr","editPosition","editSize","editRotation"].forEach(function(property) {
        
        $('#'+property).on("change",function() {
            svgEditor[property] = this.checked; 
        }).trigger("change");
    });
    
    ["toSVGDataURL","toPNGDataURL"].forEach(function(action) {
        
        $("#"+action).on("click",function() {
            svgEditor[action]().then(function(url) {
                window.open(url);
            });
        });
    });
    
    svgEditor.registerKeyShortCut({
        "ctrl+c": svgEditor.copy,
        "ctrl+x": svgEditor.cut,
        "ctrl+v": svgEditor.paste,
        "ctrl+z": svgEditor.undo,
        "ctrl+y": svgEditor.redo,
        "del": svgEditor.remove
    });
        
    svgEditor.loadURL("world.svg");
    
});