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

$('#student-type').change(function() {
	showMajor($(this).val());
})

function showErrorMsg(msg) {
	var errorMsg = $('#error-sign-up');
	errorMsg.append(msg).css('display', 'inline-block');
}

function showMajor(studentType) {
	var ba = $('#ba-major');
	var ma = $('#ma-major');
	var phd = $('#phd-major');
	var tr = $('#tr-student-type');
	switch (studentType) {
		case '全科履修生': 
			ba.css('display', 'table-row');
			ma.css('display', 'none');
			phd.css('display', 'none');
			tr.css('border-bottom', 'none');
			break;
		case '修士全科生':
			ba.css('display', 'none');
			ma.css('display', 'table-row');
			phd.css('display', 'none');
			tr.css('border-bottom', 'none');
			break;
		case '博士全科生':
			ba.css('display', 'none');
			ma.css('display', 'none');
			phd.css('display', 'table-row');
			tr.css('border-bottom', 'none');
			break;
		default: 
			ba.css('display', 'none');
			ma.css('display', 'none');
			phd.css('display', 'none');
			tr.css('border-bottom', '0.1rem solid #e1e1e1');
	}
}

function signUp() {
	// show loading icon
	showLoading('sign-up');

	var email = $('#email').val();
	var password = $('#password').val();
	var passwordConfirm = $('#password-confirm').val();
	var pattern = /.+@campus.ouj.ac.jp$/;

	var errorMsg = $('#error-sign-up');

	// clear previous errors
	errorMsg.empty('').css('display', 'none');;

	if (!pattern.test(email)) {
		// check email domain
		showErrorMsg('※放送大学の「@campus.ouj.ac.jp」で終わるメールアドレスを入力してください');
		// hide loading icon
		hideLoading();
	} else if (password !== passwordConfirm) {
		// check password match
		showErrorMsg('※パスワードが一致しません');
		// hide loading icon
		hideLoading();
	} else {
		// create new user
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function() { // success
			// send e-mail verification
			firebase.auth().currentUser.sendEmailVerification().then(function() {
				window.location.href = "/sign-up-complete.html";
			});
		})
		.catch(function(error) {
			// error
			var errorCode = error.code;

			if(errorCode == 'auth/email-already-in-use') {
				showErrorMsg('※メールアドレスはすでに登録されています');
			} else if (errorCode == 'auth/weak-password') {
				showErrorMsg('※パスワードは6文字以上で設定してください');
			} else {
				showErrorMsg('※新規登録ができませんでした')
			}
			// hide loading icon
			hideLoading();
		})
	}
}