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

const roomName = "room1-1";
const roomRef = firebase.database().ref('/' + roomName + '/');
let room = null;
let peerId = null;
let rowIndex = null;
let cellIndex = null;

peer.on('open', function(id) {
	peerId = id;

	room = peer.joinRoom(roomName, {mode: 'sfu', stream: null});
	roomHandler();
})

$(".button-join").click(function() {
	rowIndex = $(this).parent().parent().index();
	cellIndex = $(this).parent().index();

	// replace stream & show video
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		room.replaceStream(stream);
		createVideo(peerId, stream, rowIndex, cellIndex);
	}).catch(function(error) {
		// TODO send error log
		console.log(error);
		return;
	});

	// store peerId, rowIndex, cellIndex in DB
	var ref = firebase.database().ref('/' + roomName + '/' + peerId);
	ref.child('row-index').set(rowIndex);
	ref.child('cell-index').set(cellIndex);

	// set CSS
	setStyleOnJoin();
})

$('#leave').click(function() {
	// replace stream
	room.replaceStream(null);
	removeVideo(peerId);
	setStyleOnLeave();
})

function createVideo(id, stream, rIndex, cIndex) {
	/**/
	if (stream == null) {alert('stream null at: ' + rIndex + ' ' + cIndex)};
	var cell = $("table tr:eq("+rIndex+") td:eq("+cIndex+")");

	// hide "join" button
	cell.children().css('display', 'none');

	// create video
	cell.append('<video id="' + id + '" autoplay="true" muted="true"></video>');
	$('#' + id).get(0).srcObject = stream;
}

function removeVideo(id) {
	var ref = firebase.database().ref('/' + roomName + '/' + id);
	ref.on('value', function(snapshot) {
			var rIndex = snapshot.child('row-index').val();
			var cIndex = snapshot.child('cell-index').val();

			var cell = $("table tr:eq("+rIndex+") td:eq("+cIndex+")");

			// remove video
			cell.children("video").remove();

			// show "join" button
			cell.children().removeAttr('style');			
	});
}


function roomHandler() {
	/**/
	room.on('open', function() {
		alert('joined room');
	})

	room.on('stream', function(stream) {
		/**/
		var streamId = stream.peerId;
		alert('stream from ' + streamId);
		var ref = firebase.database().ref('/' + roomName + '/' + streamId);
		ref.on('value', function(snapshot) {
			var rIndex = snapshot.child('row-index').val();
			var cIndex = snapshot.child('cell-index').val();
			createVideo(stream.peerId, stream, rIndex, cIndex);
		});
	})

	room.on('peerLeave', function(id) {
		removeVideo(id);
	})
}

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
}

function setStyleOnLeave() {
	var cell = $("table tr:eq("+rowIndex+") td:eq("+cellIndex+")");

	// show "join" button in cell
	cell.children().removeAttr('style');

	// change border color
	cell.removeAttr('style');

	// enable other "join" buttons
	$("table").find("button").removeAttr('disabled');

	// hide bottom menu
	$(".bottom-menu").css('display', 'none');
}