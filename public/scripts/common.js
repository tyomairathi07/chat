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
				signOut();
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
		signOut();
	});
}

/*
function logUserAction(user, action) {
  var time = new Date().getTime();
  var ref = firebase.database().ref('user-logs/' + user.uid);
  return ref.child(time).set(action);
}
*/

function signOut() {
	firebase.auth().signOut().then(function() {
		// redirect to login page
		window.location.href = "/";
	}).catch(function(error) {
		console.log(error);
	});
}