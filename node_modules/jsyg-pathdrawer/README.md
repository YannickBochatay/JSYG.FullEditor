# JSYG.PathDrawer
drawing interactive svg paths with [JSYG framework](https://github.com/YannickBochatay/JSYG)

##### Demo
[http://yannickbochatay.github.io/JSYG.PathDrawer](http://yannickbochatay.github.io/JSYG.PathDrawer/)

##### Installation
```shell
npm install jsyg-pathdrawer
```


##### Example with webpack/babel
```javascript
import PathDrawer from "jsyg-pathdrawer"

let pencil = new PathDrawer();

document.querySelector("svg").addEventListener("mousedown",function(e) {
               
    if (pencil.inProgress) return;

    let path = document.createElementNS("http://www.w3.org/2000/svg","path");
    //with JSYG framework : path = JSYG("<path>")

    this.appendChild(path);

    pencil.draw(path,e);
});
```