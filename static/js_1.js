var map, userId, clientId;
var totalColPlace = -1, gameLink;

var socket = io();

var regVar = {}

var domVar = {}

var crds = {
	canvClickCrds: {},
	mapCenterCrds: {},
	mapPlaceCrds: [],
	convertCoordinates : {
		toPixels : function(mode, center, object, displaySize){
			switch(mode){
				case 'x':
					return displaySize * (object - (center.x - kx)) / ((center.x + kx) - (center.x - kx));
				break;
				case 'y':
					return displaySize * (object - (center.y + ky)) / ((center.x + ky) - (center.x - ky)) * -1;
				break;
			}
		},
		toDegrees : function(mode, center, object, displaySize){
			switch(mode){
				case 'x': 
					return (center[1] - kx) + (((center[1] + kx) - (center[1] - kx)) * object.x) / displaySize;
				break;
				case 'y':
					return (center[0] + ky) - (((center[0] + ky) - (center[0] - ky)) * object.y) / displaySize;
				break;
			}
		}
	},
	checkForPlaceCoordinates : function(center, object){
		for(var i = 0;i < totalColPlace;i++){
			if(center[1] > crds.mapPlaceCrds[i].x - 0.001&& center[1] < crds.mapPlaceCrds[i].x + 0.001&& center[0] > crds.mapPlaceCrds[i].y - 0.001&& center[0] < crds.mapPlaceCrds[i].y + 0.001){
				var tot = i;
				var link = crds.mapPlaceCrds[tot].link;
				document.location.href = link;
			}
			else{
				
			}
		}
	},
	addPlaceCoordinates : function(center, object){
		totalColPlace++;
		crds.mapPlaceCrds.push({});
		crds.mapPlaceCrds[totalColPlace - 1].x = crds.convertCoordinates.toDegrees('x', center, object, canvas.width);
		crds.mapPlaceCrds[totalColPlace - 1].y = crds.convertCoordinates.toDegrees('y', center, object, canvas.height);
		socket.emit('writePlaceCoords', crds.mapPlaceCrds[totalColPlace - 1].x, crds.mapPlaceCrds[totalColPlace - 1].y, gameLink);
		setTimeout(function(){socket.emit('readPlaceCoords')}, 1000);
		console.log(crds.mapPlaceCrds);
	}
}

var canvas, ctx, img;

var movement = {
	up: false,
	down: false,
	left: false,
	right: false
}

var movementFuncs = {
	up: function(event){
		switch (event.keyCode) {
		    case 65: // A
		      movement.left = true;
		      break;
		    case 87: // W
		      movement.up = true;
		      break;
		    case 68: // D
		      movement.right = true;
		      img.src = "static/images/Blue-Run-Right.gif";
		      break;
		    case 83: // S
		      movement.down = true;
		      break;
		}
	},
	down: function(event){
		switch (event.keyCode) {
		    case 65: // A
		      movement.left = false;
		      break;
		    case 87: // W
		      movement.up = false;
		      break;
		    case 68: // D
		      movement.right = false;
		      break;
		    case 83: // S
		      movement.down = false;
		      break;
		}
	}
}

