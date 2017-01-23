<?php /* Template Name: Apps */ ?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<script src='<?php echo $config->urls->templates?>scripts/GameManager.js'></script>
		<title>Apps</title>
		<style type = 'text/css'>
			html, body, iframe {
				width: 100%;
				height: 100%;
			}
			body {
			   margin: 0;
			   overflow: hidden;
			   background-color: ivory;
			   margin: auto;

			   width: 100%;
			   height: 100%;
			}
			iframe {
				border: 0;
				width: 100%;
				height:100%;
				background-color: black;
				display: block;
				margin: auto;
			}
			#testDiv {
				width: 200px;
				height: 200px;
				position: absolute;
				left: 100px;
				top: 100px;
				background-color: red;
			}		
		</style>				
	</head>
	
	<body id='bodyElmt'>
<!--http://localhost/~Pablo/victorWordpress/wp-content/97dL81xtE49aXxa/FruitFlux/game/index.html-->
<?php
$str = content_url() . '/97dL81xtE49aXxa/FruitFlux/game/index.html';
		echo "<iframe id='ifrm' src='" . $str .  "'</iframe>	";
		?>	
		<script>					
			document.getElementById('bodyElmt').focus();				
		</script>
	</body>
</html>