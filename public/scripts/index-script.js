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

function logSignIn(user) {
  var time = new Date().getTime();
  var ref = firebase .database().ref('sign-in/')
  return ref.child(user.uid).set(time);
}

function onSuccessSignIn(user) {
    // log
    logUserAction(user, 'signin');

    logSignIn(user)
    .then(function() {
      window.location.href = "/study-rooms.html";        
    });
}

function showLoading() {
  // show loading image
  var btn = $('#sign-in');
  $('<img src="images/loading.gif"></img>').insertAfter(btn).height(btn.height()).css('margin-left', '1rem');
}

function signIn() {
    // show loading image
    showLoading();

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
        var errorCode = error.code;

        // clear previous errors
        $('#error-sign-in').text();

        if (errorCode == 'auth/invalid-email' || errorCode == 'auth/wrong-password') {
          $('#error-sign-in').html('※ログインに失敗しました<br><br>');
        } else if (errorCode == 'auth/user-not-found') {
          $('#error-sign-in').html('※アカウントが存在しません<br>「新規登録」ボタンからアカウントを作成してください<br><br>');
        } else if (errorCode == 'auth/user-disabled') {
          $('#error-sign-in').html('※アカウントが停止されています<br><br>');
        }
      });
}