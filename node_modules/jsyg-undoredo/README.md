# JSYG.UndoRedo
DOM Undo/Redo plugin for JSYG framework (or standalone with jQuery)

### Demo
[http://yannickbochatay.github.io/JSYG.UndoRedo/](http://yannickbochatay.github.io/JSYG.UndoRedo/)

### Installation
```shell
npm install jsyg-undoredo
```

### Example with webpack/babel
```javascript
import UndoRedo from "jsyg-undoredo"
import $ from "jquery"

let container = $('#myContainer')
let undoRedo = new UndoRedo(container)

undoRedo.enable();

$('#button').on("click", () => {
   container.find("#myDiv").width( (i,width) => width + 50 )
   undoRedo.saveState()
})

$('#undoButton').on("click", () => undoRedo.undo() )

$('#redoButton').on("click", () => undoRedo.redo() )

```
