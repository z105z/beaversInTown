var map, rect, userId, canvasDOM;
var totalColPlace = -1,
	placeImage,
	placeDescript,
	coords,
	gameLink;

var socket = io();

var coordinates = {
	canvasClickCoordinates: {},
	mapCenterCoordinates: {},
	mapPlaceCoordinates: [],
	convertCoordinates : {
		toPixels : function(mode, center, object, displaySize){
			switch(mode){
				case 'x':
					return displaySize * (object - (center.x - numbrX)) / ((center.x + numbrX) - (center.x - numbrX));
				break;
				case 'y':
					return displaySize * (object - (center.y + numbrY)) / ((center.x + numbrY) - (center.x - numbrY)) * -1;
				break;
			}
		},
		toDegrees : function(mode, center, object, displaySize){
			switch(mode){
				case 'x': 
					return (center[1] - numbrX) + (((center[1] + numbrX) - (center[1] - numbrX)) * object.x) / displaySize;
				break;
				case 'y':
					return (center[0] + numbrY) - (((center[0] + numbrY) - (center[0] - numbrY)) * object.y) / displaySize;
				break;
			}
		}
	}
}

var canvas, context, img;

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
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = 'green';
		for (var id in players) {
		    var player = players[id];
		    if(userId == player.id){
			    coordinates.mapCenterCoordinates.x = player.x;
			    coordinates.mapCenterCoordinates.y = player.y;
			    map.setCenter([coordinates.mapCenterCoordinates.y, coordinates.mapCenterCoordinates.x]);
			}
		    player.x = coordinates.convertCoordinates.toPixels('x',coordinates.mapCenterCoordinates, player.x, canvas.width); //(850 * ((player.x) - (coordinates.mapCenterCoordinates.x - 0.01825))) / ((coordinates.mapCenterCoordinates.x + 0.01825) - (coordinates.mapCenterCoordinates.x - 0.01825));
			player.y = coordinates.convertCoordinates.toPixels('y',coordinates.mapCenterCoordinates, player.y, canvas.height);//(850 * ((player.y) - (coordinates.mapCenterCoordinates.y + 0.01095))) / ((coordinates.mapCenterCoordinates.x + 0.01095) - (coordinates.mapCenterCoordinates.x - 0.01095)) * -1;
			console.log(player);
			console.log(map.getCenter());
			context.drawImage(img, player.x, player.y, 100, 125);
		    convertion(0, map.getCenter());
		} 
		context.fillStyle = 'red';
	    for(var i = 0;i < totalColPlace;i++){
		    if(coordinates.mapPlaceCoordinates[i].x > coordinates.mapCenterCoordinates.x - numbrX&&coordinates.mapPlaceCoordinates[i].x < coordinates.mapCenterCoordinates.x + numbrX&&coordinates.mapPlaceCoordinates[i].y < coordinates.mapCenterCoordinates.y + numbrY&&coordinates.mapPlaceCoordinates[i].y > coordinates.mapCenterCoordinates.y - numbrY){
				coordinates.mapPlaceCoordinates[i].xPx = coordinates.convertCoordinates.toPixels('x',coordinates.mapCenterCoordinates, coordinates.mapPlaceCoordinates[i].x, canvas.width)//(50 * ((coordinates.mapPlaceCoordinates[i].x) - (coordinates.mapCenterCoordinates.x - 0.01825))) / ((coordinates.mapCenterCoordinates.x + 0.01825) - (coordinates.mapCenterCoordinates.x - 0.01825));
				coordinates.mapPlaceCoordinates[i].yPx = coordinates.convertCoordinates.toPixels('y',coordinates.mapCenterCoordinates, coordinates.mapPlaceCoordinates[i].y, canvas.height);//(850 * ((coordinates.mapPlaceCoordinates[i].y) - (coordinates.mapCenterCoordinates.y + 0.01095))) / ((coordinates.mapCenterCoordinates.x + 0.01095) - (coordinates.mapCenterCoordinates.x - 0.01095))* -1;
			    context.beginPath();
			    context.arc(coordinates.mapPlaceCoordinates[i].xPx, coordinates.mapPlaceCoordinates[i].yPx, 10, 0, 2 * Math.PI);
			    context.fill();
		    }
	    }
	},
	writePlaceCoordsToArray: function(result){
		coordinates.mapPlaceCoordinates = result;
		totalColPlace = result.length;
	}
}

