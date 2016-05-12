# JSYG.FullEditor
Provides a complete and very simple API to create your own svg online editor. UI is your concern.

### Demo
[http://yannickbochatay.github.io/JSYG.FullEditor](http://yannickbochatay.github.io/JSYG.FullEditor/)

### Installation
```shell
npm install jsyg-fulleditor
```
You can also install it with bower


### Example

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


### Full example script
[https://github.com/YannickBochatay/JSYG.FullEditor/blob/master/script.js](https://github.com/YannickBochatay/JSYG.FullEditor/blob/master/script.js)


### API
it will come one day. Check the [full example](https://github.com/YannickBochatay/JSYG.FullEditor/blob/master/script.js) for the moment.
There's almost everything in it, and it should be quite clear.