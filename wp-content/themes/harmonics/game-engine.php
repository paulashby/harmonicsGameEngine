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
		echo "<body  data-db='" . site_url() . "/?page_id=6' data-starturl='" . content_url() . "/startPage/src/index.html' id='bodyElmt'>
		<iframe id='ifrm' class='hideMenu' src='about:blank'></iframe>
		<div class='cornerBttn' id='bottomBttn'></div>
		<div class='cornerBttn' id='topBttn'></div>
		<script>
			var ifrm = document.getElementById('ifrm'),
				GameEngine = {
				onMenuClick: function () {//classList is an array of class strings - so we can find what we're doing and reset the focus as necessary
					if(ifrm.classList.contains('showMenu')) {
						// We're hiding the menu, so focus ifrm
						ifrm.focus();
					}
					ifrm.classList.toggle('hideMenu');
					ifrm.classList.toggle('showMenu');
				}
			}
			document.getElementById('topBttn').addEventListener('click', GameEngine.onMenuClick);
			document.getElementById('bottomBttn').addEventListener('click', GameEngine.onMenuClick);					
			document.getElementById('bodyElmt').focus();
		</script>
	</body>
</html>";
?>	
		