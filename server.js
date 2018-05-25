// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var mysql = require("mysql");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var x, y, iddb, nickname;

app.set('port', 8080);
app.use('/static', express.static(__dirname + '/static'));

var connection = mysql.createPool({
  host : 'localhost',
  user : 'root',
  database : 'coordbase'
});

var players = {};

connection.getConnection(function(err){
if(!err){
    console.log("Connected");
  }
  else{
    console.log("Error");
  }
});

app.get('/', function(req, res){
   res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/main', function(request, response) {
    response.sendFile(path.join(__dirname, 'index1.html'));
});

io.on('connection', function(socket) {

    socket.on('new player', function() {
        io.sockets.emit('writeUserIdEvent', socket.id);
        players[socket.id] = {
          x: x,
          y: y,
          id: socket.id,
          iddb: iddb,
          nick: nickname
        };
    });

    socket.on('readPlaceCoords', function(){
        connection.query("SELECT * FROM `coordbase`.`coordsgame`", function(err, result){
            console.log(result);
            io.sockets.emit('writePlaceCoordsToArray', result);
        });
    });

    socket.on('movement', function(data) {
        var player = players[socket.id] || {};
        if(data.left){
            player.x -= 0.0004;
        }
        if(data.up){
            player.y += 0.0003;
        }
        if(data.right){
            player.x += 0.0004;
        }
        if(data.down){
            player.y -= 0.0003;
        }
    });

    socket.on('writePlaceCoords', function(crdsX, crdsY, link){
        connection.query("INSERT INTO `coordbase`.`coordsgame` (`x`, `y`, `link`) VALUES ('" + crdsX + "', '" + crdsY + "', '" + link + "')", function(err, result){});
    });

    socket.on('disconnect', function() {
        console.log('Client ' + socket.id + ' disconnected');
        if(players[socket.id]){
            connection.query("UPDATE  `coordbase`.`coordtable` SET  `coordY` = '" + players[socket.id].y + "' WHERE  `coordtable`.`id` =  '" + players[socket.id].iddb + "'" , function(err, result){});
            connection.query("UPDATE  `coordbase`.`coordtable` SET  `coordX` = '" + players[socket.id].x + "' WHERE  `coordtable`.`id` =  '" + players[socket.id].iddb + "'" , function(err, result){});
        }
        players[socket.id] = undefined;
        delete players[socket.id];
    });

});

    app.get("/authorization", function(req, res){
        connection.query("SELECT * FROM coordtable WHERE login = '" + req.query.login + "' AND password = '" + req.query.password + "'", function(err, result){
            if(result!=0){
                nickname = result[0].nickname;
                x = result[0].coordX;
                y = result[0].coordY;
                iddb = result[0].id;
                io.sockets.emit('redir');
                connection.query("SELECT * FROM coordsgame", function(err, result){
                    if(result!=0){
                        console.log(result);
                        io.sockets.emit('writeGameCoordsToObject');
                    }
                });
            }
        });                
    });

    app.get('/registration', function(req, res){
        connection.query("SELECT id FROM coordtable WHERE nickname = '" + req.query.nickname + "'", function(err, result){
            if(result==0){
                connection.query("SELECT id FROM coordtable WHERE login = '" + req.query.login + "'", function(err, result){
                    if(result==0){
                        connection.query("INSERT INTO coordtable (`nickname`, `login`, `password`, `coordX`, `coordY`) VALUES ('" + req.query.nickname + "', '" + req.query.login + "', '" + req.query.password + "', '29.2225', '53.1446')", function(err, result){
                            console.log("Регистрация прошла успешно");
                        });
                    }else{
                        console.log("Логин существует");
                    }
                });
            }else{
                console.log("Ник существует");
            }
        });
    });

setInterval(function() {
    io.sockets.emit('updateStateEvent', players);
}, 1000 / 60);

server.listen(8080, function() {
    console.log('Starting server on port 5000');
});
