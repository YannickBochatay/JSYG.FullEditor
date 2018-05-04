# JSYG.Editor
Editor of svg shapes with [JSYG framework](https://github.com/YannickBochatay/JSYG)

If you look for a complete SVG editor with very simple API, try [JSYG.FullEditor](https://github.com/YannickBochatay/JSYG.FullEditor).
This one is just a brick.


### Demo
[http://yannickbochatay.github.io/JSYG.Editor/](http://yannickbochatay.github.io/JSYG.Editor/)


### Installation
```shell
npm install jsyg-editor
```


### Usage

##### es6 modules (webpack+babel)
```javascript
import Editor from "jsyg-editor"

let editor = new Editor("#mySVGContainer");
editor.enable({
  list:"#mySVGContainer > [data-editable]"
  ctrls:"all"
});
```

##### browserify
```javascript
var Editor = require("jsyg-editor");

let editor = new Editor("#mySVGContainer");
editor.enable({
  list:"#mySVGContainer > [data-editable]"
  ctrls:"all"
});
```

##### without bundler
```html
<link rel="stylesheet" href="node_modules/jsyg-editor/JSYG.Editor.css"/>

<script src="node_modules/jquery/dist/jquery.js"></script>
<script src="node_modules/jsyg/JSYG.js"></script>
<script src="node_modules/jQuery.Hotkeys/jquery.hotkeys.js"></script>
<script src="node_modules/jsyg-path/JSYG.Path.js"></script>
<script src="node_modules/jsyg-draggable/JSYG.Draggable.js"></script>
<script src="node_modules/jsyg-resizable/JSYG.Resizable.js"></script>
<script src="node_modules/jsyg-rotatable/JSYG.Rotatable.js"></script>
<script src="node_modules/jsyg-selection/JSYG.Selection.js"></script>
<script src="node_modules/jsyg-container/JSYG.Container.js"></script>
<script src="node_modules/jsyg-boundingbox/JSYG.BoundingBox.js"></script>
<script src="node_modules/jsyg-alignment/JSYG.Alignment.js"></script>
<script src="node_modules/jsyg-editor/JSYG.Editor.js"></script>
<script>
  var editor = new JSYG.Editor("#mySVGContainer");
  editor.enable({
    list:"#mySVGContainer > [data-editable]"
    ctrls:"all"
  });
</script>
```