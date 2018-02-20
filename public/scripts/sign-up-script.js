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
	var email = $('#email').val();
	var password = $('#password').val();
	var passwordConfirm = $('#password-confirm').val();
	var pattern = /.+@campus.ouj.ac.jp$/;

	// clear previous errors
	$('#error-sign-up').text();

	if (!pattern.test(email)) {
		// check email domain
		$('#error-sign-up').html('※学生用メールアドレスを入力してください<br><br>');
	} else if (password !== passwordConfirm) {
		// check password match
		$('#error-sign-up').html('※パスワードが一致しません<br><br>');
	} else {
		// create new user
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function() {
			// success
			// send e-mail verification
			firebase.auth().currentUser.sendEmailVerification().then(function() {
				// show message
				$('#message-verification').html('確認メールを送信しました<br>メール内のリンクからアカウントを認証してください<br><br>');
			});
		})
		.catch(function(error) {
			// error
			var errorCode = error.code;

			if(errorCode == 'auth/email-already-in-use') {
				$('#error-sign-up').html('※メールアドレスはすでに登録されています<br><br>');
			} else if (errorCode == 'auth/weak-password') {
				$('#error-sign-up').html('※パスワードは6文字以上で設定してください<br><br>');
			}
		})
	}
});

