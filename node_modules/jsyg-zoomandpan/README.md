# JSYG.ZoomAndPan
Zoom and Pan features with [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.ZoomAndPan/](http://yannickbochatay.github.io/JSYG.ZoomAndPan/)

### Installation
```shell
npm install jsyg-zoomandpan
```

### Example with webpack/babel

```javascript
import ZoomAndPan from "jsyg-zoomandpan"

let zap = new ZoomAndPan("#mySVGContainer")
zap.enable()
zap.mouseWheelZoom.enable()
zap.resizable.enable()
zap.mousePan.enable()
```