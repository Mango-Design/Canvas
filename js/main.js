var $lib;

$lib = (function ($){
    "use strict";

    var self,
        theme = {},
        polys = [],
        $canvas,
        $context;


    //Selects elements on array using a reference object *diff, and return the resulting array.
    function select (x, diff){
        var i, len, dx, ret = [], eq, orig;

        for(i = 0, len = x.length; i < len; i = i + 1){
            eq = true;
            orig = x[i];

            for (dx in diff){

                if(diff.hasOwnProperty(dx) && orig[dx] !== diff[dx]){
                    eq = false;
                    break;
                }
            }

            if(eq){
                ret.push(orig);
            }
        }

        return ret;
    }

    //Check if a
    function hits(arr, dot){
        var i, j, vy = [], vx = [], len, hit = false, x, y;

        x = dot[0];
        y = dot[1];

        for(i = 0, len = arr.length; i < len; i = i + 1){
            vx.push(arr[i].x);
            vy.push(arr[i].y);
        }

        for(i = 0, len = vx.length, j = len - 1; i < len; j = i, i = i + 1){
            if( ((vy[i] > y) != (vy[j] > y)) && (x < (vx[j] - vx[i]) * (y - vy[i]) / (vy[j] - vy[i]) + vx[i]) ){
                hit = !hit;
            }
        }

        return hit;
    }

    //Check if are the intersections in the selected point, and return the object that has been intersected
    function intersection (x, y) {
        var i, len, imageData, ret, cur, check;

        imageData = $context.getImageData(x, y, 1, 1).data[3];

        //Collision present, find out the object
        if(imageData){
            i = 0;
            len = polys.length;
            check = false;

            while(i < len && !check){
                cur = polys[i];
                cur = bakeTransform(cur);
                check = hits(cur.bake, [x, y]);
                i = i + 1;
            }

            ret = cur;
        }

        return ret;

    }

    function bakeTransform (poly){
        var i, len, cur, con;

        poly["bake"] = [];

        for(i = 0, len = poly.points.length; i < len; i = i + 1){

            cur = poly.points[i];
            con = poly.origin;

            poly.bake.push({x: cur.x + con[0], y: cur.y + con[1]});
        }

        return poly;
    }
    lermo
    function getCentroid(points){
        var i, len, cache, ret = {x: 0, y: 0};

        for(i = 0, len = points.length; i < len; i++) {
            cache = points[i];
            ret.x += cache.x;
            ret.y += cache.y;
        }
        ret.x /= points.length;
        ret.y /= points.length;

        return ret;
    }

    function getBoundingBox(points){
        var i, len, cache, mx, my, Mx, My;

        mx = Mx = points[0].x;
        my = My = points[0].y;

        for(i = 1, len = points.length; i < len; i = i + 1){
            cache = points[i];

            mx = mx > cache.x ? cache.x : mx;
            my = my > cache.y ? cache.y : my;
            Mx = Mx < cache.x ? cache.x : Mx;
            My = My < cache.y ? cache.y : My;
        }

        return [
            {x:mx, y:my},
            {x:Mx, y:my},
            {x:Mx, y:My},
            {x:mx, y:My}
        ];
    }

    function getBBoxIntersect(poly, tolerance){
        var mx, my, Mx, My, i, len, dx, dy, Dx, Dy, ret = [];

        mx = poly.boundingBox[0].x + poly.origin[0] - tolerance;
        my = poly.boundingBox[0].y + poly.origin[1] - tolerance;
        Mx = poly.boundingBox[2].x + poly.origin[0] + tolerance * 2;
        My = poly.boundingBox[2].y + poly.origin[1] + tolerance * 2;

        for(i = 0, len = polys.length; i < len; i = i + 1){

            dx = polys[i].boundingBox[0].x + polys[i].origin[0] - tolerance;
            dy = polys[i].boundingBox[0].y + polys[i].origin[1] - tolerance;
            Dx = polys[i].boundingBox[2].x + polys[i].origin[0] + tolerance * 2;
            Dy = polys[i].boundingBox[2].y + polys[i].origin[1] + tolerance * 2;

            if(
                (dx <= mx && mx <= Dx)&&(dy <= my && my <= Dy) ||
                (dx <= Mx && Mx <= Dx)&&(dy <= my && my <= Dy) ||
                (dx <= Mx && Mx <= Dx)&&(dy <= My && My <= Dy) ||
                (dx <= mx && mx <= Dx)&&(dy <= My && My <= Dy)
                ){
                ret.push(polys[i]);
            }
        }

        return ret;

    }

    function deselectPolys(){
        var sel, i, len, cache;

        sel = select(polys, {selected:true});

        for(i = 0, len = sel.length; i < len; i = i + 1){
            cache = sel[i];
            cache.selected = false;
        }

        self.refresh();

    }

    function getColor(j) {

        var i, rnd, color = "#";

        j = j || 3;

        for(i = 0; i < j; i = i + 1){
            rnd = parseInt(Math.random() * 15);
            if(rnd > 9){
                switch (rnd){
                    case 10:
                        rnd = "A";
                        break;
                    case 11:
                        rnd = "B";
                        break;
                    case 12:
                        rnd = "C";
                        break;
                    case 13:
                        rnd = "D";
                        break;
                    case 14:
                        rnd = "E";
                        break;
                    case 15:
                        rnd = "F";
                        break;
                }
            }
            color += rnd;
        }
        return color;
    }

    return  self = {

        //Inits globals,
        init: function () {

            $(document).ready(function () {

                $canvas = $("#canvas00");
                $context = $canvas.get(0).getContext("2d");
                theme = {
                    height: $canvas.height(),
                    width: $canvas.width(),
                    offset: $canvas.offset(),
                    fillStyle: "#202020",
                    strokeStyle: "#606060",
                    showBBox: false,
                    centroid: false
                };

                $canvas.get(0).setAttribute("width", theme.width);
                $canvas.get(0).setAttribute("height", theme.height);

                self.bind_events();
            });

        },

        //Binds click, drag and other DOM events to related actions
        bind_events: function () {
            var _defaultClick;

            $canvas
                .on("click.default", _defaultClick = function(e){

                    var offset, mx, my, ipoly;

                    offset = theme.offset;
                    mx = e.pageX - offset.left;
                    my = e.pageY - offset.top;

                    ipoly = intersection(mx, my);

                    if(ipoly){
                        ipoly.selected = !ipoly.selected;
                        self.draw(ipoly);
                    }

                })
                .on("drawPoly", function () {
                    var newPoly, offset;

                    $canvas.addClass("draw");
                    deselectPolys();

                    offset = theme.offset;
                    newPoly = {
                        points: [],
                        origin: [],
                        closed: true,
                        fillStyle: getColor(6),
                        strokeStyle: getColor(6),
                        dotStyle: getColor(6),
                        thickness: 4,
                        drawn: false,
                        selected: false,
                        temp: true
                    };

                    polys.push(newPoly);

                    $(this)
                        .off("click.default")
                        .on("click.draw", function (e) {

                            if(newPoly.points.length === 0){
                                newPoly.origin = [e.pageX - offset.left, e.pageY - offset.top];
                            }

                            newPoly.points.push({x: e.pageX - offset.left - newPoly.origin[0], y: e.pageY - offset.top - newPoly.origin[1]});
                            newPoly["boundingBox"] = getBoundingBox(newPoly.points);

                            self.draw(newPoly);
                            self.refresh(newPoly);

                        });
                })
                .on("savePoly", function () {
                    var newPoly, json, $list, name;

                    $canvas.removeClass("draw");

                    newPoly = polys[polys.length - 1];

                    if(newPoly.temp){
                        delete newPoly.temp;
                        newPoly["centroid"] = getCentroid(newPoly.points);
                    }

                    json = JSON.stringify(newPoly);
                    $list = $(".wbuttons > ul");
                    name = "Custom " + $list.find(".customPoly").length;
                    $list.append("<li class='customPoly' data='" + json + "'>" + name + "</li>");

                    $(this)
                        .off("click.draw")
                        .on("click.default", _defaultClick);

                });

            $(window).on("keypress.T", function (e) {
                var sel, offset, mx, my, i, len;

                if(e.which === 116){
                    offset = theme.offset;
                    sel = select(polys, {selected: true});

                    $(this).on("mousemove.drag", function (e) {
                        var cache;
                        mx = e.pageX - offset.left;
                        my = e.pageY - offset.top;

                        if(sel.length){
                            for(i = 0, len = sel.length; i < len; i = i + 1){
                                cache = sel[i];
                                //TODO verify why the refresh rate doesn't clear the region before the objects moves out of the original position, especially when the mouse moves fast.

                                self.refresh(cache, (function (clos) {

                                    clos.origin[0] = mx - cache.centroid.x;
                                    clos.origin[1] = my - cache.centroid.y;

                                }(cache)));
                            }
                        }

                    }).one("mouseup", function() {
                        $(this).off(".drag");
                    });
                }
            }).on("keypress.C", function(e){
                var sel, cache, i, len;
                if(e.which === 99){

                    for(i = 0; i <  polys.length; i = i + 1){
                        cache = polys[i];
                        if(cache.selected){
                            polys.splice(i,1);
                            self.clear(cache);
                            self.refresh();
                            i = i - 1;
                        }
                    }
                }
            });
        },

        addPoly: function (poly) {
            var defaultPoly;

            defaultPoly = {
                points: [
                    {x:0, y:0},
                    {x:40, y:40},
                    {x:-40, y:40}
                ],
                origin: [80, 80],
                closed: true,
                fillStyle: getColor(6),
                strokeStyle: getColor(6),
                dotStyle: getColor(6),
                thickness: 4,
                drawn: false,
                selected: false

            };

            poly = poly || defaultPoly;

            poly["centroid"] = getCentroid(poly.points);
            poly["boundingBox"] = getBoundingBox(poly.points);

            poly.drawn = true;
            polys.push(poly);
            self.draw(poly);

        },

        //This function draws polys from objects
        draw: function (obj) {
            var i, len, j, lenj, z, lenz, cache, dot, cache_pt, cache_bb, thickness, sX, sY;


            if(!(obj instanceof Array)){
                obj = [obj];
            }

            for(i = 0, len = obj.length; i < len; i = i + 1){

                cache = obj[i];

                thickness = cache.thickness;
                $context.lineWidth = thickness / 2;

                dot = parseInt(thickness / 2);

                sX = cache.origin[0];
                sY = cache.origin[1];
                $context.beginPath();
                $context.moveTo(sX, sY);

                for(j = 0, lenj = cache.points.length; j < lenj; j = j + 1){
                    cache_pt = cache.points;

                    if(cache.dotStyle){
                        $context.fillStyle = cache.dotStyle;
                        $context.fillRect(cache_pt[j].x + sX - dot, cache_pt[j].y - dot + sY, thickness, thickness);
                    }

                    if(cache.strokeStyle){
                        $context.strokeStyle = cache.strokeStyle;
                        $context.lineTo(cache_pt[j].x + sX, cache_pt[j].y + sY);
                        $context.stroke();
                    }

                    if(cache.fillStyle){
                        $context.fillStyle = cache.fillStyle;
                        $context.fill();
                    }
                }

                if(cache.closed){
                    $context.closePath();
                    $context.stroke();
                }

                if(cache.selected){
                    $context.fillStyle = "rgba(255,255,255,0.8)";
                    $context.fill();
                }

                cache.drawn = true;

                if(theme.showBBox){

                    $context.strokeStyle = "rgba(255,0,0,0.5)";
                    $context.beginPath();
                    $context.moveTo(cache.boundingBox[0].x + sX, cache.boundingBox[0].y + sY);

                    for(z = 1, lenz = cache.boundingBox.length; z < lenz; z = z + 1) {
                        cache_bb = cache.boundingBox[z];
                        $context.lineTo(cache_bb.x + sX, cache_bb.y + sY);
                        $context.stroke();
                    }

                    $context.closePath();
                    $context.stroke();
                }

                if(theme.centroid){
                    $context.fillStyle = "#FF0000";
                    $context.fillRect(sX + cache.centroid.x - thickness / 2, sY + cache.centroid.y - thickness / 2, thickness, thickness);
                }

            }
        },

        //Enable Show Bounding Box toggle.
        toggleBBox: function(state){
            theme.showBBox = state;
        },

        //Enable Show Center marker toggle.
        toggleCenter: function(state){
            theme.centroid = state;
        },

        //Clear the canvas
        clearAll: function (){
            $context.clearRect(0, 0, theme.width, theme.height);
        },

        clear: function (args){
            var i, len, orx, ory, cache_bb;

            if(!(args instanceof Array)){
                args =  [args]
            }

            for(i = 0, len = args.length; i < len; i = i + 1){
                orx = args[i].origin[0];
                ory = args[i].origin[1];
                cache_bb = args[i].boundingBox;
                $context.clearRect(
                    cache_bb[0].x + orx - 5,
                    cache_bb[0].y + ory - 5,
                    cache_bb[2].x - cache_bb[0].x + 10,
                    cache_bb[2].y - cache_bb[0].y + 10
                );

                $context.fillStyle = "rgba(100,100,100,0.2)";
                $context.fillRect(
                        cache_bb[0].x + orx - 5,
                        cache_bb[0].y + ory - 5,
                        cache_bb[2].x - cache_bb[0].x + 10,
                        cache_bb[2].y - cache_bb[0].y + 10
                );
            }
        },

        //Refresh the canvas and redraw objects
        refresh: function (sPoly, callback){
            var toWipe;

            callback = callback || function () {};

            if(sPoly){
                toWipe = getBBoxIntersect(sPoly, 5);
                self.clear(toWipe);
                self.draw(toWipe);
            }else{
                self.clearAll();
                self.draw(polys);
            }

            callback();

        },

        destroy: function () {
            self.clearAll();
            polys = [];
        },

        print: function () {
            console.log(polys);
        }

    }

}(jQuery));

$lib.init();