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

const roomId = "room2-6";
const rootRef = firebase.database().ref();
const roomRef = rootRef.child('/' + roomId + '/');

const MAX_MEMBER_COUNT = 5;
const NUM_BREAKROOMS = 4;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
		// check email verification
		checkEmailVerification(user);
		
		let peerId = null;
		let room = null;

		// set room name
		setRoomName();

		// create Peer
		const peer = new Peer({
			key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
			debug: 3
		});

		/** ACTIONS BY USER **/
		// open page
		peer.on('open', function(id) {
			appendLog('my ID: ' + id);
			// set peerId
			peerId = id;

			// DB: handle disconnections
			disconnectionHandler(peerId, user);

			// SW: join room with minimum stream
			navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: {width: 1, height: 1}
			}).then(function(stream) {
				room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
				// start roomHandler
				roomHandler(room, user);
			}).then(function() {
				// DB: check break status
				return checkBreakStatus(user, peerId);
			}).then(function() {	
				// SW: replace stream -> addVideo
				sendStream(room, peerId);
				// set style
				// TODO
				setStyleOnJoin(peerId, 'yes');
				mediaSetup(room, peerId);
			}).catch(function(error) { // error: 'no break'
				if (error.name) {
					initMediaErrorHandler(error.name, peerId, user);
				} else {
					console.log(error);
				}
				return;
			});
		})

		// click: "join" button
		$(".button-join").click(function() {
			// get radio button value
			var useCamera = $('input[name=use-camera]:checked').val();
			console.log(useCamera);


			// get cellIndex, rowIndex
			c = $(this).parent().index();
			r = $(this).parent().parent().index();

			// SW: replaceStream -> fires SFURoom#stream (getUserMedia is necessary)
			if (useCamera == 'yes') {
				// DB: add child
				roomRef.child(peerId).set({"row-index": r, "cell-index": c});

				var i = setInterval(function() {
					var r = room;
					if(r != null) {
						clearInterval(i);
						sendStream(r, peerId);
						mediaSetup(r, peerId);
					}
				}, 10);
			} else {
				var url = user.photoURL;
				// DB: add child w/ phoro url
				roomRef.child(peerId).set({"row-index": r, "cell-index": c, "photo-url": url});
			}
			
			// set style
			setStyleOnJoin(peerId, useCamera);
		});


		$('#break').click(function() {
			// DB: cancel onDisconnect
			rootRef.child('on-break/' + user.uid).onDisconnect().cancel();
			// get row & cell indeces
			var cell = $('#' + peerId);
			var r = cell.parent().index();
			var c = cell.index();
			// DB: add record to on-break
			if (!cell.children('.user-pic').length) { // no camera
				rootRef.child('on-break/' + user.uid).set({
					'row-index': r,
					'cell-index': c,
					'room-id': roomId
				}).then(function() {
					// go to break room
					goToBreakroom();
				});	
			} else {
				var url = cell.children('.user-pic').attr('src');
				console.log(url);

				rootRef.child('on-break/' + user.uid).set({
					'row-index': r,
					'cell-index': c,
					'room-id': roomId,
					'photo-url': url
				}).then(function() {
					// go to break room
					goToBreakroom();
				});	
			}
			
		});


		/** DB LISTENERS **/

		// set id to cell + photo if no video
		roomRef.on('child_added', function(snapshot, prevKey) {
			// get position
			var child_id = snapshot.key;
			var child_c = snapshot.child('cell-index').val();
			var child_r = snapshot.child('row-index').val();

			var cell = getCell(child_r, child_c);
			cell.attr('id', child_id);

			// add photo if exists
			if (snapshot.child('photo-url').exists()) {
				var url = snapshot.child('photo-url').val();
				addPhoto(child_r, child_c, url);
			}
		});

		// remove video, id from cell + photo if no video
		roomRef.on('child_removed', function(snapshot) {
			// get position
			var child_id = snapshot.key;

			if (!snapshot.child('photo-url').exists()) { // video
				removeVideo(child_id);
			} else { // photo
				removePhoto(child_id);
			}
			var cell = $('#' + child_id);
			cell.removeAttr('id');
		});

		// add coffee to cells on break
		rootRef.child('on-break').on('child_added', function(snapshot, prevkey) {
			if (snapshot.child('room-id').val() == roomId) {
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				addCoffee(r, c);
			}
		});

		// remove coffee to cells back from break
		rootRef.child('on-break').on('child_removed', function(snapshot) {
			if (snapshot.child('room-id').val() == roomId) {
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				removeCoffee(r, c);
			}
		})
	} else {
		window.location.href = "/";
	}
});

