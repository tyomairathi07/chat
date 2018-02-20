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

// create peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});

const roomName = "room0-2";
const roomRef = firebase.database().ref('/' + roomName + '/');

let peerId = null;
let room = null;

// open page
peer.on('open', function(id) {
	// DB: get users
	roomRef.once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			var remoteId = childSnapshot.key;
			// show pic & name for each user
			addUser(remoteId);
		})
	});
	// set peer Id
	peerId = id;
	appendLog('my ID: ' + peerId);
	// start peerHandler
	peerHandler();

});

$('#join').click(function() {
	// toggle button
	toggleButton('join');

	// SW: join room
	navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(function(stream) {
		room = peer.joinRoom(roomName, {mode: 'sfu', stream: stream});
		roomHandler();
	})

});

$('#leave').click(function() {
	// toggle button
	toggleButton('leave');
	// SW: close room
	room.close();
});

$('#send').click(function() {
	// get message
	var message = $('#textarea-chat').val();
	// clear textarea
	$('#textarea-chat').val('');
	// SW: send message
	room.send(message);
	// chat log
	appendChatLog('自分', message);
})

/** FUNCTIONS **/
function addUser(id) {
	$('.users').append('<div class="user-wrapper" id="' + id + '"><img src="/images/robot.png" class="user-pic"><br>' + 
		id + '</div>');
	appendLog('added user: ' + id);
}

function appendLog(text) {
	$('#log').append(text + '<br>');
}

function appendChatLog(sender, message) {
	$('#chat-log').append('<b>' + sender + ': </b>' + message + '<br>');
}



function peerHandler() {
	peer.on('disconnected', function() {
		// DB: remove peer
		roomRef.child(peerId).remove();
		// remove pic & name: self
		removeUser(peerId);
	})
}

// toggle join/leave buttons
function toggleButton(currentButton) {
	if(currentButton == 'join') {
		$('#join').css('display', 'none');
		$('#leave').css('display', 'inline');

	} else if (currentButton == 'leave') {
		$('#leave').css('display', 'none');
		$('#join').css('display', 'inline');
	}
}

function removeUser(id) {
	$('#' + id).remove();
	appendLog('removed user: ' + id);
}

function roomHandler() {
	room.on('close', function() {
		// DB: remove peer
		roomRef.child(peerId).remove();
		// remove pic & name: self
		removeUser(peerId);
		// hide chat input
		$('.container-input').css('display', 'none');
	});

	room.on('data', function(data) {
		// get sender
		var id = data.src;
		// get message
		var message = data.data;
		// chat log
		appendChatLog(id, message);
	});

	room.on('open', function() {
		// DB: add peer
		roomRef.child(peerId).set(true);
		// show pic & name: self
		addUser(peerId);
		// chat log
		appendChatLog('SYSTEM', '入室しました');
		$('.container-input').css('display', 'block');
	});

	room.on('peerJoin', function(id) {
		// DB: add user
		roomRef.child(id).set(true);
		// add user pic & name
		addUser(id);
		// chat log
		appendChatLog('SYSTEM', id + ' が入室しました');
	});

	room .on('peerLeave', function(id) {
		// DB: remove user
		roomRef.child(id).remove();
		// remove user pic & name
		removeUser(id);
		// chat log
		appendChatLog('SYSTEM', id + ' が退室しました');
	});

	room.on('stream', function(stream) {
		var id = stream.peerId;
		// play stream
		$('#' + id).append('<audio autoplay></audio>');
		$('#' + id).children('audio').get(0).srcObject = stream;
		// log
		appendLog('stream from: ' + id);
	});
}