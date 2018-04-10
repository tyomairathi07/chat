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

const NUM_BREAKROOMS = 10;
const MAX_USERS = 5;
const MIN_USERS = 3;

var peerId = null;
var room = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check if user came from a studyroom
		//checkUserEntry(user);

		// set room names
		setBreakroomName();
		setStudyroomName(user);

		// SW: create peer
		const peer = new Peer({
			key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
			debug: 3
		});

		/*
		let peerId = null;
		let room = null;
		*/

		// open page
		peer.on('open', function(id) {
			// set peer Id
			peerId = id;
			// DB: handle disconnections;
			disconnectionHandler(peerId, user);
			
			// SW: start peerHandler
			peerHandler(peer);

			// DB: get past 10 chat log
			initChatLog()
			.then(function() {
				return navigator.mediaDevices.getUserMedia({video: false, audio: true});
			}).then(function(stream) {
				// SW: join room
				room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
				// start room handler
				roomHandler(room, peer, user);
			}).catch(function(error) { // no mic
				console.log(error);
				if (error.name) {
					console.log(error.name);
					// SW: join room w/o stream
					room = peer.joinRoom(roomId, {mode: 'sfu'});
					roomHandler(room, peer, user);
					mediaErrorHandler(error.name, user);
				}
				
			})
		});

		$('#send').click(function() {
			sendChat(room, user);
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
				sendChat(room, user);
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
	addUser(r_id, r_name, r_url);
	appendChatLog('SYSTEM', r_name + 'が入室しました');

	// move temp users to another BR
	moveUserOnAdd();
});

roomRef.on('child_removed', function(snapshot) {
	var r_id = snapshot.key;
	var r_name = snapshot.child('name').val();
	removeUser(r_id);
	appendLog('child_removed: ' + r_id);
	appendChatLog('SYSTEM', r_name + 'が退室しました');

	// move users if users <= 2
	moveUserOnRemove();
});


/** FUNCTIONS **/
function addUser(id, name, url) {
	// TODO: delete later
	if (name == null) {
		name = 'テストユーザー';
	}
	if (url == null) {
		url = '/images/monster.png';
	}

	$('.users').append('<div class="user-wrapper" id="' + id + '"><img src="' + url +
		 '" class="user-pic"><br><span>' + name + '</span></div>');
	appendLog('added user: ' + id);
}

function appendLog(text) {
	$('#log').append(text + '<br>');
}

function appendChatLog(sender, message) {
	$('#chat-log').append('<b>' + sender + ': </b>' + message + '<br>');
	updateScroll();
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

function disconnectionHandler(peerId, user) {
	// log
	$(window).on('beforeunload', function() {
		logUserAction(user, 'BR-out');
		return undefined;
	})

	roomRef.child(peerId).onDisconnect().remove();
	onBreakRef.child(user.uid).onDisconnect().remove();
}

function getUserCount() {
	return roomRef.once('value').then(function(snapshot) {
		return snapshot.numChildren();
	})
}

function initChatLog() {
	var ref = rootRef.child('log-chat/' + roomId);
	var query = ref.orderByKey().limitToLast(10);
	return query.once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			var name = childSnapshot.child('name').val();
			if (!name) {
				name = 'ユーザー';
			}
			var message = childSnapshot.child('message').val();
			appendChatLog(name, message);
		})
	});	
}

function mediaErrorHandler(errorName, user) {
	var btn = $('#reload');
	// show error message
	btn.before('※マイクが使用できません。チャットの送受信はできますが、音声は受信できません。<br>');
	switch(errorName) {
		case 'NotAllowedError': 
			btn.before('対策: ブラウザからマイクのアクセスを許可');
			break;
		case 'NotReadableError':
			btn.before('対策: カメラを使用している他のアプリケーション(Skypeなど)を閉じる');
			break;
		default:
			btn.before('対策: PC側でカメラの設定をする');
	}
	btn.before(' → 下のボタンをクリック<br>(ブラウザの更新ボタンは押さないでください)<br><br>');
	btn.before('詳しくは<a href="/help.html">こちらのページ</a>をお読みください。<br>');
	// hide message
	$('.message').css('display', 'none');
	$('.error-msg').css('display', 'inline-block');

	btn.click(function() {
		// DB: cancel disconnection
		onBreakRef.child(user.uid).onDisconnect().cancel()
		.then(function() {
			// reload page
			location.reload();
		})
	})
}

function mediaSetup(room, user) {
	var selectMic = $('#select-mic');
	navigator.mediaDevices.enumerateDevices()
	.then(function(deviceInfos) {
		for (var i = 0; i < deviceInfos.length; i++) {
			var info = deviceInfos[i];
			if (info.kind == 'audioinput' && info.deviceId != 'communications') {
				var option = $('<option>');
				// set value
				option.val(info.deviceId);
				// remove "配列"
				var label = info.label;
				label = label.replace('配列', '');
				// set label
				option.text(label);
				// append to <select>
				selectMic.append(option);
			}
		}

		// add listener to <select>
		selectMic.on('change', function() {
			// get device id
			var source = $('#select-mic').val();
			// get media
			navigator.mediaDevices.getUserMedia({
				audio: {deviceId: {exact: source}},
				video: false
			}).then(function(stream) {
				// SW: send stream to room
				room.replaceStream(stream);
			}).catch(function(error) {
				console.log(error);
				mediaErrorHandler(error.name, user);
			})
		})
	})
}

