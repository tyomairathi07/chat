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
			toCsv(q);
			/*
			if(required_ok) {
				toCsv(q);
			} else {
				alert('必須事項を入力してください');
			}
			*/


			/*
			// print results
			for(var i = 0; i < q.length; i++) {
				for(var j = 0; j < q[i].length; j++) {
					console.log(i + ',' + j + ': ' + q[i][j]);
				}
			}
			*/
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

function escapeCommas(str) {
	return str.replace(/,/g, '、');
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
	// convert ','s
	res = escapeCommas(res);
	return res;
}

function toCsv(array) {
	var csv = '';
	for (var i = 0; i < array.length; i++) {
		csv += array[i].join(',');
		csv += '\n';
	}
	console.log(csv);

	var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'export.csv';
    hiddenElement.click();
}