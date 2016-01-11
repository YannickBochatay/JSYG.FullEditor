# JSYG.MenuBar
Menu bar plugin originally designed for [JSYG framework](https://github.com/YannickBochatay/JSYG), but it works as well as a jQuery plugin.
Fits well with Bootstrap.

##### Demo
[http://yannickbochatay.github.io/JSYG.MenuBar/](http://yannickbochatay.github.io/JSYG.MenuBar/)

##### Installation
```shell
bower install jsyg-menubar
```

##### Example
```javascript
//basic Menu
$('#ulElement').menuBar([{
    title:"MenuItem1",
    list : [{
            text:"simple element",
            icon:"fa fa-modx",
            action:function() {
                alert("click on simple element");
            }
        },{
            text:"another simple element",
            shortcut:"k",
            icon:"fa fa-bar-chart",
            action : function(e) {
                console.log(e);
            }
        }]
},{
    title:"MenuItem2",
    list : [{
            text:"simple element",
            icon:"fa fa-modx",
            disabled:true,
            action:function() {
                alert("click on simple element");
            }
        },{
            text:"element with keyboard shortcut",
            icon:"fa fa-bar-chart",
            action : function(e) {
                alert(e.type+' on element');
            }
        }]
});

//advanced Menu
$('#menuBar').menuBar([{
    title:"MenuItem1",
    list : [{
            text:"simple element",
            icon:"fa fa-modx",
            action:function() {
                alert("click on simple element");
            }
        },{
            text:"element with keyboard shortcut",
            shortcut:"k",
            icon:"fa fa-bar-chart",
            action : function(e) {
                alert(e.type+' on element');
            }
        }]
},{
    title:"MenuItem2",
    list:[{
            text:"element with global keyboard shortcut",
            icon:"fa fa-bug",
            action : function(e) {
                alert(e.type+' on element');
            },
            globalShortcut:"ctrl+d"
        },{
            text:"element with sub-menu",
            icon:"fa fa-book",
            submenu:[{
                    text:"disabled element",
                    action : function() {
                        alert("click on sub-element 1");
                    },
                    disabled:true,
                },{
                    text:"sub-element 2",
                    submenu:[{
                            text:"sub-sub-element 1",
                            checkbox:true,
                            action:function(e,val) {
                                alert("checkbox is "+ (val ? '' : 'un') + "checked")
                            }
                        },{
                            text:"sub-sub-element 2",
                            action : function() {
                                alert("click on sub-sub-element 2");
                            }
                        }]
                }]
        }]
},{
    title:"MenuItem3",
    list : [{
            text:"simple element",
            icon:"fa fa-modx",
            action:function() {
                alert("click on simple element");
            }
        },{
            text:"element with keyboard shortcut",
            shortcut:"k",
            icon:"fa fa-bar-chart",
            action : function(e) {
                alert(e.type+' on element');
            }
        }]
},{
    title:"MenuItem4",
    list:[{
            text:"element with submenu and shortcut",
            shortcut:"s",
            submenu:[{
                    text:"checkbox element, keep menu visible",
                    checkbox:true,
                    keepMenu:true,
                    action:function(e,val) {
                        alert("checkbox is "+ (val ? '' : 'un') + "checked")
                    }
                },{
                    text:"sub-sub-element 2",
                    action : function() {
                        alert("click on sub-sub-element 2");
                    }
                }] 
        },{
            text:"checkbox element",
            checkbox:true,
            checked:true,
            action:function(e,val) {
                alert("checkbox is "+ (val ? '' : 'un') + "checked")
            }
        }]                   
}]);
```

