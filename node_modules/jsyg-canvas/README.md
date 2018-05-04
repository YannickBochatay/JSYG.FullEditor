# JSYG.Canvas
Few canvas features for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Canvas/](http://yannickbochatay.github.io/JSYG.Canvas/)

### Installation
```shell
npm install jsyg-canvas
```

### Example with es6 bundler
```javascript
import Canvas from "jsyg-canvas"

let canvas = new Canvas("#myCanvasElement")

canvas.resize(50,null) //keep ratio while resizing
canvas.toGrayScale()
canvas.exportTo("url").then( dataURL => window.open(dataURL) )
```