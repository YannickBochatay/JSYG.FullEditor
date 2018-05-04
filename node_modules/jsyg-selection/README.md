# JSYG.Selection
Mouse selection plugin for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Selection](http://yannickbochatay.github.io/JSYG.Selection/)


### Installation
```shell
npm install jsyg-selection
```

### Usage

##### es6 modules (webpack+babel)
```javascript
import Selection from "jsyg-selection"

let selectArea = new Selection("#myContainer");
selectArea.enable({
    list : ".selectable",
    onselectedlist : function(e,liste) {
        console.log(liste.length+" elements selected");
    }
});
```

##### browserify
```javascript
var Selection = require("jsyg-selection");
var selectArea = new Selection("#myContainer");
selectArea.enable({
    list : ".selectable",
    onselectedlist : function(e,liste) {
        console.log(liste.length+" elements selected");
    }
});
```

##### without bundler
```html
<script src="node_modules/jquery/dist/jquery.js"></script>
<script src="node_modules/jquery.hotkeys/jquery.hotkeys.js"></script>
<script src="node_modules/jsyg/dist/JSYG.js"></script>
<script src="node_modules/jsyg-resizable/JSYG.Resizable.js"></script>
<script src="node_modules/jsyg-selection/JSYG.Selection.js"></script>
<script>
var selectArea = new JSYG.Selection("#myContainer");
selectArea.enable({
    list : ".selectable",
    onselectedlist : function(e,liste) {
        console.log(liste.length+" elements selected");
    }
});
</script>
```

### Warning
See the [warning](https://github.com/YannickBochatay/JSYG) in JSYG config.