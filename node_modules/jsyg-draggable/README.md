# JSYG.Draggable
Draggable plugin for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Draggable/](http://yannickbochatay.github.io/JSYG.Draggable/)

### Installation
```shell
npm install jsyg-draggable
```

### Example

##### HTML
```html
<svg width="100%" height="300" class="container">
    <rect class="drag" x="5%" width="80" height="40" fill="pink"/>
</svg>
<div class="container">
    <div class="drag" style="width:80px;height:40px;background-color:pink"></div>
</div>
```

##### javascript with es6 bundler
```javascript
import JSYG from "jsyg"
import Draggable from "jsyg-draggable"

new Draggable("rect.drag",{
  bounds:0, //no overflow
  ondrag:function() {
    var dim = JSYG(this).getDim();
    console.log(dim.x,dim.y);
  }
})
```

it also works as a JSYG plugin
```javascript
import JSYG from "jsyg"
import "jsyg-draggable"

JSYG(".drag").draggable({
  bounds:0, //no overflow
  ondrag:function() {
    var dim = JSYG(this).getDim();
    console.log(dim.x,dim.y);
  }
})
```

