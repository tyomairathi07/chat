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
  showLoading('reset-password');
  // clear message box
  $('.message').empty();

  var email = $('#email').val();

  // localize
  firebase.auth().languageCode = 'jp';

  // send password reset email
  firebase.auth().sendPasswordResetEmail(email)
  .then(function() { // success
    $('.message').append('パスワード再設定メールを送信しました');
    $('.message').css('display', 'inline-block');
    hideLoading();
  }).catch(function(error) {
      $('.message').append('※メールアドレスが登録されていません');
      $('.message').css('display', 'inline-block');
      $('#email').text();
      console.log(error.code);
      hideLoading();
  });

}); 