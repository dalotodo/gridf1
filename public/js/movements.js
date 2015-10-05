(function (container)  {

var __available_movements=[ 
	{x: -1, y: -1 },
	{x: -1, y: 0 },
	{ x: -1, y: 1 },
	{ x: 0, y: 1 },
	{ x: 0, y: -1 },
	{ x: 0, y: 0 },
	{ x: 1, y: -1 },
	{ x: 1, y: 0 },
	{ x: 1, y: 1 }
	];
	
var __dist = {
		absolute: function(p0, p1) { return Math.abs(p1.x-p0.x) + Math.abs(p1.y-p0.y)  },
		euclidean: function(p0, p1) { return Math.sqrt( Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2) ) }
	};
	
function Movements()  {
    
}

Movements.prototype.calculate = function(pos, spd) {

	var movements = __available_movements.map( function(m) {
		var m_spd = { x: spd.x+m.x, y: spd.y+m.y };
		var m_pos = { x: pos.x + m_spd.x, y: pos.y + m_spd.y }; 
		var dist = __dist.euclidean(spd, m_spd);
		return {
			pos: m_pos, 
			spd: m_spd,
			dist: dist
		};
	});
	
	return movements;
    
}
	
container.Movements = Movements;
    
})(window);

