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
  host : 'be5q9ckhe-mysql.services.clever-cloud.com',
  user : 'ueesnshdnz2x5mxg',
  database : 'be5q9ckhe',
  password : '8I1e6xtecvq9osbKtZg',
  port : '3306' 
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

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
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

    socket.on('new client', function(){
        io.sockets.emit('writeClientIdEvent', socket.id);
    });

    socket.on('readPlaceCoords', function(){
        connection.query("SELECT * FROM coordsgame", function(err, result){
            console.log(result);
            io.sockets.emit('writePlaceCoordsToArray', result);
        });
    });

    socket.on('sendMessToServer', function(messText, userId){
        io.sockets.emit('sendMessToClients', messText, players[userId].nick);
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
        connection.query("INSERT INTO coordsgame (`x`, `y`, `link`) VALUES ('" + crdsX + "', '" + crdsY + "', '" + link + "')", function(err, result){});
    });

    socket.on('disconnect', function() {
        console.log('Client ' + socket.id + ' disconnected');
        if(players[socket.id]){
            connection.query("UPDATE coordtable SET `coordY` = '" + players[socket.id].y + "' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
            connection.query("UPDATE coordtable SET `coordX` = '" + players[socket.id].x + "' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
            connection.query("UPDATE coordtable SET `status` = 'offline' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
        }
        players[socket.id] = undefined;
        delete players[socket.id];
    });

    socket.on('reconnect', function() {
        console.log('Client ' + socket.id + ' disconnected');
        if(players[socket.id]){
            connection.query("UPDATE coordtable SET `coordY` = '" + players[socket.id].y + "' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
            connection.query("UPDATE coordtable SET `coordX` = '" + players[socket.id].x + "' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
            connection.query("UPDATE coordtable SET `status` = 'offline' WHERE id = '" + players[socket.id].iddb + "'" , function(err, result){});
        }
        players[socket.id] = undefined;
        delete players[socket.id];
    });

    socket.on('registration', function(nick, login, password){
        connection.query("SELECT id FROM coordtable WHERE nickname = '" + nick + "'", function(err, result){
            if(result==0){
                connection.query("SELECT id FROM coordtable WHERE login = '" + login + "'", function(err, result){
                    if(result==0){
                        connection.query("INSERT INTO coordtable (`nickname`, `login`, `password`, `coordX`, `coordY`, `status`) VALUES ('" + nick + "', '" + login + "', '" + password + "', '29.2225', '53.1446', 'offline')", function(err, result){
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

    socket.on('authorization', function(login, password){
         connection.query("SELECT * FROM coordtable WHERE login = '" + login + "' AND password = '" + password + "'", function(err, result){
            if(result!=0&&result[0].status == 'offline'){
                nickname = result[0].nickname;
                x = result[0].coordX;
                y = result[0].coordY;
                iddb = result[0].id;
                connection.query("UPDATE coordtable SET  `status` = 'online' WHERE id =  '" + result[0].id + "'" , function(err, result){});
                connection.query("SELECT * FROM coordsgame", function(err, result){
                    if(result!=0){
                        console.log(result);
                        io.sockets.emit('writeGameCoordsToObject');
                    }
                });
                io.sockets.emit('enterance', socket.id);
            }
            else{

            }
        });           
    });

});

setInterval(function() {
    io.sockets.emit('updateStateEvent', players);
}, 1000 / 60);

server.listen(8080, function() {
    console.log('Starting server on port 5000');
});
