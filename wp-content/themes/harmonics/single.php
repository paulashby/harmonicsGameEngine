<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package WordPress
 * @subpackage Harmonics
 * @since 1.0
 * @version 1.0
 */

echo "<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<title>Game Engine</title>
	</head>
	<body id='bodyElmt' data-gameurl='" . content_url( '97dL81xtE49aXxa/' ) . get_the_title() . "'>";
?>
<script>
	// this redirect goes to the page in the game folder
	var gameUrl = document.getElementById('bodyElmt').dataset.gameurl + top.GameManager.getGameSuffix();
	window.location.replace(gameUrl);	
</script>
</php 
echo "</body>
</html>";