var canvasFuncs = {
	getCanvasClickCoordinates: function(e){
		coordinates.canvasClickCoordinates.x = e.offsetX;
		coordinates.canvasClickCoordinates.y = e.offsetY;
	}
}

//------------------------------------------------------------------------------------------------------------------

function addEvent(object, eventName, functionName){
	object.addEventListener(eventName, functionName);
}

function ymapsInit(){
	map = new ymaps.Map('map', {
		center: [53.1446,29.2225],
		zoom: 20,
		controls: [],
		behaviors:[]
	});
}

function canvasInit(){
	canvas = document.getElementById('canvas');
	canvas.width = screen.width;
	canvas.height = screen.height;
	document.getElementById('map').style.width = canvas.width + 'px';
	document.getElementById('map').style.height = canvas.height + 'px';
	numbrX = (0.01825 * (canvas.width / 2)) / 425;
	numbrY = (0.01095 * (canvas.height / 2)) / 425;
	context = canvas.getContext('2d');
	img = new Image();
	img.src = "static/images/Blue-Run-Left.gif";
}

function init(){
	socket.emit('new player');
	socket.emit('readPlaceCoords');
	ymapsInit();
	canvasInit();
	addEvent(document, 'keydown', movementFuncs.up);
	addEvent(document, 'keyup', movementFuncs.down);
	addEvent(socket, 'writeUserIdEvent', socketFuncs.writeUserId);
	addEvent(socket, 'updateStateEvent', socketFuncs.updateState);
	addEvent(socket, 'writePlaceCoordsToArray', socketFuncs.writePlaceCoordsToArray);
	addEvent(canvas, 'click', function(e){
		canvasFuncs.getCanvasClickCoordinates(e);
		convertion(0, map.getCenter(), coordinates.canvasClickCoordinates);
		$("#placeCr").show();
	});

	$("#button_1").bind('click', function(e){
		gameLink = $("#field_1").val();
		$("#placeCr").hide();
		$("#field_1").val('');
		$("#field_2").val('');
		$("#field_3").val('');
		convertion(1, map.getCenter(), coordinates.canvasClickCoordinates);
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

function convertion(mode, center, object){
	var PROPORTIONS  = ((center[1] + 0.01825) - (center[1] - 0.01825)) / 850;
	if(mode==0){
		for(var i = 0;i < totalColPlace;i++){
			if(center[1] > coordinates.mapPlaceCoordinates[i].x - 0.001&& center[1] < coordinates.mapPlaceCoordinates[i].x + 0.001&& center[0] > coordinates.mapPlaceCoordinates[i].y - 0.001&& center[0] < coordinates.mapPlaceCoordinates[i].y + 0.001){
				var tot = i;
				var link = coordinates.mapPlaceCoordinates[tot].link;
				document.location.href = link;
			}
			else{
				
			}
		}
	}

	if(mode==1){
		totalColPlace++;
		coordinates.mapPlaceCoordinates.push({});
		coordinates.mapPlaceCoordinates[totalColPlace - 1].x = coordinates.convertCoordinates.toDegrees('x', center, object, canvas.width);//(center[1] - 0.01825) + (((center[1] + 0.01825) - (center[1] - 0.01825)) * object.x) / 850,
		coordinates.mapPlaceCoordinates[totalColPlace - 1].y = coordinates.convertCoordinates.toDegrees('y', center, object, canvas.height);//(center[0] + 0.01095) - (((center[0] + 0.01095) - (center[0] - 0.01095)) * object.y) / 850; 
		socket.emit('writePlaceCoords', coordinates.mapPlaceCoordinates[totalColPlace - 1].x, coordinates.mapPlaceCoordinates[totalColPlace - 1].y, gameLink);
		socket.emit('readPlaceCoords');
	}
}

ymaps.ready(init);
