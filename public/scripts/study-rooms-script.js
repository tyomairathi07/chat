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
		// load topnav
		loadTopnav(user);
		// check email verification
		checkEmailVerification(user);
		// sign out user after 10 minutes
		checkTimeout(10, user);

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

// show loading
$('#rooms').append('<img id="loading" src="/images/loading.gif">');

var promise = roomsRef.once('value');
var ms = 1000 * 5;
setPromiseTimeout(ms, promise)
.then((snapshot) => {
	// hide loading
	$('#loading').remove();
	snapshot.forEach(function(roomSnapshot) {
		// get room id
		var roomId = roomSnapshot.key;
		// add room id to array
		roomIds.push(roomId);
		
		// get room name
		var roomName = roomSnapshot.child('name').val();
		
		// create button
		$('#rooms').append('<a href="/study-rooms/' + roomId + '.html"><button class="button button-outline" id="' 
			+ roomId + '">' + roomName + '</button></a>');
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
}).catch((error) => {
	if (error == 'promiseTO') {
		alert('データベースが読み込めないため、ページを更新します');
		location.reload();
	}
});