/** FUNCTIONS **/
function appendLog(text) {
	$('#log').append(text + '<br>');
}

// addCoffee -> addVideo
function addCoffee(r, c) {
	//appendLog('addCoffee:' + r + ', ' + c);
	var cell = getCell(r, c);
	// hide "join" button
	cell.children('.button-join').css('display', 'none');
	// add coffee
	cell.append('<img src="/images/coffee.png">');
}

function addPhoto(r, c, url) {
	var cell = getCell(r, c);
	cell.children('.button-join').css('display', 'none');
	cell.children('img').remove(); // remove coffee if exists
	cell.append('<img class="user-pic" src="' + url + '">');
}

// addVideo -> removeCoffee
function addVideo(id, stream) {
	//console.log('called addVideo');
	roomRef.child(id).on('value', function(snapshot) {
		if (!snapshot.child('photo-url').exists()) { // no photo
			var r = snapshot.child('row-index').val();
			var c = snapshot.child('cell-index').val();
			appendLog('addVideo: ' + r + ',' + c);
			if (r != null && c != null ) {
				var cell = $('#' + id);

				var iv = setInterval(function() {
					var cell = $('#' + id);
					if (cell.length) {
						clearInterval(iv);

						// hide children
						cell.children().css('display', 'none');
					
						// set video
						cell.append('<video autoplay="true" muted></video>');
						cell.children('video').get(0).srcObject = stream;
					
					}
				}, 10);
			}
		}
	})

}

function checkBreakStatus(user, pId) {
	//appendLog('checkBreakStatus');
	var ref = rootRef.child('on-break/' + user.uid);

	return ref.once('value')
	.then(function(snapshot) {
		if(!snapshot.child('done').exists()) { // no record in on-break
			throw 'no break';
		} else {
			var r = snapshot.child('row-index').val();
			var c = snapshot.child('cell-index').val();
			var a = [r, c];
			return a;
		}
	}).then(function(array) {
		// DB: add record to roomRef
		return roomRef.child(pId).set({'row-index': array[0], 'cell-index': array[1]});
	}).then(function() {
		// DB: remove record from on-break
		ref.remove();
	})
}

function disconnectionHandler(peerId, user) {
	$(window).on('beforeunload', function() {
		// log
		logUserAction(user, 'SR-out');
		return undefined;
	})

	// DB: remove records
	roomRef.child(peerId).onDisconnect().remove();
	// record deleted onDisconnect EXCEPT when going to breakroom
	rootRef.child('on-break/' + user.uid).onDisconnect().remove(); 
}

// fires peerJoin event with a dummy peer
function dummy() {
	//appendLog('dummy');
	let dummyPeer = new Peer("dummy", {
		key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
		debug: 3
	});

	dummyPeer.on('open', function(id) {
		let dummyRoom = dummyPeer.joinRoom(roomId, {mode: 'sfu'});

		dummyRoom.on('open', function() {
			dummyPeer.disconnect();
		});	
	});
}

function getCell(r, c) {
	return $("table tr:eq("+r+") td:eq("+c+")");
}

