# JSYG.Point
Points constructor for JSYG. Kind of wrapper of SVGPoint.
Not very useful outside of JSYG.

```javascript
var point = new Point(5,10);

var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');

var mtx = svg.createSVGMatrix();
mtx.e = 2;
mtx.f = 3;

point.mtx(mtx).toString(); //{"x":7,"y":13}
```

##### Installation with npm

```shell
npm install jsyg-point
```
