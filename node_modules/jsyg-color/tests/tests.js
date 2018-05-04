if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-color": '../JSYG.Color'
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-color"],factory);
    else factory(Color);
    
}(function(Color) {

    QUnit.start()

    const { module, test } = QUnit

    module("color");

    test("Manipulation d'une couleur", assert => {     
        
        var color = new Color({r:0,g:0,b:255});

        assert.expect(1);
        
        assert.equal( color.toHEX(), "0000ff" ,"hexa");
        
    });
    
}));
