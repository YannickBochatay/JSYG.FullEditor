/*jshint forin:false, eqnull:true*/
/* globals JSYG*/

(function(factory) {
    
    if (typeof define != "undefined" && define.amd) define("jsyg-path",["jsyg"],factory);
    else if (typeof JSYG != "undefined") factory(JSYG);
    else throw new Error("JSYG is needed");
    
})(function(JSYG) {
    
    "use strict";
    
    (function() {
        
        var path = new JSYG('<path>').attr('d','M0,0 L10,10')[0];
	
        JSYG.support.needReplaceSeg = (function() {
            
            var seg = path.pathSegList.getItem(1);
            seg.x = 20;
            
            return path.pathSegList.getItem(1).x !== 20;
            
        })();
        
        JSYG.support.needCloneSeg = (function() {
            
            var path2 = new JSYG('<path>').attr('d','M0,0 L10,10')[0];
            var seg = path.pathSegList.getItem(1);
            
            path2.pathSegList.appendItem(seg);
            
            return path.pathSegList.numberOfItems === 1;
            
        })();
        
    }());
    
    function distance(pt1,pt2) {
    	return Math.sqrt( Math.pow(pt1.x-pt2.x,2) + Math.pow(pt1.y-pt2.y,2) );
    }
    
    /**
     * Chemins SVG
     * @param arg optionnel, argument JSYG faisant référence à un chemin svg (balise &lt;path&gt;). Si non défini, un nouvel élément sera créé.
     * @returns {Path}
     */
    function Path(arg) {
        
        if (!(this instanceof Path)) return new Path(arg);
        
        if (!arg) arg = '<path>';
        
        JSYG.call(this,arg);
    }
    
    Path.prototype = new JSYG();
    
    Path.prototype.constructor = Path;
    
    /**
     * Renvoie la longueur totale du chemin
     * @returns {Number}
     */
    Path.prototype.getLength = function() {
        return this[0].getTotalLength();
    };
    
    /**
     * Clone le chemin
     * @returns {Path}
     */
    Path.prototype.clone = function() {
        return new Path(new JSYG(this[0]).clone());
    };
    
    /**
     * Crée un objet segment.
     * Le premier argument est la lettre correspondant au segment, les arguments suivants sont les mêmes que les méthodes natives décrites dans la <a href="http://www.w3.org/TR/SVG/paths.html#InterfaceSVGPathElement">norme SVG</a>
     * @param type {String} lettre correspondant au segment ('M','L','C','Z', etc)
     * @returns {SVGPathSeg}
     * @link http://www.w3.org/TR/SVG/paths.html#DOMInterfaces
     * @example <pre>var path = new Path();
     * var seg = path.createSeg('M',0,0);
     * var seg2 = path.createSeg('L',50,50);
     * var seg3 = path.createSeg('C',50,50,30,10,10,30);
     */
    Path.prototype.createSeg = function(type) {
        
        var method = 'createSVGPathSeg',
        args = Array.prototype.slice.call(arguments,1),
        low = type.toLowerCase();
        
        switch (low) {
            case 'z' : method+='ClosePath'; break;
            case 'm' : method+='Moveto'; break;
            case 'l' : method+='Lineto'; break;
            case 'c' : method+='CurvetoCubic'; break;
            case 'q' : method+='CurvetoQuadratic'; break;
            case 'a' : method+='Arc'; break;
            case 'h' : method+='LinetoHorizontal'; break;
            case 'v' : method+='LinetoVertical'; break;
            case 's' : method+='CurvetoCubicSmooth'; break;
            case 't' : method+='CurvetoQuadraticSmooth'; break;
            default : throw type+' is not a correct letter for drawing paths !';
        }
        
        if (low !== 'z') method+= (low === type) ? 'Rel' : 'Abs';
        
        return this[0][method].apply(this[0],args);
    };
    /**
     * Clone un segment
     * @param seg segment ou indice du segment à cloner.
     * @returns {SVGPathSeg}
     */
    Path.prototype.cloneSeg  = function(seg) {
        
        if (typeof seg == 'number') seg = this.getSeg(seg);
        
        var letter = seg.pathSegTypeAsLetter,
        args = [letter];
	
        letter = letter.toLowerCase();
        
        if (letter === 'h') args.push(seg.x);
        else if (letter === 'v') args.push(seg.y);
        else {
            
            args.push(seg.x,seg.y);
            
            switch (letter) {
                case 'c' : args.push(seg.x1,seg.y1,seg.x2,seg.y2); break;
                case 'q' : args.push(seg.x1,seg.y1); break;
                case 'a' : args.push(seg.r1,seg.r2,seg.angle,seg.largeArcFlag,seg.sweepFlag); break;
                case 's' : args.push(seg.x2,seg.y2); break;
            }
        }
	
        return this.createSeg.apply(this,args);
    };
    /**
     * Ajoute un segment à la liste
     * @returns {Path}
     * @example <pre>var path = new Path();
     * path.addSeg('M',0,0);
     * path.addSeg('C',50,50,10,30,30,10);
     * 
     * // éuivalent à
     * var seg = path.createSeg('M',0,0);
     * path.appendSeg(seg);
     * 
     * seg = path.createSeg('C',50,50,10,30,30,10);
     * path.appendSeg(seg);
     */
    Path.prototype.addSeg = function() {
        this.appendSeg(this.createSeg.apply(this,arguments));
        return this;
    };
    
    /**
     * Réinitialise la liste des segments
     * @returns {Path}
     */
    Path.prototype.clear = function() {
        this[0].pathSegList.clear();
        return this;
    };
    
    /**
     * récupère un segment
     * @param i indice du segment
     * @returns {SVGPathSeg}
     */
    Path.prototype.getSeg = function(i) {
        return this[0].pathSegList.getItem(i);
    };
    
    /**
     * récupère la liste des segments sous forme de tableau
     * @returns {Array}
     */
    Path.prototype.getSegList = function() {
        return JSYG.makeArray(this[0].pathSegList);
    };
    
    /**
     * Trace le chemin à partir d'une liste de segments
     * @param segList tableau de segments
     * @returns {Path}
     */
    Path.prototype.setSegList = function(segList) {
        
        var path = new Path();
        segList.forEach(function(seg) { path.appendSeg(seg); });
        this.applyPath(path);
        return this;
    };
    
    /**
     * récupère le dernier segment
     * @returns {SVGPathSeg}
     */
    Path.prototype.getLastSeg = function() {
        return this.getSeg(this.nbSegs()-1);
    };
    
    /**
     * Ajoute un objet segment à la liste
     * @param seg objet segment
     * @returns {Path}
     * @example <pre>var path = new Path();
     * var seg = path.createSeg('M',0,0);
     * path.appendSeg(seg);
     * 
     * //equivalent à
     * path.addSeg('M',0,0);
     */
    Path.prototype.appendSeg = function(seg) {
        this[0].pathSegList.appendItem( JSYG.support.needCloneSeg ? this.cloneSeg(seg) : seg );
        return this;
    };
    
    /**
     * Insert un segment à l'indice donné
     * @param seg objet segment
     * @param i indice ou insérer le segment
     * @returns {Path}
     */
    Path.prototype.insertSeg = function(seg,i) {
        this[0].pathSegList.insertItemBefore( JSYG.support.needCloneSeg ? this.cloneSeg(seg) : seg, i);
        return this;
    };
    
    /**
     * Remplace un segment
     * @param i indice du segment à remplacer
     * @param seg nouveau segment
     * @returns {Path}
     */
    Path.prototype.replaceSeg = function(i,seg) {
        
        if (typeof seg == 'string') {
            var args = Array.prototype.slice.call(arguments,1);
            seg = this.createSeg.apply(this,args);
        }
        else if (JSYG.support.needCloneSeg) seg = this.cloneSeg(seg);
        
        this[0].pathSegList.replaceItem(seg,i);
        return this;
    };
    
    /**
     * Supprime un segment
     * @param i indice du segment à supprimer
     * @returns {Path}
     */
    Path.prototype.removeSeg = function(i) {
        this[0].pathSegList.removeItem(i);
        return this;
    };
    
    /**
     * Ajoute un segment de déplacement
     * @param x abcisse
     * @param y ordonnée
     * @returns {Path}
     * @example <pre>var path = new Path();
     * path.moveTo(40,40);
     * 
     * //équivalent à
     * path.addSeg('M',40,40);
     * 
     * //ou encore à
     * var seg = path.createSeg('M',40,40);
     * path.appendSeg(seg);
     */
    Path.prototype.moveTo = function(x,y) {
        this.addSeg('M',x,y);
        return this;
    };
    
    /**
     * Ajout un segment de droite
     * @param x abcisse
     * @param y ordonnée
     * @returns {Path}
     * @example <pre>var path = new Path();
     * path.lineTo(40,40);
     * 
     * //équivalent à
     * path.addSeg('L',40,40);
     * 
     * //ou encore à
     * var seg = path.createSeg('L',40,40);
     * path.appendSeg(seg);
     */
    Path.prototype.lineTo = function(x,y) {
        this.addSeg('L',x,y);
        return this;
    };
    
    /**
     * Ajoute un segment de Bézier (cubique)
     * @param x1 abcisse du 1er point de contrôle
     * @param y1 ordonnée du 1er point de contrôle
     * @param x2 abcisse du 2ème point de contrôle
     * @param y2 ordonnée du 2ème point de contrôle
     * @param x abcisse du point d'arrivée
     * @param y ordonnée du point d'arrivée
     * @returns {Path}
     * @example <pre>var path = new Path();
     * path.curveTo(40,40,10,30,30,10);
     * 
     * //équivalent à
     * path.addSeg('C',40,40,10,30,30,10);
     * 
     * //ou encore à
     * var seg = path.createSeg('C',40,40,10,30,30,10);
     * path.appendSeg(seg);
     */
    Path.prototype.curveTo = function(x1,y1,x2,y2,x,y) {
        this.addSeg('C',x,y,x1,y1,x2,y2);
        return this;
    };
    
    /**
     * Ferme le chemin (ajout d'un segment "Z")
     * @returns {Path}
     * <pre>var path = new Path();
     * path.curveTo(40,40,10,30,30,10);
     * path.close();
     * 
     * //équivalent à
     * path.addSeg('Z');
     * 
     * //ou encore à
     * var seg = path.createSeg('Z');
     * path.appendSeg(seg);
     */
    Path.prototype.close = function() {
        this.addSeg('Z');
        return this;
    };
    
    /**
     * Récupère le point courant.
     * Un segment donné ne renseigne que du point d'arrivée et non du point de départ dont on a souvent besoin.<br/>
     * <strong>Attention</strong>, cela ne marche qu'avec des segments définis en absolu et non en relatif. Utilisez
     * si besoin la méthode rel2abs.
     * @param i indice du segment
     * @returns {Vect}
     * @see Path.prototype.rel2abs
     * @example <pre>var path = new Path();
     * path.attr('d','M0,0 h50
     * 
     * path.getCurPt(0); // {x:20,y:20}
     * path.getCurPt(1); // {x:20,y:20}
     * path.getCurPt(2); // {x:20,y:20}
     */
    Path.prototype.getCurPt = function(i) {
        
        var j=i,
        x=null,y=null,
        seg;
        
        if (i===0) {
            seg = this.getSeg(0);
            return new JSYG.Vect(seg.x,seg.y);
        }
        
        while (x==null || y==null) {
            j--;
            if (j<0) {
                if (x == null) { x = 0; }
                if (y == null) { y = 0; }
            }
            else {
                seg = this.getSeg(j);
                if (seg.x!=null && x == null) { x = seg.x; }
                if (seg.y!=null && y == null) { y = seg.y; }
            }
        }
        
        return new JSYG.Vect(x,y);
    };
    
    /**
     * Remplace un segment relatif par son équivalent en absolu.
     */
    function rel2absSeg(jPath,ind) {
        
        var seg = jPath.getSeg(ind),
        letter = seg.pathSegTypeAsLetter.toLowerCase(),
        args,ref;
        
        if (seg.pathSegTypeAsLetter !== letter) return; //déjà en absolu
        
        args = [ind,letter.toUpperCase()];
        ref = jPath.getCurPt(ind);
        
        if (letter === 'h') args.push(ref.x+seg.x);
        else if (letter === 'v') args.push(ref.y+seg.y);
        else if (letter != "z") {
            
            args.push(ref.x+seg.x,ref.y+seg.y);
            
            switch (letter) {
                case 'c' : args.push(ref.x+seg.x1,ref.y+seg.y1,ref.x+seg.x2,ref.y+seg.y2); break;
                case 'q' : args.push(ref.x+seg.x1,ref.y+seg.y1); break;
                case 'a' : args.push(seg.r1,seg.r2,seg.angle,seg.largArcFlag,seg.sweepFlag); break;
                case 's' : args.push(ref.x+seg.x2,ref.y+seg.y2); break;
            }
        }
        
        jPath.replaceSeg.apply(jPath,args);
    }
    
    /**
     * Applique le tracé d'un autre chemin
     * @param path argument JSYG faisant référence à un chemin
     * @returns {Path}
     */
    Path.prototype.applyPath = function(path) {
        
        this.attr('d',path.attr('d'));
        
        return this;
    };
    
    /**
     * Remplace les segments relatifs en segments absolus
     * @returns {Path}
     */
    Path.prototype.rel2abs = function() {
        
        var jPath = this.clone(),
        i=0,
        N=this.nbSegs();
        
        for (;i<N;i++) rel2absSeg(jPath,i);
        
        this.applyPath(jPath);
        return this;
    };
    
    /**
     * Teste si le chemin contient des arcs ou non (segments a ou A)
     * @returns {Boolean}
     */
    Path.prototype.hasArcs = function() {
        return /a/i.test(this.attr('d'));
    };
    
    /**
     * Teste si le chemin contient des segments relatifs ou non
     * @returns
     */
    Path.prototype.hasRelSeg = function() {
        return /(m|l|h|v|c|s|q|t|a)/.test(this.attr('d'));
    };
    
    /**
     * Teste si le chemin est normalisé ou non. Normalisé signifie que tous ces segments sont absolus et uniquement de type M, L, C ou Z (z).
     * @returns {Boolean}
     */
    Path.prototype.isNormalized = function() {
        return !/([a-y]|[A-BD-KN-Y])/.test(this.attr('d'));
    };
    
    /**
     * Renvoie le nombre de segments
     * @returns
     */
    Path.prototype.nbSegs = function() {
        return this[0].pathSegList.numberOfItems;
    };
    
    /**
     * Scinde le segment en deux et renvoie un objet Path contenant les deux nouveaux segments.
     * @param ind indice du segment à diviser en 2.
     * @returns {Path}
     */
    Path.prototype.splitSeg = function(ind) {
        
        var seg = this.getSeg(ind),
        current = this.getCurPt(ind),
        letter = seg.pathSegTypeAsLetter,
        jPath = new Path(),
        m,m1,m2,m3,mm1,mm2,mmm;
        
        
        switch (letter) {
            
            case 'C' :
                
                m1 = {
                    x : (current.x+seg.x1)/2,
                    y : (current.y+seg.y1)/2
                };
                m2 = {
                    x : (seg.x1+seg.x2)/2,
                    y : (seg.y1+seg.y2)/2
                };
                m3 = {
                    x : (seg.x2+seg.x)/2,
                    y : (seg.y2+seg.y)/2
                };
                mm1 = {
                    x : (m1.x+m2.x)/2,
                    y : (m1.y+m2.y)/2
                };
                mm2 = {
                    x : (m2.x+m3.x)/2,
                    y : (m2.y+m3.y)/2
                };
                mmm = {
                    x : (mm1.x+mm2.x)/2,
                    y : (mm1.y+mm2.y)/2
                };
                
                jPath.addSeg('C',mmm.x,mmm.y,m1.x,m1.y,mm1.x,mm1.y);
                jPath.addSeg('C',seg.x,seg.y,mm2.x,mm2.y,m3.x,m3.y);
                
                break;
            
            case 'L' :
                
                m = { x: (current.x+seg.x)/2, y: (current.y+seg.y)/2 };
                jPath.addSeg('L',m.x,m.y);
                jPath.addSeg('L',seg.x,seg.y);
                break;
            
            case 'Z' :
                
                seg = this.getSeg(0);
                m = { x: (current.x+seg.x)/2, y: (current.y+seg.y)/2 };
                jPath.addSeg('L',m.x,m.y);
                jPath.addSeg('Z');
                break;
            
            case 'M' :
                
                jPath.addSeg('M',seg.x,seg.y);
                break;
            
            default : throw "You must normalize the jPath";
        }
        
        return jPath;
    };
    
    /**
     * Scinde chaque segment du chemin en 2.
     * @returns {Path}
     */
    Path.prototype.split = function() {
        
        if (!this.isNormalized()) throw new Error("You must normalize the path");
        
        var list,
        jPath = new Path(),
        i,N,j,M;
        
        for(i=0,N=this.nbSegs();i<N;i++) {
            
            list = this.splitSeg(i);
            
            for (j=0,M=list.nbSegs();j<M;j++) jPath.appendSeg(list.getSeg(j));
        }
        
        this.applyPath(jPath);
        return this;
    };
    
    /**
     * Extrait une portion du chemin et renvoie un objet Path contenant les segments de cette portion.
     * @param begin indice du premier segment. Si négatif, on part de la fin.
     * @param end indice du dernier segment. Si négatif, on part de la fin. Si non précisé, dernier segment.
     * @returns {Path}
     */
    Path.prototype.slice = function(begin,end) {
        
        var nbseg = this.nbSegs(),
        jPath = new Path(),
        i,pt;
        
        
        if (begin < 0) begin = nbseg-begin;
        if (end == null) end = nbseg-1;
        else if (end < 0) end = nbseg-end;
        
        begin = Math.max(0,begin);
        end = Math.min(nbseg-1,end);
        
        pt = this.getCurPt(begin);
        jPath.addSeg('M',pt.x,pt.y);
        
        for (i=begin;i<=end;i++) jPath.appendSeg(this.getSeg(i));
        
        return jPath;		
    };
    
    /**
     * Inverse l'ordre des points. Pas de différence visuelle.
     * @returns {Path}
     */
    Path.prototype.reverse = function() {
        
        if (!this.isNormalized()) throw new Error("il faut normaliser le chemin");
        
        var jPath = new Path(),
        N = this.nbSegs(),
        item,current,i;
        
        for (i=N-1;i>=0;i--) {
            
            item = this.getSeg(i);
            
            if (i===N-1) jPath.addSeg('M',item.x,item.y);
            
            current = this.getCurPt(i);
            
            switch(item.pathSegTypeAsLetter) {
                
                case 'L' :
                    if (i===N-1) break;
                    jPath.addSeg("L",current.x,current.y);
                    break;
                
                case 'C' :
                    jPath.addSeg("C",current.x,current.y,item.x2,item.y2,item.x1,item.y1);
                    break;
                
                case 'Z' :
                case 'z' :
                    current = this.getSeg(N-1);
                    jPath.addSeg("L",current.x,current.y);
                    break;
            }
            
        }
        
        this.applyPath(jPath);
        return this;
    };
    
    /**
     * Transforme un segment quelconque en une série de segments de droites.
     * nécessite un segment normalisé (M,L,C,Z,z).
     * @param ind indice du segment
     * @param nbsegs nombre de segments de droite pour approximer le segment initial (dans le cas d'un segment C).
     * @returns {Path}
     */
    Path.prototype.seg2Polyline = function(ind,nbsegs) {
        
        nbsegs = nbsegs || 10;
        
        var seg = this.getSeg(ind),
        letter = seg.pathSegTypeAsLetter.toUpperCase(),
        current = this.getCurPt(ind),
        jPath = new Path(),
        t,a,b,c,d,x,y,i;
        
        switch (letter) {
            
            case 'M' :
                jPath.addSeg('M',current.x,current.y);
                break;
            
            case 'L' :
                jPath.addSeg('L',seg.x,seg.y);
                break;
            
            case 'C' :
                
                for (i=0;i<=nbsegs;i++) {
                    
                    t = i / nbsegs;
                    
                    a = Math.pow(1-t,3);
                    b = 3 * t * Math.pow(1-t,2);
                    c = 3 * Math.pow(t,2) * (1-t);
                    d = Math.pow(t,3);
                    
                    x = a * current.x + b * seg.x1 + c * seg.x2 + d * seg.x;
                    y = a * current.y + b * seg.y1 + c * seg.y2 + d * seg.y;
                    
                    jPath.addSeg('L',x,y);
                }
                
                break;
            
            case 'Z' : 
                
                seg = this.getSeg(0);
                jPath.addSeg('L',seg.x,seg.y);
                break;
            
            default : throw new Error("Vous devez normaliser le chemin pour applique la mÃ©thode seg2Polyline");
        }
        
        return jPath;		 
    };
    
    /**
     * Transforme le chemin en une série de segments de droite.
     * Le chemin doit être normalisé. 
     * @param nbsegs nombre de segments pour approximer les courbes.
     * @returns {Path}
     */
    Path.prototype.toPolyline = function(nbsegs) {
        
        var list,
        jPath = new Path(),
        i,N,j,M;
        
        if (!this.isNormalized()) throw new Error("Il faut normaliser le chemin pour la mÃ©thode toPolyLine");
        
        for(i=0,N=this.nbSegs();i<N;i++) {
            
            list = this.seg2Polyline(i,nbsegs);
            
            for (j=0,M=list.nbSegs();j<M;j++) jPath.appendSeg(list.getSeg(j));
        }
        
        this.applyPath(jPath);
        return this;
    };
    
    /**
     * réduit le nombre de points du chemin en précisant une distance minimale entre 2 points. 
     * @param minDistance distance minimale en pixels entre 2 points en dessous de laquelle l'un des 2 sera supprimé. 
     * @param screen si true, cette distance est la distance en pixels visible à  l'écran (donc plus faible si le chemin est zoomé), sinon
     * c'est la distance absolue entre 2 points du chemin.
     * @returns {Path}
    
	Path.prototype.slim = function(minDistance,screen) {
    
		var i = 0,
			ctm = screen ? this.parent().getMtx('screen') : new JSYG.Matrix(),
			seg,next;
    
		while (i < this.nbSegs()-2) { //pas le dernier point
    
			seg = new JSYG.Point(this.getSeg(i)).mtx(ctm);
			next = new JSYG.Point(this.getSeg(i+1)).mtx(ctm);
    
			if (distance(seg,next) < minDistance) {
    
				if (i < this.nbSegs()-2) this.removeSeg(i+1);
				else this.removeSeg(i);
			}
			else i++;
		}
    
		return this; 
	};
     */
    
    function getSegDist(p, p1, p2) {
        
        var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y;
        
        if (dx !== 0 || dy !== 0) {
            
            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            
            if (t > 1) {
                x = p2.x;
                y = p2.y;
                
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        
        dx = p.x - x;
        dy = p.y - y;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /* Tiré de Simplify.js
	 (c) 2013, Vladimir Agafonkin
	 Simplify.js, a high-performance JS polyline simplification library
	 mourner.github.io/simplify-js
     */
    /**
     * Simplification du chemin par l'algorithme de Douglas-Peucker
     * @param tolerance
     * @returns {Path}
     * 
     */
    Path.prototype.simplify = function(tolerance,screen) {
        
        var segs = this.getSegList(),
        len = segs.length,
        sqTolerance = tolerance ? tolerance * tolerance : 1,
        ctm = screen ? this.parent().getMtx('screen') : new JSYG.Matrix(),
        markers = new Array(len),
        first = 0,
        last = len - 1,
        stack = [],
        jPath = new Path(),
        i, maxDist, dist, index = null,
        p,p1,p2;
        
        if (len <= 1) return this;
        
        markers[first] = markers[last] = 1;
        
        while (last) {
            
            maxDist = 0;
            
            for (i = first + 1; i < last; i++) {
                
                p = new JSYG.Point(segs[i]).mtx(ctm);
                p1 = new JSYG.Point(segs[first]).mtx(ctm);
                p2 = new JSYG.Point(segs[last]).mtx(ctm);
                
                dist = getSegDist(p,p1,p2);
                
                if (dist > maxDist) {
                    index = i;
                    maxDist = dist;
                }
            }
            
            if (maxDist > sqTolerance) {
                markers[index] = 1;
                stack.push(first, index, index, last);
            }
            
            last = stack.pop();
            first = stack.pop();
        }
        
        for (i = 0; i < len; i++) {
            if (markers[i]) jPath.appendSeg(segs[i]);
        }
        
        this.applyPath(jPath);
        
        return this;
    };
    
    
    
    
    
    /**
     * Teste si le chemin est fermé ou non
     * @returns {Boolean}
     */
    Path.prototype.isClosed = function() {
        
        var seg1 = this.getSeg(0),
        seg2 = this.getLastSeg();
        
        return seg2.pathSegTypeAsLetter.toLowerCase() == 'z' || (seg1.x == seg2.x && seg1.y == seg2.y);
    };
    
    /**
     * Lisse le chemin de manière automatique, sans avoir à définir de points de contrôles.
     * @param ind optionnel, indice du segment. Si précisé, le chemin ne sera lissé qu'autour de ce point.
     * @returns {Path}
     */
    Path.prototype.autoSmooth = function(ind) {
        
        var i,N = this.nbSegs(),
        closed = this.isClosed(),
        dontloop = arguments[1] || null,
        min,max,
        seg,nm1,n0,np1,np2,x0,y0,x1,y1,x2,y2,x3,y3,
        tgx0,tgy0,tgx3,tgy3,dx,dy,d,dt0,dt3,ft0,ft3;
        
        if (ind == null) { min = 0; max = N-1; }
        else {
            if (ind === 0 && !dontloop) this.autoSmooth(N-1,true);
            if (ind >= N-2 && !dontloop) this.autoSmooth(0,true);
            
            min = Math.max(0,ind-2);
            max = Math.min(N-1,ind+2);
        }
        
        if (this.getLastSeg().pathSegTypeAsLetter.toLowerCase() === 'z') {
            seg = this.getSeg(0);
            this.replaceSeg(this.nbSegs()-1, 'L', seg.x, seg.y);
        }
        
        if (N < 3) return;
        
        for (i=min;i<max;i++){
            
            nm1 = (i===0) ? (closed ? this.getSeg(N-2) : this.getSeg(i)) : this.getSeg(i-1);
            n0 = this.getSeg(i);
            np1 = this.getSeg(i+1);
            np2 = (i===N-2) ? (closed ? this.getSeg(1) : this.getSeg(i+1)) : this.getSeg(i+2);
            
            x0 = n0.x;  y0 = n0.y;
            x3 = np1.x;	y3 = np1.y;
            
            tgx3 = x0 - np2.x;
            tgy3 = y0 - np2.y;
            tgx0 = nm1.x - np1.x;
            tgy0 = nm1.y - np1.y;
            dx  = Math.abs(x0 - x3);
            dy  = Math.abs(y0 - y3);
            d   = Math.sqrt(dx*dx + dy*dy);
            dt3 = Math.sqrt(tgx3*tgx3 + tgy3*tgy3);
            dt0 = Math.sqrt(tgx0*tgx0 + tgy0*tgy0);
            
            
            if (d !== 0) {
                
                ft3 = (dt3 / d) * 3;
                ft0 = (dt0 / d) * 3;
                
                x1 = x0 - tgx0 / ft0;
                y1 = y0 - tgy0 / ft0;
                x2 = x3 + tgx3 / ft3;
                y2 = y3 + tgy3 / ft3;
                
                this.replaceSeg(i+1,'C',np1.x,np1.y,x1,y1,x2,y2);
            }
        }
        
        return this;
    };
    
    /**
     * Teste si le point passé en paramètre est à l'intérieur du polygone défini par le chemin ou non.
     * Le chemin doit donc être fermé pour éventuellement renvoyer true.
     * @param pt objet Vect ou objet quelconque ayant les propriétés x et y.
     * @returns {Boolean}
     */
    Path.prototype.isPointInside = function(pt) {
        
        if (!this.isClosed()) return false;
        
        var counter=0,
        x_inter,
        mtx = this.getMtx(),
        p1=this.getSeg(0),
        N=this.nbSegs(),
        i, p2;
        
        p1 = new JSYG.Vect(p1.x,p1.y).mtx(mtx);
        
        for (i=1;i<=N;i++) {
            
            p2 = this.getSeg(i%N);
            p2 = new JSYG.Vect(p2.x,p2.y).mtx(mtx);
            
            if ( pt.y > Math.min(p1.y, p2.y)) {
                if ( pt.y <= Math.max(p1.y, p2.y)) {
                    if ( pt.x <= Math.max(p1.x, p2.x)) {
                        if ( p1.y != p2.y ) {
                            x_inter = (pt.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                            if ( p1.x == p2.x || pt.x <= x_inter) {
                                counter++;
                            }
                        }
                    }
                }
            }
            p1 = p2;
        }
        
        return ( counter % 2 == 1 );
    };
    
    /**
     * Normalise le chemin (segments M,L,C,Z,z uniquement).
     * @returns {Path}
     */
    Path.prototype.normalize = function() {
        
        this.rel2abs();
        
        var seg,letter,currentPoint,
        jPath = new Path(),
        x,y,
        i=0,N = this.nbSegs(),
        j,M,bezier;
        
        for (;i<N;i++) {
            
            seg = this.getSeg(i);
            letter = seg.pathSegTypeAsLetter;
            currentPoint = this.getCurPt(i);
            
            if (letter === 'H') {
                jPath.addSeg('L',seg.x,currentPoint.y);
            }
            else if (letter === 'V') {
                jPath.addSeg('L',currentPoint.x,seg.y);
            }
            else if (letter === 'S') { //transform S to C
                if (i === 0 || this.getSeg(i-1).pathSegTypeAsLetter !== 'C') {
                    x = currentPoint.x;
                    y = currentPoint.y;
                }
                else {
                    x = currentPoint.x * 2 - this.getSeg(i-1).x2;
                    y = currentPoint.y * 2 - this.getSeg(i-1).y2;
                }
                this.replaceSeg( i, 'C',seg.x,seg.y,x,y,seg.x2,seg.y2 );
                i--;continue;
            }
            else if (letter === 'Q') {
                jPath.addSeg('C',seg.x,seg.y, 1/3 * currentPoint.x + 2/3 * seg.x1, currentPoint.y/3 + 2/3 *seg.y1,2/3 * seg.x1 + 1/3 * seg.x, 2/3 * seg.y1 + 1/3 * seg.y);
            }
            else if (letter === 'T') { //transform T to Q
                if (i === 0 || this.getSeg(i-1).pathSegTypeAsLetter !== 'Q') {
                    x = currentPoint.x;
                    y = currentPoint.y;
                }
                else {
                    x = currentPoint.x * 2 - this.getSeg(i-1).x1;
                    y = currentPoint.y * 2 - this.getSeg(i-1).y1;
                }
                this.replaceSeg( i, 'Q',seg.x,seg.y,x,y,seg.x2,seg.y2 );
                i--;continue;
            }
            else if (letter === 'A') {
                bezier = this.arc2bez(i);
                for (j=0,M=bezier.nbSegs();j<M;j++) {
                    jPath.appendSeg(bezier.getSeg(j));
                }
            }
            else jPath.appendSeg(seg);
        }
        
        this.applyPath(jPath);
        return this;
    };
    
    /**
     * Renvoie la longueur d'un segment
     * @param i indice du segment
     * @returns {Number}
     */
    Path.prototype.getSegLength = function(i) {
        return this.slice(0,i).getLength()-this.slice(0,i-1).getLength();
    };
    
    /**
     * Renvoie la longueur du chemin au niveau du segment précisé
     * @param i indice du segment
     * @returns
     */
    Path.prototype.getLengthAtSeg = function(i) {
        return this.slice(0,i).getLength();
    };
    
    /**
     * Renvoie l'indice du segment situé à la distance précisée
     * @param distance
     * @returns {Number}
     */
    Path.prototype.getSegAtLength = function(distance) {
        return this[0].getPathSegAtLength(distance);
    };
    
    /**
     * Renvoie le point du chemin à la distance précisée
     * @param distance
     * @returns {Vect}
     */
    Path.prototype.getPointAtLength = function(distance) {
        var pt = this[0].getPointAtLength(distance);
        return new JSYG.Vect(pt.x,pt.y);
    };
    
    /**
     * Renvoie l'angle du chemin à la distance précisée
     * @param distance
     * @returns {Number}
     */
    Path.prototype.getRotateAtLength = function(distance) {
        var pt = this.getTangentAtLength(distance);
        return Math.atan2(pt.y,pt.x) * 180 / Math.PI;
    };
    
    /**
     * Renvoie la tangente du chemin à la distance précisée
     * @param distance
     * @returns {Vect}
     */
    Path.prototype.getTangentAtLength = function(distance) {
        
        if (!this.isNormalized()) throw new Error("Il faut normaliser le chemin");
        
        var ind = this[0].getPathSegAtLength(distance);
        
        if (ind === -1) return null;
        
        var letter, seg, current,
        l1, l2, t, a, b, c, e, f, g, x, y;
        
        do {
            seg = this.getSeg(ind);
            if (!seg) { return null; }
            letter = seg.pathSegTypeAsLetter;
        }
        while (letter === 'M' && ++ind);
        
        current = this.getCurPt(ind);
        //var jPath = new Path();
        
        switch (letter) {
            
            case 'C' :
                
                l1 = this.getLengthAtSeg(ind-1);
                l2 = this.getLengthAtSeg(ind);
                t = (distance-l1) / (l2-l1);
                
                //inspiré de http://www.planetclegg.com/projects/WarpingTextToSplines.html
                
                a = seg.x - 3  * seg.x2 + 3 * seg.x1 - current.x;
                b = 3 * seg.x2 - 6 * seg.x1 + 3 * current.x;
                c = 3 * seg.x1 - 3 * current.x;
                //d = current.x,
                e = seg.y - 3  * seg.y2 + 3 * seg.y1 - current.y;
                f = 3 * seg.y2 - 6 * seg.y1 + 3 * current.y;
                g = 3 * seg.y1 - 3 * current.y;
                //h = current.y,
                
                //point de la courbe de bézier (equivalent à getPointAtLength)
                //x = a * Math.pow(t,3) + b * Math.pow(t,2) + c * t + d,
                //y = e * Math.pow(t,3) + f * Math.pow(t,2) + g * t + h,
                
                x = 3 * a * Math.pow(t,2) + 2 * b * t + c;
                y = 3 * e * Math.pow(t,2) + 2 * f * t + g;
                
                return new JSYG.Vect(x,y).normalize();
            
            case 'L' :
                
                return new JSYG.Vect(seg.x-current.x,seg.y-current.y).normalize();
            
            case 'M' :
            case 'Z' :
                
                return null;
            
            default : throw new Error("You must normalize the Path");
        }
    };
    
    /**
     * Trouve le segment le plus proche du point donné en paramètre
     * @param point objet avec les propriÃ©tÃ©s x et y.
     * @param precision nombre de pixels maximal sï¿½parant le point du chemin
     * @returns {Number} indice du segment trouvï¿½, ou -1
     */
    Path.prototype.findSeg = function(point,precision) {
        
        precision = precision || 1;
        
        var pt,i,N=this[0].getTotalLength();
        for (i=0;i<=N;i++) {
            pt = this[0].getPointAtLength(i);
            if (distance(pt,point) < precision) return this[0].getPathSegAtLength(i);
        }
        
        return -1;
    };
    
    function getFromPoint(node,point,result,precision,borneMin,borneMax) {
        
        var pt,i,N=node.getTotalLength(),
        distance,ptmin=null,length=null,min=Infinity;
        
        precision = Math.ceil(precision || 50);
        borneMin = Math.max(borneMin || 0,0);
        borneMax = Math.min(borneMax || N,N);
        
        for (i=borneMin;i<=borneMax;i+=precision) {
            pt = node.getPointAtLength(i);
            distance = distance(pt,point);
            if (distance < min ) {
                ptmin = pt;
                min = distance;
                length = i;
                if (distance < 1) break;
            }
        }
        
        if (precision > 1) {
            return getFromPoint(node,point,result,precision/10,length-precision,length+precision);
        }
        
        return result === 'point' ? new JSYG.Vect(ptmin.x,ptmin.y) : length;
    }
    
    /**
     * Trouve le point de la courbe le plus proche du point passé en paramètre
     * @param point objet avec les propriétés x et y
     * @returns {Vect}
     */
    Path.prototype.getNearestPoint = function(point) {
        return getFromPoint(this[0],point,'point');
    };
    
    /**
     * Trouve la longueur de la courbe au point le plus proche du point passé en paramètre
     * @param point
     * @returns
     */
    Path.prototype.getLengthAtPoint = function(point) {
        return getFromPoint(this[0],point,'length');
    };
    
    /*
	Path.prototype.getArea = function() {
    
		var area = 0,
			segs = this.getSegList(),
			i,N = segs.length;
    
		if (segs[N-1].pathSegTypeAsLetter.toLowerCase() == 'z') {
			segs[N-1] = null;
			N--;
		}
    
		for (i=0;i<N-1;i++) {
			area += segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y;   
		}
    
		return area/2;
	};
    
	Path.prototype.getCentroid = function() {
    
		var area = this.getArea(),
			segs = this.getSegList(),
			i,N = segs.length,
			x=0,y=0;
    
		for (i=0;i<N-1;i++) {
			x += (segs[i].x + segs[i+1].x) * (segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y);
			y += (segs[i].y + segs[i+1].y) * (segs[i].x * segs[i+1].y - segs[i+1].x * segs[i].y);
		}
    
		return { x : x/(6*area) , y : y/(6*area) };
	};*/
    
    
    //codé à partir de http://www.w3.org/TR/2003/REC-SVG11-20030114/implnote.html#ArcConversionEndpointToCenter
    function computeCenterAndAngles(startPoint,seg) {
        
        var rad = seg.angle * Math.PI / 180,
        x1 = startPoint.x,
        y1 = startPoint.y,
        xp1 = Math.cos(rad) * (x1-seg.x) / 2 + Math.sin(rad) * (y1-seg.y) / 2,
        yp1 = -Math.sin(rad) * (x1-seg.x) / 2 + Math.cos(rad) * (y1-seg.y) / 2,
        r1c = Math.pow(seg.r1,2), r2c = Math.pow(seg.r2,2),
        xp1c = Math.pow(xp1,2), yp1c = Math.pow(yp1,2),
        lambda = xp1c / r1c + yp1c / r2c; //Ensure radii are large enough
        
        if (lambda > 1) { 
            seg.r1*=Math.sqrt(lambda);
            seg.r2*=Math.sqrt(lambda);
            r1c = Math.pow(seg.r1,2);
            r2c = Math.pow(seg.r2,2);
        }
        
        var coef = (seg.largeArcFlag === seg.sweepFlag ? -1 : 1 ) * Math.sqrt( Math.max(0,( r1c*r2c - r1c*yp1c - r2c*xp1c ) / ( r1c*yp1c + r2c*xp1c)) ),
        cpx = coef * ( seg.r1 * yp1 ) / seg.r2,
        cpy = coef * ( - seg.r2 * xp1 ) / seg.r1,
        cx = Math.cos(rad) * cpx - Math.sin(rad) * cpy + (x1 + seg.x) / 2,
        cy = Math.sin(rad) * cpx + Math.cos(rad) * cpy + (y1 + seg.y) / 2,
        cosTheta = ( (xp1-cpx)/seg.r1 ) / Math.sqrt( Math.pow( (xp1-cpx)/seg.r1 , 2 ) + Math.pow( (yp1-cpy)/seg.r2 , 2 ) ),
        theta = ( (yp1-cpy)/seg.r2 > 0 ? 1 : -1) * Math.acos(cosTheta),
        u = { x : (xp1-cpx) /seg.r1 , y : (yp1-cpy) /seg.r2 },
        v = { x : (-xp1-cpx)/seg.r1 , y : (-yp1-cpy)/seg.r2 },
        cosDeltaTheta = ( u.x * v.x + u.y * v.y ) / ( Math.sqrt(Math.pow(u.x,2) + Math.pow(u.y,2)) * Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2)) ),
        deltaTheta = (u.x*v.y-u.y*v.x > 0 ? 1 : -1) * Math.acos(Math.max(-1,Math.min(1,cosDeltaTheta))) % (Math.PI*2);
        
        if (seg.sweepFlag === false && deltaTheta > 0) { deltaTheta-=Math.PI*2; }
        else if (seg.sweepFlag === true && deltaTheta < 0) { deltaTheta+=Math.PI*2; }
        
        seg.cx = cx;
        seg.cy = cy;
        seg.eta1 = theta;
        seg.eta2 = theta + deltaTheta;
        
        return seg;
    }
    
    function rationalFunction(x,c) {
        return (x * (x * c[0] + c[1]) + c[2]) / (x + c[3]);
    }
    
    function estimateError(seg,etaA,etaB,bezierDegree) {
        
        var coefs = {
            
            degree2 : {
                
                low : [
                    [
                        [  3.92478,   -13.5822,     -0.233377,    0.0128206   ],
                        [ -1.08814,     0.859987,    0.000362265, 0.000229036 ],
                        [ -0.942512,    0.390456,    0.0080909,   0.00723895  ],
                        [ -0.736228,    0.20998,     0.0129867,   0.0103456   ]
                    ], [
                        [ -0.395018,    6.82464,     0.0995293,   0.0122198   ],
                        [ -0.545608,    0.0774863,   0.0267327,   0.0132482   ],
                        [  0.0534754,  -0.0884167,   0.012595,    0.0343396   ],
                        [  0.209052,   -0.0599987,  -0.00723897,  0.00789976  ]
                    ]
                ],
                
                high : [
                    [
                        [  0.0863805, -11.5595,     -2.68765,     0.181224    ],
                        [  0.242856,   -1.81073,     1.56876,     1.68544     ],
                        [  0.233337,   -0.455621,    0.222856,    0.403469    ],
                        [  0.0612978,  -0.104879,    0.0446799,   0.00867312  ]
                    ], [
                        [  0.028973,    6.68407,     0.171472,    0.0211706   ],
                        [  0.0307674,  -0.0517815,   0.0216803,  -0.0749348   ],
                        [ -0.0471179,   0.1288,     -0.0781702,   2.0         ],
                        [ -0.0309683,   0.0531557,  -0.0227191,   0.0434511   ]
                    ]
                ],
                
                safety : [ 0.001, 4.98, 0.207, 0.0067 ]
            },
            
            degree3 : {
                
                low : [
                    [
                        [ 3.85268,   -21.229,      -0.330434,    0.0127842   ],
                        [ -1.61486,     0.706564,    0.225945,    0.263682   ],
                        [ -0.910164,    0.388383,    0.00551445,  0.00671814 ],
                        [ -0.630184,    0.192402,    0.0098871,   0.0102527  ]
                    ],[
                        [ -0.162211,    9.94329,     0.13723,     0.0124084  ],
                        [ -0.253135,    0.00187735,  0.0230286,   0.01264    ],
                        [ -0.0695069,  -0.0437594,   0.0120636,   0.0163087  ],
                        [ -0.0328856,  -0.00926032, -0.00173573,  0.00527385 ]
                    ]
                ],
                
                high : [
                    [
                        [  0.0899116, -19.2349,     -4.11711,     0.183362   ],
                        [  0.138148,   -1.45804,     1.32044,     1.38474    ],
                        [  0.230903,   -0.450262,    0.219963,    0.414038   ],
                        [  0.0590565,  -0.101062,    0.0430592,   0.0204699  ]
                    ], [
                        [  0.0164649,   9.89394,     0.0919496,   0.00760802 ],
                        [  0.0191603,  -0.0322058,   0.0134667,  -0.0825018  ],
                        [  0.0156192,  -0.017535,    0.00326508, -0.228157   ],
                        [ -0.0236752,   0.0405821,  -0.0173086,   0.176187   ]
                    ]
                ],
                
                safety : [ 0.001, 4.98, 0.207, 0.0067 ]
            }
        };
        
        var eta  = 0.5 * (etaA + etaB);
        var aCosEtaA,bSinEtaA,xA,yA,aCosEtaB,bSinEtaB,xB,yB,aCosEta,bSinEta,x,y,dx,dy;
        var dEta,cos2,cos4,cos6,coeffs,c0,c1;
        
        if (bezierDegree < 2) {
            
            // start point
            aCosEtaA  = seg.r1 * Math.cos(etaA);
            bSinEtaA = seg.r2 * Math.sin(etaA);
            xA = seg.cx + aCosEtaA * Math.cos(seg.angleRad) - bSinEtaA * Math.sin(seg.angleRad);
            yA = seg.cy + aCosEtaA * Math.sin(seg.angleRad) + Math.sin(seg.angleRad) * Math.cos(seg.angleRad);
            
            // end point
            aCosEtaB = seg.r1 * Math.cos(etaB);
            bSinEtaB = seg.r2 * Math.sin(etaB);
            xB = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad);
            yB = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad);
            
            // maximal error point
            aCosEta = seg.r1 * Math.cos(eta);
            bSinEta = seg.r2 * Math.sin(eta);
            x = seg.cx + aCosEta * Math.cos(seg.angleRad) - bSinEta * Math.sin(seg.angleRad);
            y = seg.cy + aCosEta * Math.sin(seg.angleRad) + bSinEta * Math.cos(seg.angleRad);
            
            dx = xB - xA;
            dy = yB - yA;
            
            return Math.abs(x * dy - y * dx + xB * yA - xA * yB) / Math.sqrt(dx * dx + dy * dy);
        }
        else {
            
            x = seg.r2 / seg.r1;
            dEta = etaB - etaA;
            cos2 = Math.cos(2 * eta);
            cos4 = Math.cos(4 * eta);
            cos6 = Math.cos(6 * eta);
            coeffs = (x < 0.25) ? coefs['degree'+bezierDegree].low : coefs['degree'+bezierDegree].high;// select the right coeficients set according to degree and b/a
            c0 = rationalFunction(x, coeffs[0][0]) + cos2 * rationalFunction(x, coeffs[0][1]) + cos4 * rationalFunction(x, coeffs[0][2]) + cos6 * rationalFunction(x, coeffs[0][3]);
            c1 = rationalFunction(x, coeffs[1][0]) + cos2 * rationalFunction(x, coeffs[1][1]) + cos4 * rationalFunction(x, coeffs[1][2]) + cos6 * rationalFunction(x, coeffs[1][3]);
            
            return rationalFunction(x, coefs['degree'+bezierDegree].safety) * seg.r1 * Math.exp(c0 + c1 * dEta);
        }
    }
    
    /**
     * Convertit un arc en courbe de bézier
     * @param ind indice du segment arc ("A")
     * @param bezierDegree optionnel, degré de la courbe de bézier à utiliser (3 par défaut)
     * @param defaultFlatness optionnel, 0.5 (valeur par défaut) semble être la valeur adaptée.
     * @returns {Path}
     */
    Path.prototype.arc2bez = function(ind,bezierDegree,defaultFlatness) {
        
        defaultFlatness = defaultFlatness || 0.5;
        bezierDegree = bezierDegree || 3;
        
        var seg = this.getSeg(ind);
        if (seg.pathSegTypeAsLetter !== 'A') { throw "You can only comput center and angles on 'A' segments"; }
        
        var startPoint = this.getCurPt(ind);
        
        //from Luc Maisonobe www.spaceroots.org
        seg.angleRad = seg.angle*Math.PI/180;
        seg.r1 = Math.abs(seg.r1);
        seg.r2 = Math.abs(seg.r2);
        
        // find the number of Bï¿½zier curves needed
        var found = false,
        i,n = 1,
        dEta,etaA,etaB,
        jPath = new Path();
        
        computeCenterAndAngles(startPoint,seg);
        
        while ((!found) && (n < 1024)) {
            dEta = (seg.eta2 - seg.eta1) / n;
            if (dEta <= 0.5 * Math.PI) {
                etaB = seg.eta1;
                found = true;
                for (i=0; found && (i<n); ++i) {
                    etaA = etaB;
                    etaB += dEta;
                    found = ( estimateError(seg, etaA, etaB, bezierDegree) <= defaultFlatness );
                }
            }
            n = n << 1;
        }
        
        dEta = (seg.eta2 - seg.eta1) / n;
        etaB = seg.eta1;
        
        var aCosEtaB = seg.r1 * Math.cos(etaB),
        bSinEtaB = seg.r2 * Math.sin(etaB),
        aSinEtaB = seg.r1 * Math.sin(etaB),
        bCosEtaB = seg.r2 * Math.cos(etaB),
        xB = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad),
        yB = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad),
        xADot,
        yADot,
        xBDot = -aSinEtaB * Math.cos(seg.angleRad) - bCosEtaB * Math.sin(seg.angleRad),
        yBDot = -aSinEtaB * Math.sin(seg.angleRad) + bCosEtaB * Math.cos(seg.angleRad);
        
        //jPath.addSeg('M',xB,yB);
        
        var t = Math.tan(0.5 * dEta),
        alpha = Math.sin(dEta) * (Math.sqrt(4 + 3 * t * t) - 1) / 3,
        xA,yA,k;
        
        for (i=0;i<n;++i) {
            
            etaA = etaB;
            xA = xB;
            yA = yB;
            xADot = xBDot;
            yADot = yBDot;
            
            etaB += dEta;
            aCosEtaB = seg.r1 * Math.cos(etaB);
            bSinEtaB = seg.r2 * Math.sin(etaB);
            aSinEtaB = seg.r1 * Math.sin(etaB);
            bCosEtaB = seg.r2 * Math.cos(etaB);
            xB       = seg.cx + aCosEtaB * Math.cos(seg.angleRad) - bSinEtaB * Math.sin(seg.angleRad);
            yB       = seg.cy + aCosEtaB * Math.sin(seg.angleRad) + bSinEtaB * Math.cos(seg.angleRad);
            xBDot    = -aSinEtaB * Math.cos(seg.angleRad) - bCosEtaB * Math.sin(seg.angleRad);
            yBDot    = -aSinEtaB * Math.sin(seg.angleRad) + bCosEtaB * Math.cos(seg.angleRad);
            
            if (bezierDegree == 1) { jPath.addSeg('L',xB,yB); }
            else if (bezierDegree == 2) {
                k = (yBDot * (xB - xA) - xBDot * (yB - yA)) / (xADot * yBDot - yADot * xBDot);
                jPath.addSeg('Q', xB , yB , xA + k * xADot , yA + k * yADot);
            } else {
                jPath.addSeg('C', xB , yB , xA + alpha * xADot , yA + alpha * yADot, xB - alpha * xBDot, yB - alpha * yBDot);
            }
        }
        
        return jPath;
    };
    
    /**
     * Constante pour approximer les arcs
     */
    JSYG.kappa = 4 * (Math.sqrt(2)-1)/3;
    // JSYG.kappa = 0.551915;
    
    
    /**
     * récupère les propriétés de mise en page
     */
    function getLayoutAttrs(elmt) {
        
        var tab,
        i=0,N,
        l={};
        
        switch (elmt.tagName) {
            case 'circle' : tab = ['cx','cy','r']; break;
            case 'ellipse' : tab = ['cx','cy','rx','ry']; break;
            case 'rect' : tab = ['x','y','rx','ry','width','height']; break;
            case 'line' : tab = ['x1','y1','x2','y2']; break;
            case 'polygon' : case 'polyline' : tab = ['points']; break;
            case 'path' : tab = ['d']; break;
            default : tab = ['x','y','width','height']; break;		
        }
        
        for(N=tab.length;i<N;i++) l[tab[i]] = parseFloat(elmt.getAttribute(tab[i]) || 0);
        
        return l;
    }
    
    /**
     * Convertit une forme svg en chemin
     * @param opt optionnel, objet pouvant avoir les propriétés suivantes :
     * <ul>
     * 	<li>normalize : booleen, normalise ou non le chemin</li>
     * <li>style : booleen, clone ou non les attributs de style de la forme au chemin</li>
     * <li>transform : booleen, clone ou non l'attribut de trasnformation de la forme au chemin</li>
     * </ul>
     * @returns {Path}
     */
    JSYG.prototype.clonePath = function(opt) {
        
        opt = opt || {};
        
        var normalize = opt.normalize,
        style = opt.style,
        transform = opt.transform,
        jPath = new Path(),
        l = getLayoutAttrs(this[0]),
        tag = this.getTag(),
        kx=0,ky=0,points,thisPath,
        i,N,pt;
        
        if (JSYG.svgShapes.indexOf( this.getTag() ) == -1) return null;
        
        switch (tag) {
            
            case 'circle' :
            case 'ellipse' :
                
                if (tag === 'circle') { l.rx = l.ry = l.r; }
                
                jPath.moveTo(l.cx+l.rx,l.cy);
                
                if (!normalize) {
                    
                    jPath.addSeg('A', l.cx-l.rx, l.cy, l.rx, l.ry, 0, 0, 1);
                    jPath.addSeg('A', l.cx+l.rx, l.cy, l.rx, l.ry, 0, 0, 1);
                    
                } else {
                    
                    kx = JSYG.kappa * l.rx;
                    ky = JSYG.kappa * l.ry;
                    
                    jPath.curveTo(l.cx+l.rx, l.cy+ky, l.cx+kx, l.cy+l.ry, l.cx, l.cy+l.ry);
                    jPath.curveTo(l.cx-kx, l.cy+l.ry, l.cx-l.rx, l.cy+ky,l.cx-l.rx, l.cy);
                    jPath.curveTo(l.cx-l.rx, l.cy-ky, l.cx-kx, l.cy-l.ry,l.cx, l.cy-l.ry);
                    jPath.curveTo(l.cx+kx, l.cy-l.ry, l.cx+l.rx, l.cy-ky,l.cx+l.rx, l.cy);
                }
                
                jPath.close();
                
                break;
            
            case 'rect' :
                
                jPath.moveTo(l.x+l.rx,l.y);
                
                if (normalize) {
                    
                    if ((l.rx || l.ry)) {
                        kx = JSYG.kappa*( l.rx || 0);
                        ky = JSYG.kappa*( l.ry || 0);
                    }
                    
                    jPath.lineTo(l.x+l.width-l.rx,l.y);
                    if (l.rx || l.ry) { jPath.curveTo( l.x+l.width-l.rx+kx, l.y,l.x+l.width, l.y+l.ry-ky, l.x+l.width, l.y+l.ry); }
                    jPath.lineTo(l.x+l.width,l.y+l.height-l.ry);
                    if (l.rx || l.ry) { jPath.curveTo(l.x+l.width, l.y+l.height-l.ry+ky, l.x+l.width-l.rx+kx, l.y+l.height,l.x+l.width-l.rx, l.y+l.height); }
                    jPath.lineTo(l.x+l.rx,l.y+l.height);
                    if (l.rx || l.ry) { jPath.curveTo(l.x+l.rx-kx, l.y+l.height, l.x, l.y+l.height-l.ry+ky,l.x,l.y+l.height-l.ry); }
                    jPath.lineTo(l.x,l.y+l.ry);
                    if (l.rx || l.ry) { jPath.curveTo(l.x, l.y+l.ry-ky, l.x+l.rx-kx, l.y,l.x+l.rx,l.y); }
                }
                else {
                    
                    jPath.addSeg('H',l.x+l.width-l.rx);
                    if (l.rx || l.ry) { jPath.addSeg('A', l.x+l.width, l.y+l.ry, l.rx, l.ry, 0, 0, 1); }
                    jPath.addSeg('V',l.y+l.height-l.ry);
                    if (l.rx || l.ry) { jPath.addSeg('A',l.x+l.width-l.rx, l.y+l.height, l.rx, l.ry, 0, 0, 1); }
                    jPath.addSeg('H',l.x+l.rx);
                    if (l.rx || l.ry) { jPath.addSeg('A', l.x,l.y+l.height-l.ry, l.rx, l.ry, 0, 0, 1); }
                    jPath.addSeg('V',l.y+l.ry);
                    if (l.rx || l.ry) { jPath.addSeg('A', l.x+l.rx,l.y, l.rx, l.ry, 0, 0, 1); }
                }
                
                jPath.addSeg('Z');
                
                break;
            
            case 'line' :
                
                jPath.moveTo(l.x1,l.y1).lineTo(l.x2,l.y2);
                break;
            
            case 'polyline' :
            case 'polygon' :
                
                points = this[0].points;
                
                pt = points.getItem(0);
                jPath.moveTo(pt.x,pt.y);
                
                for(i=1,N=points.numberOfItems;i<N;i++) {
                    pt = points.getItem(i);
                    jPath.lineTo(pt.x,pt.y);
                }
                
                if (tag === 'polygon') jPath.close();
                
                break;
            
            case 'path' :
                
                thisPath = new Path(this[0]);
                
                thisPath.getSegList().forEach(function(seg) {
                    jPath.appendSeg(seg);
                });
                
                if (normalize) jPath.normalize();
                
                break;
        }
        /*
			default :
        
				jPath.moveTo(l.x,l.y);
				jPath.lineTo(l.x+l.width,l.y);
				jPath.lineTo(l.x+l.width,l.y+l.height);
				jPath.lineTo(l.x,l.y+l.height);
				jPath.lineTo(l.x,l.y);
				jPath.close();
        
				break;
         */
        
        if (transform) jPath.setMtx(this.getMtx());
        
        if (style) jPath.styleClone(this[0]);
        
        return jPath;				
    };
    
    /**
     * Teste si la forme passée en paramètre est à l'intérieur de l'élément.
     * méthode de calcul un peu bourrin, gagnerait à être amélioriée.
     * @param shape argument JSYG faisant référence à une forme SVG
     * @returns {Boolean}
     */
    JSYG.prototype.isShapeInside = function(shape) {
        
        if (!this.isClosed()) { return false; }
        
        var jShape = new JSYG(shape).clonePath({normalize:true,transform:true}).css('visibility','hidden').appendTo(this.parent()).mtx2attrs().toPolyline();
        var clone = this.clonePath({normalize:true,transform:true}).css('visibility','hidden').appendTo(this.parent()).mtx2attrs().toPolyline();
        
        var test = true;
        
        for (var i=0,N=jShape.getLength();i<N;i++) {
            if (!clone.isPointInside(jShape.getPointAtLength(i))) {
                test = false;
                break;
            }
        }
        
        jShape.remove();
        clone.remove();
        return test;
    };
    
    /**
     * Transforme une courbe quelconque en segments de type C
     * @returns {Path}
     */
    Path.prototype.toCubicCurve = function() {
        
        this.normalize();
        
        var segList = this.getSegList(),
        that = this;
        
        segList.forEach(function(seg,i) {
            
            if (seg.pathSegTypeAsLetter != 'L') return;
            
            var prec = segList[i-1],
            newseg = that.createSeg('C',seg.x,seg.y,prec.x,prec.y,seg.x,seg.y);
            
            that.replaceSeg(i,newseg);
        });
        
        return this;
    };
    
    JSYG.Path = Path;
    
    return Path;
    
});