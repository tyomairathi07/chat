/**
open page: only shows icons
click "join": send & receive audio; send & receive chat
**/

/** TODO
- get user name & icon from DB
- make links clickable
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

const roomName = "room0-0";
let peerId = null;
let room = null;
let localStream = null;


/** USER ACTIONS **/
// open page
peer.on('open', function(id) {
	// set peerId
	peerId = id;
	appendLog('my ID: ' + peerId);

	// show user icons

});

// click "join" button
$('#join').click(function() {
	// get stream & join room
	navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(function(stream) {
		localStream = stream;
		if (localStream == null) {
			appendLog('localStream is null');
		}
		room = peer.joinRoom(roomName, {mode: 'sfu', stream: localStream});
		roomHandler();
	});

	// hide "join" button
	$(this).css('display', 'none');

	// show "leave" button
	$('#leave').css('display', 'inline');
});

$('#leave').click(function() {
	// leave room
	room.close();
	appendLog('left room');

	// hide "leave" button
	$(this).css('display', 'none');

	// show "join" button
	$('#join').css('display', 'inline');
});

$('#send').click(function() {
	// get message
	var message = $('#textarea-chat').val();
	
	// SW: send message
	room.send(message);

	// show in chat log
	appendChatLog('自分', message);
});

/** FUNCTIONS **/
function addUser(id) {
	$('.users').append('<div class="user-wrapper" id="' + id + '"><img src="/images/robot.png" class="user-pic"><br>' + 
		id + '</div>');
}

function removeUser(id) {
	$('#' + id).remove();
}

function appendLog(text) {
	$('#log').append(text + '<br>');
}

function appendChatLog(sender, message) {
	$('#chat-log').append('<b>' + sender + ': </b>' + message + '<br>');
}

function roomHandler() {
	room.on('close', function() {
		// remove user pic & name
		removeUser(peerId);
		// show in chat log
		appendChatLog('SYSTEM', '退室しました');
	})

	room.on('data', function(data) {
		// get message
		var message = data.data;
		// get sender
		var id = data.src;
		// show in chat log
		appendChatLog(id, message);
	})

	room.on('open', function() {
		// add user pic & name
		addUser(peerId);
		// show in chat log
		appendChatLog('SYSTEM', '入室しました');
	});

	room.on('peerJoin', function(id) {
		// add user pic & name
		addUser(id);
		// show in chat log
		appendChatLog('SYSTEM', id + ' が入室しました');
	});

	room.on('peerLeave', function(id) {
		// remove user pic & name
		removeUser(id);
		// show in chat log
		appendChatLog('SYSTEM', id + ' が退室しました');
	});

	room.on('stream', function(stream) {
		var id = stream.peerId;
		
		// play stream
		$('#' + id).append('<audio autoplay></audio>');
		$('#' + id).children('audio').get(0).srcObject = stream;

		appendLog('stream from: ' + id);
	});
}