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

// create Peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});

const roomName = "room2-4";
const roomRef = firebase.database().ref('/' + roomName + '/'); // Reference to root/roomName

let peerId = null;
let room = null;
let localStream = null;

let rowIndex = null;
let cellIndex = null;

/** ACTIONS BY USER **/
// open page
peer.on('open', function(id) {
	appendLog('my ID: ' + id);
	// set peerId
	peerId = id;
	peerHandler(peer);

	// SW: join room with stream 
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		room = peer.joinRoom(roomName, {mode: 'sfu', stream: stream});
		localStream = stream;
		// start roomHandler
		roomHandler();
	})
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
	/*
	var data = roomRef.child(id).on('value', function(snapshot) {
		if (!snapshot.exists()) {
			alert('child ' + id + ' doesn\'t exist');
		}
	})
	*/

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
		let dummyRoom = dummyPeer.joinRoom(roomName, {mode: 'sfu'});

		dummyRoom.on('open', function() {
			dummyPeer.disconnect();
		});			
	});
}

function getCell(r, c) {
	return $("table tr:eq("+r+") td:eq("+c+")");
}

function peerHandler(peer) {
	peer.on('disconnected', function(id) {
		// remove from DB: peerId
		roomRef.child(id).remove();
	})
}

function removeVideo(id, r, c) {
	appendLog('removeVideo at: ' + r + ', ' + c);

	var cell = getCell(r, c);
	// remove video
	cell.children('video').remove();
	cell.children('.button-join').removeAttr('style');
}

// handle SFURoom events
function roomHandler() {
	room.on('open', function() {
		dummy();
	})

	room.on('peerLeave', function(id) {
		// remove from DB: id
		roomRef.child(id).remove();
	});

	// get stream & create video
	room.on('stream', function(stream) {
		var timer = setTimeout(function() {
			appendLog('stream waiting...');
			appendLog('stream from: ' + stream.peerId);
			createVideo(stream.peerId, stream);
		}, 1000);
	});
}

function setStyleOnJoin(r, c) {
	var cell = getCell(r, c);

	// set border
	cell.css('border', '0.3rem solid black');

	// disable button
	$("table").find('.button-join').attr('disabled', 'disabled');

	// show bottom menu
	$(".bottom-menu").css('display', 'inline');
}

function setStyleOnLeave(r, c) {
	var cell = getCell(r, c);

	// remove border
	cell.removeAttr('style');

	// enable button
	$("table").find('.button-join').removeAttr('disabled');

	// hide bottom menu
	$(".bottom-menu").removeAttr('style');
}
