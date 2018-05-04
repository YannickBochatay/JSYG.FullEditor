'use strict';

module.exports = function (grunt) {
    
    var files = [
        "jsyg-wrapper/JSYG-wrapper.js",
        "jsyg-point/JSYG.Point.js",
        "jsyg-vect/JSYG.Vect.js",
        "jsyg-matrix/JSYG.Matrix.js",
        "jsyg-strutils/JSYG-strutils.js",
        "jsyg-utils/JSYG-utils.js",
        "jsyg-events/JSYG.Events.js",
        "jsyg-stdconstruct/JSYG.StdConstruct.js"
    ];
    
    var rep = "node_modules";
    
    files = files.map(function(file) { return rep+"/"+file; });
        
    files.push("JSYG.js");
   
    grunt.initConfig({
      concat: {
          options: {
            separator: '\n\n',
          },
          dist: {
            src: files,
            dest: 'dist/JSYG.js'
          },
      }
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
  
    grunt.registerTask('default', ['concat']);

};
