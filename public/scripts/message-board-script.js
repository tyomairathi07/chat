// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  storageBucket: "fireba-a8775.appspot.com",
  projectId: "fireba-a8775",
};
firebase.initializeApp(config);

// load footer
loadFooter();

// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// load topnav
		loadTopnav(user);
		// check guest time limit
		checkGuestTimeout(user);
		// check email verification
		checkEmailVerification(user);
		// sign out user after 10 minutes
		checkTimeout(20, user);

		let boardRef = firebase.database().ref('message-board');

		$('#send').click(() => {
			// get date
			var date = new Date();
			var min = date.getMinutes();
			if (min < 10)
				min = '0' + min;
			var ts = (date.getMonth()+1) + '/' + date.getDate() + ' ' 
				+ date.getHours() + ':' + min;

			// get message, name
			var name = user.displayName || 'ユーザー';
			var msg = $('#board-input').val();
			$('#board-input').val('');

			// write message to DB
			var ref = boardRef.push();
			ref.set({
				'name' : name,
				'uid' : user.uid,
				'message' : msg,
				'timestamp' : ts
			});
		});

		// DB listener
		boardRef.on('child_added', (data) => {
			var msg = data.child('message').val();
			var name = data.child('name').val();
			var ts = data.child('timestamp').val();
			var uid = data.child('uid').val();

			// replace newlines with brs
			msg = msg.replace(/\n/g, '<br>');

			// get photo
			var ref = firebase.storage().ref('user-photo/' + uid);
			ref.getDownloadURL().then(url => {
				$('table').prepend('<tr><td><img src="' + url + '" class="user-pic"></td><td><b>' + 
					name + ' </b> ' + ts + '<br>' + msg + '</td></tr>');
			}).catch(error => {
				$('table').prepend('<tr><td><img src="/images/monster.png" class="user-pic"></td><td><b>' + 
				name + ' </b> ' + ts + '<br>' + msg + '</td></tr>');
			})

			
		})
	} else {
		// redirect to login page
		window.location.href = "/";
	}
})

function disconnectionHandler(userRef, user) {
	// log user action
	$(window).on('beforeunload', function() {
		logUserAction(user, 'MB-out');
		return undefined;
	});
}

