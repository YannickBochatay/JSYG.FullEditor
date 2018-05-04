# JSYG.Resizable
Resizable plugin for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Resizable/](http://yannickbochatay.github.io/JSYG.Resizable/)

### Installation

##### with npm
```shell
npm install jsyg-resizable
```

### Example

##### HTML
```html
<svg width="100%" height="300" class="container">
    <rect class="resize" width="80" height="40" fill="pink"/>
</svg>
<div class="container">
    <div class="resize" style="width:80px;height:40px;background-color:pink"></div>
</div>
```

##### Javascript es6
```javascript
import JSYG from "jsyg"
import Resizable from "jsyg-resizable"

let resize = new Resizable("rect.resize",{ 
    bounds:0,
    ondrag:function() {
       var dim = JSYG(this).getDim();
       console.log(dim.width,dim.height);
    }
})
```

Or as a JSYG plugin (so you can apply it on several elements)
```javascript
import JSYG from "jsyg"
import "jsyg-resizable"

JSYG(".resize").resizable({
    bounds:0,
    ondrag:function() {
       var dim = JSYG(this).getDim();
       console.log(dim.width,dim.height);
    }
});
```