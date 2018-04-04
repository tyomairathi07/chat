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


$('#reset').click(function() {
    // clear message box
    $('.message').empty();
    $('.message').css('display', 'none');

    // Get the action to complete.
    var mode = getParameterByName('mode');
    // Get the one-time code from the query parameter.
    var actionCode = getParameterByName('oobCode');

    if (mode == 'resetPassword') {
        handleResetPassword(auth, actionCode);
    } else { // invalid mode
        invalidLink();
    }
})

function handleResetPassword(auth, actionCode) {
    var accountEmail;
    // Verify the password reset code is valid.
    auth.verifyPasswordResetCode(actionCode).then(function(email) {
        var accountEmail = email;

        // get new password
        newPassword = $('#new-password').val();

        auth.confirmPasswordReset(actionCode, newPassword).then(function(resp) { 
            $('.message').append('パスワードが変更されました。<br>トップページに戻り、新しいパスワードでログインしてください。<br><br>');
            $('.message').append('<a href="/"><button class="button-black">トップページ</button></a><br>');
            $('.message').css('display', 'inline-block');

            confirmPassword = $('#confirm-password').val();
            if (newPassword != confirmPassword) {
              throw 'no-match'
            }
        }).catch(function(error) { // expired code or weak password
            console.log('confirm' + error.code);
            if (error.code == 'auth/weak-password') {
              $('.error-msg').append('※パスワードは6文字以上で入力してください');
              $('.error-msg').css('display', 'inline-block');
            } else if (error == 'no-match') {
              $('.error-msg').append('※パスワードが一致しません');
              $('.error-msg').css('display', 'inline-block');
            } else {
              invalidLink(accountEmail);
            }
        });
    }).catch(function(error) { // invalid or expired action code
        console.log('verify' + error.code);
        invalidLink(accountEmail);
    });
}

function invalidLink(email) {
  $('.message').append('※無効なリンクです。<br>下のボタンからパスワード再設定メールを再送してください<br><br>');
  $('.message').append('<a href="/send-password-reset.html"><button class="button-black" id="resend">' + 
      'メールを再送</button></a><br>');
  $('.message').css('display', 'inline-block');

  $('.message').on('click', '#resend', function() {
      firebase.auth().sendPasswordResetEmail(email).then(function() {
          alert('メールを再送しました');
      })
  })
}

/*
function resetPasswordError() {
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
*/