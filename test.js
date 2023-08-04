simulatorDetector.addEventListener('detect', function() {
	console.log('detected');
});
document.body.addEventListener('click', e => {
	console.log('clicked');
});
document.body.click();