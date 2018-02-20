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

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
		//initPage(user);
		return;
	} else {
		window.location.href = "/";
	}
});

const rootRef = firebase.database().ref();
const roomId = "room2-6";
const roomRef = rootRef.child('/' + roomId + '/');

// set room name
firebase.database().ref('/study-rooms/' + roomId + '/name').once('value')
.then(function(snapshot) {
	$('#roomName').text(snapshot.val());
});

// create Peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});

let peerId = null;
let room = null;
let localStream = null;

let rowIndex = null;
let cellIndex = null;

const MAX_MEMBER_COUNT = 5;
const NUM_BREAKROOMS = 4;

/** ACTIONS BY USER **/
// open page
peer.on('open', function(id) {
	appendLog('my ID: ' + id);
	// set peerId
	peerId = id;
	peerHandler(peer);

	// DB: handle disconnections; removes data for last user in room
	roomRef.child(peerId).onDisconnect().remove();

	// DB: check break status
	firebase.auth().onAuthStateChanged(function(user) {
		checkBreakStatus(user);
	})

	// SW: join room with stream 
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		var iv = setInterval(function() {
			localStream = stream;
			if(localStream != null) {
				clearInterval(iv);
				$('.button-join').removeAttr('disabled');
			}
		}, 10);
		room = peer.joinRoom(roomId, {mode: 'sfu', stream: stream});
		
		// start roomHandler
		roomHandler();
	})
})

// click: "join" button
$(".button-join").click(function() {
	// get cellIndex, rowIndex
	cellIndex = $(this).parent().index();
	rowIndex = $(this).parent().parent().index();

	// DB: peerId, cellIndex, rowIndex -> fires Firebase#child_added
	roomRef.child(peerId).set({"row-index": rowIndex, "cell-index": cellIndex});

	// SW: replaceStream -> fires SFURoom#stream (getUserMedia is necessary)
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		localStream = stream;
		room.replaceStream(localStream);
	});

	// set style
	setStyleOnJoin();
});

$(document).on('click', '#back', function() { // .click() won't work on dynamically added DOMs
	// DB: add record
	roomRef.child(peerId).set({'row-index': rowIndex, 'cell-index': cellIndex})
	.then(function() {
		// DB: remove record from on-break
		removeFromOnBreak();
	});

	// SW: replaceStream -> fires SFURoom#stream (getUserMedia is necessary)
	navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function(stream) {
		localStream = stream;
		room.replaceStream(localStream);
	});

	// set style
	setStyleOnJoin();

})

$('#break').click(function() {
	var user = firebase.auth().currentUser;
	// DB: add record to on-break
	rootRef.child('on-break/' + user.uid).set({
		'row-index': rowIndex,
		'cell-index': cellIndex,
		'room-id': roomId
	}).then(function() {
		// go to break room
		goToBreakroom();
	});	
})

// goes to study-rooms.html
$('#home').click(function() {
	// DB: remove from on-break
	removeFromOnBreak();
})

// click: "leave" button
$("#leave").click(function() {
	// DB: remove record
	roomRef.child(peerId).remove();

	// set style
	setStyleOnLeave();

	// set rowIndex, cellIndex to null
	rowIndex = null;
	cellIndex = null;
});	


/** DB LISTENERS **/
roomRef.on('child_added', function(snapshot, prevKey) {
	// get position
	var child_id = snapshot.key;
	var child_c = snapshot.child('cell-index').val();
	var child_r = snapshot.child('row-index').val();

	appendLog('child_added: ' + child_r + ', ' + child_c);
	
	if (child_id == peerId) {
		addVideo(peerId, localStream);
	}

});

roomRef.on('child_removed', function(snapshot) {
	// get position
	var child_id = snapshot.key;
	var child_c = snapshot.child('cell-index').val();
	var child_r = snapshot.child('row-index').val();

	appendLog('child_removed: ' + child_r + ', ' + child_c);

	// remove video from [row, col]
	removeVideo(child_id);
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

	// get position
	var r = null;
	var c = null;

	roomRef.child(id).on('value', function(snapshot) {
		r = snapshot.child('row-index').val();
		c = snapshot.child('cell-index').val();
	});

	if(r != null && c != null ){
		appendLog('addVideo at: ' + r + ', ' + c);

		var cell = getCell(r, c);
		// set id to cell
		cell.attr('id', id);
		// hide children
		cell.children().css('display', 'none');
		// set video
		cell.append('<video autoplay="true" muted></video>');
		cell.children('video').get(0).srcObject = stream;
	}
}

function checkBreakStatus(user) {
	appendLog('checkBreakStatus');
	rootRef.child('on-break/' + user.uid).once('value')
	.then(function(snapshot) {
		if(snapshot.child('done').exists()) {
			rowIndex = snapshot.child('row-index').val();
			cellIndex = snapshot.child('cell-index').val();
			setStyleOnBack(rowIndex, cellIndex);
		}
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

// removes record from /on-break/
function removeFromOnBreak() {
	appendLog('removeFromOnBreak');
	var user = firebase.auth().currentUser;
	rootRef.child('on-break/' + user.uid).remove();
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

function removeVideo(id) {
	appendLog('removeVideo');

	var cell = $('#' + id);
	// remove video
	cell.children('video').remove();
	if (cell.children().length > 1) { // has coffee
		cell.children('button').css('display', 'none');
	} else {
		cell.children('.button-join').removeAttr('style');
	}

	if (id != peerId) {
		// remove id from cell
		cell.removeAttr('id');
	}
}

// handle SFURoom events
function roomHandler() {
	room.on('open', function() {
		dummy();
		// getUsersOnBreak();
	})

	room.on('peerLeave', function(id) {
		// remove from DB: id
		roomRef.child(id).remove();
	});

	// get stream & create video
	room.on('stream', function(stream) {
		var timer = setTimeout(function() {
			appendLog('stream waiting...');
			appendLog('stream from: ' + stream.peerId);
			addVideo(stream.peerId, stream);
		}, 1000);
	});
}

function setStyleOnBack(r, c) {
	appendLog('setStyleOnBack');
	var cell = getCell(r, c);
	// set border to cell
	cell.css('border', '0.3rem solid #9b4dca');
	// hide all "join" buttons
	$('table').find('.button-join').css('display', 'none');
	// append "back" button to menu
	$('.topnav').append('<button id="back">自分の席に戻る</button>')
	$('#back').css({
		display: 'inline',
		float: 'right'
	});
}
 
function setStyleOnJoin() {
	appendLog('setStyleOnJoin');

	var cell = $('#' + peerId);

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

function setStyleOnLeave() {
	appendLog('setStyleOnLeave');
	var cell = $('#' + peerId);
	appendLog(peerId);
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
