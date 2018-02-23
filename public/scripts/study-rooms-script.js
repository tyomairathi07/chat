/**
room1-n: コース別
room2-n: 資格とか？
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


// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// set display name
		initTopnav(user);
		// sign out user after 30 minutes
		checkTimeout(user);
	} else {
		// redirect to login page
		window.location.href = "/";
	}
})





let rootRef = firebase.database().ref();
let roomsRef = firebase.database().ref('/study-rooms/');

let roomIds = [];

// create buttons for each study room
roomsRef.once('value')
.then(function(snapshot) {
	snapshot.forEach(function(roomSnapshot) {
		// get room id
		var roomId = roomSnapshot.key;
		// add room id to array
		roomIds.push(roomId);
		
		// get room name
		var roomName = roomSnapshot.child('name').val();
		
		// create button
		$('#rooms').append('<a href="/study-rooms/' + roomId + '.html"><button class="button button-outline" id="' 
			+ roomId + '" style="margin: 1.0rem;">' + roomName + '</button></a>');
		$('#' + roomId).append('<br><span></span>');
	})
}).then(function() {
	// set listener for each room
	for(i = 0; i < roomIds.length; i++) {
		var roomId = roomIds[i];
		rootRef.child(roomId).on('value', function(snapshot) {
			$('#' + snapshot.key).children('span').text(snapshot.numChildren() + '人');

		})
	} 
})

function checkTimeout(user) {
	// get sign-in time
	var ref = firebase.database().ref('sign-in/' + user.uid).once('value')
	.then(function(snapshot) {
		return snapshot.val();
	}).then(function(ms) {
		var signIn = new Date(parseInt(ms));
		var timeout = new Date();
		timeout.setMinutes(signIn.getMinutes() + 30); // 30 minutes after last sign-in

		var i = setInterval(function() {
			var now = new Date();
			if (now > timeout) {
				clearInterval(i);
				firebase.auth().signOut().then(function() {
					window.location.href = "/";
				})
			}
		})
	})
}

function initTopnav(user) {
	var name = user.displayName;
	if (name != null) {
		$('#displayName').text(name);
	}

	// sign out user
	$('#sign-out').click(function() {
		firebase.auth().signOut().then(function() {
			// redirect user
			window.location.href = "/";
		})
	});
}