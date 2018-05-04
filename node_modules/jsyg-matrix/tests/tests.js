if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jquery": '../node_modules/jquery/dist/jquery',
            "jsyg-wrapper": '../node_modules/jsyg-wrapper/JSYG-wrapper',
            "jsyg-point": '../node_modules/jsyg-point/JSYG.Point',
            "jsyg-vect": '../node_modules/jsyg-vect/JSYG.Vect',
            "jsyg-matrix": '../JSYG.Matrix'
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-matrix","jsyg-wrapper"],factory);
    else if (typeof JSYG != "undefined") factory(JSYG.Matrix);
    else factory(Matrix);
    
}(function(Matrix) {

    QUnit.start();

    const { module, test } = QUnit

    module("Matrix");

    test("Création d'une matrice", assert => {     

        var mtx = new Matrix();
        
        assert.expect(6);
        assert.equal(mtx.a,1,"a");
        assert.equal(mtx.b,0,"b");
        assert.equal(mtx.c,0,"c");
        assert.equal(mtx.d,1,"d");
        assert.equal(mtx.e,0,"e");
        assert.equal(mtx.f,0,"f");
    });
    
     test("Translation", assert => {     

        var mtx = new Matrix();
        
        mtx = mtx.translate(5,10);
        
        assert.expect(2);
        assert.equal(mtx.e,5,"x");
        assert.equal(mtx.f,10,"y");
    });
    
    test("Scale", assert => {     

        var mtx = new Matrix();
        
        mtx = mtx.scale(2);
        
        assert.expect(2);
        assert.equal(mtx.a,2,"scale x");
        assert.equal(mtx.d,2,"scale y");
    });
    
}));
