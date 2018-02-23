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
	if (user) { // user is signed in
		initTopnav(user);
		initUserSettings(user);
		// sign out user after 30 minutes
		checkTimeout(user);
	} else { // no user is signed in
		alert('not signed in');
	}
})

/** FUNCTIONS **/
function clearMessage() {
	$('#message').empty();
}

function initUserSettings(user) {
	// clear message
	clearMessage();

	var email = user.email;
	// set email
	$('#user-email').html(email);
	// reset password
	$('#reset-password').click(function() {
		firebase.auth().sendPasswordResetEmail(email)
		.then(function() {
			showMessage('パスワード再設定用メールを送信しました');
		}).catch(function(error) {
			showMessage('パスワード再設定用メールを送信できませんでした')
		})
	})

}

function showMessage(text) {
	// append message
	$('.message').append(text + '<br>');
	// show message div
	$('.message').css('display', 'inline-block');
}
