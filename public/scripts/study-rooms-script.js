// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775",
  messagingSenderId: "86072280692"
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
		// send notifications
		saveMessagingDeviceToken(user);

		let rootRef = firebase.database().ref();
		let roomsRef = firebase.database().ref('/study-rooms/');

		let roomIds = [];

		var promise = roomsRef.once('value');
		var ms = 1000 * 5;

		/** notification variables **/
		var title = 'バーチャル自習室～オキ朗～';
		var img = 'images/okirou-256.png';

		// show loading
		$('#rooms').append('<img id="loading" src="/images/loading.gif">');

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
				rootRef.child(roomId).on('value', snapshot => {
					updateMembers(snapshot);
				});	
			}
		}).catch((error) => {
			if (error == 'promiseTO') {
				alert('データベースが読み込めないため、ページを更新します');
				location.reload();
			}
		});

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
});

function updateMembers(snapshot) {
	var key = snapshot.key;
	var members = snapshot.numChildren();
	$('#' + key).children('span').css('font-weight', '300').text(members + '人');
}

// request permission for notifications
function requestNotificationPermissions(user) {
	console.log('requesting for notification permission...');
	firebase.messaging().requestPermission().then(() => {
		// permission granted
		saveMessagingDeviceToken(user);
	}).catch(error => {
		console.log('permission denied', error);
	})
}

// save FCM device tokens to DB
function saveMessagingDeviceToken (user) {
	firebase.messaging().getToken().then(currentToken => {
		if (currentToken) {
			console.log('got FCM device token', currentToken);
			// save to DB
			firebase.database().ref('/fcmTokens').child(currentToken)
				.set(user.uid);
		} else {
			// request permission for notifications
			requestNotificationPermissions(user);
		}
	}).catch(error => {
		console.log('unable to get device token', error);
	})
}