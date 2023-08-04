window.addEventListener('load', function() {
	const a = Math.round(Math.random() * 10);
	const b = Math.round(Math.random() * 10);

	document.querySelector('#question').innerText = `${a} + ${b} = `;
	submit.addEventListener('click', e => {
		document.querySelector('#answer').value === (a + b).toString()
			&& alert('Captcha passed');
	});

	simulatorDetector.addEventListener('detect', e => {
		console.log('Simulator detected', e.detail);
	});

	simulatorDetector.addEventListener('bypass', e => {
		console.log('Bypasser script detected', e.detail);
	});
});