$(function() {
    
    window.svgEditor = new JSYG.FullEditor('svg');
    
    
    var fileMenu = (function() {
        
        $('#confirmExample').on("click",function() {
            $('#exampleChoice').modal("hide");
            svgEditor.loadURL('../' + $('#examples').val() + '.svg');
        });
        
        $('#confirmDim').on("click",function() {
            svgEditor.newDocument($("#width").val(),$("#height").val());
            $('#dimChoice').modal("hide");
        });
        
        return new JSYG.Menu({
            title:"File",
            list:[{
                    text:"New document",
                    icon:"ledicon page_white_add",
                    action:function() {
                        $('#dimChoice').modal();
                        
                    }
                },{
                    text:"Open document",
                    icon:"ledicon page_white_edit",
                    action:function() {
                        $("<input>").attr("type","file").on("change",function() {
                            svgEditor.loadFile(this.files[0]).catch(alert);
                        }).trigger("click");
                    }
                },{
                    text:"Open example",
                    icon:"ledicon page_green",
                    action:function() {
                        $('#exampleChoice').modal();
                    }
                },{
                    text:"Export...",
                    icon:"ledicon page_go",
                    submenu : [{
                            text:"SVG File",
                            icon:"ledicon page_code",
                            action:function() {
                                svgEditor.toSVGDataURL().then(function(url) {
                                    window.open(url);
                                });
                            }
                        },{
                            text:"PNG file",
                            icon:"ledicon image",
                            action:function() {
                                svgEditor.toPNGDataURL().then(function(url) {
                                    window.open(url);
                                });
                            }
                        }]
                    
                },{
                    text:"Print",
                    icon:"ledicon printer",
                    action:function() {
                        svgEditor.print();
                    }
                }]
        });
        
    })();
    
    
    
    var editMenu = (function initEditMenu() {
        
        var copyItem = new JSYG.MenuItem({
            text:"copy",
            icon:"ledicon page_copy",
            globalShortcut:"Ctrl+C",
            disabled:true,
            action:function() {
                svgEditor.copy();
            }
        });
        
        var cutItem = new JSYG.MenuItem({
            text:"cut",
            icon:"ledicon cut",
            globalShortcut:"Ctrl+X",
            disabled:true,
            action:function() {
                svgEditor.cut();
            }
        });
        
        var pasteItem = new JSYG.MenuItem({
            text:"paste",
            icon:"ledicon page_paste",
            globalShortcut:"Ctrl+V",
            disabled:true,
            action:function() {
                svgEditor.paste();
            }
        });
        
        var duplicateItem = new JSYG.MenuItem({
            text:"duplicate",
            icon:"ledicon page_2_copy",
            disabled:true,
            action:function() {
                svgEditor.duplicate();
            }
        });
        
        var removeItem = new JSYG.MenuItem({
            text:"remove",
            icon:"ledicon bin_closed",
            globalShortcut:"Del",
            disabled:true,
            action:function() {
                svgEditor.remove();
            }
        });
        
        var undoItem = new JSYG.MenuItem({
            text:"undo",
            icon:"ledicon arrow_undo",
            globalShortcut:"Ctrl+Z",
            keepMenu:true,
            disabled:true,
            action:function() {
                svgEditor.undo();
            }
        });
        
        var redoItem = new JSYG.MenuItem({
            text:"redo",
            icon:"ledicon arrow_redo",
            globalShortcut:"Ctrl+Y",
            keepMenu:true,
            disabled:true,
            action:function() {
                svgEditor.redo();
            }
        });
        
        var groupItem = new JSYG.MenuItem({
            text:"group elements",
            icon:"ledicon link",
            disabled:true,
            action:function() {
                svgEditor.group();
            }
        });
        
        var ungroupItem = new JSYG.MenuItem({
            text:"ungroup elements",
            icon:"ledicon link_break",
            disabled:true,
            action:function() {
                svgEditor.ungroup();
            }
        })
        
        function majUndoRedoItems() {
            undoItem.disabled = !svgEditor.undoRedo.hasUndo();
            redoItem.disabled = !svgEditor.undoRedo.hasRedo();
            editMenu.update();
        }
        
        function updateGroupItems() {
            var isMulti = svgEditor.isMultiSelection();
            var isContainer = !isMulti && svgEditor.shapeEditor.target().getTag() == "g";
            groupItem.disabled = !isMulti;
            ungroupItem.disabled = !isContainer;
        }
        
        svgEditor.undoRedo.on("change",majUndoRedoItems);
        svgEditor.on("change",majUndoRedoItems);
        
        svgEditor.shapeEditor.on({
            show:function() {
                copyItem.disabled = false;
                cutItem.disabled = false;
                removeItem.disabled = false;
                duplicateItem.disabled = false;
                editMenu.update();
            },
            hide:function() {
                copyItem.disabled = true;
                cutItem.disabled = true;
                removeItem.disabled = true;
                pasteItem.disabled = true;
                duplicateItem.disabled = true;
                editMenu.update();
            },
            changetarget:updateGroupItems
        });
        
        svgEditor.shapeEditor.clipBoard.on({
            "cut copy":function() {
                pasteItem.disabled = false;
                editMenu.update();
            }
        });
        
        return new JSYG.Menu({
            title:"Edit",
            list:[undoItem,redoItem,'divider',copyItem,cutItem,pasteItem,duplicateItem,removeItem,'divider',groupItem,ungroupItem]
        });
        
    })();
    
    
    var viewMenu = (function() {
        
        var fullScreenItem = new JSYG.MenuItem({
            text:"Full screen",
            checkbox:true,
            action:function() {
                $(document).toggleFullScreen();
            }
        });
        
        $(document).on("fullscreenchange", function() {
            fullScreenItem.checked = $(document).fullScreen();
            viewMenu.update();
        });
        
        return new JSYG.Menu({
            title:"View",
            list:[{
                    text:"Zoom in",
                    icon:"ledicon zoom_in",
                    keepMenu:true,
                    action:function() {
                        svgEditor.zoom(+10);
                    }
                },{
                    text:"Zoom out",
                    icon:"ledicon zoom_out",
                    keepMenu:true,
                    action:function() {
                        svgEditor.zoom(-10);
                    }
                },{
                    text:"Fit to canvas",
                    icon:"ledicon doc_resize",
                    action:function() {
                        svgEditor.zoomTo("canvas");
                    }
                },{
                    text:"Real size",
                    icon:"ledicon doc_resize_actual",
                    action:function() {
                        svgEditor.zoomTo(100);
                    }
                },{
                    text:"Marquee zoom",
                    icon: "ledicon zone",
                    action:function() {
                        svgEditor.enableMarqueeZoom();
                    }
                },
                
                fullScreenItem,
                
                {
                    text:"Enable mouse pan",
                    checkbox:true,
                    icon: "fa fa-hand-grab-o",
                    action:function(e,val) {
                        svgEditor[ (val?"en":"dis")+"ableMousePan"]();
                    }
                }]
        });
        
    })();
    
    var positionMenu = (function() {
        
        var menu = new JSYG.Menu({title:"Position"});
        
        var moveBack = new JSYG.MenuItem({
            icon : 'ledicon shape_move_back',
            text : "Move back",
            disabled : true,
            action : function() {
                svgEditor.moveBack();
                majItemsPosition();
                menu.update();
            }
        })
            .addTo(menu);
        
        var moveBackwards = new JSYG.MenuItem({
            icon : 'ledicon shape_move_backwards',
            text : "Move backwards",
            keepMenu : true,
            disabled : true,
            action : function() {
                svgEditor.moveBackwards();
                majItemsPosition();
                menu.update();
            }
        })
            .addTo(menu);
        
        var moveForwards = new JSYG.MenuItem({
            icon : 'ledicon shape_move_forwards',
            text : "Move forwards",
            keepMenu : true,
            disabled : true,
            action : function() {
                svgEditor.moveForwards();
                majItemsPosition();
                menu.update();
            }
        })
            .addTo(menu);
        
        var moveFront = new JSYG.MenuItem({
            icon : 'ledicon shape_move_front',
            text : "Move front",
            disabled : true,
            action : function() {
                svgEditor.moveFront();
                majItemsPosition();
                menu.update();
            }
        })
            .addTo(menu);
        
        function majItemsPosition() {
            
            moveBack.disabled = moveBackwards.disabled = !svgEditor.canMoveBackwards();
            moveFront.disabled = moveForwards.disabled = !svgEditor.canMoveForwards();
        }
        
        menu.addDivider();
        
        var vertiItem = new JSYG.MenuItem({
            icon : "ledicon shape_aling_middle",
            text : "Align vertically",
            disabled : true,
            action : 'submenu',
            submenu : ["top","middle","bottom"].map(function(type) {
                return {
                    icon:"ledicon shape_aling_"+type,
                    text:type,
                    action:function() {
                        svgEditor.align(type);
                        menu.update();
                    }
                };
            })
        })
            .addTo(menu);
        
        var horizItem = new JSYG.MenuItem({
            icon : "ledicon shape_aling_center",
            text : "Align horizontally",
            disabled : true,
            action : 'submenu',
            submenu : ["left","center","right"].map(function(type) {
                return {
                    icon:"ledicon shape_aling_"+type,
                    text:type,
                    action:function() {
                        svgEditor.align(type);
                        menu.update();
                    }
                };
            })
        })
            .addTo(menu);
        
        function majItemsAlignement() {
            
            var isMulti = svgEditor.isMultiSelection();
                    
            vertiItem.disabled = !isMulti;
            horizItem.disabled = !isMulti;
        }
        
        menu.addDivider();
        
        centreVitem = new JSYG.MenuItem({
            icon : "ledicon application_split",
            text : "Center vertically",
            disabled : true,
            action : function() {
                svgEditor.centerVertically();
                centreVitem.disabled = true;
            }
        })
            .addTo(menu);
        
        centreHitem = new JSYG.MenuItem({
            icon : "ledicon application_tile_horizontal",
            text : "Center horizontally",
            disabled : true,
            action : function() {
                svgEditor.centerHorizontally();
                centreHitem.disabled = true;
            }
        })
            .addTo(menu);
        
        svgEditor.shapeEditor.on({
            "hide":function() {
                majItemsAlignement();
                majItemsPosition();
                centreVitem.disabled = true;
                centreHitem.disabled = true;
                menu.update();
            },
            "changetarget":function() {
                majItemsAlignement();
                majItemsPosition();
                centreVitem.disabled = false;
                centreHitem.disabled = false;
                menu.update();
            }
        });
        
        return menu;
        
    }());
    
    var optionsMenu = new JSYG.Menu({
        title:"Options",
        list:[{
                text:"Edit position",
                checkbox:true,
                checked:true,
                action:function(e,val) {
                    svgEditor.editPosition = val;
                }
                
            },{
                text:"Edit size",
                checkbox:true,
                checked:true,
                action:function(e,val) {
                    svgEditor.editSize = val;
                }
            },{
                text:"Edit rotation",
                checkbox:true,
                checked:true,
                action:function(e,val) {
                    svgEditor.editRotation = val;
                }
            },{
                text:"Edit paths main points",
                checkbox:true,
                checked:true,
                action:function(e,val) {
                    svgEditor.editPathMainPoints = val;
                }
            },{
                text:"Edit paths control points",
                checkbox:true,
                checked:false,
                action:function(e,val) {
                    svgEditor.editPathCtrlPoints = val;
                }
            },{
                text:"Auto-smooth paths",
                checkbox:true,
                checked:true,
                action:function(e,val) {
                    svgEditor.autoSmoothPaths = val;
                }
            },{
                text:"Use transform attribute",
                checkbox:true,
                checked:false,
                action:function(e,val) {
                    svgEditor.useTransformAttr = val;
                }
            },{
                text:"Keep Shapes ratio",
                checkbox:true,
                checked:false,
                action:function(e,val) {
                    svgEditor.keepShapesRatio = val;
                }
            },{
                text:"Canvas resizable",
                checkbox:true,
                checked:false,
                action:function(e,val) {
                    svgEditor.canvasResizable = val;
                }
            },
        ]
    });
    
    
    new JSYG("#menuBar").menuBar([fileMenu,editMenu,viewMenu,positionMenu,optionsMenu]);
    
    
    $('.collapse').collapse({parent:"#accordion"});
    
    $('#viewPanel').on("hide.bs.collapse",function() {
        svgEditor.disableMousePan();
        $('#mousePan').removeClass("active");
    });
    
    $('#drawShapes').on({
        "show.bs.collapse":function () {
            $('#shape').trigger("change");
        },
        "hide.bs.collapse":function() {
            svgEditor.disableShapeDrawer();
            svgEditor.disableInsertElement();
        }
    });
    
    $('#shape').on("change",function() {
        
        var type = this.value;
        
        if (type.indexOf("path")!=-1) {
            svgEditor.drawingPathMethod = (type == "path") ? "point2point" : "freehand";
            type = "path";
        }
        
        var shape = new JSYG("<"+type+">").addClass("perso");
        
        if (type == "text") svgEditor.enableInsertElement(shape);
        else svgEditor.enableShapeDrawer(shape);
    });
    
    svgEditor.editableShapes = "> *";
    
    svgEditor.enable();
    
    svgEditor.newDocument(500,500);
    
    svgEditor.enableDropImages();
    
});