function moveUserOnAdd() {
	roomRef.once('value').then(function(snapshot) {
		var mCount = snapshot.numChildren();

		if (mCount >= (MAX_USERS + MIN_USERS)) { // over capacitated
			// DB: cancel disconnection
			var uid = snapshot.child(peerId).child('uid').val();
			console.log(uid);
			onBreakRef.child(uid).onDisconnect().cancel();

			snapshot.forEach(function(childSnapshot) {
				if ((childSnapshot.key == peerId) && (childSnapshot.child('temp').exists())) { // snapshot for peer
					console.log('RELOCATE');
					looper(0);

					function looper(roomIndex) {
						if (roomIndex >= NUM_BREAKROOMS) {
							return;
						}
						rootRef.child('room0-' + roomIndex).once('value')
						.then(function(snapshot) {
							var memberCount = snapshot.numChildren();
							if (memberCount <= 2) {
								alert('定員を超えたため、休憩室を移動します');
								window.location.href = 'room0-' + roomIndex + '.html';
								return;
							} else {
								looper(++roomIndex)
							}
						})
					}
				}
			})
		}
	})
}


function moveUserOnRemove() {
	roomRef.once('value').then(function(snapshot) { // read initial state of data
		var mCount = snapshot.numChildren();

		if (mCount < MIN_USERS) { // users <= 2
			// move user to another room: 
			var uid = snapshot.child(peerId).child('uid').val();
			// DB: cancel disconnection
			onBreakRef.child(uid).onDisconnect().cancel().then(function() {
				looper(0);
			});

			function looper(roomIndex) {
				if (roomIndex >= NUM_BREAKROOMS) {
					// TODO
					return;
				}
				rootRef.child('room0-' + roomIndex).once('value')
				.then(function(snapshot) {
					console.log('room0-' + roomIndex);
					var memberCount = snapshot.numChildren();
					if (('room0-' + roomIndex) == roomId) {
						memberCount--;
					}
					console.log(memberCount);
					if (memberCount < MAX_USERS) { // available room
						if (memberCount <= 1) { // room only has one or no user
							roomIndex--;
						}
						alert('2人以下になったため、休憩室を移動します')
						window.location.href = '/break-rooms/room0-' + roomIndex + '.html';
					} else {
						looper(++roomIndex);
					}
				})
			}

		}
	});

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
		// log
		logUserAction(user, 'BR-in');

		// DB: add peer
		var name = user.displayName;
		var url = user.photoURL;
		var temp = null;

		if (name == null) {
			name = 'ユーザー';
		}
		if (url == null) { // no photo is set
			url = '/images/monster.png';
		}

		// DB: get userCount
		getUserCount().then(function(mCount) { // # of users before new user
			if (mCount >= MAX_USERS) {
				temp = true;
			}
		}).then(function() {
			roomRef.child(peer.id).set({
				'uid': user.uid,
				'name': name,
				'url': url,
				'temp': temp
			})
		});

		// show chat input
		$('.container-input').css('display', 'block');

		// list available mics
		mediaSetup(room, user);
	});

	room.on('stream', function(stream) {
		// console.log('stream from: ' + stream.peerId);
		var id = stream.peerId;
		// play stream
		var iv = setInterval(function() {
			var wrapper = $('#' + id);
			if (wrapper.length) {
				clearInterval(iv);
				// append <audio> if it doesn't exist
				if (!wrapper.children('audio').length) {
					wrapper.append('<audio autoplay></audio>');
				}
				wrapper.children('audio').get(0).srcObject = stream;
			}
		}, 10);
	});
}

function sendChat(room, user) {
	// get current time in milliseconds
	var time = new Date().getTime();

	// get message
	var message = $('#textarea-chat').val();
	// clear textarea
	$('#textarea-chat').val('');
	console.log(message);

	// DB: add to log-chat/roomId/timestamp
	var ref = rootRef.child('log-chat/' + roomId);
	ref.child(time).set({'id': user.uid, 'name': user.displayName, 'message': message})
	.then(function() {
		// SW: send message
		room.send(message);
		// chat log
		appendChatLog('自分', message);
	});
}

function setBreakroomName() {
	var rIndex = roomId.substr(roomId.length - 1);
	var roomName = '休憩室' + (++rIndex);
	$('#breakroomName').text(roomName);
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

function updateScroll() {
	var element = $('#chat-log');
	element.scrollTop(element.prop('scrollHeight'));
}