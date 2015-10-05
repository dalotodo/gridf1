'use strict';
(function (container, d3, $) {


if (!container.Grid) throw 'Grid factory not found. grid.js is required';
if (!container.Movements) throw 'Movements factory not found. movements.js is required';

var Grid = container.Grid, 
    Movements = container.Movements
    ;

var identity = {
    x: function(d) { return d; },
    y: function(d) { return d; },
}


var defaults = {
    useBackground: true
};

function CircuitRenderEngine(element, options) {
    this.element = element;

    var svg = this.element;
    
    this.options = $.extend({}, defaults, options);
    
    var viewport = this.viewport = svg.append("g").attr("id","viewport");
    
    this.background = viewport.append("g").attr("id", "background");
    this.grid = viewport.append("g").attr("id", "grid");
    this.layout = viewport.append("g").attr("id", "layout");
    this.paths = viewport.append("g").attr("id", "paths");
    this.moves = viewport.append("g").attr("id", "moves");
    this.scale = identity;
    
   
}
    
CircuitRenderEngine.prototype.setViewBox = function(w,h) {
    var svg = this.element;
    var options = this.options;
    
    var svgWidth = svg.attr("width");
    var svgHeight = svg.attr("height");
    
    var viewBox = this.viewBox = { width: w, height: h };
    
    svg.attr("viewBox", [0,0,w,h]);
    svg.attr("preserveAspectRatio", "xMidYMid slice");
    
    var x = d3.scale.linear()
        .domain([0,viewBox.width])
        .range([0,svgWidth])
        ;
        
    var y = d3.scale.linear()
        .domain([0,viewBox.width])
        .range([0,svgHeight])
        ;
        
    //var transform = this.scale = { x: x, y: y };
    var transform = this.scale;
    
    
    var bg = this.background;
    
    if (options.useBackground) {
        bg.select("rect").remove();
        bg.append("rect")
            .classed("background grab",true)
            .attr("x", transform.x(0))
            .attr("y", transform.y(0))
            .attr("width", transform.x(w))
            .attr("height", transform.y(h))
        ;
    }
    
    var viewport = this.viewport;
    // create the zoom listener
	// https://truongtx.me/2014/03/13/working-with-zoom-behavior-in-d3js-and-some-notes/
	var zoomListener = d3.behavior.zoom()
		.scaleExtent([1, 20])
		.x(x)
		.y(y)
		.on("zoom", zoomHandler)
		;

	// function for handling zoom event
	function zoomHandler() {
  		viewport.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
	}
	
	// apply the zoom behavior to the svg image
	zoomListener(this.viewport);
    
}

CircuitRenderEngine.prototype.resize = function(width, height) {
    var svg = this.element;
    
    var viewBox = this.viewBox;
    
    svg
        .attr("width", width)
        .attr("height", height);
        
    var x = d3.scale.linear()
        .domain([0,viewBox.width])
        .range([0,width])
        ;
        
    var y = d3.scale.linear()
        .domain([0,viewBox.width])
        .range([0,height])
        ;
        
    var viewport = this.viewport;
    
    this.viewport.select().on(".zoom", null);
    
    // create the zoom listener
	// https://truongtx.me/2014/03/13/working-with-zoom-behavior-in-d3js-and-some-notes/
	var zoomListener = d3.behavior.zoom()
		.scaleExtent([1, 20])
		.x(x)
		.y(y)
		.on("zoom", zoomHandler)
		;

	// function for handling zoom event
	function zoomHandler() {
  		viewport.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
	}
	
	// apply the zoom behavior to the svg image
	zoomListener(this.viewport);
}

CircuitRenderEngine.prototype.drawCircuit = function(svgLayout) {
    var html = $(svgLayout).find("#circuit").html();
    this.layout.html(html);
}

CircuitRenderEngine.prototype.setCircuitURL = function(w,h,href) {
    
    this.layout
        .append("svg:image")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", w)
        .attr("height", h)
        .attr("xlink:href", href);
        
}

CircuitRenderEngine.prototype.drawGrid = function(w,h) {
    var transform = this.scale;

    var options = this.options;
    
    if (!options.drawGrid) return;
    
    var data = new Grid(w,h).create();

    
    var grid = this.grid.selectAll("circle.dot")
        .data(data)
        ;
    
        
    grid.enter()
        .append("circle")
        .classed("dot",true)
        .attr("cx", function(d) { return transform.x(d.x) })
        .attr("cy", function(d) { return transform.y(d.y) })
        .attr("r", function(d) { return 0.1; })
        ;
}

CircuitRenderEngine.prototype.drawPlayer = function(player) {
    
    if ((typeof player.moves==='undefined') || (!player.moves.length)) return; 
    
    var paths = this.paths;
    
    var drawLine=d3.svg.line()
	    .x(function(d) {return d.pos.x; })
	    .y(function(d) { return d.pos.y; })
	    .interpolate("linear");
	
	
    var color = d3.rgb(player.color);
    var playerPath = paths.selectAll("path").filter("."+player.id);
    
    var drawPath = function () {
        var col = this;
        
        col
        .classed(player.id, true)
        .attr("d", function(d) { return drawLine(d.moves) } )
        .attr("stroke-width", function(d) { return 0.2; })
        .attr("stroke", function(d) { return color; })
        .attr("fill", "none")
    }
    
    var p = playerPath
        .data([ player ])
        ;
        
        p.call(drawPath);
        
        p.enter()
        .append("path")
        .call(drawPath)
        
        ;
        
    var circles = paths.selectAll("circle").filter("."+player.id);
    circles.remove();
    
    circles
        .data(player.moves)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return d.pos.x; })
        .attr("cy", function(d) { return d.pos.y; })
        .attr("r", function(d) { return 0.3; })
         .attr("stroke-width", function(d) { return 0.2; })
        .attr("stroke", function(d) { return color; })
        .attr("fill", "#fff")
        ;
        
}

