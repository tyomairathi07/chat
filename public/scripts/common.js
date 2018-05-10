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

function initTopnav(user) {
	var name = user.displayName;
	if (name != null) {
		$('#displayName').text(name);
	}

	$('#sign-out').click(function() {
		logUserAction(user, 'signout').then(function() {
			// cancel logging for page
			$(window).off('beforeunload');
			// go to survey page
			window.location.href = "/survey.html";
		})
	});

	/*
	// sign out user
	$('#sign-out').click(function() {
		// log
		logUserAction(user, 'signout');
		// cancel logging for page
		$(window).off('beforeunload');
		// go to survey page
		window.location.href = "/survey.html";
	});
	*/
}

function initTopnavNoUser() {
	// hide elements
	$('#displayName').css('display', 'none');
	$('#sign-out').css('display', 'none');
}

function loadFooter() {
	$(function() {
		$('.footer').load('/footer.html');
	})
}

function logUserAction(user, action) {
  var time = new Date().getTime();
  var ref = firebase.database().ref('log-users/' + user.uid);
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