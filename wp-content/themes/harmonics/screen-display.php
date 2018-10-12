<?php /* Template Name: Screen Display */  

	$volfbURL = esc_url( get_template_directory_uri() . '/audio/VolFeedback.mp3' );
	$serverSentEventurl = esc_url( site_url() . '/?page_id=476' );

	echo "<!DOCTYPE html>
	<html>
	<head>
		<title>Screen Display</title>
	</head>
	<body data-sseurl = " . $serverSentEventurl . ">
		<h1>Screen Display</h1>
		<audio id='beep' src='" . $volfbURL . "' preload='auto'></audio>";	
	?>
	<script>
		var serverSentEventurl = document.getElementsByTagName('body')[0].dataset['sseurl'],
			source = new EventSource(serverSentEventurl),
			audioBeep = document.getElementById('beep'),
			queuedBeeps = 0,
			onAudioEnded = function () {
				if(queuedBeeps > 0) {
					queuedBeeps--;
					audioBeep.play();
				}
			};
		
		if(typeof(EventSource) !== 'undefined') {		    
			source.onmessage = function(event) {

				// For now, we're only worrying about the hearts entry
				var heartCount;

				if (event.data !==  '0') {
					audioBeep.play();
					heartCount = parseInt(event.data, 10) -1; 
					queuedBeeps += heartCount;
				}

			}
		} else {
		    alert('Sorry! No server-sent events support');
		}
		audioBeep.addEventListener('ended', onAudioEnded);
	</script>
</body>
</html>