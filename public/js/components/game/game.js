'use strict';

/* GAME SERVICE */
(function(angular, undefined) {
    
    var app = angular.module('gridf1.game', ['gridf1.players', 'underscore', 'socket.io']);
    
    function GameManagementServiceFactory($http, $q) {
        function GameManagementService() {
        }
        
        GameManagementService.prototype.create = function(options) {
            var d = $q.defer();
            
            $http.post("/games", options)
                .success(function(game) {
                    d.resolve(game);
                })
                .error(function(msg) {
                    d.reject(msg);
                });
            
            return d.promise;
        }
        
        GameManagementService.prototype.getGame = function(id) {
            var d = $q.defer();
            
            var url = '/games/' + id;
            $http.get(url)
                .success(function(game) {
                    d.resolve(game);
                })
                .error( function(msg) {
                    d.reject(msg);
                });
        
            return d.promise;
        }
        
        return new GameManagementService();
    }
    
    app.provider('gameManagementService', 
    function() {
        this.$get = ['$http', '$q', GameManagementServiceFactory ];
    });
 
    function GameServiceFactory($http, $q, $timeout, _, $io) {
        
        function GameService() {
            this.__players = [];
            this.__circuit = {};
            this.__index = 0;
        }
        
        var defaults = {
            pos: { x: 0, y: 0 },
            spd: { x: 0, y: 0 },
            moves: []
        };
        
        
        
        GameService.prototype.addPlayer = function( player ) {
            var d = $q.defer();
            var svc = this;
            $timeout( function() {
                var p = _.extend( {}, player, defaults );
                svc.__players.push(p);
                d.resolve(p);
            }, 1000);
            
            return d.promise;
        }
        
         GameService.prototype.getPlayers = function() {
            var d = $q.defer();
            
            var svc = this;
            $timeout( function() {
                d.resolve(svc.__players);
            }, 1000);
            
            return d.promise;
        }
        
        GameService.prototype.getNextPlayer = function() {
            var d = $q.defer();
            
            var svc = this;
            
            $timeout( function() {
                var i = (++svc.__index)<svc.__players.length?svc.__index:0;
                
                var player = svc.__players[i];
                svc.__index = i;
                d.resolve({ 
                    'players': svc.__players,
                    'player': player
                });
            }, 1000);
            
            return d.promise;
        }
        
        GameService.prototype.setCircuit = function(circuit) {
            this.__circuit = circuit;
            
            var d=$q.defer();
            var svc = this;
            
            $timeout( function() {
                d.resolve(svc.__circuit);
            }, 1000);
            return d.promise;
        }
        
        GameService.prototype.startGame = function() {
            // Assign positions to the players using circuit's settings
            var d = $q.defer();
            if (this.__players.length > this.__circuit.length) {
                d.reject('Too many players for this circuit.');
            }
            else {
                for (var i = 0; i < this.__players.length; i++) {
                    var pos = _.extend( {}, this.__circuit.settings.start[i] );
                    var spd = {x:0,y:0};
                    
                    var move = { pos: pos, spd: spd };
                    
                    // Position the player
                    this.__players[i].pos = move.pos;
                    // Make speed = 0
                    this.__players[i].spd = move.spd;
                    // Init movement history
                    this.__players[i].moves = [ move ];
                }
                this.__index = this.__players.length;
                d.resolve();
            }
            
            return d.promise;
        }
        
        GameService.prototype.makeMove = function(move) {
            var d = $q.defer();
            var svc = this;
            $timeout(function() {
                var player = svc.__players[svc.__index];
                var m = _.extend({}, move);
                player.moves.push(move)
                player.pos = m.pos;
                player.spd = m.spd;
                d.resolve();
            }, 1000);
        
            return d.promise;
        }
                
        return new GameService();
    }
    
    
    app.provider('gameService', 
    function() {
        this.$get = ['$http', '$q', '$timeout', 'underscore', '$io', GameServiceFactory ];
    });
    
    
    
    /**
     * @ngdoc object
     * @name gridf1.game.gameCtrl
     * 
     * @requires gridf1.game.gameService
     * @requires gridf1.game.playerService
     * @requires gridf1.game.circuitService
     * 
     * @desription
     * `gameCtrl` takes the responsiibility to glue real-time game service with 
     * UI
     * 
     */
    
    app.controller('gameCtrl', ['$scope', '$stateParams', '$q', '$io', 'circuitService', 'gameService', 
	function ($scope, $stateParams, $q, $io, circuitService, gameService) {
	    $scope.game = $stateParams.game;
	    $scope.player = $stateParams.player;
	    
	    
	    
	    var socket = $io.connect('/games/'+$stateParams.game.id);
	    
	    socket.emit("player:register", $scope.player);
	    
		$scope.isReady = $scope.isSuccess = $scope.isError = false;
		
		$scope.circuitName = $scope.game.circuit; 
		$scope.players = [];
		
		socket.on("player:registered", function(registration) {
		    $scope.$apply( function() {
		        $scope.player = registration.player;
		        $scope.players = registration.players;
		    });
		});
		
		socket.on("player:isAdmin", function(isAdmin) {
		    $scope.player.isAdmin = isAdmin;
		});
		
		socket.on("player:list", function(players) {
		   $scope.$apply(function() {
		        $scope.players = players;  
		   });
		});
		
		$scope.start = function() {
		    socket.emit("game:start");
		}
		
		socket.on("game:start", function(players) {
		     
		     $scope.$apply(function() {
		        $scope.isStarted = true;
		        $scope.players = players;  
		    });
		});
		
		socket.on("game:turn", function(turn) {
		    $scope.$apply(function() {
		        
		        $scope.turn = turn;
		        
		        if (turn.amI) {
		            $scope.currentPlayer = turn;
		        }
		        else {
		            $scope.currentPlayer = undefined;
		        }
		    });
		});
		
		circuitService.loadCircuit($scope.circuitName)
                    .then( function(c) {
                        $scope.circuit = c;
                        gameService.setCircuit(c);
                        $scope.isReady = $scope.isSuccess = true;
                    })
		
		/*
		$q.all([
				gameService.addPlayer({
					id: 'steijido',
					name: 'Sergio «Poo Poo» Teijido',
					color: '#4c7a9f'
				}),
				gameService.addPlayer({
					id: 'sgutierrez',
					name: 'Santiago «Arrasquetti» Gutierrez',
					color: '#7a9f4c'
				}),
				gameService.addPlayer({
					id: 'pperez',
					name: 'Pablo «Brembo Jones» Perez',
					color: '#9f4c7a'
				})
			])
			.then(function() {
				return circuitService.loadCircuit($scope.circuitName)
                    .then( function(c) {
                        $scope.circuit = c;
                        gameService.setCircuit(c);
                        $scope.isCircuitLoaded = true;
                    });
			})
			.then(function() {
				return gameService.getPlayers();
			})
			.then(function(players) {
				$scope.players = players;
				$scope.isReady = $scope.isSuccess = true;
			}, function(err) {
				console.warn(err);
				$scope.isReady = $scope.isError = true;
			});
		*/
		/*
		function playTurn() {
			gameService
				.getNextPlayer()
				.then( function(turn) {
					$scope.players = turn.players;
					$scope.currentPlayer = turn.player;
				});
		}
			
		
		
		$scope.nextTurn = function(move) {
			gameService.makeMove(move)
				
				.then( function() {
					playTurn()
				});
			
		}
		*/
		
		$scope.makeMove = function(move) {
		    socket.emit("game:move", move);
		}
		
				
	}]);
	
	
    
})(window.angular);