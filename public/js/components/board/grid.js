'use strict';

(function (window) {
    
    function Grid(w,h) {
        this.w = w;
        this.h = h;
    }
    
    Grid.prototype.create = function() {
        var grid = [];
        for (var i=0; i<this.w; i++) {
            for (var j=0; j<this.h; j++) {
                grid.push({ x:i, y:j});
            }
        }
        return grid;
    }
    
    window.Grid = Grid;
})(window);