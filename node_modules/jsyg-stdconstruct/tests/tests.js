if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-stdconstruct": '../JSYG.StdConstruct',
            "jquery":"../node_modules/jquery/dist/jquery",
            "jsyg-events":"../node_modules/jsyg-events/JSYG.Events"
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-stdconstruct"],factory);
    else factory(StdConstruct);
    
}(function(StdConstruct) {

    QUnit.start()

    const { module, test } = QUnit

    module("StdConstruct");

    test("Gestion des fonction standard", assert => {     
        
        var obj = new StdConstruct();
        
        obj.enable();
        
        assert.expect(2);
        
        assert.equal(obj.enabled, true, "activation du plugin");
        
        assert.equal(typeof obj.on, "function", "héritage de Events");
    });
    
}));
