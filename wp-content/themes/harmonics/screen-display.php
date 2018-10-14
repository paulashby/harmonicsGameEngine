<?php /* Template Name: Screen Display */  

	$serverSentEventurl = esc_url( site_url() . '/?page_id=476' );
	$asseturl = esc_url( get_template_directory_uri() )  . "/screen-display-assets/";

	echo "<!DOCTYPE html>
<html>
	<head>
		<title>Screen Display</title>"; 

	wp_head(); 

	echo "</head>
	<body data-sseurl=" . $serverSentEventurl . " data-asseturl=" . $asseturl . ">		
	</body>
</html>";