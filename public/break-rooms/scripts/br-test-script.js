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

		// DB: create ref
		userRef = roomRef.push();

		// SW: create peer
		const peer = new Peer({
			key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
			debug: 3
		});

		// open page
		peer.on('open', function(id) {
			// set peer Id
			peerId = id;
			// DB: handle disconnections;
			disconnectionHandler(userRef, user);
			
			// SW: start peerHandler
			peerHandler(peer);

			navigator.mediaDevices.getUserMedia({video: false, audio: true})
			.then((stream) => {
				// SW: join room
				room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
				// start room handler
				roomHandler(room, peerId, user, userRef);
			}).catch(function(error) { // no mic
				console.log(error);
				if (error.name) {
					console.log(error.name);
					// SW: join room w/o stream
					room = peer.joinRoom(roomId, {mode: 'sfu'});
					roomHandler(room, peerId, user, userRef);
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

		/** DB LISTENERS **/
		let flag = false; // append join message if true
		roomRef.orderByKey().on('child_added', function(snapshot, prevkey) {
			console.log(flag);

			var r_id = snapshot.child('peer-id').val();
			var r_name = snapshot.child('name').val();
			var r_url = snapshot.child('url').val();
			addUser(r_id, r_name, r_url);

			if (snapshot.key == userRef.key) {
				console.log(userRef.key);
				// set flag to true
				flag = true;
				appendChatLog('SYSTEM', '<b>＊＊＊休憩室に入室しました＊＊＊</b>');
			} else if (flag) {
				appendChatLog('SYSTEM', r_name + 'が入室しました');
			}

			// move temp users to another BR
			moveUserOnAdd(user.uid);
		});

		roomRef.on('child_removed', function(snapshot) {
			var r_id = snapshot.child('peer-id').val();
			var r_name = snapshot.child('name').val();
			removeUser(r_id);
			appendChatLog('SYSTEM', r_name + 'が退室しました');

			// move users if users <= 2
			//moveUserOnRemove(user.uid);
		});
	} else {
		window.location.href = "/";
	}
})




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
}

function appendChatLog(sender, message) {
	var log = $('#chat-log');
	if (sender == 'SYSTEM') {
		log.append('<span style="color: #9b4dca;">' + message + '</span><br>');
	} else {
		log.append('<b>' + sender + ':</b>&nbsp;' + message + '<br>');
	}
	// scroll to bottom
	updateScroll();
}

// check if user came to BR from a SR/BR
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

function disconnectionHandler(userRef, user) {
	// log
	$(window).on('beforeunload', function() {
		logUserAction(user, 'BR-out');
		return undefined;
	})

	userRef.onDisconnect().remove();
	onBreakRef.child(user.uid).onDisconnect().remove();
}

function getUserCount() {
	return roomRef.once('value').then(function(snapshot) {
		return snapshot.numChildren();
	})
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
				var message = log.message.data.msg;
				var name = log.message.data.name;
				roomData.push([name, message]);
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
			appendChatLog(name, message);
		}
	})
}

