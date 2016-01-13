/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-pathdrawer",["jsyg-path"],factory);
    else if (typeof JSYG != "undefined") {
        if (JSYG.Path) factory(JSYG);
        else throw new Error("You need JSYG.Path");
    }
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    /**
     * Tracé de chemins SVG à la souris
     * @param opt optionnel, objet définissant les options.
     * @returns {PathDrawer}
     */
    function PathDrawer(opt) {
        
        if (opt) this.set(opt);
    }
    
    PathDrawer.prototype = new JSYG.StdConstruct();
    
    PathDrawer.prototype.constructor = PathDrawer;
    
    /**
     * zone sur laquelle on affecte les écouteurs d'évènements (si null, prend le parent svg le plus éloigné)
     */
    PathDrawer.prototype.area = null;
    /**
     * Type de segment utilisés pour le tracé ("L","T", etc). La valeur spéciale "autosmooth" permet un lissage
     * automatique sans se soucier des points de controle.
     */
    PathDrawer.prototype.segment = 'autosmooth';
    /**
     * Type de tracé "freehand" (à main levée) ou "point2point" (ou tout autre valeur) pour tracé point par point.
     */
    PathDrawer.prototype.type = 'freehand';
    /**
     * Indique si un tracé est en cours ou non
     */
    PathDrawer.prototype.inProgress = false;
    /**
     * Pour le tracé à main levée, indique le nombre d'évènement "mousemove" à ignorer entre chaque point
     * (sinon on aurait trop de points)
     */
    //PathDrawer.prototype.skip = 4;
    /**
     * Pour le tracé à main levée, indique la tolérance (en pixels) pour la simplification de la courbe
     * @link http://mourner.github.io/simplify-js/
     */
    PathDrawer.prototype.simplify = 1;
    /**
     * Indique la force de l'aimantation en pixels écran des points extremes entre eux.
     * La valeur null permet d'annuler l'aimantation
     */
    PathDrawer.prototype.strengthClosingMagnet = 5;
    /**
     * Ferme systématiquement ou non le chemin (segment Z)
     */
    PathDrawer.prototype.closePath = false;
    /**
     * fonction(s) à éxécuter pendant le tracé
     */
    PathDrawer.prototype.ondraw = false;
    /**
     * fonction(s) à éxécuter avant la fin du tracé
     */
    PathDrawer.prototype.onbeforeend = false;
    /**
     * fonction(s) à éxécuter à la fin du tracé
     */
    PathDrawer.prototype.onend = false;
    /**
     * fonction(s) à éxécuter avant un nouveau point (type "point2point" uniquement)
     */
    PathDrawer.prototype.onbeforenewseg = false;
    /**
     * fonction(s) à éxécuter à la création d'un nouveau point
     */
    PathDrawer.prototype.onnewseg = false;
    
    /**
     * Commence le tracé point à point.
     * @param e objet JSYG.Event
     * @returns {PathDrawer}
     */
    PathDrawer.prototype.drawPoint2Point = function(path,e) {
        
        path = new JSYG.Path(path);
        
        if (!path.parent().length) throw new Error("Il faut attacher l'objet path à l'arbre DOM");
        
        var node = path[0],
        jSvg = this.area ? new JSYG(this.area) : path.offsetParent('farthest'),
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
            
            that.trigger('draw',node,e);
        }
        
        function mousedown(e) {
            
            if (that.trigger('beforenewseg',node,e) === false) return;
            
            //si la courbe est fermée, un clic suffit pour terminer.
            if (path.nbSegs() > 3 && path.isClosed()) {
                
                if (that.trigger('beforeend',node,e) === false) return;
                return that.end();
            }
            
            if (e.detail === 2) return; //pas d'action au double-clic
            
            var mtx = path.getMtx('screen').inverse(),
            xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
            
            path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
            
            if (autoSmooth) path.autoSmooth(path.nbSegs()-1);
            
            that.trigger('newseg',node,e);
        }
        
        function dblclick(e,keepLastSeg) {
            
            path.removeSeg(path.nbSegs()-1);
            
            if (that.trigger('beforeend',node,e) === false) return;
            
            //path.removeSeg(path.nbSegs()-1);
            
            that.end();
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
            
            that.trigger('end',node,e);
            
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
        
        return this;
    };
    
    /**
     * Commence le tracé à main levée.
     * @param e objet Event (évènement mousedown).
     * @returns {PathDrawer}
     */
    PathDrawer.prototype.drawFreeHand = function(path,e) {
        
        path = new JSYG.Path(path);
        
        if (!path.parent().length) throw new Error("Il faut attacher l'objet path à l'arbre DOM");
        
        var node = path[0],
        autoSmooth = this.segment.toLowerCase() === 'autosmooth',
        segment = autoSmooth ? 'L' : this.segment,
        jSvg = this.area ? new JSYG(this.area) : path.offsetParent('farthest'),
        mtx = path.getMtx('screen').inverse(),
        xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx),
        that = this;
        
        function mousemove(e) {
            
            var xy = new JSYG.Vect(e.clientX,e.clientY).mtx(mtx);
            
            path.addSeg(segment,xy.x,xy.y,xy.x,xy.y,xy.x,xy.y);
            that.trigger('newseg',node,e);
            
            that.trigger('draw',node,e);
        }
        
        function mouseup(e) {
            that.end();
            that.trigger('end',node,e);
        }
        
        this.end = function() {
            
            var nbSegs = path.nbSegs(),
            last,first;
            
            if (nbSegs == 1) path.remove();
            else {
                
                last = path.getLastSeg();
                first = path.getSeg(0);
                
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
            }
            
            that.inProgress = false;
            
            jSvg.off('mousemove',mousemove);
            
            new JSYG(document).off('mouseup',mouseup);
                        
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
    PathDrawer.prototype.draw = function(path,e) {
        
        if (this.type.toLowerCase() === 'freehand') this.drawFreeHand(path,e);
        else this.drawPoint2Point(path,e);
        
        return this;
    };
    
    /**
     * Termine le tracé.
     * @returns {PathDrawer}
     */
    PathDrawer.prototype.end = function() { return this; };
    
    JSYG.PathDrawer = PathDrawer;
    
    return PathDrawer;
    
});