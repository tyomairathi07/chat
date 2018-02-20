// Initialize Firebase
var config = {
apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
authDomain: "fireba-a8775.firebaseapp.com",
databaseURL: "https://fireba-a8775.firebaseio.com",
projectId: "fireba-a8775",
storageBucket: "fireba-a8775.appspot.com",
messagingSenderId: "86072280692"
};
firebase.initializeApp(config);

const rootRef = firebase.database().ref();
let currentUser = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
		return;
	} else {
		window.location.href = "/";
	}
})

const roomId = 'room2-5';
const roomRef = rootRef.child('/' + roomId + '/');

// set room name
firebase.database().ref('/study-rooms/' + roomId + '/name').once('value')
.then(function(snapshot) {
	$('#roomName').text(snapshot.val());
});

// create Peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});


let peerId = null;
let room = null;
let localStream = null;

let rowIndex = null;
let cellIndex = null;

const MAX_MEMBER_COUNT = 5;
const NUM_BREAKROOMS = 4;

/** ACTIONS BY USER **/
// open page
peer.on('open', function(id) {
	appendLog('my ID: ' + id);
	// set peerId
	peerId = id;
	peerHandler(peer);

	// DB: handle disconnections; removes data for last user in room
	roomRef.child(peerId).onDisconnect().remove();

	// SW: join room with stream 
	navigator.mediaDevices.getUserMedia({video: true, audio: false})
	.then(function(stream) {
		var iv = setInterval(function() {
			localStream = stream;
			if (localStream != null) {
				clearInterval(iv);
				$('.button-join').removeAttr('disabled');
			}
		}, 10);
		room = peer.joinRoom(roomId, {mode: 'sfu', stream: localStream});
		// start roomHandler
		roomHandler();
	});

	/*
	// DB: check if back from break
	firebase.auth().onAuthStateChanged(function(user) {
		if(user) {
			// set currentUser
			currentUser = user;
			// DB: check if back from break
			var backFromBreak = false;
			rootRef.child('/on-break/' + currentUser.uid).once('value')
			.then(function(snapshot) {
				backFromBreak = snapshot.child('done').exists();
				if(backFromBreak) { // user returned from breakroom
					// set rowIndex, cellIndex
					rowIndex = snapshot.child('row-index').val();
					cellIndex = snapshot.child('cell-index').val();
					joinFromBreak(snapshot);
				}
			});
		}
	});
	*/
})

// click: "join" button
$(".button-join").click(function() {
	// get cellIndex, rowIndex
	cellIndex = $(this).parent().index();
	rowIndex = $(this).parent().parent().index();

	// DB: peerId, cellIndex, rowIndex -> fires Firebase#child_added
	roomRef.child(peerId).set({"row-index": rowIndex, "cell-index": cellIndex});

	// SW: replaceStream -> fires SFURoom#stream
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		localStream = stream;
		room.replaceStream(localStream);
	});

	if (localStream == null) {
		appendLog('localStream is null');
	}

	// set style
	setStyleOnJoin(rowIndex, cellIndex);
});

$('#break').click(function() {
	// DB: save rowIndex, cellIndex
	var currentUser = firebase.auth().currentUser;
	firebase.database().ref('/on-break/').child(currentUser.uid)
	.set({
		"room-id": roomId,
		"row-index": rowIndex,
		"cell-index": cellIndex
	}).then(function() {
		// SW: send data to room -> set coffee icon at place
		room.send("break");
		// go to break room
		goToBreakroom();
	});
});


// click: "leave" button
$("#leave").click(function() {
	// remove from DB: peerId
	roomRef.child(peerId).remove();

	// set style
	setStyleOnLeave(rowIndex, cellIndex);

	// set rowIndex, cellIndex to null
	rowIndex = null;
	cellIndex = null;
});


/** DB LISTENERS **/
// event: child added
roomRef.on('child_added', function(snapshot, prevKey) {
	// get position
	var child_id = snapshot.key;
	var child_c = snapshot.child('cell-index').val();
	var child_r = snapshot.child('row-index').val();

	appendLog('child_added: ' + child_r + ', ' + child_c);
	
	if (child_id == peerId) {
		createVideo(peerId, localStream);
	}

});

// event: child removed
roomRef.on('child_removed', function(snapshot) {
	// get position
	var child_id = snapshot.key;
	var child_c = snapshot.child('cell-index').val();
	var child_r = snapshot.child('row-index').val();

	appendLog('child_removed: ' + child_r + ', ' + child_c);

	// remove video from [row, col]
	removeVideo(child_id, child_r, child_c);
})

/** FUNCTIONS **/
function appendLog(text) {
	$('#log').append(text + '<br>');
}

