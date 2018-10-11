<?php /* Template Name: Screen display */  ?>

<!DOCTYPE html>
<html>
<head>
	<title>Screen Display</title>
</head>
<body>
	<h1>Screen Display</h1>
	<div id='messages'></div>
	
	<?php
	$volfbURL = esc_url( get_template_directory_uri() . "/audio/VolFeedback.mp3" );
	
	echo "<div id='menuContainer' class='hideMenu'>
		<audio id='volfeedback' src='" . $volfbURL . "' preload='auto'></audio>";
	?>
</body>
</html>