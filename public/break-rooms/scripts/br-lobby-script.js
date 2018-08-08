/** TODO 
- enable checkUserEntry
**/

// Initialize Firebase
var config = {
apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
authDomain: "fireba-a8775.firebaseapp.com",
databaseURL: "https://fireba-a8775.firebaseio.com",
projectId: "fireba-a8775"
};
firebase.initializeApp(config);

const roomId = getRoomId();
const rootRef = firebase.database().ref();
const roomRef = rootRef.child(roomId + '/');
const onBreakRef = rootRef.child('on-break');
const chatRef = rootRef.child('log-chat/' + roomId);

var peerId = null;
var room = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check if user came from a studyroom
		checkUserEntry(user);

		// set room name
		setStudyroomName(user);

		// check guest time limit
		checkGuestTimeout(user);

		// DB: create ref
		var userRef = roomRef.push();

		// SW: create peer
		const peer = new Peer({
			key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
			debug: 3
		});

		peer.on('open', (id) => {
			peerId = id;
			// DB: handle disconnections
			disconnectionHandler(userRef, user);

			// SW: join room
			room = peer.joinRoom(roomId, {mode: 'sfu'});
			roomHandler(room, userRef, user);
		})

		$('#send').click(function() {
			sendChat(room, user);
		})

		$('.study').click(function() {
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
			if (e.keyCode == 13 && !e.shiftKey) {
				sendChat(room, user);
				return false; // equal to e.preventDefault(); prevents newline
			}
		});

		/** [START] DB LISTENERS **/
		// set # of users online
		roomRef.on('value', function(snapshot) {
			// update # of users
			var numUsers = snapshot.numChildren();
			$('#num-users').text(numUsers);
		});

		// log user join
		roomRef.orderByKey().startAt(userRef.key).on('child_added', function(childSnapshot) {
			if (childSnapshot.key != userRef.key) { // log new users AFTER current user
				var name = childSnapshot.child('name').val();
				sendSystemChat(name + 'が入室しました');
			}
		});

		// log user leave
		roomRef.on('child_removed', function(childSnapshot) {
			var name = childSnapshot.child('name').val();
			sendSystemChat(name + 'が退室しました');
		});
		/** [END] DB LISTENERS **/
	} else {
		window.location.href = "/";
	}
});

function checkUserEntry(user) {
	var promise = onBreakRef.once('value');
	var ms = 1000 * 5;
	setPromiseTimeout(ms, promise)
	.then((snapshot) => {
		if (snapshot.child(user.uid).exists()) { // user record exists under /on-break
			return;
		} else { // user came from URL
			// redirect to study-rooms.html
			window.location.href = "/study-rooms.html";
		}
	}).catch((error) => {
		if (error == 'promiseTO') {
			reloadPage(user.uid);
			alert('データベースが読み込めないため、ページを更新します');
		}
	});
}

// NOTE: another disconnection handling above
function disconnectionHandler(userRef, user) {
	// log user action
	$(window).on('beforeunload', function() {
		logUserAction(user, 'BR-out');
		return undefined;
	});

	// DB: remove on disconnection
	userRef.onDisconnect().remove();
	onBreakRef.child(user.uid).onDisconnect().remove();
}

function initChatLog(room) {
	room.getLog();
	room.once('log', (logs) => {
		var roomData = [];
		// store past chat messages
		for (var i = 0; i < logs.length; i++) {
			const log = JSON.parse(logs[i]);
			//console.log(log);
			if (log.messageType == 'ROOM_DATA') {
				var name = log.message.data.name;
				var message = log.message.data.msg;
				var url = log.message.data.url;
				roomData.push([name, message, url]);
			}
		}

		var start, end;
		if (roomData.length < 10) { // less than 10 messages
			start = 0;
			end = roomData.length;
		} else { // 10 messages or more
			start = roomData.length - 10;
			end = roomData.length;
		}

		// append messages to chat log
		for (var i = start; i < end; i++) {
			var name = roomData[i][0];
			var message = roomData[i][1];
			var url = roomData[i][2]
			onData(name, message, url);
		}
		// append join message
		sendSystemChat('<b>＊＊＊ロビーに入室しました＊＊＊</b>');

	})
}

// add chat to chat log
function onData(name, message, url) {
	$('.table-lobby').append('<tr><td class="td-user"><img class="user-pic" src="' + url + '"></td>' +
		'<td class="td-message"><b>' + name + '</b><br>' + message + '</td></tr>');

	updateScroll();
}

function reloadPage(uid) {
	// DB: cancel disconnection
	return onBreakRef.child(uid).onDisconnect().cancel()
	.then(function() {
		// reload page
		location.reload();
	});
}

function roomHandler(room, userRef, user) {
	room.on('data', (data) => {
		var name = data.data.name;
		var message = data.data.msg;
		var url = data.data.url;
		onData(name, message, url);
	})

	room.on('open', () => {
		// log user action
		logUserAction(user, 'BR-in');
		// DB: add child
		userRef.set({
			'name': user.displayName || 'ユーザー',
			'uid': user.uid
		}).then(function() {
			// SW: initialize chat log
			initChatLog(room);
			// show input container
			$('.container-input').css('display', 'block');
		});
	})
}

// DB: send chat
function sendChat(room, user) {
	var name = user.displayName || 'ユーザー';
	var url = user.photoURL || '/images/monster.png';
	var message = $('#textarea-chat').val();
	$('#textarea-chat').val('');

	// SW: send chat
	data = {'msg': message, 'name': name, 'url': url};
	room.send(data);

	// show in local chat log
	onData(name, message, url);
}

// add user join/leave to chat log
function sendSystemChat(msg) {
	var table = $('.table-lobby');
	table.append('<tr><td class="td-system" colspan="2">' + msg + '</td></tr>');

	updateScroll();
}

// sets name of study room where user came from
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

// scroll to bottom of div
function updateScroll() {
	var element = $('#chat-log');
	element.scrollTop(element.prop('scrollHeight'));
}