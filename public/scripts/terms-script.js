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

$("input[name='agree']").on('change', function() {
	if ($(this).val() == 'yes') {
		// enable button
		$('#proceed').removeAttr('disabled');
	} else {
		// disable button
		$('#proceed').attr('disabled', 'disabled');
	}
})