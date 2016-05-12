'use strict';

module.exports = function (grunt) {



    var cssFiles = [
      "jsyg-boundingbox/JSYG.BoundingBox.css",
      "jsyg-editor/JSYG.Editor.css",
      "jsyg-fulleditor/JSYG.FullEditor.css",
      "jsyg-selection/JSYG.Selection.css",
      "jsyg-texteditor/JSYG.TextEditor.css",
      "jsyg-zoomAndPan/JSYG.ZoomAndPan.css",
    ]

    cssFiles = cssFiles.map(function(file) { return "bower_components/"+file; })

    cssFiles.push("styles.css")


    grunt.initConfig({
      concat:{
        options: {
            separator: '\n\n',
          },
          dist: {
            src: cssFiles,
            dest: 'JSYG.FullEditor.css'
          }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);

};
