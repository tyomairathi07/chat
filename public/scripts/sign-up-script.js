/**
IMPORTANT: enable domain check
**/

// Initialize Firebase
var config = {
apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
authDomain: "fireba-a8775.firebaseapp.com",
// authDomain: "fireba-a8775.firebaseapp.com",
databaseURL: "https://fireba-a8775.firebaseio.com",
// databaseURL: "https://fireba-a8775.firebaseio.com",
projectId: "fireba-a8775",
// projectId: "fireba-a8775",
};
firebase.initializeApp(config);

// load top nav
loadTopnav(null);

// load footer
loadFooter();

$('#sign-up').click(signUp);

$('#student-type').change(function() {
	showMajor($(this).val());
});

function getProfile() {
	var gender = $("input[name='gender']:checked").val();
	var ageGroup = $("select[name='age-group']").val();
	var sType = $("select[name='student-type']").val();
	var major;

	switch (sType) {
		case '全科履修生': 
			major = $("select[name='ba-major']").val();
			break;
		case '修士全科生':
			major = $("select[name='ma-major']").val();
			break;
		case '博士全科生':
			major = $("select[name='phd-major']").val();
			break;
		default: 
			major = null;
	}

	var data = [gender, ageGroup, sType, major];
	return data;
}

function setProfile(uid, data) {
	var ref = firebase.database().ref('user-profile').push();
	return ref.set({
		"uid": uid,
		"性別": data[0],
		"年代": data[1],
		"学生種別": data[2],
		"所属コース・プログラム": data[3]
	}).catch(error => {
		console.log(error);
	})

}

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
			// change footer margin
			$('.footer').css('margin-bottom', '0');
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

	// if (!pattern.test(email)) {
	// 	// check email domain
	// 	showErrorMsg('※放送大学の「@campus.ouj.ac.jp」で終わるメールアドレスを入力してください');
	// 	// hide loading icon
	// 	hideLoading();
	// } else 
    
    if (password !== passwordConfirm) {
		// check password match
		showErrorMsg('※パスワードが一致しません');
		// hide loading icon
		hideLoading();
	} else if ($("input[name='gender']:checked").length == 0) {
		showErrorMsg('※「性別」を選択してください');
		// hide loading icon
		hideLoading();
	} else {
		// create new user
		firebase.auth().createUserWithEmailAndPassword(email, password)
		.then(function() { // success
			var user = firebase.auth().currentUser;
			// add to database
			var data = getProfile();
			setProfile(user.uid, data).then(function() {
				// send e-mail verification
				user.sendEmailVerification().then(function() {
					window.location.href = "/sign-up-complete.html";
				});
			})
		})
		.catch(function(error) { // error
			// error
			var errorCode = error.code;

			if(errorCode == 'auth/email-already-in-use') {
				showErrorMsg('※メールアドレスはすでに登録されています');
			} else if (errorCode == 'auth/weak-password') {
				showErrorMsg('※パスワードは6文字以上で設定してください');
			} else {
				showErrorMsg('※新規登録ができませんでした');
				console.log(error);
			}
			// hide loading icon
			hideLoading();
		})
	}
}