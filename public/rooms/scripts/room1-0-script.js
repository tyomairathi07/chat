/**
TODO:
- synchronize screen
- handle browser/network close events
**/

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

let localStream = null;
const roomName = "room1-0";
let room = null;
let peerId = null;
let rowIndex = null;
let cellIndex = null;

// get localStream
navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
	// success
	localStream = stream;
}).catch(function(error) {
	// TODO send error log
	console.log(error);
	return;
});

peer.on('open', function(id) {
	peerId = id;
	peerHandler(peer);

	// join room
	if (localStream == null) {alert('alert')};
	room = peer.joinRoom(roomName, {mode: 'sfu', stream: localStream});
	roomHandler();
});


// click "join" button
$(".button-join").click(function() {
	rowIndex = $(this).parent().parent().index();
	cellIndex = $(this).parent().index();

	// set CSS
	setStyleOnJoin();

	/**
	// join room
	room = peer.joinRoom(roomName, {mode: 'sfu', stream: localStream});
	roomHandler();
	**/

	// update db: member count
	updateMemberData('join');

	// update db: add peerId & location
	updateRoomData('join');
});

$('#leave').click(function() {
	// leave room
	room.close();
});

$('#muteVideo').click(function() {
	var cell = $("table tr:eq("+rowIndex+") td:eq("+cellIndex+")");

	if ($(this).val() == 'on') {
		// hide video
		$('#' + peerId).css('display', 'none'); 

		// show image
		cell.append('<img src="/images/no-video.png" class="img-no-video">');

		// change text
		$(this).text("ビデオをONにする");

		// change value
		$(this).val('off');
	} else {
		// remove image
		cell.children('img').remove();

		// show video
		$('#' + peerId).css('display', 'block');

		// change text
		$(this).text("ビデオをOFFにする");

		// change value
		$(this).val('on');
	}
});

// add child to db
function updateRoomData(action) {
	var ref = firebase.database().ref('/' + roomName + '/' + peerId);
	if (action == 'join') {
		ref.child('row-index').set(rowIndex);
		ref.child('cell-index').set(cellIndex);
	} else if (action == 'leave') {
		ref.remove();
	}
}

// handle room events
function roomHandler() {
	// receive stream
	room.on('stream', function(stream) {
		var streamId = stream.peerId;
		var ref = firebase.database().ref('/' + roomName + '/' + streamId);
		ref.on('value', function(snapshot) {
			var streamRowIndex = snapshot.child('row-index').val();
			var streamCellIndex = snapshot.child('cell-index').val();
			if ((streamCellIndex !== null) && (streamRowIndex !== null)) {
				alert('new stream at: ' + streamRowIndex + ', ' + streamCellIndex);
				createVideo(streamId, stream, streamRowIndex, streamCellIndex);
			}
		})
	});

	// member leaves room
	room.on('close', function() {
		updateMemberData('leave');
		updateRoomData('leave');
		setStyleOnLeave();
	});
}

function createVideo(id, stream, rIndex, cIndex) {
	var cell = $("table tr:eq("+rIndex+") td:eq("+cIndex+")");

	// hide "join" button
	cell.children().css('display', 'none');

	// create video
	cell.append('<video id="' + id + '" autoplay="true" muted="true"></video>');
	$('#' + id).get(0).srcObject = stream;
}

// handle Peer events
function peerHandler(peer) {
	/*
	peer.on('disconnected', function() {
		updateMemberData('leave');
	});
	*/

	peer.on('close', function() {
		// TODO
	});
		
}

// set style
function setStyleOnJoin() {
	var cell = $("table tr:eq("+rowIndex+") td:eq("+cellIndex+")");

	// hide button
	cell.children().css('display', 'none');

	// change border color
	cell.css('border', '0.2rem solid black');

	// disable other "join" buttons
	$("table").find('button').attr('disabled', 'disabled');

	// show floating menu: leave, video on/off
	$(".bottom-menu").css('display', 'inline');
	
	// show video
	cell.append('<video id="' + peerId + '" autoplay="true" muted="true"></video>');
	$('#' + peerId).get(0).srcObject = localStream;

}

function setStyleOnLeave() {
	var cell = $("table tr:eq("+rowIndex+") td:eq("+cellIndex+")");

	// remove video
	cell.children('video').remove();

	// show "join" button in cell
	cell.children().removeAttr('style');

	// change border color
	cell.removeAttr('style');

	// enable other "join" buttons
	$("table").find("button").removeAttr('disabled');

	// hide bottom menu
	$(".bottom-menu").css('display', 'none');
}

// add or subtract member count at db
function updateMemberData(action) {
	var ref = firebase.database().ref('/members/' + roomName);

	ref.transaction(function(currentMemberCount) {
		if (action == 'join') {
			return ++currentMemberCount;
		}
		else if (action == 'leave') {
			return --currentMemberCount;
		}
	});	
}