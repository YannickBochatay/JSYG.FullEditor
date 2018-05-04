if (typeof require!= "undefined") {
  
    var rep = "../node_modules";
    
    require.config({
        paths: {
            "jsyg" : '../dist/JSYG',
            "jquery" : rep+"/jquery/dist/jquery"
        },
        urlArgs: "bust=" + (+new Date())
    });
}

QUnit.config.autostart = false;

(function(factory) {
    
    if (typeof define == 'function' && define.amd) require(["jsyg"],factory);
    else factory(JSYG);
    
}(function(JSYG) {

    QUnit.start()

    const { module, test } = QUnit

    module("JSYG");

    test("Core", assert => {     

        var rect = new JSYG("<rect>");
        
        assert.expect(2);
        
        assert.equal(rect.length,1,"création d'un élément SVG");
        assert.equal(rect.isSVG(),true,"vérification de l'espace de nom");
    });
    
    test("Création d'un point", assert => {

        var point = new JSYG.Point(5,10);

        assert.expect(2);
        assert.equal(point.x,5,"abcisse");
        assert.equal(point.y,10,"ordonnée");
    });
    
    test("Création d'un vecteur", assert => {
        
        var vect = new JSYG.Vect(2,5);

        assert.expect(2);
        assert.ok(vect instanceof JSYG.Vect,"instance de Vect");
        assert.ok(vect instanceof JSYG.Vect.prototype.constructor,"instance de Point");
    });
    
     test("Création d'une matrice", assert => {     

        var mtx = new JSYG.Matrix();
        
        assert.expect(6);
        assert.equal(mtx.a,1,"a");
        assert.equal(mtx.b,0,"b");
        assert.equal(mtx.c,0,"c");
        assert.equal(mtx.d,1,"d");
        assert.equal(mtx.e,0,"e");
        assert.equal(mtx.f,0,"f");
    });
    
    test("Dimensions d'un élement", assert => {

        var container = JSYG("#qunit-fixture");
        
        var svg = JSYG('<svg width="500" height="400">').appendTo(container);
        var rect = JSYG('<rect>').attr({width:200,height:200,x:50,y:50}).appendTo(svg);
                
        var dimRect = rect.getDim();

        assert.expect(9);
        
        assert.equal(svg.attr("width"),"500","largeur");
        assert.equal(svg.attr("height"),"400","hauteur");
        
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
    
    test("Manipulation des événements", assert => {     
        
        var cpt = 0;
        
        var events = new JSYG.Events();
        
        function incremente() { cpt++; }
        
        events.ontest = null;
        
        assert.expect(3);
        
        events.on("test",incremente);
        events.trigger("test");
        assert.equal(cpt,1,"Déclenchement de l'événement");
        
        events.on("test",incremente);
        events.trigger("test");
        assert.equal(cpt,2,"Non prise en compte des doublons");
        
        events.off("test",incremente);
        events.trigger("test");
        assert.equal(cpt,2,"Suppression d'un événement");
        
    });
    
    test("Gestion des fonction standard", assert => {     
        
        var obj = new JSYG.StdConstruct();
        
        obj.enable();
        
        assert.expect(2);
        
        assert.equal(obj.enabled, true, "activation du plugin");
        
        assert.equal(typeof obj.on, "function", "héritage de Events");
    });
    
     test("fonctions diverses sur les chaines", assert => {
        
        assert.expect(2);
        
        assert.equal( JSYG.camelize("toto_tata_titi"), "totoTataTiti" ,"camelize");
        assert.equal( JSYG.dasherize("totoTataTiti"), "toto-tata-titi" ,"camelize");
    });
        
}));
