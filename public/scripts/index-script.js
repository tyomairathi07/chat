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

// load footer.html
loadFooter();
// load topnav
loadTopnav(null);

// click "sign in" button
$('#sign-in').click(function() {
   signIn();
});

// press ENTER key
$('#password').keypress(function(e) {
    if (e.which == 13) {
       // set focus to sign-in button
       $('#sign-in').focus();
        signIn();
    }  
});

function onSuccessSignIn(user) {
    // log
    logUserAction(user, 'signin').then(() => {
      window.location.href = "/study-rooms.html";
    });
}

function signIn() {
    // show loading image
    showLoading('sign-in');

    // get email & password
    var email = $('#email').val();
    var password = $('#password').val();

    // Firebase: user sign-up
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(function() {
          // sign-in
          return firebase.auth().signInWithEmailAndPassword(email, password);
    }).then(function(user) {
          onSuccessSignIn(user);
    }).catch(function(error) {
        hideLoading();
        console.log(error);
        
        var errorCode = error.code;
        // clear previous errors
        var errorMsg = $('#error-sign-in');
        errorMsg.empty();
        // append error message
        var msg;
        switch(errorCode) {
            case 'auth/invalid-email':
              msg = '※メールアドレスが正しくありません';
              break;
            case 'auth/user-disabled':
              msg = '※アカウントが停止されています';
              break;
            case 'auth/user-not-found':
              msg = '※アカウントが存在しません<br>「新規登録」ボタンからアカウントを作成してください';
              break;
            case 'auth/wrong-password':
              msg = '※パスワードが正しくありません'
              break;
            default:
              msg = '※ログインに失敗しました';
        }
        errorMsg.append(msg);
        errorMsg.css('display', 'inline-block');
      });
}