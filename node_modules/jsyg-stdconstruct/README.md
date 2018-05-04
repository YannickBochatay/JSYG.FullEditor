# JSYG.StdConstruct
Standard constructor for writing [JSYG](https://github.com/YannickBochatay/JSYG) or plugins

### Installation
```shell
npm install jsyg-stdconstruct
```

### Example with es6
```javascript
import StdConstruct from "jsyg-stdconstruct"

export default class Blink extends StdConstruct {

    constructor(selector,opt) {

        this.onshow = null
        this.onhide = null
        this.setNode(selector)
        this.frequency = 1000

        if (opt) this.enable(opt)
    }

    show() {
        
        this.node.style.display = "none"
        this.trigger("show")
        return this
    }
    
    hide() {
        
        this.node.style.display = "block"
        this.trigger("hide")
        return this
    }

    toggle() {
    
        this[ this.node.style.display == "none" ? "show" : "hide" ]()
    }

    enable(opt) {

        this.disable()
        
        if (opt) this.set(opt)
        
        this.interval = window.setInterval( this.toggle.bind(this), this.frequency )

        this.enabled = true
    }

    disable() {
        
        if (this.interval) window.clearInterval(this.interval)
    
        this.enabled = false
    }       
}
```

```javascript
import Blink from "./blink"

let blink = new Blink('#myElement')

blink.on({
  "show" : () => console.log("show")
  "hide" : () => console.log("hide")
})

blink.enable({
    frequency : 2000
})
```

If you use JSYG framework, you can register the plugin like this :
```javascript
let plugin = JSYG.bindPlugin(Blink)

JSYG.prototype.blink = function() { plugin.apply(this,arguments); }
```

Then you can use your plugin like this :
```javascript
let $myElmt = JSYG("#myElement")

$myElmt.blink({
    frequency : 2000,
    onshow : () => console.log("show")
    onhide : () => console.log("hide")
})

window.setTimeout( ()=> $myElmt.blink("disable"), 10000 )
```
