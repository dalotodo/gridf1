'use strict';

(function (angular, undefined) {
    
    var app = angular.module('gridf1.players', []);
    
    
    function PlayerServiceFactory($http, $q, $timeout) {
        
        function PlayerService() {
            this.__players = [];
            this.__index = 0;
        }
    
        PlayerService.prototype.registerPlayer = function(player) {
            var d = $q.defer();
            
            var svc = this;
            
            $timeout( function() {
                svc.__players.push(player);
                d.resolve();
            }, 1000);
            
            return d.promise;
        }
        
       
        
        
        
        return new PlayerService();
    }
    
    
    app.provider('playerService', 
    function() {
        this.$get = ['$http', '$q', '$timeout', PlayerServiceFactory ];
    })   
    
})(window.angular);