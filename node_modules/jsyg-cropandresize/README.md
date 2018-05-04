# JSYG.CropAndResize
Crop and resize image with [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.CropAndResize/](http://yannickbochatay.github.io/JSYG.CropAndResize/)

### Installation
```shell
npm install jsyg-cropandresize
```

### Example with module bundler

```html
<link rel="stylesheet" href="node_modules/jsyg-editor/JSYG.Editor.css"/>

<svg width="620" height="620" id="content">
    <image xlink:href="image.jpg" width="620" height="620"/>
</svg>
```

```javascript
import CropAndResize from "jsyg-cropandresize"

let crop = new CropAndResize("#myImage");
            
crop.enable();
            
document.querySelector('#myButton').addEventListener("dblclick",function() {

    crop.toCanvas().then(function(canvas) {
        document.body.appendChild(canvas);
    });
});
```