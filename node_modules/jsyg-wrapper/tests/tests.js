require.config({
    paths: {
        "jquery": '../node_modules/jquery/dist/jquery',
        "jsyg-wrapper": '../JSYG-wrapper'
    },
    urlArgs: "bust=" + new Date()
});

QUnit.config.autostart = false

require(["jquery","jsyg-wrapper"],function($,JSYG) {

    QUnit.start()

    const { test, module } = QUnit
		
    module("JSYG core", () => {
	
        const div = new JSYG('<div>')
        const svg = new JSYG('<svg>')
            
        test("Création d'éléments", assert => {
            
            assert.expect(2)
            assert.ok( !div.isSVG() && div.length , "Element HTML" )
            assert.ok( svg.isSVG() && svg.length , "Element SVG" )

        });
        
        test("Création d'éléments avec innerHTML", assert => {
            
            const div = new JSYG("<div><span>TOTO</span></div>")
            const divSvg = new JSYG("<svg width='400' height='500'><rect width='30' height='40'/></svg>")
            
            assert.equal(div.find('span').text(), "TOTO","Elements HTML")
            assert.equal(divSvg.find('rect').attr("width"), "30","Elements SVG")
        });
        
        test("Sélection d'éléments", assert => {

            const container = new JSYG("#qunit-fixture")
            
            assert.equal( container[0].tagName , "DIV", "DIV" )
            
            container.append(div[0])
        
            assert.equal( container[0].tagName , "DIV", "DIV" )
            
            svg.appendTo(div[0])
            
            assert.equal( container[0].tagName , "DIV", "DIV" )
            
            assert.ok( container.find("div").length , "Elements HTML" )
            
            assert.equal( container[0].tagName , "DIV", "DIV" )
            
            assert.ok( container.find("svg").length , "Elements SVG" )
            
            assert.equal( container[0].tagName , "DIV", "DIV" )
        });
        
        test("Manipulation du css", assert => {
            
            const color = "rgb(255, 0, 0)";
            
            div.css("background-color",color);
            
            const rect = new JSYG('<rect>').attr({width:50,height:50,fill:color}).appendTo(svg[0]);
            
            rect[0].style.stroke = color;
            rect[0].style.opacity = 0.5;
                                            
            assert.equal( div.css("background-color"), color , "Elements HTML" );
            
            assert.equal( rect.css("fill"), color , "Elements SVG" );
            
            assert.equal( rect.css("stroke"), color , "Elements SVG" );
            assert.equal( rect.css("opacity"), "0.5" , "Elements SVG" );
        });
        
        test("Gestion des classes", assert => {
            
            div.addClass("red strokeRed");
            
            const rect = new JSYG('<rect>').attr({width:50,height:50}).appendTo(svg[0]);
            rect.addClass("red strokeRed");
            
            assert.ok( div.hasClass("red"), "addClass et hasClass sur élements HTML");
            assert.ok( rect.hasClass("strokeRed"), "addClass et hasClass sur élements SVG");
            
            assert.ok( div.hasClass("red"), "addClass et hasClass sur élements HTML");
            assert.ok( rect.hasClass("strokeRed"), "addClass et hasClass sur élements SVG");
            
            div.removeClass("red");
            rect.removeClass("strokeRed");
            
            assert.ok( div.hasClass("strokeRed") , "removeClass et hasClass sur élements HTML");
            assert.ok( !rect.hasClass("strokeRed") && rect.hasClass("red"), "removeClass et hasClass sur élements SVG");
            
            div.addClass(function(j) { return "red strokeRed"+j; });
            rect.addClass(function(j) { return "red strokeRed"+j; });
            
            assert.ok( div.hasClass("strokeRed0"), "addClass avec fonction en argument sur élements HTML");
            assert.ok( rect.hasClass("strokeRed0"), "addClass avec fonction en argument sur élements SVG");
            
            div.toggleClass("strokeRed0");
            rect.toggleClass("strokeRed0");
            
            assert.ok( !div.hasClass("strokeRed0"), "toggleClass sur élements HTML");
            assert.ok( !rect.hasClass("strokeRed0"), "toggleClass sur élements SVG");
            
            div.toggleClass("red");
            rect.toggleClass("red");
                    
        });
        
        
        test("Gestion des attributs et liens", assert => {
            
            const a = new JSYG('<a>'),
            aSVG = new JSYG('<svg:a>'),
            url = "http://ybochatay.fr/";
            
            a.attr("href",url);
            aSVG.attr("href",url);
            
            assert.equal( a.attr("href") , url, "Attribut href sur éléments HTML" );
            assert.equal( aSVG.attr("href") , url, "Attribut href sur éléments SVG" );
            
            a.removeAttr("href");
            aSVG.removeAttr("href");
            
            assert.equal( a.attr("href"), "", "retrait de l'attribut href sur éléments HTML" );
            assert.equal( aSVG.attr("href"), "", "retrait de l'attribut href sur éléments SVG" );
            
            a.attr({href:url});
            aSVG.attr({href:url});
            
            assert.equal( a.attr("href") , url, "Attributs sous forme d'objet sur éléments HTML" );
            assert.equal( aSVG.attr("href") , url, "Attribut sous forme d'objet sur éléments SVG" );
            
            a.attr("href",function(i) { return url; });
            aSVG.attr("href",function(i) { return url; });
            
            assert.equal( a.attr("href") , url, "Attributs sous forme de fonction sur éléments HTML" );
            assert.equal( aSVG.attr("href") , url, "Attribut sous forme de fonction sur éléments SVG" );
                    
                    
            svg.attr("viewBox","50 50 100 100");
                    
            assert.equal( svg.attr("viewBox") , "50 50 100 100", "Attributs sensibles à la casse" );
            assert.equal( svg.attr("viewbox") , null, "Attributs sensibles à la casse" );
            assert.equal( svg[0].getAttribute("viewBox") , "50 50 100 100", "Attributs sensibles à la casse" );
            assert.equal( typeof svg[0].viewBox , "object", "Modification de la viewBox" );
                    
        });
        
        test("Traversing", assert => {

            const container = new JSYG("#qunit-fixture")
            
            const a = new JSYG('<a>').appendTo(container[0]);
            const b = $('<a>').appendTo(container[0]);
            
            assert.equal( container[0].tagName , "DIV", "DIV" );
            assert.equal( a.parent()[0].tagName , container[0].tagName, "Parent d'élément HTML" );
            
            assert.equal( container[0].tagName , "DIV", "DIV" );
            assert.equal( a[0].tagName , "A", "Parent d'élément HTML" );
            
            assert.equal( container[0].tagName , "DIV", "DIV" );
            assert.equal( b.parent()[0].tagName , container[0].tagName, "Parent d'élément HTML" );
            
            assert.equal( container[0].tagName , "DIV", "DIV" );
            assert.equal( b[0].tagName , "A", "Parent d'élément HTML" );
            
        });
        
        test("Dimensions", assert => {

            const container = new JSYG("#qunit-fixture")
            
            const svg = new JSYG('<svg>')
                .css({
                    "position":"absolute",
                    "top":50,
                    "left":50,
                    "width":500,
                    "height":500
                })
                .appendTo(container);
            
            const rect = new JSYG('<rect>')
                .attr({
                    width:100,
                    height:100,
                    x:50,
                    y:50
                })
                .appendTo('svg');
            
            const ellipse = new JSYG('<ellipse>')
                .attr({
                    cx:100,
                    cy:100,
                    rx:50,
                    ry:50
                })
                .appendTo('svg');
            
            const line = new JSYG('<line>')
                .attr({
                    x1:100,
                    y1:50,
                    x2:200,
                    y2:100
                })
                .appendTo('svg');
            
            const div = new JSYG('<div>')
                .css({
                    position:"absolute",
                    top:50,
                    left:50,
                    width:100,
                    height:150
                })
                .appendTo(container);
            
            assert.equal( svg.width(), 500, "Taille des balises SVG inline dans la page" );
            assert.equal( svg.height(), 500, "Taille des balises SVG inline dans la page" );
            
            assert.equal( ellipse.width() , 100, "Taille des éléments SVG" );
            assert.equal( ellipse.height() , 100, "Taille des éléments SVG" );
            
            assert.equal( line.width() , 100, "Taille des éléments SVG" );
            assert.equal( line.height() , 50, "Taille des éléments SVG" );
            
            assert.equal( rect.width() , 100, "Taille des éléments SVG" );
            assert.equal( rect.height() , 100, "Taille des éléments SVG" );
            
            assert.equal( div.width() , 100, "Taille des éléments HTML" );
            assert.equal( div.height() , 150, "Taille des éléments HTML" );
            
            rect.width(200).height(200);
            
            assert.equal( rect.width() , 200, "Taille des éléments SVG" );
            assert.equal( rect.height() , 200, "Taille des éléments SVG" );
                    
            rect.css("width","50%");
            assert.equal( rect.css("width") , "250px", "Conversion en pixels de dimensions en pourcentage" );
            
        });
            
        test("Gestion du positionnement", assert => {

            const container = new JSYG("<div>")
                .css("position","relative")
                .appendTo("#qunit-fixture")

                        
            const svg = new JSYG('<svg>')
                .css({
                    "position":"absolute",
                    "top":50,
                    "left":50,
                    "width":500,
                    "height":500
                })
                .appendTo(container);
            
            const rect = new JSYG('<rect>')
                .attr({
                    width:100,
                    height:100,
                    x:50,
                    y:50
                })
                .appendTo('svg');
            
            const div = new JSYG('<div>')
                .css({
                    position:"absolute",
                    top:50,
                    left:50
                })
                .appendTo(container);
            
            const offsetParent = container.offset();
                        
            assert.equal( Math.round(svg.offset().top) , Math.round(offsetParent.top+50) , "Position des balises SVG inline dans la page" );
            assert.equal( Math.round(svg.offset().left) , Math.round(offsetParent.left+50) , "Position des balises SVG inline dans la page" );
            
            assert.equal( Math.round(rect.offset().top) , Math.round(offsetParent.top+100) , "Position des balises SVG inline dans la page" );
            assert.equal( Math.round(rect.offset().left) , Math.round(offsetParent.left+100) , "Position des balises SVG inline dans la page" );
            
            assert.equal( Math.round(div.offset().top) , Math.round(offsetParent.top+50) , "Position des balises SVG inline dans la page" );
            assert.equal( Math.round(div.offset().left) , Math.round(offsetParent.left+50) , "Position des balises SVG inline dans la page" );
        });
 
    });	
	
});
