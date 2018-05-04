# JSYG.Path
Manipulation of svg path with [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Installation
```shell
npm install jsyg-path
```

### Example with es6
```javascript
import Path from "jsyg-path"

let path = new Path();
path.moveTo(0,0).lineTo(30,50).lineTo(80,80);
path.appendTo('svg#mySVGContainer');

path = new Path('#myPath');
path.normalize(); //M,L,C,Z,z segments only
```