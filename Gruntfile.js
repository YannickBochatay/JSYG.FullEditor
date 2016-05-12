'use strict';

module.exports = function (grunt) {
  
    function ucfirst(str) {
      return str.charAt(0).toUpperCase()+str.slice(1)
    }
    
    function getFiles(ext) {
      
      return function(dep) {
        
        var rep = "jsyg" + (dep == "jsyg" ?  "" : "-"+dep);
        var file = "JSYG" + (dep == "jsyg" ? "" : "."+(dep == "fetch" ? dep : ucfirst(dep)) ) + "."+ext
        
        return "node_modules/"+rep+"/"+file;
      }
    }

    var cssFiles = ["boundingbox","editor","fulleditor","selection","texteditor","zoomandpan"].map( getFiles("css") );
    cssFiles.push("styles.css");
    
    var jsFiles = ["jsyg","editor","texteditor","zoomandpan","pathdrawer","polylinedrawer","shapedrawer","undoredo","fetch"].map ( getFiles("js") );
    jsFiles.push("JSYG.FullEditor.js");
           
    grunt.initConfig({
      concatJS: {
          options: {
            separator: '\n\n'
          },
          dist: {
            src: jsFiles,
            dest: 'dist/JSYG.FullEditor.js'
          }
      },
      
      concatCSS: {
        options: {
            separator: '\n\n'
          },
          dist: {
            src: jsFiles,
            dest: 'dist/JSYG.FullEditor.css'
          }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concatJS','concatCSS'] );

};
