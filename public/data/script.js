/** THIS PAGE WILL NOT BE DEPLOYED **/

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775",
  storageBucket: "fireba-a8775.appspot.com"
};
firebase.initializeApp(config);

const columnDelimiter = ',';
const lineDelimiter = '\n';

$('#profiles').click(() => {
	const ref = firebase.database().ref('user-profile');
	const keys = ['uid', '性別', '学生種別', '所属コース・プログラム'];
	var csv = '';

	// append keys
	csv += keys.join(columnDelimiter);
	csv += lineDelimiter;

	// show loading
	showLoading('profiles');

	ref.once('value').then((snapshot) => {
		snapshot.forEach((childSnapshot) => {
			for (var i = 0; i < keys.length; i++){
				var key = keys[i];
				var val = childSnapshot.child(key).val();
				if (val == null) {
					val = 'n/a';
				}
				// append value
				csv += val;
				// append delimiter
				if (i != (keys.length - 1)) { // not last node
					csv += columnDelimiter;
				} else {
					csv += lineDelimiter;
				}
			}
		})
	}).then(() => {
		// hide loading
		hideLoading();
		downloadCSV(csv, 'profiles');
	});
});

$('#logs').click(() => {
	const ref = firebase.database().ref('log-users');
	const keys = ['uid', 'timestamp', 'action'];
	var csv = '';

	// append keys
	csv += keys.join(columnDelimiter);
	csv += lineDelimiter;

	// show loading
	showLoading('logs');

	ref.once('value').then((snapshot) => {
		snapshot.forEach((childSnapshot) => {
			var uid = childSnapshot.key;
			childSnapshot.forEach((log) => {
				csv += uid + columnDelimiter;
				csv += log.key + columnDelimiter;
				csv += log.val() + lineDelimiter;
			})
		})
	}).then(() => {
		// hide loading
		hideLoading();
		downloadCSV(csv, 'logs');
	})
})

function downloadCSV(csv, kind) {
	// get date
	var date = new Date();
	var timestamp = formatDate(date);
	
	var link = document.createElement('a');
	link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
	link.download = kind + '_' + timestamp + '.csv';
	link.click();

	// set progress
	$('#progress').text('');
}

function formatDate(date) {
	var year, month, day, hour, minute, second, res;
	year = date.getFullYear();
	month = date.getMonth() + 1;
	day = date.getDate();
	hour = date.getHours();
	minute = date.getMinutes();
	second = date.getSeconds();

	// append zeros
	if (month < 10) {
		month = '0' + month;
	}
	if (day < 10) {
		day = '0' + day;
	}
	if (hour < 10) {
		hour = '0' + hour;
	}
	if (minute < 10) {
		minute = '0' + minute;
	}
	if (second < 10) {
		second = '0' + second;
	}

	res = year + '-' + month + '-' + day + '_' + hour + '-' + minute + '-' + second;
	return res;
}