'use strict';
(function(angular, io) {

    var app = angular.module('socket.io', []);

    app.service('$io', function IOFactory() {
        return io;
    });

})(window.angular, window.io);