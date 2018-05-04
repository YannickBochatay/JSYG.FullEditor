# JSYG.TextEditor
svg text editor with [JSYG framework](https://github.com/YannickBochatay/JSYG).
It's a brick of [JSYG.FullEditor](https://github.com/YannickBochatay/JSYG.FullEditor), a full svg editor API.

### Demo
[http://yannickbochatay.github.io/JSYG.TextEditor/](http://yannickbochatay.github.io/JSYG.TextEditor/)

### Installation
```shell
npm install jsyg-texteditor
```

### Example with module bundler
```javascript
import TextEditor from "jsyg-texteditor"
import $ from "jquery"

let editor = new TextEditor('#mySVGContainer')
           
$('#mySVGContainer').on("click",function(e) {

  if ( e.target.tagName == "text") {
    editor.target(e.target)
    editor.show()
  }
})
```