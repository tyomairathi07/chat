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

$('#sign-up').click(signUp);

$('#password-confirm').keypress(function(event) {
	if (event.which == 13) {
		// set focus to button
		$('#sign-up').focus();
		signUp();
	}
});

function hideLoading() {
	$('#loading').css('display', 'none');
}

function signUp() {
	// show loading icon
	showLoading('sign-up');

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
			showLoading('sign-up');
			// send e-mail verification
			firebase.auth().currentUser.sendEmailVerification().then(function() {
				window.location.href = "/sign-up-complete.html";
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
}