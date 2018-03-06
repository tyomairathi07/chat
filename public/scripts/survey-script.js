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


// check sign-in status
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// log on disconnection
		$(window).on('beforeunload', function() {
			// log
			logUserAction(user, 'survey-out');
			return undefined;
		})		

		$('#send').click(function() {
			var q = [];

			// get results
			q[0] = [];
			q[0].push(getRadioVal('q0_0'));
			q[0].push(getTextareaVal('q0_1'));

			q[1] = [];
			q[1].push(getRadioVal('q1_0'));
			q[1].push(getTextareaVal('q1_1'));
			q[1].push(getTextareaVal('q1_2'));

			q[2] = [];
			q[2].push(getRadioVal('q2_0'));
			q[2].push(getRadioVal('q2_1'));
			q[2].push(getTextareaVal('q2_2'));
			q[2].push(getTextareaVal('q2_3'));

			// check if required fields are set
			var required_ok = checkRequired(q);

			if(required_ok) {
				// get csv as string
				var str = toCsv(q);
				// get time
				var time = new Date().getTime();
				// ST: upload csv
				var ref = firebase.storage().ref('survey/' + user.uid + '/' + time + '.csv');
				var metadata = {
					contentType: 'text/csv',
				};
				ref.putString(str, 'raw', metadata).then(function(snapshot) {
					// TODO go to survey_complete.html
					alert('回答を送信しました。ご協力ありがとうございました');
					signOut(user);
				})
			} else {
				alert('必須事項を入力してください');
			}
		})
	} else {
		// redirect to login page
		window.location.href = "/";
	}
})

function checkRequired(array) {
	var res = true;

	if (array[0][0] == 'n/a') {
		$('#l0_0').css('background-color', '#FFCDD2');
		res = false;
	}

	if (array[1][0] == 'n/a') {
		$('#l1_0').css('background-color', '#FFCDD2');
		res = false;
	}

	if (array[2][0] == 'n/a') {
		$('#l2_0').css('background-color', '#FFCDD2');
		res = false;
	}

	if (array[2][1] == 'n/a') {
		$('#l2_1').css('background-color', '#FFCDD2');
		res = false;
	}

	return res;
}

/*
function exportCsv(csv) {
	var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'export.csv';
    hiddenElement.click();
}
*/

function getQuestions() {
	var res = '';
	var length = $('label').length;

	$('label').each(function(index) {
		// get question
		var question = $(this).text();
		// surround with double quotes
		question = '\"' + question + '\"';

		res += question;
		// append commas except for last element
		if (index <= (length - 2)) {
			res += ',';
		}
	});

	return res;
}

function getRadioVal(name) {
	var res = $("input:radio:checked[name='" + name + "']").val();
	if (!res) {
		res = 'n/a';
	}
	return res;
}

function getTextareaVal(name) {
	var res = $("textarea[name='" + name + "']").val();
	if (!res) {
		res = 'n/a'
	}
	// escape double quotes
	res = res.replace(/"/g, '""');
	// append double quotes -> preserve commas & newlines
	res = '\"' + res + '\"';
	return res;
}

function toCsv(array) {
	var csv = '';

	// append questions
	csv += getQuestions();
	csv += '\n';

	for (var i = 0; i < array.length; i++) {
		csv += array[i].join(',');
		csv += ',';
	}

	//exportCsv(csv);
	return csv;
}