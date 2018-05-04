# JSYG.Rotatable
Rotatable plugin for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Rotatable/](http://yannickbochatay.github.io/JSYG.Rotatable/)

### Installation

##### with npm
```shell
npm install jsyg-rotatable
```


### Example

##### HTML
```html
<svg width="100%" height="300" class="container">
  <rect class="rotate" x="10%" y="10%" width="80" height="40" fill="pink"/>
</svg>
<div class="container">
  <div class="rotate" style="width:80px;height:40px;background-color:pink;position:absolute;left:100px;top:100px"></div>
</div>
```

##### Javascript es6
```javascript
import JSYG from "jsyg"
import Rotatable from "jsyg-rotatable"

let rotatable = new Rotatable("rect.rotate",{ 
    ondrag:function() {
    console.log( "angle : " + JSYG(this).rotate() );
  }
})
```

Or as a JSYG plugin (so you can apply it on several elements)
```javascript
import JSYG from "jsyg"
import "jsyg-rotatable"

JSYG(".rotate").rotatable({
  ondrag:function() {
    console.log( "angle : " + JSYG(this).rotate() );
  }
})
```