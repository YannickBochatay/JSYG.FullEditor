if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-draggable": '../JSYG.Draggable',
            "jquery":"../node_modules/jquery/dist/jquery",
            "jsyg":"../node_modules/jsyg/dist/JSYG"
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-draggable"],factory);
    else factory(JSYG.Draggable);
    
}(function(Draggable) {

    QUnit.start();

    const { module, test } = QUnit

    module("draggable");

    test("Constructeur", assert => {
        
        var drag = new Draggable();

        assert.expect(1);
        
        assert.equal(drag.type,"attributes","abcisse");
    });
    
}));