// finds open break room and goes there
function goToBreakroom() {
	//appendLog('goToBreakroom');
	var rootRef = firebase.database().ref();
	var prefix = "room0-";
	var array = [];
	var i = 0;

	for(var i = 0; i  < NUM_BREAKROOMS; i++) {
		rootRef.child(prefix + i).once('value')
		.then(function(snapshot) {
			var memberCount = snapshot.numChildren();
			if (memberCount < MAX_MEMBER_COUNT) { // found available room
				var roomId = snapshot.key;
				var j = roomId.substr(roomId.length - 1);
				while(j < MAX_MEMBER_COUNT) {
					rootRef.child(prefix + j).off();
					j++;
				}
				window.location.href = "/break-rooms/" + roomId + '.html';
			}
		});
	}
}

// handles MediaDevices error on pageload
function initMediaErrorHandler(errorName, peerId, user) {
	console.log(errorName);

	var ref = rootRef.child('on-break/' + user.uid);
	ref.once('value').then(function(snapshot) {
		if (snapshot.exists()) { // back from break
			var r = snapshot.child('row-index').val();
			var c = snapshot.child('cell-index').val();
			var url = snapshot.child('photo-url').val();

			// DB: add child to room
			roomRef.child(peerId).set({"row-index": r, "cell-index": c, "photo-url": url});

			// set style
			setStyleOnJoin(peerId, 'no');
		} else { // not back from break
			// disable join buttons
			$('.button-join').attr('disabled', 'disabled');

			var errorMsg = $('.error-msg');
			// show error message
			if (errorName == 'NotAllowedError') { // access to camera denied from browser
				errorMsg.append('※カメラが使用できません。<br>');
				errorMsg.append('対策1: ブラウザからカメラのアクセスを許可 → ページを更新<br>');
				errorMsg.append('対策2: 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
			} else if (errorName == 'NotReadableError') { // camera used in another app 
				errorMsg.append('※カメラが使用できません。<br>');
				errorMsg.append('対策1: カメラを使用している他のアプリケーション(Skypeなど)を閉じる → ページを更新<br>');
				errorMsg.append('対策2: 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
			} else { // other errors
				errorMsg.append('※カメラが使用できません。<br>');
				errorMsg.append('対策: 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
			}
			errorMsg.append('詳しくは<a href="/help.html">こちらのページ</a>をお読みください。');

			// radio button listener
			$("input[name='use-camera']").change(function() {
				var val = $(this).val();
				if (val == 'no') {
					// remove message
					errorMsg.empty();
					// enable join buttons
					$('.button-join').removeAttr('disabled');
				}
			})
		}
	})
}

// handles MediaDevices error
function mediaErrorHandler(errorName, peerId) {
	var errorMsg = $('.error-msg');

	// show error message
	if (errorName == 'NotAllowedError') { // access to camera denied from browser
		errorMsg.append('※カメラが使用できません。<br>');
		errorMsg.append('対策1: ブラウザからカメラのアクセスを許可 → ページを更新<br>');
		errorMsg.append('対策2: ページを更新 → 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
	} else if (errorName == 'NotReadableError') { // camera used in another app 
		errorMsg.append('※カメラが使用できません。<br>');
		errorMsg.append('対策1: カメラを使用している他のアプリケーション(Skypeなど)を閉じる → ページを更新<br>');
		errorMsg.append('対策2: ページを更新 → 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
	} else { // other errors
		errorMsg.append('※カメラが使用できません。<br>');
		errorMsg.append('対策: ページを更新 → 右上の「カメラを使用しない」を選択 → 「入室」ボタンを押す (ビデオの代わりにプロフィール画像が表示されます)<br><br>');
	}
	errorMsg.append('詳しくは<a href="/help.html">こちらのページ</a>をお読みください。');
}

// allows user to choose cameras
function mediaSetup(room, pId) {
	var selectCamera = $('#select-camera');
	navigator.mediaDevices.enumerateDevices()
	.then(function(deviceInfos) {
		for (var i = 0; i < deviceInfos.length; i++) {
			var info = deviceInfos[i];
			if (info.kind == 'videoinput') {
				var option = $('<option>');
				option.val(info.deviceId);
				option.text(info.label);
				selectCamera.append(option);
			}
		}

		// add listener to <select>
		selectCamera.on('change', function() {
			var source = selectCamera.val();
			appendLog(source);

			// get new stream
			var cell = $('#' + pId);
			var w = cell.width();
			var h = cell.height();

			navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					deviceId: {exact: source},
					height: h,
					width: w
				}
			}).then(function(stream) {
				// replace local video
				cell.children('video').get(0).srcObject = stream;
				// SW: send stream to room
				room.replaceStream(stream);
			}).catch(function(error) {
				if (error.name) {
					mediaErrorHandler(error.name, pId);
				} else {
					console.log(error);
				}
			})
		});
	});
}

function removeCoffee(r, c) {
	var cell = getCell(r, c);
	// remove img
	cell.children('img').remove();
	if (cell.children().length > 1) { // video & button
		// hide "join" button
		cell.children('.button-join').css('display', 'none');
	} else { // button only
		// show "join button"
		cell.children('.button-join').css('display', 'inline');
	}
}

function removePhoto(id) {
	var cell = $('#' + id);
	// remove video
	cell.children('.user-pic').remove();
	if (cell.children().length > 1) { // has coffee
		cell.children('button').css('display', 'none');
	} else {
		cell.children('.button-join').removeAttr('style');
	}
}

function removeVideo(id) {
	var cell = $('#' + id);
	// remove video
	cell.children('video').remove();
	if (cell.children().length > 1) { // has coffee
		cell.children('button').css('display', 'none');
	} else {
		cell.children('.button-join').removeAttr('style');
	}
}

// handle SFURoom events
function roomHandler(room, user) {
	/*
	room.on('data', function(data) {
		var obj = data.data;
		console.log(obj['cell']);
	})
	*/

	room.on('open', function() {
		// log
		logUserAction(user, 'SR-in');
		appendLog('joined room');
		dummy();
	})

	room.on('peerJoin', function(id) {
		var bool = id.startsWith('dummy');
		if (!bool) {
			appendLog('peerJoin: ' + id);
			//dummy();
		}
	})

	room.on('peerLeave', function(id) {
		if(!(id.startsWith('dummy'))) {
			appendLog('peerLeave: ' + id);
		}
	})

	room.on('removeStream', function(stream) {
		appendLog('removeStream from: ' + stream.peerId);
		// remove video
		removeVideo(stream.peerId);
	})

	// get stream & add video
	room.on('stream', function(stream) {
		appendLog('stream from: ' + stream.peerId);
		addVideo(stream.peerId, stream);

	});
}

function sendStream(room, pId) {
	console.log('sendStream called');
	var w = $('#' + pId).width();
	var h = $('#' + pId).height();

	navigator.mediaDevices.getUserMedia({
		audio: false,
		video: {
			width: w,
			height: h
		}
	}).then(function(s) {
		var stream = null;
		var iv = setInterval(function() {
			stream = s
			if(stream != null) {
				clearInterval(iv);
				appendLog('replace stream');
				room.replaceStream(stream);
				addVideo(pId, stream);
			}
		}, 10);
	}).catch(function(error) {
		if (error.name) {
			mediaErrorHandler(error.name, pId);
		} else {
			console.log(error);
		}
	});
}

function setRoomName() {
	rootRef.child('study-rooms/' + roomId + '/name').once('value')
	.then(function(snapshot) {
		$('#roomName').text(snapshot.val());
	});
}
 
function setStyleOnJoin(id, useCamera) {
	var cell = $('#' + id);

	// set border
	cell.css('border', '0.3rem solid black');
	// hide "join" button in cell
	cell.children('.button-join').css('display', 'none');
	// disable button
	$("table").find('.button-join').attr('disabled', 'disabled');
	
	// switch menu
	$('.menu-camera').css('display', 'none');
	$(".menu").css('display', 'inline-block');

	if (useCamera == 'no') { // no camera
		$('.menu > span').css('display', 'none');
		$('#select-camera').css('display', 'none');
	}

}