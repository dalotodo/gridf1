'use strict';
(function (angular, undefined) {
    
    var app = angular.module('gridf1.circuit', []);
    
    var settings = {
        baseUrl : '/assets/circuits/'
    };
    
    function CircuitServiceFactory($http, $q) {
        
        function CircuitService() {
        }
        
        CircuitService.prototype.getCircuits = function() {
            var d = $q.defer();
            
            $http.get('/circuits')
                .success(function(circuits) {
                    d.resolve(circuits);
                })
                .error(function(err) {
                    d.reject(err);
                });
            
            return d.promise;
        };
        
        CircuitService.prototype.loadCircuit = function(circuit) {
            var baseUrl = settings.baseUrl + circuit + '/';
            
            var hasSettings = false, hasLayout = false;
            
            return $q.all([
                    $http.get(baseUrl + 'settings.json')
                        .success(function(settings) {
                            hasSettings = true;
                            return settings;
                        }),
                    $http.get(baseUrl + 'layout.svg')
                        .success(function(layout) {
                            hasLayout = true;
                            return layout;
                        })
                ]).then( function(results) {
                    
                    if (!hasSettings) return $q.reject('Could not load circuit settings file');
                    if (!hasLayout) return $q.reject('Could not load circuit layout file');
                    
                    var c = {
                        id: circuit,
                        // Tweak to force to get response from XHttpRequest 
                        settings : results[0].data,
                        layout : results[1].data
                    };
                    
                    return c;
                });
        }
        
        return new CircuitService();
        
    }
    
    app.provider('circuitService', function() {
        this.$get = ['$http', '$q', CircuitServiceFactory];
        
        this.setBaseURL = function(url) {
            settings.baseUrl = url;
        }
    });
    
})(window.angular);