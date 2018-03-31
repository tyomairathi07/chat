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

$('#sign-up').click(function() {
	// show loading icon
	showLoading();

	var email = $('#email').val();
	var password = $('#password').val();
	var passwordConfirm = $('#password-confirm').val();
	var pattern = /.+@campus.ouj.ac.jp$/;

	// clear previous errors
	$('#error-sign-up').empty('').css('display', 'none');;

	if (!pattern.test(email)) {
		// check email domain
		$('#error-sign-up').append('※放送大学Gmailのメールアドレスを入力してください<br><br>').css('display', 'inline-block');
		// hide loading icon
		hideLoading();
	} else if (password !== passwordConfirm) {
		// check password match
		$('#error-sign-up').append('※パスワードが一致しません<br><br>').css('display', 'inline-block');
		// hide loading icon
		hideLoading();
	} else {
		// create new user
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function() { // success
			// show loading
			//showLoading();
			// send e-mail verification
			firebase.auth().currentUser.sendEmailVerification().then(function() {
				// show message
				$('#message-verification').css('display', 'inline-block');
				// hide loading icon
				hideLoading();
			});
		})
		.catch(function(error) {
			// error
			var errorCode = error.code;

			if(errorCode == 'auth/email-already-in-use') {
				$('#error-sign-up').append('※メールアドレスはすでに登録されています<br><br>').css('display', 'inline-block');
				// hide loading icon
				hideLoading();
			} else if (errorCode == 'auth/weak-password') {
				$('#error-sign-up').append('※パスワードは6文字以上で設定してください<br><br>').css('display', 'inline-block');
				// hide loading icon
				hideLoading();
			}
		})
	}
});

function showLoading() {
  // show loading image
  var btn = $('#sign-up');
  btn.css('vertical-align', 'top');
  $('<img id="loading" src="images/loading.gif"></img>').insertAfter(btn).height(btn.outerHeight())
  .css('margin-left', '1rem');
}

function hideLoading() {
	$('#loading').css('display', 'none');
}