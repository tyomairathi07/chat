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
		updateUserProfile(user);
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
		/**
		// get robot.png from Storage
		var robotRef = firebase.storage().ref().child('robot.png');
		robotRef.getDownloadURL().then(function(url) {
			$('.user-pic').attr('src', url);
		});
		**/
		$('.user-pic').attr('src', '/images/monster.png');
	} else { // photo is set
		$('.user-pic').attr('src', photoUrl);
	}

	// enable file input
	$('#fileInput').prop('disabled', false);
}

function showMessage(text) {
	// append message
	$('.message').append(text + '<br>');
	// show message div
	$('.message').css('display', 'inline-block');
}

function updateUserProfile(user) {
	let file = null;

	// get new photo
	$('#fileInput').on('change', function() {
		file = this.files[0];
	});

	// click "save changes" button
	$('#update').click(function() {
		// show loading
		showLoading('update');

		// clear message div
		$('.message').empty();
		$('.message').css('display', 'none');

		var newName = $('#user-name').val();
		if ((newName == user.displayName) && (file == null)) {
			hideLoading();
		}

		// get new displayName
		if (newName != user.displayName) {
			// update displayName
			user.updateProfile({
				displayName: newName
			}).then(function() { // success
				showMessage('ユーザー名を変更しました');
				hideLoading();
			}).catch(function(error) { // error
				showMessage('エラー: ユーザー名の変更に失敗しました');
				hideLoading();
			});
		}
		
		// get new photo 
		if (file != null) {
			// get Storage ref to user > user-pic
			var fileRef = firebase.storage().ref().child(user.uid + '/photo/' + file.name);

			// TODO delete existing child under photo

			// upload new photo
			fileRef.put(file)
			.then(function() { // file upload success
				// get download URL
				return fileRef.getDownloadURL();
			}).then(function(url) {
				// set image source
				$('.user-pic').attr('src', url);

				// update profile
				return user.updateProfile({photoURL: url});
			}).then(function() { // profile update success
				showMessage('プロフィール画像を変更しました');
				hideLoading();
			}).catch(function(error) {
				showMessage('プロフィール画像の変更に失敗しました');
				hideLoading();
			});
		}

				
	});
}