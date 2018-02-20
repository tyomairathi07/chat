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

// check user status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) { // user is signed in
		initTopnav(user);
	} else { // no user is signed in
		window.location.href = "/";
	}
});

function initTopnav(user) {
	var name = user.displayName;
	if (name != null) {
		$('#displayName').text(name);
	}

	// sign out user
	$('#sign-out').click(function() {
		firebase.auth().signOut().then(function() {
			// redirect to login page
			window.location.href = "/";
		}).catch(function(error) {
			console.log(error);
		});
	});
}
