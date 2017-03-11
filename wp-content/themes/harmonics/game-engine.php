<?php /* Template Name: Game Engine */ ?>
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<title>Game Engine</title>					
		<?php wp_head(); ?>				
	</head>	
	<?php echo "<body  data-db='" . site_url() . "/?page_id=6' data-starturl='" . content_url() . "/startPage/src/index.html' data-templateurl='" . get_template_directory_uri(). "' id='bodyElmt'>"; ?>
			<div id='menuContainer' class='hideMenu'>
		
			<?php	
				for($i = 0; $i < 4; $i++) {
					$classString = '';
					switch ($i) {
						case 0:
						$classString = "menuTop";
						break;

						case 1:
						$classString = "menuRight";
						break;

						case 2:
						$classString = "menuBottom";
						break;

						default:
						$classString = "menuLeft";
						break;
					}
					echo "<div class='menu " . $classString . "'>";		
				    if( have_rows("menu-items", "option") ) {

				    	$currUser ="user_" . get_current_user_id();

				    	echo "<ul>
					        <li class='logoutBttn'>";				        	
				        	$ServicesPageName = get_field('services-page-name', $currUser);
							$redirectURL = esc_url( content_url(). '/servicespages/' . $ServicesPageName );
							$redirectString = '[logout redirect="' . $redirectURL . '"]';
				        	echo do_shortcode( $redirectString ) . "</li>
			        		<li class='exitBttn exitGame'><a href=''><img src='" . get_template_directory_uri() . "/css/img/menu_exitgame.png' alt='exit game' data-category='exit'></a></li>
				        	<li class='teamBttn changeTeams'><a href=''><img src='" . get_template_directory_uri() . "/css/img/menu_changeteams.png' alt='change teams' data-category='teamchange'></a></li>";

				        while( have_rows("menu-items", "option") ) {
				        	
				        	the_row();
				        	$title = get_sub_field("title");
				        	$linkURL = get_sub_field("link-url");

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
				        		} else if($title == "services") {
				        			$ServicesPageName = get_field('services-page-name', $currUser);
            						$linkURL = esc_url( content_url(). '/servicespages/' . $ServicesPageName );
				        		}
				        		echo "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . get_template_directory_uri() . "/css/img/menu_" . $title . ".png' alt='" . $title . "' data-category='" . $title . "'></a></li>";	
				        	}			        				        	
				        }
				        echo "</ul>
				        </div>";
				    }
				}
			?>
			</div>
		
		<iframe id='ifrm' class='hideMenu' src='about:blank'></iframe>
		<div class='cornerBttn' id='bottomBttn' data-category='toggleMenu'></div>
		<div class='cornerBttn' id='topBttn' data-category='toggleMenu'></div>
	</body>
</html>
		