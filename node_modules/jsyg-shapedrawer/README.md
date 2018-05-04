# JSYG.ShapeDrawer
Draw svg shapes with [JSYG framework](https://github.com/YannickBochatay/JSYG)


### Demo
[http://yannickbochatay.github.io/JSYG.ShapeDrawer](http://yannickbochatay.github.io/JSYG.ShapeDrawer/)


### Installation
```shell
npm install jsyg-shapedrawer
```


### Example with webpack/babel

```javascript
import ShapeDrawer from "jsyg-shapedrawer"

let drawer = new JSYG.ShapeDrawer();
        
drawer.on("end",function(e,shape) {
    alert("What a beautiful "+shape.tagName);
});

document.querySelector("svg").on("mousedown",function(e) {

    let shape = document.createElementNS("http://www.w3.org/2000/svg","rect");
   //with JSYG framework : shape = JSYG("<rect>")

    this.appendChild(shape);

    drawer.draw(shape,e);
});
```
