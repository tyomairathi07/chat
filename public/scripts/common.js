/*
function autoSignOut(user) {
	// get sign-out time
	var time = new Date().getTime();

	// DB: add record to /sign-out/user.uid
	var ref = firebase.database().ref('sign-out');
	ref.child(user.uid).set(time)
	.then(function() {
		// sign-out
		return firebase.auth().signOut();
	}).then(function() {
		// redirect to login page
		window.location.href = "/";
	}).catch(function(error) {
		console.log(error);
	});
}
*/

function checkEmailVerification(user) {
	if (!user.emailVerified) {
		window.location.href = "/verify.html";
	}
}

function checkTimeout(user) {
	// get sign-in time
	var ref = firebase.database().ref('sign-in/' + user.uid);
	ref.once('value')
	.then(function(snapshot) {
		return snapshot.val();
	}).then(function(ms) {
		var signIn = new Date(parseInt(ms));
		var timeout = new Date();
		timeout.setMinutes(signIn.getMinutes() + 30); // 30 minutes after last sign-in

		var i = setInterval(function() {
			var now = new Date();
			if (now > timeout) {
				clearInterval(i);
				// log
				logUserAction(user, 'signout-TO')
				// sign out
				signOut(user);
			}
		})
	})
}

function initTopnav(user) {
	var name = user.displayName;
	if (name != null) {
		$('#displayName').text(name);
	}

	// sign out user
	$('#sign-out').click(function() {
		// log
		logUserAction(user, 'signout');
		// go to survey page
		window.location.href = "survey.html";
	});
}

/*
1回ログインした人のうち、何％が再度利用しているか。
利用回数の頻度分布は
1回の平均利用時間は
休憩室への平均滞在時間は
休憩室のリピーター率は

ログイン (signin): 
自習室 入室 (SR-in): ページを開いたとき(×「入室」ボタンを押したとき)
自習室 退室 (SR-out): ページ遷移ORページ更新をしたとき(window.beforeunloadイベントで検知)
休憩室 入室 (BR-in): 同上
休憩室 退室 (BR-out): 同上
ログアウト (signout): ログアウトボタンを押したとき (タイムアウトでログアウトした場合は記録されない; アンケート終了後ではない)
強制ログアウト (signout-TO)
*/

function logUserAction(user, action) {
  var time = new Date().getTime();
  var ref = firebase.database().ref('log-users/' + user.uid);
  return ref.child(time).set(action);
}

function signOut(user) {
	// DB: remove sign-in record
	var ref = firebase.database().ref('sign-in/' + user.uid);
	ref.remove().then(function() {
		// sign out
		return 	firebase.auth().signOut();
	}).then(function() {
		// redirect to login page
		window.location.href = "/";
	}).catch(function(error) {
		console.log(error);
	});
}