var socketFuncs = {
	writeUserId: function(socketId){
		if(!userId){
			userId = socketId;
			console.log(userId);
		}
	},
	updateState: function(players) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var id in players) {
		    var player = players[id];
		    if(userId == player.id){
			    crds.mapCenterCrds.x = player.x;
			    crds.mapCenterCrds.y = player.y;
			    map.setCenter([crds.mapCenterCrds.y, crds.mapCenterCrds.x]);
			}
		    player.x = crds.convertCoordinates.toPixels('x',crds.mapCenterCrds, player.x, canvas.width); 
		    player.y = crds.convertCoordinates.toPixels('y',crds.mapCenterCrds, player.y, canvas.height);
		    ctx.drawImage(img, player.x, player.y, 100, 125);
		    crds.checkForPlaceCoordinates(map.getCenter());
		} 
		ctx.fillStyle = 'red';
	    for(var i = 0;i < totalColPlace;i++){
		    if(crds.mapPlaceCrds[i].x > crds.mapCenterCrds.x - kx&&crds.mapPlaceCrds[i].x < crds.mapCenterCrds.x + kx&&crds.mapPlaceCrds[i].y < crds.mapCenterCrds.y + ky&&crds.mapPlaceCrds[i].y > crds.mapCenterCrds.y - ky){
				crds.mapPlaceCrds[i].xPx = crds.convertCoordinates.toPixels('x',crds.mapCenterCrds, crds.mapPlaceCrds[i].x, canvas.width);
				crds.mapPlaceCrds[i].yPx = crds.convertCoordinates.toPixels('y',crds.mapCenterCrds, crds.mapPlaceCrds[i].y, canvas.height);
			    ctx.beginPath();
			    ctx.arc(crds.mapPlaceCrds[i].xPx, crds.mapPlaceCrds[i].yPx, 10, 0, 2 * Math.PI);
			    ctx.fill();
		    }
	    }
	},
	writePlaceCoordsToArray: function(result){
		crds.mapPlaceCrds = result;
		totalColPlace = result.length;
	},
	enterance: function(socketId){
		if(!userId&&clientId==socketId){
			init();
		}
	},
	writeClientId: function(socketId){
		if(!clientId){
			clientId = socketId;
		}
	}
}

var canvasFuncs = {
	getCanvasClickCoordinates: function(e){
		crds.canvClickCrds.x = e.offsetX;
		crds.canvClickCrds.y = e.offsetY;
	}
}

var registrFuncs = {
	authorization: function(){
		regVar.authLogin = domVar.logAuthField.value;
		regVar.authPassword = domVar.pasAuthField.value;
		registrFuncs.authCheck(regVar.authLogin, regVar.authPassword);
	},
	registration: function(){
		regVar.nickname = domVar.nickField.value;
		regVar.login = domVar.logField.value;
		regVar.password = domVar.pasField.value;
		regVar.rePassword = domVar.rePasField.value;
		registrFuncs.registrCheck(regVar.nickname, regVar.login, regVar.password, regVar.rePassword);
	},
	registrCheck: function(nick, login, password, rePassword){
		if(nick==''||nick.length<4){
			registrFuncs.errors.regError(1);
		}
		else if(login==''||login.length<4){
			registrFuncs.errors.regError(2);
		}
		else if(password==''||password.length<6){
			registrFuncs.errors.regError(3);
		}
		else if(rePassword!=password){
			registrFuncs.errors.regError(4);
		}
		else{
			socket.emit('registration', nick, login, password);
		}
	},
	authCheck: function(login, password){
		if(login==''){
			registrFuncs.errors.authError(1);
		}
		else if(password==''){
			registrFuncs.errors.authError(2);
		}else{
			socket.emit('authorization', login, password);
		}
	},
	clear: {
		fields:function(){
			domVar.logAuthField.value = '';
			domVar.pasAuthField.value = '';
			domVar.nickField.value = '';
			domVar.logField.value = '';
			domVar.pasField.value = '';
			domVar.rePasField.value = '';
		}
	},
	errors: {
		regError: function(number){
			switch(number){
				case 1: 
					registrFuncs.clear.fields();
					domVar.regSpan.innerHTML = 'Введите никнейм';
					setTimeout(function(){domVar.regSpan.innerHTML = '';}, 4000);
				break;
				case 2: 
					registrFuncs.clear.fields();
					domVar.regSpan.innerHTML = 'Введите логин';
					setTimeout(function(){domVar.regSpan.innerHTML = '';}, 4000);
				break;
				case 3: 
					registrFuncs.clear.fields();
					domVar.regSpan.innerHTML = 'Введите пароль';
					setTimeout(function(){domVar.regSpan.innerHTML = '';}, 4000);
				break;
				case 4: 
					registrFuncs.clear.fields();
					domVar.regSpan.innerHTML = 'Пароли не совпадают';
					setTimeout(function(){domVar.regSpan.innerHTML = '';}, 4000);
				break;
			}
		},
		authError: function(number){
			switch(number){
				case 1: 
					registrFuncs.clear.fields();
					domVar.authSpan.innerHTML = 'Введите логин';
					setTimeout(function(){domVar.authSpan.innerHTML = '';}, 4000);
				break;
				case 2: 
					registrFuncs.clear.fields();
					domVar.authSpan.innerHTML = 'Введите пароль';
					setTimeout(function(){domVar.authSpan.innerHTML = '';}, 4000);
				break;
			}
		}
	}
}

