# Color
Constructeur de couleurs.

### Installation
```shell
npm install jsyg-color
```

### Usage

##### es6 modules (babel+webpack)
```javascript
import Color from "jsyg-color"
²
var div = document.getElementById("#myElmt");
var color = new Color("violet");
div.style.color = color.complementary().lighten(2).toString();
```

##### without bundler
```html
<script src="node_modules/jsyg-color/JSYG.Color.js"></script>
<script>
  var div = document.getElementById("#myElmt");
  var color = new Color("violet");
  div.style.color = color.complementary().lighten(2).toString();
</script>
```