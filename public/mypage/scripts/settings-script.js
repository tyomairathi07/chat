// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775",
};
firebase.initializeApp(config);

// load footer
loadFooter();

// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) { // user is signed in
		// load topnav
		loadTopnav(user);
		initUserSettings(user);
		// sign out user after 30 minutes
		checkTimeout(10, user);

		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'MP-settings-out');
			return undefined;
		})		

	} else { // no user is signed in
		window.location.href = "/";
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

	// password reset
	$('#reset-password').click(function() {
		showLoading($(this).attr('id'));
		firebase.auth().sendPasswordResetEmail(email)
		.then(function() {
			hideLoading();
			showMessage('パスワード再設定用メールを送信しました。');
		}).catch(function(error) {
			hideLoading();
			showMessage('パスワード再設定用メールを送信できませんでした。');
		});
	})

	// email verification
	if (user.emailVerified) {
		$('#verified').text('認証済');
		$('#wrapper-verify').css('display', 'none');
	} else {
		$('#send-verify').click(function() {
			showLoading($(this).attr('id'));
			user.sendEmailVerification().then(function() {
				console.log('verification success');
				hideLoading();
				showMessage('アカウント認証メールを送信しました。');
			}).catch(function(error) {
				hideLoading();
				showMessage('アカウント認証メールを送信できませんでした。')
			});
		})
	}
}

function showMessage(text) {
	$('.message').empty();
	// append message
	$('.message').append(text);
	// show message div
	$('.message').css('display', 'inline-block');
}
