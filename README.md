# JSYG.FullEditor
Full SVG editing API with JSYG framework

##### Demo
[http://yannickbochatay.github.io/JSYG.FullEditor](http://yannickbochatay.github.io/JSYG.FullEditor/)

##### Installation
```shell
bower install jsyg-fulleditor
```


##### Example

HTML
```html
<svg width="500" height="500" id="editor"></svg>

Shape :
<select name="shape">
    <option>circle</option>
    <option>rect</option>
    <option>line</option>
    <option>polyline</option>
</select>

<button id="importImage">Import image</button>

<button id="download">Download</button>
```

Javascript
```javascript
var svgEditor = new JSYG.FullEditor("#editor");

svgEditor.enable();

svgEditor.newDocument(600,600);

$("[name=shape]").on("change",function() {
    svgEditor.shapeDrawerModel = '<'+this.value+'>';
}).trigger("change");

svgEditor.enableShapeDrawer();

$("#importImage").on("click",function() {
    svgEditor.chooseFile().then(svgEditor.insertImageFile);
});

$("#download").on("click",function() {
    svgEditor.download("svg");
});
```


#### Full example script
[https://github.com/YannickBochatay/JSYG.FullEditor/blob/master/script.js](https://github.com/YannickBochatay/JSYG.FullEditor/blob/master/script.js)
