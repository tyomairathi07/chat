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

// check user status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) { // user is signed in
		initTopnav(user);
		initUserProfile(user);
		updateName(user);
		updatePhoto(user);
		// sign out user after 30 minutes
		checkTimeout(user);

		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'MP-profile-out');
			return undefined;
		})		

	} else { // no user is signed in
		window.location.href = "/";
	}
});

function initUserProfile(user) {
	// get name & photo URL
	var name = user.displayName;
	var photoUrl = user.photoURL;

	// show name & photo
	if (name == null) { // no displayName
		$('#user-name').attr('placeholder', 'ユーザー名を設定してください');
	} else {
		$('#user-name').val(name);		
	}
	if (!photoUrl) { // no photo is set
		$('.user-pic').attr('src', '/images/monster.png');
	} else { // photo is set
		$('.user-pic').attr('src', photoUrl);
	}

	// enable file input
	$('#fileInput').prop('disabled', false);
}

function showError(text) {
	var errorMsg = $('.error-msg');
	errorMsg.empty();
	errorMsg.append(text);
	errorMsg.css('display', 'inline-block');
}

function showMessage(text) {
	var msg = $('.message');
	// clear message
	msg.empty();
	// append message
	msg.append(text);
	// show message div
	msg.css('display', 'inline-block');
}

function updateName(user) {
	$('#update-name').click(function() {
		showLoading($(this).attr('id'));
		$('.error-msg').css('display', 'none');
		$('.message').css('display', 'none');
		var name = $('#user-name').val();
		if (!name) {
			hideLoading();
			showError('※ユーザー名を入力してください');
		} else {
			user.updateProfile({
				displayName: name
			}).then(function() { // success
				hideLoading();
				showMessage('ユーザー名を変更しました')
			}).catch(function(error) {
				console.log(error);
				hideLoading();
				showError('※ユーザー名の変更に失敗しました')
			})
		}
	});	
}

function updatePhoto(user) {
	var myCroppie = $('#preview').croppie({
		viewport: {
			width: 200, 
			height: 200,
			type: 'circle'
		}, boundary: {
			width: 250,
			height: 250
		}
	});

	$('#fileInput').on('change', function() {
		$('#preview-wrapper').css('display', 'block');
		readFile(this);
	});

	$('#update-photo').click(function() {
		showLoading($(this).attr('id'));
		$('.error-msg').css('display', 'none');
		$('.message').css('display', 'none');
		// get croppie result as blob
		myCroppie.croppie('result', 'blob').then(function(resp) {
			// upload to storage
			var ref = firebase.storage().ref().child('user-photo/' + user.uid);
			ref.put(resp)
			.then(function(snapshot) {
				// get download url
				return ref.getDownloadURL()
			}).then(function(url) {
				$('.user-pic').attr('src', url);
				// update user photo
				return user.updateProfile({
					photoURL: url
				})
			}).then(function() {
				hideLoading();
				$('#preview-wrapper').css('display', 'none');
				// clear file input
				$('#fileInput').val('');
				showMessage('プロフィール画像を変更しました');
			})
			.catch(function(error) {
				console.log(error);
				hideLoading();
				showError('※プロフィール画像の変更に失敗しました')
			}) 
		})
	})

	function readFile(input) {
		var file = input.files[0];
		var reader = new FileReader();

		reader.readAsDataURL(file);

		reader.onload = function() {
			// bind image to croppie
			myCroppie.croppie('bind', {
				url: reader.result
			});
		}
	}
}
