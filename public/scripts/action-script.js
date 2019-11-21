// Initialize Firebase
var config = {
   apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
   authDomain: "fireba-a8775.firebaseapp.com",
   projectId: "fireba-a8775",
};
var app = firebase.initializeApp(config);

var auth = app.auth();

// load top nav
loadTopnav(null);
// load footer 
loadFooter();

// get action
var mode = getParameterByName('mode');
// get one-time code
var actionCode = getParameterByName('oobCode');

if (mode == 'resetPassword') {
	handleResetPassword(auth, actionCode);
} else if (mode == 'verifyEmail') {
	handleVerifyEmail(auth, actionCode);
} else { // error: invalid mode
	invalidLink('no-mode');
}

function handleResetPassword(auth, actionCode) {
	// verify action code
	auth.verifyPasswordResetCode(actionCode).then(function(email) {
		// set span text
		$('#action-result').text('パスワード再設定')
		// show password reset div
		$('#reset-password').css('display', 'block');
		// click reset button
		$('#reset').click(function() {
			// clear error messages
			var errorMsg = $('.error-msg');
			errorMsg.empty();
			errorMsg.css('display', 'none');
			// save new password
			var newPassword = $('#new-password').val();

			auth.confirmPasswordReset(actionCode, newPassword).then(function(resp) { // success
				$('#reset-password').css('display', 'none');
				$('#reset-success').css('display', 'inline-block');
			}).catch(function(error) { // error: expired code OR weak password
				if (error.code == 'auth/weak-password') {
					errorMsg.append('※パスワードは6文字以上で設定してください');
					errorMsg.css('display', 'inline-block');
				} else {
					invalidLink();
				}
			});
		});
	}).catch(function(error) { // error:
		invalidLink();
	})
}

function handleVerifyEmail(auth, actionCode) {
	// apply action code
	auth.applyActionCode(actionCode).then(function(resp) { // success
		// set span text
		$('#action-result').text('アカウント認証完了');
		// show confirmation message
		$('#verify-success').css('display', 'inline-block');
	}).catch(function(error) { // error:
		invalidLink();
	})
}

function invalidLink() {
	$('#action-result').text('無効なリンク');
	$('#invalid-link').css('display', 'inline-block');
}