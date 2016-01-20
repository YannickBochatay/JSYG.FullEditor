# JSYG.ShapeDrawer
Draw svg shapes with JSYG framework

##### Demo
[http://yannickbochatay.github.io/JSYG.ShapeDrawer](http://yannickbochatay.github.io/JSYG.ShapeDrawer/)

##### Installation
```shell
bower install jsyg-shapedrawer
```


##### Example

HTML
```html
<svg width="500" height="500" id="editor"></svg>
```

Javascript
```javascript
var drawer = new JSYG.ShapeDrawer();
        
drawer.on("end",function(e,shape) {
    alert("What a beautiful rectangle");
});

$("svg").on("mousedown",function(e) {

    var shape = new JSYG("<rect>");

    shape.appendTo(this);

    drawer.draw(shape,e);
});
```
