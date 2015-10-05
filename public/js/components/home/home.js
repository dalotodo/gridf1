(function (angular) {
    'use strict';

    var app = angular.module('gridf1.home', ['ui.router','gridf1.circuit', 'gridf1.game']);
    
    app.controller('homeCtrl', ['$scope', '$state', '$stateParams', 'circuitService', 'gameManagementService', '$q', '$timeout',
        function($scope, $state, $stateParams, cs, gms, $q, $timeout) {
            $scope.isReady = $scope.isSuccess = $scope.isFalse = false;
            
            $scope.selectCircuit = function(c) {
                $scope.circuit = c;
            };
            
            cs.getCircuits()
                .then( function(circuits) {
                    $scope.circuits = circuits;
                    $scope.isReady = $scope.isSuccess = true;        
                    $scope.selectCircuit($scope.circuits[0]);
                });

            $scope.game = $stateParams.game;

            $scope.create = function() {
                gms.create({
                        circuit: $scope.circuit.id
                    })
                    .then(function(game) {
                        $scope.game = game;
                        var player = {
                            id: $scope.username,
                            name: $scope.displayName
                        };
                        $state.go("play", {
                            game: $scope.game,
                            player: player
                        });
                    });
            }

            $scope.join = function() {
                gms.getGame($scope.game)
                    .then(function(game) {
                        $scope.game = game;
                        var player = {
                            id: $scope.username,
                            name: $scope.displayName
                        };
                        $state.go("play", {
                            game: $scope.game,
                            player: player
                        });
                    });
            }

        }
    ]);
    
})(window.angular);