CircuitRenderEngine.prototype.drawPlayerMoves = function(players, player, callback) {

    var transform = this.scale;

    var constraints = players.map(function (p) { return p.pos });
	
	var isPlayerMovement = function (col, m) {
		for (var i=0; i<col.length; i++) {
			var p = col[i];
			if ((m.x==p.x)&&(m.y==p.y)) return true;
		}
		return false;
	}
	
	var isOutsideBoard = function(m) {
	    return false;
	}
	
	var movements = new Movements()
            // Calculate positions
            .calculate(player.pos, player.spd)
            // Make sure don't overlap other player
            .filter(function(m) { return !isPlayerMovement(constraints,m.pos); })
            .filter(function(m) { return !isOutsideBoard(m.pos)})
            ;
        

    var color = d3.rgb(player.color);

    var d3MovsLayer = this.moves;
    var d3Movs = d3MovsLayer.selectAll("circle.move");
    d3Movs.remove();

    var d3NewMovs = d3MovsLayer.selectAll("circle.move")
        .data(movements)
        .enter()
        .append("circle")
        .classed("move", true)
        .attr("cx", function(d) { return d.pos.x; })
        .attr("cy", function(d) { return d.pos.y; })
        .attr("r", function(d) { return 0.3 + 0.1 * d.dist; })
        .attr("stroke-width", function(d) { return 0.1; })
        .attr("stroke", function(d) { return color; })
        .attr("fill", function(d) { return color; });

    d3NewMovs.on("click", function(d, i) {
        // 2015-10-04: Forced to omit check due to zoom behavior
       // if (d3.event.defaultPrevented) return; // click suppressed
        var move = _.extend({}, d);

        // Remove old elements
        d3MovsLayer.selectAll("circle.move").remove();

        // Make a callback indicating that move has been made
        (callback && callback.call && callback.call(null, move));


    });
}
    
container.CircuitRenderEngine = CircuitRenderEngine;
    
})(window, window.d3, window.jQuery);
