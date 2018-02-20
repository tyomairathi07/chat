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

// create Peer
const peer = new Peer({
	key: 'b9980fd6-8e93-43cc-ba48-0d80d1d3144d',
	debug: 3
});

const roomName = "room2-0";
const roomRef = firebase.database().ref('/' + roomName + '/'); // Reference to root/roomName
let peerId = null;
let rowIndex = null;
let cellIndex = null;

/** ACTIONS BY USER **/
// open page
peer.on('open', function(id) {
	// set peerId
	peerId = id;
})

// click: "join" button
$(".button-join").click(function() {
	// set rowIndex, cellIndex
	rowIndex = $(this).parent().parent().index();
	cellIndex = $(this).parent().index();

	// insert DB: peerId, rowIndex, cellIndex
	roomRef.child(peerId).set({"row-index": rowIndex, "cell-index": cellIndex});

})

// click: "leave" button
$("#leave").click(function() {
	// remove from DB: peerId
	roomRef.child(peerId).remove()

})

// TODO close page