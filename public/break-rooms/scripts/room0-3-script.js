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

let currentUser = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		currentUser = user;
		setStudyroomName(user);
	} else {
		window.location.href = "/";
	}
})

const roomId = "room0-3";
const rootRef = firebase.database().ref();
const roomRef = rootRef.child(roomId + '/');

// set room names
setBreakroomName();

// create peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});


let peerId = null;
let room = null;

// open page
peer.on('open', function(id) {
	// set peer Id
	peerId = id;
	appendLog('my ID: ' + peerId);

	// DB: handle disconnections; removes data for last user in room
	roomRef.child(peerId).onDisconnect().remove();
	
	// start peerHandler
	peerHandler();

});

$('#join').click(function() {
	// toggle button
	toggleButton('join');

	// SW: join room
	navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(function(stream) {
		room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
		roomHandler();
	})

});

$('#home').click(function() {
	// DB: remove record from on-break
	removeFromOnBreak();
})

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

$('#study').click(function() {
	var uid = currentUser.uid;
	var uidRef = rootRef.child('on-break/' + uid);
	// DB: set 'done' field
	uidRef.child('done').set(true);

	// DB: get studyroom id
	uidRef.child('room-id').once('value')
	.then(function(snapshot) {
		var roomId = snapshot.val();
		// go to studyroom
		window.location.href = "/study-rooms/" + roomId + '.html';
	})

})

/** DB LISTENERS **/
roomRef.on('child_added', function(snapshot, prevkey) {
	var r_id = snapshot.key;
	var r_name = snapshot.child('name').val();
	var r_url = snapshot.child('url').val();
	addUser(r_id, r_name, r_url);
	appendLog('child_added: ' + r_id);
	appendChatLog('SYSTEM', r_name + 'が入室しました');
});

roomRef.on('child_removed', function(snapshot) {
	var r_id = snapshot.key;
	var r_name = snapshot.child('name').val();
	removeUser(r_id);
	appendLog('child_removed: ' + r_id);
	appendChatLog('SYSTEM', r_name + 'が退室しました');
});

/** FUNCTIONS **/
function addUser(id, name, url) {
	$('.users').append('<div class="user-wrapper" id="' + id + '"><img src="' + url +
		 '" class="user-pic"><br><span>' + name + '</span></div>');
	appendLog('added user: ' + id);
}

function appendLog(text) {
	$('#log').append(text + '<br>');
}

function appendChatLog(sender, message) {
	$('#chat-log').append('<b>' + sender + ': </b>' + message + '<br>');
}

function peerHandler() {
	peer.on('open', function() {
		// DB: handle disconnections
		roomRef.child(peerId).onDisconnect().remove();
	});

	peer.on('disconnected', function() {
		// DB: remove peer
		roomRef.child(peerId).remove();
		// remove pic & name: self
		removeUser(peerId);
	});
}

function removeFromOnBreak() {
	var user = firebase.auth().currentUser;
	rootRef.child('on-break/' + user.uid).remove();
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
		var name = $('#' + id).children('span').text();
		// get message
		var message = data.data;
		// chat log
		appendChatLog(name, message);
	});

	room.on('open', function() {
		// DB: add peer
		var name = currentUser.displayName;
		var url = currentUser.photoURL;
		if (name == null) {
			name = 'ユーザー';
		}
		if (url == null) { // no photo is set
			url = '/images/monster.png';
		}
		roomRef.child(peerId).set({
			"name": name,
			"url": url
		})
		// show chat input
		$('.container-input').css('display', 'block');
	});

	room .on('peerLeave', function(id) {
		// DB: remove user
		roomRef.child(id).remove();
	});

	room.on('stream', function(stream) {
		var id = stream.peerId;
		// play stream
		var timer = setTimeout(function() {
			$('#' + id).append('<audio autoplay></audio>');
			$('#' + id).children('audio').get(0).srcObject = stream;
			// log
			appendLog('stream from: ' + id);
		}, 200);
		
	});
}

function setBreakroomName() {
	firebase.database().ref('/break-rooms/' + roomId + '/name').once('value')
	.then(function(snapshot) {
		$('#breakroomName').text(snapshot.val());
	})
}

function setStudyroomName(user) {
    firebase.database().ref('/on-break/' + user.uid + '/room-id').once('value')
    .then(function(snapshot) { // データの読み込み
        return snapshot.val();
    }).then(function(id) { // studyroomIdを使って再度データを読み込む
        return firebase.database().ref('/study-rooms/' + id + '/name').once('value');
    }).then(function(snapshot) {
        return snapshot.val();
    }).then(function(text) {
        $('#studyroomName').text(text);
    });
}