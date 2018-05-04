if (typeof require!= "undefined") {

    require.config({
        paths: {
            "jquery": '../node_modules/jquery/dist/jquery',
            "jsyg-wrapper": '../node_modules/jsyg-wrapper/JSYG-wrapper',
            "jsyg-point" : '../node_modules/jsyg-point/JSYG.Point',
            "jsyg-vect" : '../node_modules/jsyg-vect/JSYG.Vect',
            "jsyg-matrix" : '../node_modules/jsyg-matrix/JSYG.Matrix',
            "jsyg-strutils" : '../node_modules/jsyg-strutils/JSYG-strutils',
            "jsyg-utils" : '../JSYG-utils'
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg-utils"],factory);
    else if (typeof JSYG !== "undefined") factory(JSYG);
    
}(function($) {

    QUnit.start()

    const { module, test } = QUnit
    
    module("jsyg-utils", () => {
    
        test("Dimensions d'un élement", function(assert) {

            var container = $("#qunit-fixture");
            
            var svg = $('<svg width="500" height="500">').appendTo(container);
            var rect = $('<rect>').attr({width:200,height:200,x:50,y:50}).appendTo(svg);
                    
            var dimRect = rect.getDim();
            
            assert.equal(svg.attr("width"),"500","largeur");
            assert.equal(svg.attr("height"),"500","hauteur");
            
            svg.width(400);
            assert.equal(svg.attr("width"),"400px","largeur par l'attribut");
            assert.equal(svg.css("width"),"400px","largeur par css");
            assert.equal(svg.getDim().width,400,"largeur par la méthode getDim");
            
            svg.height(400);
            assert.equal(svg.attr("height"),"400px","hauteur par l'attribut");
            assert.equal(svg.css("height"),"400px","hauteur par css");
            assert.equal(svg.getDim().height,400,"hauteur par la méthode getDim");
            
            
            svg.css("width","550px");
            assert.equal(svg.attr("width"),"550px","largeur par attribut");
            assert.equal(svg.css("width"),"550px","largeur par css");
            assert.equal(svg.getDim().width,550,"largeur par la méthode getDim");
            
            svg.css("height","550px");
            assert.equal(svg.attr("height"),"550px","hauteur par l'attribut");
            assert.equal(svg.css("height"),"550px","hauteur par css");
            assert.equal(svg.getDim().height,550,"hauteur par la méthode getDim");
            
            svg.setDim("width",600);
            assert.equal(svg.attr("width"),"600px","largeur par l'attribut");
            assert.equal(svg.css("width"),"600px","largeur par css");
            assert.equal(svg.getDim().width,600,"largeur par la méthode getDim");
            
            svg.setDim("height",600);
            assert.equal(svg.attr("height"),"600px","hauteur par l'attribut");
            assert.equal(svg.css("height"),"600px","hauteur par css");
            assert.equal(svg.getDim().height,600,"hauteur par la méthode getDim");
            
            assert.equal(svg.parent()[0],container[0],"hierarchie DOM");
            
            assert.ok(svg.isSVG(),"reconnaissance d'un élément SVG");
            assert.ok(rect.isSVG(),"reconnaissance d'un élément SVG");
                    
            assert.equal(dimRect.x,50,"abcisse");
            assert.equal(dimRect.y,50,"ordonnée");
            
            rect.setDim({
                width:20,
                height:30,
                x:0,
                y:0
            });
            
            dimRect = rect.getDim();
            
            assert.equal(dimRect.x,0,"abcisse");
            assert.equal(dimRect.width,20,"ordonnée");
        });
        
        test("ViewBox", function(assert) {

            var container = $("#qunit-fixture");

            var svg = $('<svg width="500" height="400">').appendTo(container);
            
            assert.deepEqual(svg.viewBox(),{x:0,y:0,width:500,height:400},"Récupération de la viewbox");
            
            assert.deepEqual(
                svg.viewBox({x:50,y:50,width:1000,height:80}).viewBox(),
                {x:50,y:50,width:1000,height:80},
                "Modification de la viewbox"
            );
            
        });
        
        test("strutils", function(assert) {
        
            assert.ok( $.urlencode(" "), "%20", "Encodage d'url" );        
        });
    })

}));
