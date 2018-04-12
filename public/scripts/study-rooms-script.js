// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775"
};
firebase.initializeApp(config);

// load footer
loadFooter();

// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// check email verification
		checkEmailVerification(user);
		// set display name
		initTopnav(user);
		// sign out user after 30 minutes
		checkTimeout(user);

		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'SRlist-out');
			return undefined;
		})		

	} else {
		// redirect to login page
		window.location.href = "/";
	}
})

let rootRef = firebase.database().ref();
let roomsRef = firebase.database().ref('/study-rooms/');

let roomIds = [];

/** TEST CODE **/
/*
var ws = new WebSocket('wss://s-usc1c-nss-207.firebaseio.com/');
ws.onopen = function(e) {
	console.log('WebSocket connected');
}

ws.onclose = function(e) {
	console.log('WebSocket disconnected');
}
*/


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
			+ roomId + '" style="margin: 1.5rem;">' + roomName + '</button></a>');
		$('#' + roomId).append('<br><span></span>');
	})
}).then(function() {
	// set listener for each room
	for(i = 0; i < roomIds.length; i++) {
		var roomId = roomIds[i];
		rootRef.child(roomId).on('value', function(snapshot) {
			$('#' + snapshot.key).children('span').css('font-weight', '300').text(snapshot.numChildren() + '人');

		})
	} 
})