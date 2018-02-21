/**
TODO
rewrite room#stream event with wrapper.length
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

const roomId = "room2-6";
const rootRef = firebase.database().ref();
const roomRef = rootRef.child('/' + roomId + '/');

const MAX_MEMBER_COUNT = 5;
const NUM_BREAKROOMS = 4;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
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
			peerHandler(peer);

			// DB: handle disconnections
			roomRef.child(peerId).onDisconnect().remove();
			rootRef.child('on-break/' + user.uid).onDisconnect().remove(); // record deleted onDisconnect EXCEPT when going to breakroom

			// SW: join room with no stream
			room = peer.joinRoom(roomId, {mode: 'sfu'});
			// start roomHandler
			roomHandler(room);

			// DB: check break status
			checkBreakStatus(user, peerId)
			.then(function() {	
				// SW: replace stream -> addVideo
				sendStream(room, peerId);
				// set style
				setStyleOnJoin(peerId);
			}).catch(function(e) { // error: 'no break'
				return;
			});
		})

		// click: "join" button
		$(".button-join").click(function() {
			// get cellIndex, rowIndex
			c = $(this).parent().index();
			r = $(this).parent().parent().index();

			// DB: peerId, cellIndex, rowIndex -> fires Firebase#child_added
			roomRef.child(peerId).set({"row-index": r, "cell-index": c});

			// SW: replaceStream -> fires SFURoom#stream (getUserMedia is necessary)
			sendStream(room, peerId);

			// set style
			setStyleOnJoin(peerId);
		});


		$('#break').click(function() {
			// DB: cancel onDisconnect
			rootRef.child('on-break/' + user.uid).onDisconnect().cancel();
			// get row & cell indeces
			var cell = $('#' + peerId);
			var r = cell.parent().index();
			var c = cell.index();
			// DB: add record to on-break
			rootRef.child('on-break/' + user.uid).set({
				'row-index': r,
				'cell-index': c,
				'room-id': roomId
			}).then(function() {
				// go to break room
				goToBreakroom();
			});	
		});

		// click: "leave" button
		$("#leave").click(function() {
			// DB: remove record
			roomRef.child(peerId).remove();

			// set style
			setStyleOnLeave(peerId);
		});	

		/** DB LISTENERS **/
		roomRef.on('child_added', function(snapshot, prevKey) {
			// get position
			var child_id = snapshot.key;
			var child_c = snapshot.child('cell-index').val();
			var child_r = snapshot.child('row-index').val();

			appendLog('child_added: ' + child_r + ', ' + child_c);

			// set id to cell
			var cell = getCell(child_r, child_c);
			cell.attr('id', child_id);
		});

		roomRef.on('child_removed', function(snapshot) {
			// get position
			var child_id = snapshot.key;
			var child_c = snapshot.child('cell-index').val();
			var child_r = snapshot.child('row-index').val();

			appendLog('child_removed: ' + child_r + ', ' + child_c);

			// remove video from [row, col]
			removeVideo(child_id, peerId);
		});

		rootRef.child('on-break').on('child_added', function(snapshot, prevkey) {
			if (snapshot.child('room-id').val() == roomId) {
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				appendLog('on-break added: ' + r + ',' + c);
				addCoffee(r, c);
			}
		});

		rootRef.child('on-break').on('child_removed', function(snapshot) {
			if (snapshot.child('room-id').val() == roomId) {
				// remove coffee from cell
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				appendLog('on-break removed: ' + r + ',' + c);
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
	appendLog('addCoffee');
	var cell = getCell(r, c);
	// remove video (if any)
	cell.children('video');
	// hide "join" button
	cell.children('.button-join').css('display', 'none');
	// add coffee
	cell.append('<img src="/images/coffee.png">');
}

// addVideo -> removeCoffee
function addVideo(id, stream) {
	appendLog('addVideo');

	var iv = setInterval(function() {
		var cell = $('#' + id);
		if (cell.length) {
			clearInterval(iv);
			appendLog('addVideo with stream');

			// hide children
			cell.children().css('display', 'none');
			// set video
			cell.append('<video autoplay="true" muted></video>');
			cell.children('video').get(0).srcObject = stream;
		}
	}, 10);

	
}

// return: 
// is back from break -> array (row, cell)
// not back from break -> null
function checkBreakStatus(user, pId) {
	appendLog('checkBreakStatus');

	return rootRef.child('on-break/' + user.uid).once('value')
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
		 roomRef.child(pId).set({'row-index': array[0], 'cell-index': array[1]});
	})
}

// fires peerJoin event with a dummy peer
function dummy() {
	appendLog('dummy');
	let dummyPeer = new Peer("dummyPeer", {
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
	appendLog('goToBreakroom');
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

function peerHandler(peer) {
	peer.on('disconnected', function(id) {
		// remove from DB: peerId
		roomRef.child(id).remove();
	})
}

function removeCoffee(r, c) {
	appendLog('removeCoffee');
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

function removeVideo(id, peerId) {
	appendLog('removeVideo');

	var cell = $('#' + id);
	// remove video
	cell.children('video').remove();
	if (cell.children().length > 1) { // has coffee
		cell.children('button').css('display', 'none');
	} else {
		cell.children('.button-join').removeAttr('style');
	}

	if (id != peerId) { // id is needed for setStyleOnLeave
		// remove id from cell
		cell.removeAttr('id');
	}
}

function sendStream(room, pId) {
	navigator.mediaDevices.getUserMedia({video: true, audio: false})
	.then(function(s) {
		var stream = null;
		var iv = setInterval(function() {
			stream = s
			if(stream != null) {
				clearInterval(iv);
				room.replaceStream(stream);
				addVideo(pId, stream);
			}
		}, 10);
	})
}

// handle SFURoom events
function roomHandler(room) {
	room.on('open', function() {
		dummy();
		// getUsersOnBreak();
	})

	// get stream & add video
	room.on('stream', function(stream) {
		addVideo(stream.peerId, stream);

	});
}

function setRoomName() {
	rootRef.child('study-rooms/' + roomId + '/name').once('value')
	.then(function(snapshot) {
		$('#roomName').text(snapshot.val());
	});
}
 
function setStyleOnJoin(id) {
	appendLog('setStyleOnJoin');

	var cell = $('#' + id);

	if($('#back') != null) { // back from break
		// show all "join" buttons
		$('table').find('.button-join').css('display', 'inline');
		// remove "back" button
		$('#back').remove();
	}

	// set border
	cell.css('border', '0.3rem solid black');
	// hide "join" button in cell
	cell.children('.button-join').css('display', 'none');
	// disable button
	$("table").find('.button-join').attr('disabled', 'disabled');
	// show bottom menu
	$(".menu").css('display', 'inline');
	// hide "join" buttons for coffee cells
	$("td").each(function(index) {
		if ($(this).children().length > 1) { // has coffee & button
			$(this).children('.button-join').css('display', 'none');
		}
	})
}

function setStyleOnLeave(id) {
	appendLog('setStyleOnLeave');
	var cell = $('#' + id);
	appendLog(id);
	// enable button
	$("table").find('.button-join').removeAttr('disabled');
	// hide bottom menu
	$(".menu").removeAttr('style');
	// show "join" button
	cell.children('.button-join').css('display', 'inline');
	// remove border
	cell.removeAttr('style');
	// remove id from cell
	cell.removeAttr('id');
}
