// Initialize Firebase
var config = {
   apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
   authDomain: "fireba-a8775.firebaseapp.com",
   databaseURL: "https://fireba-a8775.firebaseio.com",
   projectId: "fireba-a8775",
   storageBucket: "fireba-a8775.appspot.com",
   messagingSenderId: "86072280692"
};
var app = firebase.initializeApp(config);
var auth = app.auth();



// Get the action to complete.
var mode = getParameterByName('mode');
// Get the one-time code from the query parameter.
var actionCode = getParameterByName('oobCode');

if (mode == 'verifyEmail') {
  handleVerifyEmail(auth, actionCode);
} else {
  verifyEmailError();
}

function handleVerifyEmail(auth, actionCode) {
  // Try to apply the email verification code.
  auth.applyActionCode(actionCode).then(function(resp) { // success

  }).catch(function(error) { // code invalid or expired
    verifyEmailError();
  });
}

function verifyEmailError() {
  // change breadcrumb
  $('#verify_result').text('アカウント認証失敗');

  // switch message
  $('#success').css('display', 'none');
  $('#fail').css('display', 'inline-block');

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // log on disconnection
      $(window).on('beforeunload', function() {
        // log
        logUserAction(user, 'email-verified-out');
        return undefined;
      })  

      // resend verification email
      $('#resend').click(function() {
        user.sendEmailVerification().then(function() {
          alert('アカウント認証メールを送信しました');
        })
      })
    } else {
      $('#resend').click(function() {
        alert('アカウント認証メールを送信できませんでした。トップページからログインしてください');
      })
    }
  })
}