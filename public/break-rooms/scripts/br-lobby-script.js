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

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check if user came from a studyroom
		//checkUserEntry(user);

		// handle disconnections
		disconnectionHandler(user);

		// set room name
		setStudyroomName(user);

		// DB: add user to room
		var userRef = roomRef.push();
		// DB: handle disconnections
		userRef.onDisconnect().remove();

		// DB: add child
		userRef.set({
			'name': user.displayName || 'ユーザー',
			'uid': user.uid
		}).then(function() {
			// log user action
			logUserAction(user, 'BR-in');
			// show input container
			$('.container-input').css('display', 'block');
		});

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

		// read chats
		var query = chatRef.orderByKey().limitToLast(20);
		var counter = 1;
		var max = 20;
		query.once('value').then(function(snapshot) {
			if (snapshot.numChildren() < max) { // get # of chats BEFORE join
				max = snapshot.numChildren();
			}
			console.log(max);
		}).then(function() {
			if(max == 0) {
				sendSystemChat('<b>＊＊＊ロビーに入室しました＊＊＊</b>');
			}
			query.on('child_added', function(childSnapshot) {
				onChildAdded(childSnapshot);
				if (counter == max) { // last chat BEFORE join
					sendSystemChat('<b>＊＊＊ロビーに入室しました＊＊＊</b>');
				}
				counter++;
			});
		})
		/** [END] DB LISTENERS **/
	} else {
		window.location.href = "/";
	}
});

// NOTE: another disconnection handling above
function disconnectionHandler(user) {
	// log user action
	$(window).on('beforeunload', function() {
		logUserAction(user, 'BR-out');
		return undefined;
	});
	onBreakRef.child(user.uid).onDisconnect().remove();
}

// add chat to chat log
function onChildAdded(childSnapshot) {
	var table = $('.table-lobby');
	// add to chat log
	var name = childSnapshot.child('name').val();
	var url = childSnapshot.child('url').val();
	var msg = childSnapshot.child('msg').val();

	table.append('<tr><td class="td-user"><img class="user-pic" src="' + url + '"></td>' +
		'<td class="td-message"><b>' + name + '</b><br>' + msg + '</td></tr>');

	updateScroll();
}

// DB: send chat
function sendChat(user) {
	// get time
	var time = new Date().getTime();
	var name = user.displayName || 'ユーザー';
	var url = user.photoURL || '/images/monster.png';
	var msg = $('#textarea-chat').val();
	
	// DB: add child
	chatRef.push().set({
		'name': name,
		'url': url,
		'msg': msg,
		'timestamp': time
	}).then(function() {
		// clear textarea
		$('#textarea-chat').val('');
	});
}

// add user join/leave to chat log
function sendSystemChat(msg) {
	var table = $('.table-lobby');
	table.append('<tr><td class="td-system" colspan="2">' + msg + '</td></tr>');
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