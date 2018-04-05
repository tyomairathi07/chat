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

$("select[name='student-type']").change(function() {
	var type = $(this).val();
	var undergrad = $('#undergrad-major');
	var grad = $('#grad-major');
	var postgrad = $('#postgrad-major');
	switch (type) {
		case '全科履修生': 
			undergrad.css('display', 'block');
			grad.css('display', 'none');
			postgrad.css('display', 'none');
			break;
		case '修士全科生':
			undergrad.css('display', 'none');
			grad.css('display', 'block');
			postgrad.css('display', 'none');
			break;
		case '博士全科生':
			undergrad.css('display', 'none');
			grad.css('display', 'none');
			postgrad.css('display', 'block');
			break;
		default: 
			undergrad.css('display', 'none');
			grad.css('display', 'none');
			postgrad.css('display', 'none');
			$(this).after('<br>');
			break;

	}
});