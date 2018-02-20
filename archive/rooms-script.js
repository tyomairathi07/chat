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

// TODO check if user is signed in

// TODO if signed in -> show rooms
// TODO if not signed in -> show error message

var rootRef = firebase.database().ref('/');
var roomArray = [
	"room0-0", "room0-1", "room0-2",
	"room1-0", "room1-1",
	"room2-0", "room2-1", "room2-2", "room2-3", "room2-4", "room2-5", "room2-6", "room2-7",
	"room3-0", "room3-1", "room3-2", "room3-3", "room3-4", "room3-5", "room3-6", "room3-7", "room3-8", "room3-9",
	"room4-0", "room4-1", "room4-2", "room4-3", "room4-4", "room4-5",
	"room5-0", "room5-1", "room5-2", "room5-3", "room5-4", 
	"room6-0", "room6-1", "room6-2", "room6-3", "room6-4", "room6-5", "room6-6", 
	"room7-0", "room7-1", "room7-2", "room7-3", "room7-4", "room7-5", 
	"room8-0", "room8-1", "room8-2", "room8-3", 
	"room9-0", "room9-1", "room9-2", "room9-3", "room9-4", "room9-5", "room9-6", "room9-7",
	"room10-0"
];

$.each(roomArray, function(index, roomName) {
	rootRef.child(roomName).on('value', function(snapshot) {
		$('#' + roomName).text(snapshot.numChildren() + '人');
	})
})
