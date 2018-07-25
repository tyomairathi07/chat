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

// load footer
loadFooter();

// check user status
firebase.auth().onAuthStateChanged(function(user) {
	// load topnav
	loadTopnav(user);
	
	if (user) { // user is signed in
		// sign out user after 20 minutes
		checkTimeout(20, user);

		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'help-out');
			return undefined;
		})		

	} 
});