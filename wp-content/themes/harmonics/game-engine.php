<?php /* Template Name: Game Engine */ ?>
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<title>Game Engine</title>					
		<?php wp_head(); ?>				
	</head>	
	<?php 
	function get_url_by_slug($slug) {
	    $page_url_id = get_page_by_path( $slug );
	    $page_url_link = get_permalink($page_url_id);
	    return esc_url( $page_url_link );
	};
	echo "<body  data-db='" . esc_url( site_url() . '/?page_id=6' ) . "' data-starturl='" . esc_url( content_url() . '/startPage/src/index.html' ) . "' data-templateurl='" . get_template_directory_uri() . "' data-timeoutduration='" . get_field('inactivity-timeout-duration', 'option') . "'id='bodyElmt'>"; ?>
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
				        	$linkPageName = get_field('services-page-name', $currUser);
							$redirectURL = esc_url( content_url(). '/servicesPages/' . $linkPageName );
							$redirectString = '[logout redirect="' . $redirectURL . '"]';
							$gamesPageURL = get_url_by_slug( 'game-engine' );
				        	echo do_shortcode( $redirectString ) . "</li>
			        		<li class='exitBttn exitGame'><a href=''><img src='" . esc_url( get_template_directory_uri() )  . "/css/img/menu_exitgame.png' alt='exit game' data-category='exit'></a></li>
				        	<li class='teamBttn changeTeams'><a href=''><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_changeteams.png' alt='change teams' data-category='teamchange'></a></li>
				        	<li class='gamesBttn games'><a href='" . $gamesPageURL . "'><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_games.png' alt='games'></a></li>";

				        while( have_rows("menu-items", "option") ) {
				        	
				        	the_row();
				        	$title = get_sub_field("title");
				        	$linkURL = "";

				        	if(get_sub_field("include")){
					        	switch ( $title ) {
					        		case "services":
					        		// Check for user override					        		
					        		$linkPageName = get_field('services-page-name', $currUser);
					        			
					        		if( strlen( $linkPageName ) == 0 ) {
					        			// If override unavailable, use Game Engine settings
					        			$linkURL = esc_url( content_url(). '/servicesPages/' . get_sub_field("page-name") );
					        		} else {
					        			$linkURL = esc_url( content_url(). '/servicesPages/' . $linkPageName );
					        		}				        		
	        						break;

	        						case "cardgames":
					        		// Check for user override
	        						$linkPageName = get_field('card-games-page-name', $currUser);
					        		
					        		if( strlen( $linkPageName ) == 0 ) {
					        			// If override unavailable, use Game Engine settings
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . get_sub_field("page-name") );
					        		} else {
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . $linkPageName );
					        		}
	        						break;

	        						case "shopping":
					        		// Check for user override 
	        						$linkPageName = get_field('shopping-page-name', $currUser);
					        		
					        		if( strlen( $linkPageName ) == 0 ) {
					        			// If override unavailable, use Game Engine settings
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . get_sub_field("page-name") );
					        		} else {
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . $linkPageName );
					        		}
	        						break;

	        						default:
					        		// Check for user override 
	        						$linkPageName = get_field('whiteboard-page-name', $currUser);	        						
					        		
					        		if( strlen( $linkPageName ) == 0 ) {
					        			// If override unavailable, use Game Engine settings
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . get_sub_field("page-name") );
					        		} else {
					        			$linkURL = esc_url( content_url(). '/appsCategoryPages/' . $linkPageName );	
					        		}
					        	}					        	
					        	echo "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . esc_url( get_template_directory_uri() . "/css/img/menu_" . $title . '.png' ) . "' alt='" . $title . "' data-category='" . $title . "'></a></li>";	
				        	
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
		