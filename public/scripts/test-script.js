// Initialize Firebase
var config = {
  apiKey: "AIzaSyDRmp_XJqP10QY0oop0Y0u7WalMhDqrhaQ",
  projectId: "fireba-a8775",
  storageBucket: "fireba-a8775.appspot.com",
};
firebase.initializeApp(config);

var myCroppie = null;

function readFile(input) {
	var file = input.files[0];
	var reader = new FileReader();

	if (!myCroppie) {
		myCroppie = $('#preview').croppie({
			viewport: {
				width: 100,
				height: 100,
				type: 'circle'
			}, boundary: {
				width: 300,
				height: 300
			}
		});
	}
	
	reader.onload = function() {
		myCroppie.croppie('bind', {
			url: reader.result
		});
	}

	reader.readAsDataURL(file);
}

$('#fileInput').on('change', function() {
	readFile(this);
});

$('#ok').click(function() {
	myCroppie.croppie('result', 'blob').then(function(resp) {
		var storageRef = firebase.storage().ref().child('test');
		storageRef.put(resp).then(function(snapshot) {
			console.log('upload success');
		}).catch(function(error) {
			console.log(error);
		})

	})
})