# JSYG.PolylineDrawer
Draw polylines and polygon with [JSYG framework](https://github.com/YannickBochatay/JSYG)



##### Demo
[http://yannickbochatay.github.io/JSYG.PolylineDrawer/](http://yannickbochatay.github.io/JSYG.PolylineDrawer/)



##### Installation
```shell
npm install jsyg-polylinedrawer
```



##### Example with webpack/babel
```javascript
import PolylineDrawer from "jsyg-polylinedrawer"

let pencil = new PolylineDrawer()
            
document.querySelector("svg").addEventListener("mousedown",function(e) {

   if (pencil.inProgress) return;

   let poly = document.createElementNS("http://www.w3.org/2000/svg","polyline");
   //with JSYG framework : path = JSYG("<polyline>")

   this.appendChild(poly);

   pencil.draw(poly,e);

});
```
