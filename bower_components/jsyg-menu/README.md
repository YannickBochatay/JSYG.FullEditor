# JSYG.Menu
Menu plugin originally designed for [JSYG framework](https://github.com/YannickBochatay/JSYG), but it works as well as a jQuery plugin.
Fits well with Bootstrap.

##### Demo
[http://yannickbochatay.github.io/JSYG.Menu/](http://yannickbochatay.github.io/JSYG.Menu/)

##### Installation
```shell
bower install jsyg-menu
```

##### Example
```javascript
//basic Menu
$('#ulElement').jMenu([{
    text:"element 1",
    icon:"fa fa-modx",
    action:function() {
        alert("click on element 1");
    }
},{
    text:"element 2",
    icon:"fa fa-bug",
    action:function() {
        alert("click on element 2");
    }
}])
.jMenu("show");

//advanced Menu
$('#ulElement').jMenu([{
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
},{
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
},{
    text:"element with submenu and shortcut",
    shortcut:"s",
    submenu:[{
            text:"checkbox element",
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
},{
    text:"checkbox element",
    checkbox:true,
    checked:true,
    action:function(e,val) {
        alert("checkbox is "+ (val ? '' : 'un') + "checked")
    }
}])
.jMenu("show");
```
