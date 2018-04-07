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

const NUM_BR = 4;
const MAX_MEMBER_COUNT = 5;
var ref = firebase.database().ref();

// var roomId = 'room0-3';

fn(0);

function fn(roomIndex) {
	console.log('room0-' + roomIndex);
	if (roomIndex >= NUM_BR) {
		return;
	}
	ref.child('room0-' + roomIndex).once('value')
	.then(function(snapshot) {
		var memberCount = snapshot.numChildren();
		if (memberCount < MAX_MEMBER_COUNT) {
			if (memberCount == 0) {
				roomIndex--;
			}
			console.log('found room: room0-' + roomIndex);
		} else {
			fn(++roomIndex);
		}
	})
}
/*
getMemberCount(roomId).then(function(count) {
	console.log(count);
})

function getMemberCount(roomId) {
	return ref.child(roomId).once('value')
	.then(function(snapshot) {
		return snapshot.numChildren();
	});
}
*/
