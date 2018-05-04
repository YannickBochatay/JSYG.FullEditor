if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-point": '../node_modules/jsyg-point/JSYG.Point',
            "jsyg-vect": '../JSYG.Vect'
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-vect"],factory);
    else factory(Vect);
    
}(function(Vect) {

    QUnit.start()

    const { module, test } = QUnit

    module("Vect");
    
    test("Création d'un vecteur", assert => {
        
        var vect = new Vect(2,5);

        assert.expect(2);
        assert.ok(vect instanceof Vect,"instance de Vect");
        assert.ok(vect instanceof Vect.prototype.constructor,"instance de Point");
    });
    
    test("Longueur d'un vecteur", assert => {
        
        var vect = new Vect(5,5);

        assert.expect(1);
        
        assert.equal( Math.round(vect.length()) , 7 ,"longueur de vect");
    });
    
}));
