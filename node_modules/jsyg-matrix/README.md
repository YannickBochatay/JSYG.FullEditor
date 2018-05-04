# JSYG.Matrix
matrix constructor for JSYG

### Installation
```shell
npm install jsyg-matrix
```

### Example with webpack
```javascript
import Matrix from "jsyg-matrix"

const mtx = new Matrix()

console.log( mtx.translate(50,50).rotate(90).inverse().toString() )
```