function addEvent(object, eventName, functionName){
	object.addEventListener(eventName, functionName);
}

function ymapsInit(){
	map = new ymaps.Map('map', {
		center: [53.1446,29.2225],
		zoom: 15,
		controls: [],
		behaviors:[]
	});
}

function canvasInit(){
	$('#canvas').show();
	$('#mainPanel').hide();
	canvas = document.getElementById('canvas');
	canvas.width = screen.width;
	canvas.height = screen.height;
	document.getElementById('map').style.width = canvas.width + 'px';
	document.getElementById('map').style.height = canvas.height + 'px';
	kx = (0.01825 * (canvas.width / 2)) / 425;
	ky = (0.01095 * (canvas.height / 2)) / 425;
	ctx = canvas.getContext('2d');
	img = new Image();
	img.src = "static/images/Blue-Run-Left.gif";
	document.body.removeChild(document.getElementById('mainPanel'));
}

function DOMinit(){
	domVar.regBut = document.getElementById('registrationButton1');
	domVar.authBut = document.getElementById('authorizationButton1');
	domVar.nickField = document.getElementById('nick');
	domVar.logField = document.getElementById('log');
	domVar.pasField = document.getElementById('pas');
	domVar.rePasField = document.getElementById('rePas');
	domVar.logAuthField = document.getElementById('logA');
	domVar.pasAuthField = document.getElementById('pasA');
	domVar.authSpan = document.getElementById('span_2');
	domVar.regSpan = document.getElementById('span_1');
}

function registr(){
	DOMinit();
	socket.emit('new client');
	addEvent(socket, 'writeClientIdEvent', socketFuncs.writeClientId);
	addEvent(domVar.regBut, 'click', registrFuncs.registration);
	addEvent(domVar.authBut, 'click', registrFuncs.authorization);
	addEvent(socket, 'enterance', socketFuncs.enterance);
}

function init(){
	socket.emit('new player');
	addEvent(socket, 'writeUserIdEvent', socketFuncs.writeUserId);
	socket.emit('readPlaceCoords');
	ymapsInit();
	canvasInit();
	addEvent(document, 'keydown', movementFuncs.up);
	addEvent(document, 'keyup', movementFuncs.down);
	addEvent(socket, 'updateStateEvent', socketFuncs.updateState);
	addEvent(socket, 'writePlaceCoordsToArray', socketFuncs.writePlaceCoordsToArray);
	addEvent(canvas, 'click', function(e){
		canvasFuncs.getCanvasClickCoordinates(e);
		crds.checkForPlaceCoordinates(map.getCenter(), crds.canvClickCrds);
		$("#placeCr").show();
	});

	$("#button_1").bind('click', function(e){
		gameLink = $("#field_1").val();
		$("#placeCr").hide();
		$("#field_1").val('');
		$("#field_2").val('');
		$("#field_3").val('');
		crds.addPlaceCoordinates(map.getCenter(), crds.canvClickCrds);
	});	

	$("#button_2").bind('click', function(e){
		$("#placeCr").hide();
		$("#field_1").val('');
		$("#field_2").val('');
		$("#field_3").val('');
	});

	setInterval(function() {
	  socket.emit('movement', movement);
	}, 1000 / 60);
}

ymaps.ready(registr);
