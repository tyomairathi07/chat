// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775",
};
firebase.initializeApp(config);

// load footer
loadFooter();

// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		$('#send').click(() => {
			// reset bg color for questions
			$('.content-sidenav').find('label').css('background-color', '');

			var required_ok = checkRequired();

			if (required_ok) {
				var questions = [];
				var answers = [];

				$('label').each((index, element) => {
					// add question
					questions.push($(element).text());
					// add answer
					var next = $(element).next();
					if (next.is('textarea')) { // textarea input
						if (!next.val()) { // no answer
							answers.push('n/a');
						} else {
							answers.push(next.val());
						}
					} else {
						var name = next.attr('name');
						var val = $("input:checked[name='" + name + "']").val();
						answers.push(val);
					}
				});

				// add to database
				var ref = firebase.database().ref('survey').push();
				ref.set({'uid': user.uid, 'timestamp': new Date().getTime()})
				.then(() => {
					/** test code **/
					var promises = [];
					for (var i = 0; i < questions.length; i++) {
						var promise = ref.child(questions[i]).set(answers[i]);
						promises.push(promise);
					}
					return Promise.all(promises);
				}).then(() => {
					console.log('ok');
					alert('回答を送信しました。ご協力ありがとうございました');
					signOut(user);
				}).catch((error) => {
					console.log(error);
				})
				
			}
		})
	} else {
		// redirect to login page
		window.location.href = "/";
	}
})

function checkRequired() {
	var flag = false; // true if unanswered required field exists
	var names = ['q0_0', 'q0_1', 'q0_2', 'q0_3', 'q1_0', 'q2_0', 'q2_1']; // names required fields
	
	names.forEach((name) => {
		var value = $("input:checked[name='" + name + "']").val();
		if (!value) {
			// set flag to true
			flag = true;
			// change bg color for label
			$('#l' + name.substr(1)).css('background-color', '#FFCDD2');
		}
	});

	if (flag) {
		alert('必須事項を入力してください');
		return false;
	} else {
		return true;
	}
}
