/*jshint forin:false, eqnull:true*/
/* globals JSYG,define*/

(function(root,factory) {
    
    if (typeof define == 'function' && define.amd) {
        if (root.fetch) define("jsyg-fetch",factory(root));
        else define("jsyg-fetch",["fetch"],factory(root));
    }
    else if (root.fetch) factory(root);
    else throw new Error("fetch polyfill is needed");
    
})(this,function(root) {
    
    "use strict";
    
    if (typeof root.fetch == "undefined") throw new Error();
    
    function checkStatus(response) {
        
        var s = response.status;
        
        if (s >= 200 && s < 300 || s === 304 || s === 0 /*file protocol*/) return response;
        
        var error = new Error(response.statusText);
        
        error.response = response;
        
        throw error;
    }
    
    function jfetch() {
     
        return root.fetch.apply(root,arguments).then(checkStatus);
    }
                        
    if (typeof JSYG != "undefined") JSYG.fetch = jfetch;
    
    return jfetch;
    
});
