# JSYG.BoundingBox
BoundingBox plugin for JSYG framework

[demo](http://yannickbochatay.github.io/JSYG.BoundingBox/)

### Installation
```shell
npm install jsyg-boundingbox
```

### Usage
Include the css file JSYG.BoundingBox.css.

##### es6 modules (webpack+babel)
```javascript
import BoundingBox from "jsyg-boundingbox"

var box = new BoundingBox("#myElement");
box.show();
box.hide();
```

##### browserify
```javascript
var BoundingBox = require("jsyg-boundingbox")

var box = new BoundingBox("#myElement");
box.show();
box.hide();
```

##### without bundler
```html
<link rel="stylesheet" href="node_modules/jsyg-boundingbox/JSYG.BoundingBox.css">

<script src="node_modules/jquery/dist/jquery.js"></script>
<script src="node_modules/jsyg/dist/JSYG.js"></script>
<script src="node_modules/pathseg/pathseg.js"></script>
<script src="node_modules/jsyg-path/JSYG.Path.js"></script>
<script src="node_modules/jsyg-boundingbox/JSYG.BoundingBox.js"></script>
<script>
    var box = new JSYG.BoundingBox("#myElement");
    box.show();
    box.hide();

    //or as a plugin
    new JSYG("#myElement").boundingBox("show");
</script>
```