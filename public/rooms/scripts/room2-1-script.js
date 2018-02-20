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

const roomName = "room2-1";
const roomRef = firebase.database().ref('/' + roomName + '/'); // Reference to root/roomName

let peerId = null;
let room = null;

let rowIndex = null;
let cellIndex = null;

/** ACTIONS BY USER **/
// open page
peer.on('open', function(id) {
	// set peerId
	peerId = id;
	peerHandler(peer);

	// join room with stream: null
	room = peer.joinRoom(roomName, {mode:'sfu', stream: null});
	$('#log').append('joined room: ' + id + '<br>');
	roomHandler(room);
})

// click: "join" button
$(".button-join").click(function() {
	// set rowIndex, cellIndex
	rowIndex = $(this).parent().parent().index();
	cellIndex = $(this).parent().index();

	// insert DB: peerId, rowIndex, cellIndex
	roomRef.child(peerId).set({"row-index": rowIndex, "cell-index": cellIndex});

	// TODO
	// replace stream
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		// send local stream to room
		room.replaceStream(stream); // triggers removeStream & stream event
		if(stream != null) {
			$('#log').append('replaced stream: non-null<br>');
			createVideo(peerId, stream);
		} else {
			$('#log').append('replaced stream: null<br>');
		}
		
	})
})

// click: "leave" button
$("#leave").click(function() {
	// remove video
	removeVideo(peerId);

	// set rowIndex, cellIndex to null
	rowIndex = null;
	cellIndex = null;

	// Skyway: replaceStream with null
	room.replaceStream(null);

	// remove from DB: peerId
	roomRef.child(peerId).remove();

});

/** DB LISTENERS **/
roomRef.on('child_added', function(snapshot, prevKey) {
	// get stream
	// create video
});

roomRef.on('child_removed', function(snapshot) {
	// remove video from [row, col]
})

/** FUNCTIONS **/
function getCell(r, c) {
	return $("table tr:eq("+r+") td:eq("+c+")");
}

function createVideo(id, stream) {
	roomRef.child(id).on('value', function(snapshot) {
		var rIndex = snapshot.child('row-index').val();
		var cIndex = snapshot.child('cell-index').val();

		if (rIndex != null && cIndex != null) { // remote user is sending stream
			$('#log').append('stream sent from ' + id +  ' at: ' + rIndex + ', ' + cIndex + '<br>');
			var cell = getCell(rIndex, cIndex);

			// hide "join" button
			cell.children('.button-join').css('display', 'none');

			// create video tag
			cell.append('<video id="' + id + '" autoplay="true" muted="true"></video>');
			$('#' + id).get(0).srcObject = stream;

		} else { // remote user is NOT sending a stream
			$('#log').append('stream removed from ' + id + '<br>');

		}
	});
}

function peerHandler(peer) {
	peer.on('disconnected', function(id) {
		// remove from DB: peerId
		roomRef.child(id).remove();
	})
}

function removeVideo(id) {
	$('#log').append('removeVideo at: ' + rowIndex + ', ' + cellIndex + '<br>');
	var cell = getCell(rowIndex, cellIndex);
	cell.children('video').remove();
	cell.children('.button-join').removeAttr('style');
}

function roomHandler(room) {
	room.on('stream', function(stream) {
		if (stream != null) {
			$('#log').append('received stream from: ' + stream.peerId + '<br>');
			// show video
			createVideo(stream.peerId, stream);
		}
	});

	room.on('removeStream', function(stream) {
		$('#log').append('removeStream from: ' + stream.peerId + '<br>');
	})

	room.on('peerLeave', function(id) {
		$('#log').append('peerLeave from: ' + id + '<br>');
		// remove from DB: peer
		roomRef.child(id).remove();
	})
}