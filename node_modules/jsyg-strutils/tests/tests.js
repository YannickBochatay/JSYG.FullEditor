if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-strutils": '../JSYG-strutils',
            "jquery":"../node_modules/jquery/dist/jquery",
            "jsyg-wrapper":"../node_modules/jsyg-wrapper/JSYG-wrapper"
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-wrapper","jsyg-strutils"],factory);
    else if (typeof JSYG !== "undefined") factory(JSYG,JSYG);
    
}(function(JSYG,strUtils) {

    QUnit.start()

    const { module, test } = QUnit

    module("strUtils");

    test("fonctions diverses", assert => {
        
        assert.expect(2);
        
        assert.equal( strUtils.camelize("toto_tata_titi"), "totoTataTiti" ,"camelize");
        assert.equal( strUtils.dasherize("totoTataTiti"), "toto-tata-titi" ,"dasherize");
    });
    
}));
