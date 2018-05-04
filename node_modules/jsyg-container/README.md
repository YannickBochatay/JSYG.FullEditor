# JSYG.Container
Container plugin for [JSYG framework](https://github.com/YannickBochatay/JSYG)

### Demo
[http://yannickbochatay.github.io/JSYG.Container/](http://yannickbochatay.github.io/JSYG.Container/)

### Installation
```shell
npm install jsyg-container
```

### Example with es6 bundler
```
import Container from "jsyg-container"

let container = new Container()
container.appendTo('svg') //it's actually a g element

container.addItems("svg > *") //put elements inside the g element
container.translate(50,50).rotate(30) // apply transformation on group
container.freeItems() //free elements. They keep the transformation
```