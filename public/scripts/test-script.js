var video = $('video').get(0);
navigator.mediaDevices.getUserMedia({audio: false, video: true})
.then(function(stream) {
	video.srcObject = stream;
}).then(() => {
	video.onloadedmetadata = () => {
		console.log('width: ' + video.videoWidth);
		console.log('height: ' + video.videoHeight);
	}
})