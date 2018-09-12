/** TODO
- clean up css
- adjust style for mobile	
- log user action
**/

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  authDomain: "fireba-a8775.firebaseapp.com",
  databaseURL: "https://fireba-a8775.firebaseio.com",
  projectId: "fireba-a8775"
};
firebase.initializeApp(config);

const roomId = getRoomId();
const rootRef = firebase.database().ref();
const roomRef = rootRef.child('/' + roomId + '/');

const MAX_USERS = 5;
const NUM_BREAKROOMS = 10;

let room = null;

// check sign in status
firebase.auth().onAuthStateChanged(function(user) {
	if(user) {
		// load top nav
		loadTopnavSr();
		// check guest time limit
		checkGuestTimeout(user);
		// check email verification
		checkEmailVerification(user);
		// handle disconnections
		disconnectionHandler(user);	

		// handle users on break
		breakUsersHandler(user).catch(err => { console.log(err) });	

		/** ACTIONS BY USER **/
		// click: "join" button
		$(".button-join").click(function() {
			// get cellIndex, rowIndex
			c = $(this).parent().index();
			r = $(this).parent().parent().index();

			// add to DB
			var url = user.photoURL
			if (!url) // no user photo set
				url = "/images/monster.png";

			roomRef.child(user.uid).set({
				'cell-index': c,
				'row-index': r,
				'url': url,
				'status': '勉強中です'
			});

			// set style
			setStyle();
		});

		// change status message (press enter key)
		$(document).on('keypress', '#myStat', event => {
			if (event.which == 13) {
				$('#myStat').blur(); // unfocus from input
				roomRef.child(user.uid).child('status').set($('#myStat').val());
			}
		});

		// click break button
		$('.topnav-sr').on('click', '.break', function() {
			var cell = $('#' + user.uid);
			// show loading
			cell.children().remove();
			cell.append('<img id="loading" src="/images/loading.gif">');

			// DB: cancel onDisconnect
			rootRef.child('on-break/' + user.uid).onDisconnect().cancel();

			// get row & cell indeces
			var r = cell.parent().index();
			var c = cell.index();
			var url = user.photoURL;
			if (!url) // no user photo set
				url = "/images/monster.png";

			// DB: add to on break
			rootRef.child('on-break/' + user.uid).set({
				'row-index': r,
				'cell-index': c,
				'url' : url,
				'room-id': roomId
			}).then(() => {
				// go to break room
				goToBreakroom(user);
			});	
		});
		
		/** DB LISTENERS **/
		roomRef.on('child_added', data => {
			var id = data.key;
			var r = data.child('row-index').val();
			var c = data.child('cell-index').val();
			var url = data.child('url').val();
			var status = data.child('status').val();

			var cell = getCell(r, c);
			cell.children('.button-join').css('display', 'none');
			cell.append('<img class="user-pic" src="' + url + '">');

			if (id == user.uid) 
				cell.append('<input type="text" id="myStat" placeholder="' + status + '" />');
			else
				cell.append('<br><div class="remStat">' 
					+ status + '</div>');

			cell.attr('id', id);
		});

		roomRef.on('child_changed', (data, prevData) => {
			var id = data.key;
			var status = data.child('status').val();
			if (id != user.uid) {
				$('#' + id).children('.remStat').text(status);
			}
		});

		roomRef.on('child_removed', data => {
			var id = data.key;
			var cell = $('#' + id);

			cell.children('.user-pic').remove();
			if (!cell.children('.coffee').length) { // no coffee
				cell.find('*').not('.button-join').remove();
				cell.children('.button-join').removeAttr('style');
			}

			cell.removeAttr('id');
			console.log('child removed');
		})

		// handle users on break
		rootRef.child('on-break').on('child_added', function(snapshot, prevkey) {
			if (snapshot.child('room-id').val() == roomId) {
				console.log('child_added on break')
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				var cell = getCell(r, c);
				if (snapshot.key != user.uid) {
					// hide or remove elements
					cell.children('.button-join').css('display', 'none');
					cell.children(':not(.button-join)').remove();
					cell.append('<img class="coffee" src="/images/coffee.png">');
				}
			}
		});

		rootRef.child('on-break').on('child_removed', function(snapshot) {
			if (snapshot.child('room-id').val() == roomId) {
				var r = snapshot.child('row-index').val();
				var c = snapshot.child('cell-index').val();
				var cell = getCell(r, c);
				cell.children('.coffee').remove();
			}
		});
	} else {
		window.location.href = "/";
	}
});

/** FUNCTIONS **/
function disconnectionHandler(user) {
	$(window).on('beforeunload', function() {
		// log
		logUserAction(user, 'SR-out');
		return undefined;
	})

	// DB: remove records
	roomRef.child(user.uid).onDisconnect().remove();
	// record deleted onDisconnect EXCEPT when going to breakroom
	rootRef.child('on-break/' + user.uid).onDisconnect().remove(); 
}

function breakUsersHandler(user) {
	var ref = rootRef.child('on-break/' + user.uid);

	let r, c, url;

	return ref.once('value')
	.then((snapshot) => {
		if (!snapshot.child('done').exists()) {
			throw 'notOnBreak';
		}
		r = snapshot.child('row-index').val();
		c = snapshot.child('cell-index').val();
		url = snapshot.child('url').val();
		// DB: add child 
		return roomRef.child(user.uid).set({
			'cell-index': c,
			'row-index': r,
			'url': url,
			'status': '勉強中です'
		});
	}).then(() => {
		setStyle();
		// hide loading
		$('#loading').remove();
		ref.remove();
	})
}

function getCell(r, c) {
	return $("table tr:eq("+r+") td:eq("+c+")");
}

function goToBreakroom(user) {
	var ref = firebase.database().ref();
	var srRef = roomRef.child(user.uid);

	looper(1);

	function looper(roomIndex) {
		if (roomIndex > NUM_BREAKROOMS) { // no open room
			// go to lobby
			window.location.href = '/break-rooms/room0-0.html';
			return;
		}
		ref.child('room0-' + roomIndex).once('value')
		.then(function(snapshot) {
			var memberCount = snapshot.numChildren();
			
			if (memberCount < MAX_USERS) { // open room
				if ((memberCount == 0) && (roomIndex != 1)) { // no members
					roomIndex--;
				}
				// go to BR
				window.location.href = '/break-rooms/room0-' + roomIndex + '.html';
			} else {
				looper(++roomIndex);
			}
		})
	}
}

function loadTopnavSr() {
	$(function() {
		$('.topnav-sr').load('topnav-sr2.html', () => {
			// show loading: check DB for breaks & room name -> removed in 2 places
			$('.breadcrumb').append('<img id="loading" src="/images/loading.gif">');
			// set room name
			setRoomName();
		});
	})
}

function setRoomName() {
	// set timeout
	var promise = rootRef.child('study-rooms/' + roomId + '/name').once('value');
	var ms = 1000 * 5; // timeout limit

	setPromiseTimeout(ms, promise)
	.then((snapshot) => { // data retreived in time
		$('#roomName').text(snapshot.val());
		$('#loading').remove();
	}).catch((error) => {
		if (error == 'promiseTO') {
			alert('データベースが読み込めないため、ページを更新します');
			location.reload();
		}
	});
}

function setStyle() {
	// change topnav
	var mediaQuery = window.matchMedia("(max-width: 600px");
	if (mediaQuery.matches)
		$('.menu-resp').css('display', 'inline-block');
	else 
		$(".menu").css('display', 'inline-block');

	// disable join buttons
	$('.button-join').attr('disabled', 'disabled');
}