function mediaErrorHandler(errorName, user) {
	var reload = $('#reload');
	var lobby = $('#lobby');
	// show error message
	reload.before('<b><span style="color:red;">※マイクが使用できません。</span></b>チャットの送受信はできますが、音声は受信できません。<br>');
	switch(errorName) {
		case 'NotAllowedError': 
			reload.before('対策1: ブラウザからマイクのアクセスを許可');
			break;
		case 'NotReadableError':
			reload.before('対策1: カメラを使用している他のアプリケーション(Skypeなど)を閉じる');
			break;
		default:
			reload.before('対策1: PC側でカメラの設定をする');
	}
	reload.before(' → 下のボタンをクリック (ブラウザの更新ボタンは押さないでください)<br>');
	lobby.before('<br>対策2: ロビーで休憩する (マイク不要のテキストチャットのみの休憩室です)<br>')
	lobby.after('<br>詳しくは<a href="/help.html#sr-camera">こちらのページ</a>をお読みください。');
	// hide message
	$('.message').css('display', 'none');
	$('.error-msg').css('display', 'inline-block');

	reload.click(function() {
		reloadPage(user.uid);
	})

	lobby.click(function() {
		//DB: cancel disconnection
		onBreakRef.child(user.uid).onDisconnect().cancel()
		.then(function() {
			// go to lobby
			window.location.href = "room0-0.html";
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

function moveUserOnAdd(uid) {
	roomRef.once('value').then(function(snapshot) {
		var mCount = snapshot.numChildren();

		if (mCount >= (MAX_USERS + MIN_USERS)) { // over capacitated
			// DB: cancel disconnection
			onBreakRef.child(uid).onDisconnect().cancel();

			snapshot.forEach(function(childSnapshot) {
				if ((childSnapshot.child('peer-id') == peerId) && (childSnapshot.child('temp').exists())) { // snapshot for peer
					console.log('RELOCATE');
					looper(1);

					function looper(roomIndex) {
						if (roomIndex > NUM_BREAKROOMS) { // no open room
							// go to lobby
							alert('休憩室が満室なため、ロビーに移動します');
							window.location.href = '/break-rooms/room0-0.html';
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


function moveUserOnRemove(uid) {
	roomRef.once('value').then(function(snapshot) { // read initial state of data
		var mCount = snapshot.numChildren();

		// move user to another room
		if (mCount < MIN_USERS) { // users <= 2	
			// DB: cancel disconnection
			onBreakRef.child(uid).onDisconnect().cancel().then(function() {
				looper(1);
			});

			function looper(roomIndex) {
				if (roomIndex > NUM_BREAKROOMS) { // no open room
					// go to lobby
					alert('休憩室が満室なため、ロビーに移動します');
					window.location.href = '/break-rooms/room0-0.html';
					return;
				}
				rootRef.child('room0-' + roomIndex).once('value')
				.then(function(snapshot) {
					var memberCount = snapshot.numChildren();
					if (('room0-' + roomIndex) == roomId) {
						memberCount--;
					}
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

function reloadPage(uid) {
	// DB: cancel disconnection
	return onBreakRef.child(uid).onDisconnect().cancel()
	.then(function() {
		// reload page
		location.reload();
	});
}

function removeUser(id) {
	$('#' + id).remove();
}

function roomHandler(room, peerId, user, userRef) {
	room.on('data', function(data) {
		var name = data.data.name;
		var message = data.data.msg;
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
			userRef.set({
				'peer-id': peerId,
				'uid': user.uid,
				'name': name,
				'url': url,
				'temp': temp
			})
		});

		// SW: initialize chat log
		initChatLog(room);

		// show chat input
		$('.container-input').css('display', 'block');

		// list available mics
		mediaSetup(room, user);
	});

	room.on('stream', function(stream) {
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
	var message, name, data;

	// get message
	message = $('#textarea-chat').val();
	$('#textarea-chat').val('');

	// get name
	name = user.displayName;

	// SW: send chat
	data = {'msg': message, 'name': name};
	room.send(data);

	// show in local chat log
	appendChatLog('自分', message);
}

function setBreakroomName() {
	var rIndex = roomId.substr(roomId.length - 1);
	var roomName = '休憩室' + (rIndex);
	$('#breakroomName').text(roomName);
}

function setStudyroomName(user) {
	// show loading icon
	$('#studyroomName').after('<img id="loading" src="/images/loading.gif">');
    firebase.database().ref('/on-break/' + user.uid + '/room-id').once('value')
    .then(function(snapshot) { // データの読み込み
        return snapshot.val();
    }).then(function(id) { // studyroomIdを使って再度データを読み込む
        return firebase.database().ref('/study-rooms/' + id + '/name').once('value');
    }).then(function(snapshot) {
        return snapshot.val();
    }).then(function(text) {
    	// hide loading icon
    	$('#loading').remove();
        $('#studyroomName').text(text);
    });
}

function updateScroll() {
	var element = $('#chat-log');
	element.scrollTop(element.prop('scrollHeight'));
}