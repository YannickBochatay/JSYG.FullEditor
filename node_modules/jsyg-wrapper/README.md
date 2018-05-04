JSYG
====

JSYG is a jQuery wrapper to work on svg elements.

```javascript
var svg = JSYG("<svg>").attr({"width":400,"height":500}).appendTo("body");

var rect = JSYG("<rect>")
.attr({"x":50,"y":50,"width":100,"height":50})
.css("fill","red")
.addClass("MyClass");
.appendTo(svg);

rect.position(); // {left:50,top:50}
rect.offsetParent()[0] === svg[0] // true

svg.constructor === JSYG // true
svg instanceof jQuery // true
```

It doesn't work with html strings, only with single tags :
```javascript
var rect = JSYG("<rect>").attr({width:500,height:200});
rect.isSVG(); //true;

var rect = JSYG("<rect width='500' height='200'/>");
rect.isSVG(); //false;
```

##### Installation with npm or bower

```shell
npm install jsyg-wrapper
bower install jsyg-wrapper
```
