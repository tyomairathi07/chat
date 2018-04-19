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

const ref = firebase.database().ref('user-profile');
const keys = ['uid', '性別', '学生種別', '所属コース・プログラム'];
const columnDelimiter = ',';
const lineDelimiter = '\n';

var res = ''; // string result

// append keys
res += keys.join(columnDelimiter);
res += lineDelimiter;

ref.once('value').then((snapshot) => {
	snapshot.forEach((childSnapshot) => {
		for (var i = 0; i < keys.length; i++){
			var key = keys[i];
			var val = childSnapshot.child(key).val();
			if (val == null) {
				val = 'n/a';
			}
			// append value
			res += val;
			// append delimiter
			if (i != (keys.length - 1)) { // not last node
				res += columnDelimiter;
			} else {
				res += lineDelimiter;
			}
		}
	})
}).then(() => {
	console.log(res);
})