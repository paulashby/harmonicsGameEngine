<?php /* Template Name: Game Engine */ ?>
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<title>Game Engine</title>					
		<?php wp_head(); ?>				
	</head>	
	<?php echo "<body  data-db='" . site_url() . "/?page_id=6' data-starturl='" . content_url() . "/startPage/src/index.html' id='bodyElmt'>"; ?>

		
			<?php	
				for($i = 0; $i < 4; $i++) {
					$idString = '';
					switch ($i) {
						case 0:
						$idString = "menuTop";
						break;

						case 1:
						$idString = "menuRight";
						break;

						case 2:
						$idString = "menuBottom";
						break;

						default:
						$idString = "menuLeft";
						break;
					}
					echo "<div id=" . $idString . " class='menu'>";		
				    if( have_rows("menu-items", "option") ) {

				    	echo "<ul>";
	        
				        while( have_rows("menu-items", "option") ) {
				        	
				        	the_row();
				        	$title = get_sub_field("title");
				        	$linkURL = get_sub_field("link-url");
				        	$currUser ="user_" . get_current_user_id();

				        	// Check for URL overrides entered on user page
				        	if( have_rows("user-menu-items", $currUser)){

							    while( have_rows("user-menu-items", $currUser)){

							    	the_row();
							        
							        $linkTitle = get_sub_field("user-menu-items-title");
							        
							        // Use user URL if available
							        if($linkTitle == $title) {
							        	$linkURL = get_sub_field("link-url");
							        }
							    }
							}
							// Only include item in menu if include is checked on Game Engine Settings page
				        	if(get_sub_field("include")){
				        		// Game Engine address not expected from Game Engine Settings page
				        		if($title == "games" && ! $linkURL) {			        			
				        			$linkURL = get_home_url();
				        		}
				        		echo "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . get_template_directory_uri() . "/css/img/menu_" . $title . ".png' alt='" . $title . "'></a></li>";	
				        	}			        				        	
				        }
				        echo "<li class='exitGame'><a href=''><img src='" . get_template_directory_uri() . "/css/img/menu_exitgame.png' alt='exit game'></a></li>
				        	<li class='changeTeams'><a href=''><img src='" . get_template_directory_uri() . "/css/img/menu_changeteams.png' alt='change teams'></a></li>
				        </ul>
				        </div>";
				    }
				}
			?>
		
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
			};
			document.getElementById('topBttn').addEventListener('click', GameEngine.onMenuClick);
			document.getElementById('bottomBttn').addEventListener('click', GameEngine.onMenuClick);					
			document.getElementById('bodyElmt').focus();
		</script>
	</body>
</html>";
?>	
		