if (typeof require!= "undefined") {
    
    require.config({
        paths: {
            "jsyg-point": '../JSYG.Point'
        },
        urlArgs: "bust=" + new Date()
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-point"],factory);
    else factory(Point);
    
}(function(Point) {

    QUnit.start()

    const { module, test } = QUnit

    module("JSYG.Point");

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');

    test("Création d'un point", assert => {

        var point = new Point(5,10);

        assert.expect(2);
        assert.equal(point.x,5,"abcisse");
        assert.equal(point.y,10,"ordonnée");
    });

    test("Translation d'un point", assert => {

        var point = new Point(5,10);
        var mtx = svg.createSVGMatrix();

        mtx.e = 5;
        mtx.f = 10;

        point = point.mtx(mtx);

        assert.expect(2);
        assert.equal(point.x,10,"abcisse");
        assert.equal(point.y,20,"ordonnée");

    });

    test("Echelle d'un point", assert => {

        var point = new Point(5,10);
        var mtx = svg.createSVGMatrix();

        mtx.a = 2;
        mtx.d = 2;

        point = point.mtx(mtx);

        assert.expect(2);
        assert.equal(point.x,10,"abcisse");
        assert.equal(point.y,20,"ordonnée");
    });
    
    
    test("Transformation en chaine", assert => {
        
        var point = new Point(5,10);

        assert.equal(point.toString(), '{"x":5,"y":10}', "Méthode toString" );
        assert.equal(point.toJSON(), '{"x":5,"y":10}', "Méthode toJSON" );
    });
    
}));
