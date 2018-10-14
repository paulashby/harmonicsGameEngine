<?php /* Template Name: Screen Control */  

	$communalInteractions = esc_url( site_url() . '/?page_id=472' );

	echo "<!DOCTYPE html>
	<html>
	<head>
		<title>Screen Control</title>";	 
		
		wp_head(); 
		
	echo "</head>
	<body>
		<h1>Screen Control</h1>
		<button id='hearts' data-ciurl=" . $communalInteractions . ">Hearts</button>";	
	?>
	<script>
		var heartButton = document.getElementById('hearts'),
			communalinteractionurl = heartButton.dataset['ciurl'],
			_apiCall = function (url) {
				var req = new XMLHttpRequest();
					req.open('GET', url);
					req.send();
			},
			onCButtonClick = function () {
				_apiCall(communalinteractionurl + '?t=' + Math.random() + '&reqType=heart');						
			};

		heartButton.addEventListener('click', onCButtonClick);
	</script>
</body>
</html>