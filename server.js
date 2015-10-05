'use strict';

var morgan = require('morgan');
var _ = require("underscore");
var fs = require("fs");
var express = require('express'),
    bodyParser = require("body-parser"),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    crypto = require("crypto")
    ;
    


app.use(morgan('combined'));


app.use(express.static('public'));
app.use(bodyParser.json());


function __nsp__config(game) {
    var colors = ['#4c7a9f','#7a9f4c','#9f4c7a'];
    var nsp = io.of('/games/'+game.id);
    var sockets = [];
    
    nsp.on('connection', function(socket) {
        if (game.isStarted) return;
    
        //console.log('Game server ready for connections user');
        socket.on('player:register', function(player) {
            if (!player) return;
    
            console.log("Player ", player.id, " requests registration for game ", game.id);
    
            // Check that user is not already registered
            var exists = game.players.filter(function(x) { return x.id == player.id; }) != 0;
            if (exists) return;
            
            var p = {
                id: player.id,
                name: player.name,
                spd: {
                    x: 0,
                    y: 0
                },
                pos: {
                    x: 0,
                    y: 0
                }
            };
            
            var isAdmin = (game.players.length==0);
            
            socket.isAdmin = isAdmin;
            p.isAdmin = isAdmin;
            p.color = colors[game.players.length];
            game.players.push(p);
            sockets.push(socket);
    
            socket.emit('player:registered', {
                player: p,
                players: game.players
            });
            nsp.emit('player:list', game.players);
            
        });
        
        /**
         * game:start
         * 
         * Raised when game starts
         */
         socket.on("game:start", function() {
             
             var circuit = game.settings.circuit;
             
             console.info("Game requested from channel admin?: ", socket.isAdmin);
             
             if (game.isStarted) return;
             
             game.isStarted = true;
             
             // Set start positions
               for (var i = 0; i < game.players.length; i++) {
                    var pos = _.extend( {}, circuit.start[i] );
                    var spd = {x:0,y:0};
                    
                    var move = { pos: pos, spd: spd };
                    
                    // Position the player
                    game.players[i].pos = move.pos;
                    // Make speed = 0
                    game.players[i].spd = move.spd;
                    // Init movement history
                    game.players[i].moves = [ move ];
                }
                
                game.__index = game.players.length;
             
             nsp.emit("game:start", game.players);
             
             play_turn();
         });
         
         function play_turn() {
              var i = game.__index = (++game.__index)<game.players.length?game.__index:0;
              
              var player = game.players[i];
              var turnSocket = sockets[i];
              
              // http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io
              // Send to all clients except player's turn
              var p = _.extend({}, player, { amI: true });
              turnSocket.emit("game:turn", p);
              
              // Send player whose turn is
              var p = _.extend({}, player, { amI: false });
              turnSocket.broadcast.emit("game:turn", p);
         }
         
         /**
          * game:turn
          * 
          * Raised when game has 
          */
          socket.on("game:turn", play_turn );
          
          socket.on("game:move", function(move) {
              var i = game.__index;
              
              // If calling socket is not the one with the turn, reject
              if (sockets[i]!=socket) return;
              
              var player = game.players[i];
              var m = _.extend({}, move);
              player.moves.push(move)
              player.pos = m.pos;
              player.spd = m.spd; 
              
              nsp.emit("player:list", game.players);
              
              play_turn();
          });
         
    });
    
    game.nsp = nsp;
}

var games = {};

app.get("/games/:id", function(req, res) {
    var id = req.params.id;
    
    var game = games[id];
    
    if (game==undefined) return res.status(404);
    
    if (game.isStarted) return res.status(403).send("Game has already started");
    
    var result = {
        id: game.id,
        circuit: game.circuit
    };
    
    res.send(result);
});

app.get("/games/:id/players", function(req,res) {
    var id = req.params.id;
    
    var g = games[id];
    if (g==undefined) { 
        res.status(404);
        return;
    }
    res.send(g.players);
});

app.post("/games", function(req,res) {
    // http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js 
    // See also: http://stackoverflow.com/questions/7480158/how-do-i-use-node-js-crypto-to-create-a-hmac-sha1-hash
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    var hash = crypto.createHash('sha1').update(current_date + random).digest('hex');
    var defaults = {};
    var overrides = {
        id: hash,
        players: [],
        isStarted : false
    };
    
    var game = _.extend({}, defaults, req.body, overrides);
    
    if (!game.circuit) {
        res.status(400).send('Invalid circuit for game');
        return;
    }
    
    // Load circuit
    var obj;
    var file = 'public/assets/circuits/' + game.circuit +'/settings.json';
    
    
    
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) return res.status(500).send(err);
        
        game.settings = { circuit : JSON.parse(data) };
        
        console.info('Created game '+game.id+' with circuit '+game.circuit);
    
        __nsp__config(game);
    
        games[hash] = game;  
        var output = _.extend({}, { id: game.id }, { circuit: game.circuit });
        res.send(output);
    });
    
    
});

var circuits = [
    { id: 'shanghai', name: 'Shanghai'},
    { id: 'montecarlo', name: 'Montecarlo'}
];

app.get('/circuits', function(req,res) {
   res.send(circuits) ;
});


http.listen(process.env.PORT, function() {
    console.log('Express server started on port %s', process.env.PORT);    
});

