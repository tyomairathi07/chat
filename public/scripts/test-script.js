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

// check user's sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) { // user is signed in
		// do nothing
		return;
	} else { // no user is signed in
		// show sign-in form
		$('#wrapper-sign-in').css('display', 'block');
		// hide sign-out button
		$('#sign-out').css('display', 'none');
	}
})

$('#sign-in').click(function() {
	// get email and password
	var email = $('#user-email').val();
	var password = $('#user-password').val();
	// sign-in
	firebase.auth().signInWithEmailAndPassword(email, password)
	.then(function() {
		alert('sign-in successful!');
	}).catch(function(error) {
		console.log(error);
	})
})

$('#sign-out').click(function() {
	// sign out user
	// redirect to sign-in page
	window.location.href = "http://localhost:5000/index.html";
})