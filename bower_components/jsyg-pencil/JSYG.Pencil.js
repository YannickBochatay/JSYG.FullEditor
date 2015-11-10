/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-pencil",["jsyg-path"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Path) factory(JSYG);
        else throw new Error("You need JSYG.Path");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    /**
     * Tracé de chemins SVG à la souris
     * @param arg optionnel, argument JSYG faisant référence à un chemin SVG. Si non défini, un nouveau chemin est créé.
     * Il pourra étre modifié par la méthode setNode.
     * @param opt optionnel, objet définissant les options.
     * @returns {Pencil}
     */
    function Pencil(arg,opt) {
        
        if (!arg) arg = '<path>';
        this.setNode(arg);
        
        if (opt) this.set(opt);
    }
    
    Pencil.prototype = new JSYG.StdConstruct();
    
    Pencil.prototype.constructor = Pencil;
    
    /**
     * Type de segment utilisés pour le tracé ("L","T", etc). La valeur spéciale "autosmooth" permet un lissage
     * automatique sans se soucier des points de controle.
     */
    Pencil.prototype.segment = 'autosmooth';
    /**
     * Type de tracé "freehand" (à main levée) ou "point2point" (ou tout autre valeur) pour tracé point par point.
     */
    Pencil.prototype.type = 'freehand';
    /**
     * Indique si un tracé est en cours ou non
     */
    Pencil.prototype.inProgress = false;
    /**
     * Pour le tracé à main levée, indique le nombre d'évènement "mousemove" à ignorer entre chaque point
     * (sinon on aurait trop de points)
     */
    //Pencil.prototype.skip = 4;
    /**
     * Pour le tracé à main levée, indique la tolérance (en pixels) pour la simplification de la courbe
     * @link http://mourner.github.io/simplify-js/
     */
    Pencil.prototype.simplify = 1;
    /**
     * Indique la force de l'aimantation en pixels écran des points extremes entre eux.
     * La valeur null permet d'annuler l'aimantation
     */
    Pencil.prototype.strengthClosingMagnet = 5;
    /**
     * Ferme systématiquement ou non le chemin (segment Z)
     */
    Pencil.prototype.closePath = false;
    /**
     * fonction(s) à éxécuter pendant le tracé
     */
    Pencil.prototype.ondraw = false;
    /**
     * fonction(s) à éxécuter avant la fin du tracé
     */
    Pencil.prototype.onbeforeend = false;
    /**
     * fonction(s) à éxécuter à la fin du tracé
     */
    Pencil.prototype.onend = false;
    /**
     * fonction(s) à éxécuter avant un nouveau point (type "point2point" uniquement)
     */
    Pencil.prototype.onbeforenewseg = false;
    /**
     * fonction(s) à éxécuter à la création d'un nouveau point
     */
    Pencil.prototype.onnewseg = false;
    /**
     * définition du chemin svg lié au pinceau.
     */
    Pencil.prototype.setNode = function(arg) {
        this.node = new JSYG(arg)[0];
        return this;
    };
    /**
     * Attache le chemin svg au parent précisé.
     * @param arg argument JSYG parent.
     * @returns {Pencil}
     */
    Pencil.prototype.appendTo = function(arg) {
        new JSYG(this.node).appendTo(arg);
        return this;
    };
    
    /**
     * Commence le tracé point à point.
     * @param e objet JSYG.Event
     * @returns {Pencil}
     */
    Pencil.prototype.drawPoint2Point = function(e) {
        
        if (!this.node.parentNode) throw new Error("Il faut attacher l'objet path à l'arbre DOM");
        
        var path = new JSYG.Path(this.node),
        jSvg = path.offsetParent('farthest'),
        autoSmooth = this.segment.toLowerCase() === 'autosmooth',
        segment = autoSmooth ? 'L' : this.segment,
        mtx = path.getMtx('screen').inverse(),
        xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
        that = this;
        
        function mousemove(e) {
            
            var mtx = path.getMtx('screen').inverse(),
            xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
            nbSegs = path.nbSegs(),
            seg = path.getSeg(nbSegs-1),
            pos,first,ref;
            
            if (that.strengthClosingMagnet!=null) {
                
                first = path.getSeg(0);
                ref = new JSYG.Vect(first.x,first.y).mtx(mtx.inverse());
                pos = new JSYG.Vect(e.clientX,e.clientY);
                
                if (JSYG.distance(ref,pos) < that.strengthClosingMagnet) {
                    xy.x = first.x;
                    xy.y = first.y;
                }
            }
            
            seg.x = xy.x;
            seg.y = xy.y;
            
            path.replaceSeg(nbSegs-1,seg);
            
            if (autoSmooth) path.autoSmooth(nbSegs-1);
            
            that.trigger('draw',that.node,e);
        }
        
        function mousedown(e) {
            
            if (that.trigger('beforenewseg',that.node,e) === false) return;
            
            //si la courbe est fermée, un clic suffit pour terminer.
            if (path.nbSegs() > 3 && path.isClosed()) return dblclick(e,true);
            
            if (e.detail === 2) return; //pas d'action au double-clic
            
            var mtx = path.getMtx('screen').inverse(),
            xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
            
            path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
            
            if (autoSmooth) path.autoSmooth(path.nbSegs()-1);
            
            that.trigger('newseg',that.node,e);
        }
        
        function dblclick(e,keepLastSeg) {
            
            if (keepLastSeg!==true) path.removeSeg(path.nbSegs()-1);
            
            if (that.trigger('beforeend',that.node,e) === false) return;
            
            that.end();
            
            that.trigger('end',that.node,e);
        }
        
        this.end = function() {
            
            var first;
            
            if (that.closePath && !path.isClosed()) {
                first = path.getSeg(0);
                path.addSeg(segment,first.x,first.y,first.x,first.y,first.x,first.y);
            }
            
            if (autoSmooth) path.autoSmooth(path.nbSegs()-1);
            
            jSvg.off({
                'mousemove':mousemove,
                'mousedown':mousedown,
                'dblclick':dblclick
            });
            
            that.inProgress = false;
            
            that.end = function() { return this; };
        };
        
        if (path.nbSegs() === 0) path.addSeg('M',xy.x,xy.y);
        
        that.inProgress = true;
        
        jSvg.on({
            'mousemove':mousemove,
            'mousedown':mousedown,
            'dblclick':dblclick
        });		
        
        mousedown(e);
        mousemove(e);
        
        return this;
    };
    
    /**
     * Commence le tracé à main levée.
     * @param e objet Event (évènement mousedown).
     * @returns {Pencil}
     */
    Pencil.prototype.drawFreeHand = function(e) {
        
        if (!this.node.parentNode) throw new Error("Il faut attacher l'objet path à l'arbre DOM");
        
        var path = new JSYG.Path(this.node),
        autoSmooth = this.segment.toLowerCase() === 'autosmooth',
        segment = autoSmooth ? 'L' : this.segment,
        jSvg = path.offsetParent('farthest'),
        mtx = path.getMtx('screen').inverse(),
        //cpt = 1,
        xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
        that = this;
        
        function mousemove(e) {
            
            var xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
            
            //if (!that.skip || cpt % (that.skip+1) === 0)  {
            path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
            that.trigger('newseg',that.node,e);
            //}
            //cpt++;
            that.trigger('draw',that.node,e);
        }
        
        function mouseup(e) {
            that.end();
            that.trigger('end',that.node,e);
        }
        
        this.end = function() {
            
            var nbSegs = path.nbSegs(),
            last = path.getLastSeg(),
            first = path.getSeg(0);
            
            jSvg.off('mousemove',mousemove);
            
            new JSYG(document).off('mouseup',mouseup);
            
            if (that.strengthClosingMagnet!=null) {
                
                if (JSYG.distance(first,last) < that.strengthClosingMagnet) {
                    last.x = first.x;
                    last.y = first.y;
                }
                path.replaceSeg(nbSegs-1,last);
            }
            
            if (this.closePath && !path.isClosed()) {
                path.addSeg(segment,first.x,first.y,first.x,first.y,first.x,first.y);
            }
            
            if (this.simplify) path.simplify(this.simplify);
            
            if (autoSmooth) path.autoSmooth();
            
            that.inProgress = false;
            
            that.end = function() { return this; };
        };
        
        jSvg.on('mousemove',mousemove);
        new JSYG(document).on('mouseup',mouseup);
        
        e.preventDefault();
        
        path.clear();
        path.addSeg('M',xy.x,xy.y);
        
        this.inProgress = true;
        
        return this;
    };
    
    /**
     * Commence le tracé selon le type défini ("freehand" ou "point2point") 
     * @param e objet JSYG.Event (évènement mousedown).
     * @returns
     */
    Pencil.prototype.draw = function(e) {
        
        if (this.type.toLowerCase() === 'freehand') this.drawFreeHand(e);
        else this.drawPoint2Point(e);
        
        return this;
    };
    
    /**
     * Termine le tracé.
     * @returns {Pencil}
     */
    Pencil.prototype.end = function() { return this; };
    
    JSYG.Pencil = Pencil;
    
    return Pencil;
    
});