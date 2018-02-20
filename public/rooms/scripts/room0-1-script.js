/**
open page: only shows icons
click "join": send & receive audio; send & receive chat
**/

/** TODO
- LINK WITH DB
- get user name & icon from DB
- make links clickable
**/

/**
open page:
- get all users
- show user pic & name for each user

join room
- show pic & name for self
- add to db

peerjoin
- add user pic & name for peer
- add to db

peer leave
- remove user pic/name for peer
- remove from db

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

// create peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});

const roomName = "room0-1";
const roomRef = firebase.database().ref('/' + roomName + '/');

let peerId = null;

// open page
peer.on('open', function(id) {
	// set peer Id
	peerId = id;
	appendLog('my ID: ' + peerId);
	// get all users from DB
	roomRef.once('value').then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			var remoteId = childSnapshot.key;
			// show pic & name for each user
			addUser(remoteId);
		})
	})
});

$('#join').click(function() {
	// show pic & name: self
	addUser(peerId);
	// add to DB
	roomRef.child(peerId).set(true);
	// toggle button
	toggleButton('join');
});

$('#leave').click(function() {
	// remove pic & name: self
	removeUser(peerId);
	// remove from DB
	roomRef.child(peerId).remove();
	// toggle button
	toggleButton('leave');

});

/** FUNCTIONS **/
function addUser(id) {
	$('.users').append('<div class="user-wrapper" id="' + id + '"><img src="/images/robot.png" class="user-pic"><br>' + 
		id + '</div>');
	appendLog('added user: ' + id);
}

function appendLog(text) {
	$('#log').append(text + '<br>');
}

function appendChatLog(sender, message) {
	$('#chat-log').append('<b>' + sender + ': </b>' + message + '<br>');
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
function removeUser(id) {
	$('#' + id).remove();
	appendLog('removed user: ' + id);
}
