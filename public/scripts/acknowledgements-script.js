// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775",
  storageBucket: "fireba-a8775.appspot.com",
};
firebase.initializeApp(config);

// load footer
loadFooter();

// check user status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) { 
		// initialize top nav
		initTopnav(user);
		
		// sign out user after 30 minutes
		checkTimeout(user);

		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'acknowledgements-out');
			return undefined;
		})		

	} else { // no user is signed in
		// initialize top nav
		initTopnavNoUser();
	}
});