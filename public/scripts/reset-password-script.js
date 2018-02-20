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

$('#reset-password').click(function() {
  var email = $('#email').val();

  // localize
  firebase.auth().languageCode = 'jp';

  // send password reset email
  firebase.auth().sendPasswordResetEmail(email).then(function() {
    // success
    $('#message').html('パスワード再設定メールを送信しました<br><br>');
  }).catch(function(error) {
    // error
    var errorCode = error.code;

    if (errorCode == 'auth/user-not-found') {
      $('#message').html('※メールアドレスが登録されていません<br><br>');
      $('#email').text();
    }

  });

}); 