/** TODO
- enable checkUserEntry, disconnectionHandler
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

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check if user came from a studyroom
		//checkUserEntry(user);

		// handle disconnections
		disconnectionHandler(user);

		// set room names
		setStudyroomName(user);

		// TODO DB: initialize chat log to last 10 messages
		
		// DB: add user to room
		roomRef.child(user.uid).set({'name': user.displayName})
		.then(function() {
			// show input container
			$('.container-input').css('display', 'block');
		})

		$('#send').click(function() {
			sendChat(user);
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
			if (e.keyCode == 13 && !e.shiftKey) {
				sendChat(user);
				return false; // equal to e.preventDefault(); prevents newline
			}
		});
	} else {
		window.location.href = "/";
	}
});

roomRef.on('value', function(snapshot) {
	// update # of users
	var numUsers = snapshot.numChildren();
	$('#num-users').text(numUsers);
});

roomRef.on('child_added',function(childSnapshot) {
	// show system message
	var name = childSnapshot.child('name').val();
	$('.table-lobby').append('<tr><td class="td-system" colspan="2">' + name + 
		'が入室しました</td></tr>');
	updateScroll();
})

roomRef.on('child_removed', function(childSnapshot) {
	var name = childSnapshot.child('name').val();
	$('.table-lobby').append('<tr><td class="td-system" colspan="2">' + name + 
		'が退室しました</td></tr>');
	updateScroll();
})

// TODO
chatRef.on('child_added', function(childSnapshot) {
	var table = $('.table-lobby');
	// add to chat log
	var name = childSnapshot.child('name').val();
	var url = childSnapshot.child('url').val();
	var msg = childSnapshot.child('msg').val();

	table.append('<tr><td class="td-user"><img class="user-pic" src="' + url + '"></td>' +
		'<td class="td-message"><b>' + name + '</b><br>' + msg + '</td></tr>');
	updateScroll();
});

function disconnectionHandler(user) {
	// log user action
	$(window).on('beforeunload', function() {
		logUserAction(user, 'BR-out');
		return undefined;
	});

	roomRef.child(user.uid).onDisconnect().remove();
	onBreakRef.child(user.uid).onDisconnect().remove();
}

function sendChat(user) {
	// get time
	var time = new Date().getTime();
	var name = user.displayName || 'ユーザー';
	var url = user.photoURL || '/images/monster.png';
	var msg = $('#textarea-chat').val();
	
	// DB: add child
	chatRef.child(time).set({
		'name': name,
		'url': url,
		'msg': msg
	}).then(function() {
		// clear textarea
		$('#textarea-chat').val('');
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

function updateScroll() {
	var element = $('#chat-log');
	element.scrollTop(element.prop('scrollHeight'));
}