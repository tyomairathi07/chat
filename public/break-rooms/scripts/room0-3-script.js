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

const roomId = "room0-3";
const rootRef = firebase.database().ref();
const roomRef = rootRef.child(roomId + '/');
const onBreakRef = rootRef.child('on-break');

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check if user came from a studyroom
		checkUserEntry(user);

		// set room names
		setBreakroomName();
		setStudyroomName(user);

		// SW: create peer
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

			// DB: handle disconnections;
			roomRef.child(peerId).onDisconnect().remove();
			onBreakRef.child(user.uid).onDisconnect().remove();
			
			// SW: start peerHandler
			peerHandler(peer);

			// SW: join room
			navigator.mediaDevices.getUserMedia({video: false, audio: true}).then(function(stream) {
				room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
				// start room handler
				roomHandler(room, peer, user);
			});
		});

		$('#send').click(function() {
			sendChat(room);
		})

		$('#study').click(function() {
			var uid = user.uid;
			var uidRef = onBreakRef.child(uid);
			// DB: cancel onDisconnect; ONLY when goes back to study room
			uidRef.onDisconnect().cancel();
			// DB: set 'done' field
			uidRef.child('done').set(true);

			// DB: get studyroom id
			uidRef.child('room-id').once('value')
			.then(function(snapshot) {
				var roomId = snapshot.val();
				// go to studyroom
				window.location.href = "/study-rooms/" + roomId + '.html';
			})
		});

		$('#textarea-chat').keypress(function(e) {
			if (e.which == 13) {
				sendChat(room);
				return false; // equal to e.preventDefault(); prevents newline
			}
		});
	} else {
		window.location.href = "/";
	}
})

/** DB LISTENERS **/
roomRef.on('child_added', function(snapshot, prevkey) {
	var r_id = snapshot.key;
	var r_name = snapshot.child('name').val();
	var r_url = snapshot.child('url').val();
	appendLog('child_added: ' + r_id);
	addUser(r_id, r_name, r_url);
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

function checkUserEntry(user) {
	onBreakRef.once('value').then(function(snapshot) {
		if (snapshot.child(user.uid).exists()) { // user record exists under /on-break
			return;
		} else { // user came from URL
			// redirect to study-rooms.html
			window.location.href = "/study-rooms.html";
		}
	})
}

function peerHandler(peer) {
	peer.on('disconnected', function() {
		// remove pic & name: self
		removeUser(peer.id);
	});
}

function removeUser(id) {
	$('#' + id).remove();
	appendLog('removed user: ' + id);
}

function roomHandler(room, peer, user) {
	room.on('close', function() {
		// DB: remove peer
		roomRef.child(peer.id).remove();
		// remove pic & name: self
		removeUser(peer.id);
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
		var name = user.displayName;
		var url = user.photoURL;
		if (name == null) {
			name = 'ユーザー';
		}
		if (url == null) { // no photo is set
			url = '/images/monster.png';
		}
		roomRef.child(peer.id).set({
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
		appendLog('stream from: ' + stream.peerId);
		var id = stream.peerId;
		// play stream
		appendLog('<b>start interval</b>');
		var iv = setInterval(function() {
			var wrapper = $('#' + id);
			if (wrapper.length) {
				clearInterval(iv);
				appendLog('<b>end interval</b>');
				wrapper.append('<audio autoplay></audio>');
				wrapper.children('audio').get(0).srcObject = stream;
			}
		}, 10);
	});
}

function sendChat(room) {
	// get message
	var message = $('#textarea-chat').val();
	// clear textarea
	$('#textarea-chat').val('');
	// SW: send message
	room.send(message);
	// chat log
	appendChatLog('自分', message);
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