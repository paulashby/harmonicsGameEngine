<?php /* Template Name: Game Engine */ ?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<title>Game Engine</title>					
		</style>
		<?php wp_head(); ?>				
	</head>	
	<?php
		echo "<body  data-db='" . site_url() . "/?page_id=6' data-starturl='" . content_url() . "/startPage/src/index.html' id='bodyElmt'>";
		//$str = content_url() . '/startPage/src/index.html';
		//echo "<iframe id='ifrm' src='" . $str .  "'</iframe>
		echo "<iframe id='ifrm' src='about:blank'></iframe>
		<script>					
			document.getElementById('bodyElmt').focus();				
		</script>
	</body>
</html>";
?>	
		