function createVideo(id, stream) {
	appendLog('createVideo called');

	if (stream == null) {
		appendLog('ERROR: stream is null');
	}

	// get position
	var rIndex = null;
	var cIndex = null;

	roomRef.child(id).on('value', function(snapshot) {
		rIndex = snapshot.child('row-index').val();
		cIndex = snapshot.child('cell-index').val();
	});

	if ((rIndex !== null) && (cIndex !== null)) {
		appendLog('createVideo at: ' + rIndex + ', ' + cIndex);
		// get cell
		var cell = getCell(rIndex, cIndex);
		// hide "join" button
		cell.children('.button-join').css('display', 'none');
		// create video tag
		cell.append('<video id="' + id + '" autoplay="true" muted></video>');
		// set stream to video
		$('#' + id).get(0).srcObject = stream;
	}
}

// fires peerJoin event with a dummy peer
function dummy() {
	let dummyPeer = new Peer("dummyPeer", {
		key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
		debug: 3
	});

	dummyPeer.on('open', function(id) {
		let dummyRoom = dummyPeer.joinRoom(roomId, {mode: 'sfu'});

		dummyRoom.on('open', function() {
			dummyPeer.disconnect();
		});			
	});
}

function getCell(r, c) {
	return $("table tr:eq("+r+") td:eq("+c+")");
}

function getCellIndex(id) {
	var c;
	roomRef.child(id).on('value', function(snapshot) {
		c = snapshot.child('cell-index').val();
	});
	return c;
}


function getRowIndex(id) {
	var r;
	roomRef.child(id).on('value', function(snapshot) {
		r = snapshot.child('row-index').val();
	});
	return r;
}

// finds open break room and goes there
function goToBreakroom() {
	var rootRef = firebase.database().ref();
	var prefix = "room0-";
	var array = [];
	var i = 0;

	for(var i = 0; i  < NUM_BREAKROOMS; i++) {
		rootRef.child(prefix + i).once('value')
		.then(function(snapshot) {
			var memberCount = snapshot.numChildren();
			if (memberCount < MAX_MEMBER_COUNT) { // found available room
				var roomId = snapshot.key;
				var j = roomId.substr(roomId.length - 1);
				while(j < MAX_MEMBER_COUNT) {
					rootRef.child(prefix + j).off();
					j++;
				}
				window.location.href = "/break-rooms/" + roomId + '.html';
				//window.location.href = "/";
			}
		});
	}
}

/*
function joinFromBreak(snapshot) {
	// SW: replace stream
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		localStream = stream;
		room.replaceStream(localStream);
	});

	// DB: add child
	var r = snapshot.child('row-index').val();
	var c = snapshot.child('cell-index').val();
	roomRef.child(peerId).set({'row-index': r, 'cell-index': c})
	.then(function() {
		// SW: send message to room
		room.send('back');
		// DB: remove record from on-break
		rootRef.child('/on-break/' + currentUser.uid).remove();
		// set style on join
		setStyleOnJoin(r, c);
	})
	appendLog('joinFromBreak: ' + r + ', ' + c);	
}
*/

function peerHandler(peer) {
	/*
	peer.on('close', function(id) {
		roomRef.child(id).remove();
		
	});
	*/
}

function removeCoffee(id, r, c) {
	appendLog('removeCoffee at: ' + r + ', ' + c);

	var cell = getCell(r, c);
	// remove coffee
	cell.children('img').remove();
}

function removeVideo(id, r, c) {
	appendLog('removeVideo at: ' + r + ', ' + c);

	var cell = getCell(r, c);
	// remove video
	cell.children('video').remove();
	if (cell.children().length > 1) { // has img & button
		// hide button
		cell.children('.button-join').css('display', 'none');
	} else { // cell has only button
		// enable button
		cell.children('.button-join').removeAttr('style');
	}
}

// handle SFURoom events
function roomHandler() {
	room.on('data', function(data) {
		var id = data.src;
		var msg = data.data;
		if (msg == "break") {
			// set coffee icon at location
			r = getRowIndex(id);
			c = getCellIndex(id);
			setCoffee(id, r, c);
		} 
		/** else if (msg == "back") {
			r = getRowIndex(id);
			c = getCellIndex(id);
			removeCoffee(id, r, c);
		}
		**/
	});

	room.on('open', function() {
		dummy();
	});

	// TODO clean up code
	// get stream & create video
	room.on('stream', function(stream) {
		var timer = setTimeout(function() {
			appendLog('stream waiting...');
			appendLog('stream from: ' + stream.peerId);
			createVideo(stream.peerId, stream);
		}, 1000);
	});
}

function setCoffee(id, r, c) {
	appendLog('setCoffee at: ' + r + ', ' + c);

	var cell = getCell(r, c);
	// remove video
	cell.children('video').remove();
	// hide button
	cell.children('button').css('display', 'none');
	cell.append('<img src="/images/coffee.png">');
}

function setStyleOnJoin(r, c) {
	var cell = getCell(r, c);

	// set border
	cell.css('border', '0.3rem solid black');

	// disable button
	$("table").find('.button-join').attr('disabled', 'disabled');

	// show bottom menu
	$(".menu").css('display', 'inline');
}

function setStyleOnLeave(r, c) {
	var cell = getCell(r, c);

	// remove border
	cell.removeAttr('style');

	// enable button
	$("table").find('.button-join').removeAttr('disabled');

	// hide bottom menu
	$(".menu").css('display', 'none');;
}
