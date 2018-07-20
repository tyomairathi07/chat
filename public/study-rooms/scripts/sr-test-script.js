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
const roomRef = rootRef.child('/' + roomId + '/');

const MAX_USERS = 5;
const NUM_BREAKROOMS = 10;

let peerId = null;
let room = null;
let localStream = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
		// check email verification
		checkEmailVerification(user);

		// set room name
		// show loading: check DB for breaks & room name -> removed in 2 places
		$('.breadcrumb').append('<img id="loading" src="/images/loading.gif">');
		setRoomName();
		

		// create Peer
		const peer = new Peer({
			key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
			debug: 3
		});

		/** ACTIONS BY USER **/
		// open page
		peer.on('open', function(id) {
			// set peerId
			peerId = id;

			// DB: handle disconnections
			disconnectionHandler(peerId, user);

			navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: {width: 1, height: 1}
			}).then(function(stream) {
				localStream = stream;
				// SW: join room
				room = peer.joinRoom(roomId, {mode: 'sfu', stream: localStream});
				// start roomHandler
				roomHandler(room, user);
			}).then(() => {
				// automatically add users from BR
				return breakUsersHandler(user, peerId, room);
			}).catch((error) => {
				if (error == 'notOnBreak') {
					// hide loading
					$('#loading').remove();
					// enable buttons
					$('.button-join').removeAttr('disabled');
				}
				if (error.name) {
					initMediaErrorHandler(error.name, peerId, user);
				}
				console.log(error);
			});
		})

		// click: "join" button
		$(".button-join").click(function() {
			// get radio button value
			var useCamera = $('input[name=use-camera]:checked').val();

			// get cellIndex, rowIndex
			c = $(this).parent().index();
			r = $(this).parent().parent().index();

			// SW: replaceStream -> fires SFURoom#stream 
			if (useCamera == 'yes') {
				// DB: add child
				roomRef.child(peerId).set({"row-index": r, "cell-index": c})
				.then(() => {
					sendStream(room, peerId);
					mediaSetup(room, peerId);
				});
			} else {
				var url = user.photoURL;
				if (url == null) {
					url = '/images/monster.png';
				}
				// DB: add child w/ phoro url
				roomRef.child(peerId).set({"row-index": r, "cell-index": c, "photo-url": url});
			}
			
			// set style
			setStyleOnJoin(peerId, useCamera);
		});


		$('#break').click(function() {
			var cell = $('#' + peerId);
			var userPic = cell.children('.user-pic');
			var url = userPic.attr('src');

			// show loading
			cell.children().remove();
			cell.append('<img id="loading" src="/images/loading.gif">');

			// DB: cancel onDisconnect
			rootRef.child('on-break/' + user.uid).onDisconnect().cancel();
			// get row & cell indeces
			var r = cell.parent().index();
			var c = cell.index();
			// DB: add to on break
			if (url === undefined) { // uses camera
				rootRef.child('on-break/' + user.uid).set({
					'row-index': r,
					'cell-index': c,
					'room-id': roomId
				}).then(function() {
					// go to break room
					goToBreakroom();
				});	
			} else { // no camera
				rootRef.child('on-break/' + user.uid).set({
					'row-index': r,
					'cell-index': c,
					'room-id': roomId,
					'photo-url': url
				}).then(function() {
					// don't show coffee
					removeCoffee(r, c);
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

		// add coffee (or loading) to cells on break
		rootRef.child('on-break').on('child_added', function(snapshot, prevkey) {
			if (snapshot.child('room-id').val() == roomId) {
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				var cell = getCell(r, c);
				if (snapshot.key != user.uid) {
					// hide or remove elements
					cell.children('.button-join').css('display', 'none');
					cell.children(':not(.button-join)').remove();
					cell.append('<img class="coffee" src="/images/coffee.png">');
				}
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
function addPhoto(r, c, url) {
	var cell = getCell(r, c);
	cell.children('.button-join').css('display', 'none');
	cell.children('img').remove(); // remove coffee if exists
	cell.append('<img class="user-pic" src="' + url + '">');
}

// addVideo -> removeCoffee
function addVideo(id, stream) {
	//console.log('addVideo');
	roomRef.child(id).on('value', function(snapshot) {
		if (!snapshot.child('photo-url').exists()) { // no photo
			var r = snapshot.child('row-index').val();
			var c = snapshot.child('cell-index').val();
			if (r != null && c != null ) {
				var cell = $('#' + id);

				var iv = setInterval(function() {
					var cell = $('#' + id);
					if (cell.length) {
						clearInterval(iv);

						// remove loading
						cell.children('#loading').remove();
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

function breakUsersHandler(user, peerId, room) {
	var ref = rootRef.child('on-break/' + user.uid);

	let r, c, url;

	return ref.once('value')
	.then((snapshot) => {
		if (!snapshot.child('done').exists()) {
			throw 'notOnBreak';
		} 
		r = snapshot.child('row-index').val();
		c = snapshot.child('cell-index').val();
		url = snapshot.child('photo-url').val();
		// DB: add child 
		return roomRef.child(peerId).set({'row-index': r, 'cell-index': c, 'photo-url': url});
	}).then(() => {
		if (url == null) { // uses camera
			// SW: replace stream
			sendStream(room, peerId);
			// set style
			mediaSetup(room, peerId);
			setStyleOnJoin(peerId, 'yes');
		} else {
			// set style
			setStyleOnJoin(peerId, 'no');
		}
	}).then(() => {
		// hide loading
		$('#loading').remove();
		ref.remove();
	})
}

function disconnectionHandler(peerId, user) {
	$(window).on('beforeunload', function() {
		// free camera
		if (localStream) {
			var tracks = localStream.getTracks();
			tracks.forEach(function(track) {
				track.stop();
			});
		}

		var video = $('#'+peerId).children('video').get(0);
		if (video)
			video.srcObject = null;
	
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
	let dummyPeer = new Peer({
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
	var ref = firebase.database().ref();

	looper(1);

	function looper(roomIndex) {
		if (roomIndex > NUM_BREAKROOMS) { // no open room
			// go to lobby
			window.location.href = '/break-rooms/room0-0.html';
			return;
		}
		ref.child('room0-' + roomIndex).once('value')
		.then(function(snapshot) {
			var memberCount = snapshot.numChildren();
			// TODO
			if (memberCount < MAX_USERS) { // open room
				if ((memberCount == 0) && (roomIndex != 1)) { // no members
					roomIndex--;
				}
				// go to BR
				window.location.href = '/break-rooms/room0-' + roomIndex + '.html';
			} else {
				looper(++roomIndex);
			}
		})
	}
}

// handles MediaDevices error on pageload
function initMediaErrorHandler(errorName, peerId, user) {
	console.log(errorName);

	// DB: remove from on-break
	var ref = rootRef.child('on-break/' + user.uid);
	ref.once('value').then(function(snapshot) {
		if (snapshot.exists()) { 
			ref.remove();
		}
	});

	// disable join buttons
	$('.button-join').attr('disabled', 'disabled');
	// hide radio buttons
	$(".menu-camera").css('display', 'none');

	// show error message
	showMediaErrorMessage(errorName);
}

// handles MediaDevices error
function mediaErrorHandler(errorName, peerId) {
	console.log(errorName);

	var errorMsg = $('.error-msg');

	// show error message
	showMediaErrorMessage(errorName);
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

			var vConstraints = {deviceId : {exact: source}, frameRate: 10};
			sendStream(room, pId, vConstraints);
		});
	});
}

function removeCoffee(r, c) {
	var cell = getCell(r, c);
	// remove img
	cell.children('.coffee').remove();
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
	room.on('open', function() {
		// log
		logUserAction(user, 'SR-in');
		// enable buttons
		$('.button-join').removeAttr('disabled');
		// start dummy peer connection
		dummy();
	})

	room.on('peerJoin', function(id) {
	})

	room.on('removeStream', function(stream) {
		// remove video
		removeVideo(stream.peerId);
	})

	// get stream & add video
	room.on('stream', function(stream) {
		//console.log('stream from: ' + stream.peerId);
		addVideo(stream.peerId, stream);

	});
}

function sendStream(room, peerId, videoConstraints = {frameRate: 10}) {
	var cell = $('#' + peerId);
	if (!cell.children('video').length) { // no video tag
		cell.append('<video autoplay="true" muted></video>');
	}
	var video = cell.children('video').get(0);

	navigator.mediaDevices.getUserMedia({
		audio: false, 
		video: videoConstraints
	}).then((stream) => {
		localStream = stream;
		// SW: send stream
		room.replaceStream(localStream);
		// replace local video
		video.srcObject = localStream;
	}).catch(function(error) {
		if (error.name) {
			mediaErrorHandler(error.name, peerId);
		} else {
			console.log(error);
		}
	});
}

function setRoomName() {
	// set timeout
	var promise = rootRef.child('study-rooms/' + roomId + '/name').once('value');
	var ms = 1000 * 5; // timeout limit

	setPromiseTimeout(ms, promise)
	.then((snapshot) => { // data retreived in time
		$('#roomName').text(snapshot.val());
	}).catch((error) => {
		if (error == 'promiseTO') {
			alert('データベースが読み込めないため、ページを更新します');
			location.reload();
		}
	});
}
 
function setStyleOnJoin(id, useCamera) {
	// hide message
	$('.message').css('display', 'none');

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

function showMediaErrorMessage(errorName) {
	// hide message
	$('.message').css('display', 'none');
	var errorMsg = $('.error-msg');
	// clear previous messages
	errorMsg.empty();
	// show error message
	errorMsg.append('※カメラが使用できません。<br>');
	if (errorName == 'NotAllowedError') { // access to camera denied from browser
		errorMsg.append('対策: ブラウザからカメラのアクセスを許可 → ページを更新<br><br>');
	} else if (errorName == 'NotReadableError') { // camera used in another app 
		errorMsg.append('対策: カメラを使用している他のアプリケーション(Skypeなど)を閉じる → ページを更新<br><br>');
	} else { // other errors
		errorMsg.append('対策: PC側でカメラの設定をする → ページを更新<br><br>');
	}
	errorMsg.append('詳しくは<a href="/help.html#sr-camera">こちらのページ</a>をお読みください。');
}
