function checkEmailVerification(user) {
	if (!user.emailVerified && !user.isAnonymous) { // allow anonymous users
		window.location.href = "/verify.html";
	}
}

// no logging
function checkGuestTimeout(user) {
	if (!user.isAnonymous)
		return;
	
	var now = new Date().getTime();
	var tl;
	// get time limit from DB
	var ref = firebase.database().ref('guests/' + user.uid);
	ref.once('value')
	.then((snapshot) => {
		tl = parseInt(snapshot.val());
		// alert user if < 1 minute
		return new Promise(resolve => {
			setTimeout(() => {
				alert('残り時間1分です');
				resolve();
			}, tl - now - 60*1000);
		});
	}).then(() => {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, 60 * 1000);
		});
	}).then(() => {
		return firebase.auth().signOut();
	}).then(() => {
		return ref.remove();
	}).then(() => {
		// redirect
		window.location.href = "/";
	}).catch(err => {
		console.log(err);
	});
}

function checkTimeout(minutes, user) {
	ms = 1000 * 60 * minutes;
	setTimeout(() => {
		// log
		logUserAction(user, 'signout-TO');
		// signout
		signOut(user);
	}, ms);
}

function getParameterByName(name) {
	var query = window.location.search.substring(1);
	var variables = query.split('&');

	for (var i=0; i < variables.length; i++) {
		var param = variables[i].split('=');
		var paramName = param[0];
		var paramVal = param[1];
		if (paramName == name) {
			return paramVal;
		}
	}
}

function getRoomId() {
	var path = window.location.pathname;
	var res1 = path.split('/');
	var res2 = res1[2].split('.');
	var roomId = res2[0];
	return roomId;
}

function hideLoading() {
	$('#loading').remove();
	//$('#loading').css('display', 'none');
}

function loadFooter() {
	$(function() {
		$('.footer').load('/footer.html');
	})
}

function loadTopnav(user) {
	$(function() {
		$('.topnav').load('/topnav.html', () => {
			if (user == null) {
				$('#mypage').css('display', 'none');
				$('#mb').css('display', 'none');
				$('#sign-out').css('display', 'none');
				$('#topnav-sign-in').css('display', 'inline');
			}
		});
	});

	$('.topnav').on('click', '#sign-out', () => {
		logUserAction(user, 'signout').then(function() {
			// cancel logging for page
			$(window).off('beforeunload');
			// go to survey page
			window.location.href = "/survey.html";
		})
	});

	
}

function logUserAction(user, action) {
  var time = new Date().getTime();
  var ref = firebase.database().ref('log-users');

  if (user.isAnonymous) {
  	ref = ref.child('000guest');
  } else {
  	ref = ref.child(user.uid);
  }

  return ref.child(time).set(action);
}

// throws 'promiseTO' when promise times out
function setPromiseTimeout(ms, promise) {
	var timeout = new Promise(function(resolve, reject) {
		setTimeout(reject, ms, 'promiseTO');
	});

	return Promise.race([timeout, promise]);
}

function showLoading(btn_id) {
   // show loading image
  var btn = $('#' + btn_id);
  btn.css('vertical-align', 'top');
  $('<img id="loading" src="/images/loading.gif"></img>').insertAfter(btn).height(btn.outerHeight())
  .css('margin-left', '1rem');
}

function signOut(user) {
	// signout
	firebase.auth().signOut()
	.then(function() {
		// redirect to login page
		window.location.href = "/";
	}).catch(function(error) {
		console.log(error);
	});
}