'use strict';

(function (angular, d3, undefined) {
    
    var app = angular.module('gridf1.board', ['gridf1.circuit']);
    
    
    
    
    app.directive('ccBoard', ['$window', '$document', '$location',
        function($window, $document, $location) {
            return {
                restrict: 'E',
                scope: {
                    circuit: '=',
                    player: '=',
                    players: '=',
                    onTurn: '&onturn'
                },
                replace: true,
                transclude: true,
                templateNamespace: 'svg',
                template: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ng-transclude></svg>',
                controller: function($scope) {
                    $scope.isReady = $scope.isSuccess = $scope.isFailure = false;
    
                    $scope.hasCircuit = false;
                    this.engine = undefined;
    
                    this.__engineListeners = [];
    
                    var ctrl = this;
    
                    this.addEngineListener = function(callback) {
                        ctrl.__engineListeners.push(callback);
                        // Notify callback
                        callback(ctrl.engine);
                    }
    
                    this.notifyEngineListeners = function(engine) {
                        for (var i = 0; i < this.__engineListeners.length; i++) {
                            ctrl.__engineListeners[i](engine);
                        }
                    }
    
                    this.addEngineListener(function(engine) {
                        ctrl.engine = engine;
                    });
    
    
                    $scope.$watch('circuit', function(newValue, oldValue) {
                        var c = newValue;
                        if (typeof c === 'undefined') {
                            ctrl.notifyEngineListeners(undefined);
                            $scope.hasCircuit = false;
                            return;
                        }
    
                        var engine = new CircuitRenderEngine($scope.svg, c.settings);
    
                        var protocol = $location.protocol();
                        var host = $location.host();
                        var path = '/assets/circuits/' + c.id + '/layout.svg';
                        var url = [protocol, '://', host, path].join('');
    
                        engine.setCircuitURL(c.settings.width, c.settings.height, url);
                        //engine.drawCircuit(c.layout);
    
                        ctrl.notifyEngineListeners(engine);
    
                        engine.setViewBox(c.settings.width, c.settings.height);
                        engine.drawGrid(c.settings.width, c.settings.height);
    
                        $scope.hasCircuit = true;
                    });
    
    
    
                    $scope.$watch('player', function(newValue, oldValue) {
                        var player = newValue;
                        if (typeof player === 'undefined') return;
    
                        if ($scope.hasCircuit) {
                            var engine = ctrl.engine;
                            engine.drawPlayer(player);
                            engine.drawPlayerMoves($scope.players, player, function(move) {
                                // A movement has been made. Notify parent
                                // http://weblogs.asp.net/dwahlin/creating-custom-angularjs-directives-part-3-isolate-scope-and-function-parameters
                                var cb = $scope.onTurn();
                                cb && cb.call && cb(move);
                            });
                        }
                    });
                    
                    // Temporarily disable Window resize event
                    if (false) {
                        var wnd = angular.element($window);
                        var dimensions = [];
                    
                        $scope.getWindowDimensions = function() {
                            dimensions = [wnd.innerWidth(), wnd.innerHeight()];
                            return dimensions;
                        };
                    
                        // http://jsfiddle.net/jaredwilli/SfJ8c/
                        $scope.$watch($scope.getWindowDimensions, function(newValue, oldValue) {
                            var engine = ctrl.engine;
                            if (!engine) return;
                            var w = newValue[0],
                                h = newValue[1];
                    
                            engine.resize(w - 5, h - 5);
                        }, true);
                    
                        wnd.bind("resize", function() {
                            $scope.$apply();
                        });
                    }
                    $scope.isReady = $scope.isSuccess = true;
                },
    
                link: function($scope, element, attrs, ctrl) {
                    var item = element[0];
    
                    var
                        w = element.parent().width(),
                        h = element.parent().height();
    
                    var svg = d3.select(item);
                    svg
                        .attr("width", w)
                        .attr("height", h);
                        
                    $scope.svg = svg;
                }
            }
        }
    ]);
    
    app.directive('ccPath', ['$document', function($document) {
        return {
            restrict: 'E',
            scope: {
                player: '='
            },
            replace: true,
            require: [ 'ccPath', '^ccBoard' ],
            transclude: true,
            templateNamespace : 'svg',
            template: '<g class="path {{ player.id }}"></g>',
            controller: function($scope) {
                /* http://stackoverflow.com/questions/14712089/how-to-deep-watch-an-array-in-angularjs */
                // https://docs.angularjs.org/api/ng/type/$rootScope.Scope
                
                this.engine = undefined;
                
                var ctrl = this;
                
                var player = $scope.player;
                
                $scope.$watchCollection('player.moves', function(newValue, oldValue) {
                    if (newValue===undefined) return;
                    if (ctrl.engine===undefined) return;
                    
                    ctrl.engine.drawPlayer(player);    
                });
                
            },
            link: function($scope, element, attrs, ctrls) {
                var selfCtrl = ctrls[0],
                    boardCtrl = ctrls[1]
                    ;
                
                boardCtrl.addEngineListener(function(engine) {
                    selfCtrl.engine = engine;
                });
                
            }
        }
    }]);
    
})(window.angular, window.d3);