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
				$logOutURL;
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
				    	$gamesPageURL = get_url_by_slug( 'game-engine' );				    		
				    	$linkURL = "";			    					        	 

			        	$out = "</li>
		        		<li class='exitBttn exitGame'><a href=''><img src='" . esc_url( get_template_directory_uri() )  . "/css/img/menu_exitgame.png' alt='exit game' data-category='exit'></a></li>
			        	<li class='teamBttn changeTeams'><a href=''><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_changeteams.png' alt='change teams' data-category='teamchange'></a></li>
			        	<li class='gamesBttn games'><a href='" . $gamesPageURL . "'><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_games.png' alt='games'></a></li>";

				        while( have_rows("menu-items", "option") ) {
				        	
				        	the_row();
				        	$title = get_sub_field("title");

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
					        		// Set this URL for log out redirect too 
					        		$logOutURL = $linkURL;			        		
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
					        	$out .= "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . esc_url( get_template_directory_uri() . "/css/img/menu_" . $title . '.png' ) . "' alt='" . $title . "' data-category='" . $title . "'></a></li>";	
				        	
					        }
				        }
			        	$redirectURL = esc_url( $logOutURL );
						$redirectString = '[logout redirect="' . $redirectURL . '"]';
						
				        echo "<ul>
					        <li class='logoutBttn'>" . 
					        do_shortcode( $redirectString ) . $out . "</ul>
				        </div>";
				    }
				}
			
			echo "</div>
			<iframe id='ifrm' data-servicesurl='" . $logOutURL . "' class='hideMenu' src='about:blank'></iframe>";
		
		/*
			Let's assume we'e getting a list of file names for the ads
			and that they'll be hosted on our server for now

			For cycling through the ads, probably easiest to move them between active and inactive divs 
			These can be placed inside a parent div whose visibility can be adjusted when menu is activated.
		*/
			// AdSet for current user
			function getAds($adSet) {

				$ads = [];

				if( have_rows('ad-set', 'option') ) {
			        
			        while( have_rows('ad-set', 'option') ) {

			            the_row();

			            $set = get_sub_field('title');

			            if( $adSet == $set ) {

			            	if( have_rows('ads') ) {
								while( have_rows('ads')) {
									the_row();
									$adFileName = get_sub_field( 'ad-file-names');
									array_push($ads, $adFileName);
								}
							}	           	
			            }
			        }        
			    }
			    return $ads;
			};
			
			$adSet = get_field_object('ad-set-select', $currUser)['value'];
			$adsAvailable = $adSet != "Ad Free" && $adSet != "";
			if($adsAvailable) {
				$ads = getAds($adSet);
				$numAds = count($ads);
				
				$adClass = "";
				$adImages = "";
				$adState = [
					"numAds"=>$numAds,
					"adURLs"=>[],
					"cycle"=>[]
				];
				function make_images($numImages, &$adImages, &$adState, &$ads, &$numAds) {

					$blankImageString = "data:image/png;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

					for($i = 0; $i < $numImages; $i++) {						
						$adImages .= "<img id='ad" . ($i + 1) . "' src='" . $blankImageString . "'>";							
						array_push($adState["adURLs"], esc_url( content_url() . "/ads/" )  . $ads[$i % $numAds]);
					}
				};

				switch($numAds) {
					case 1:
					$adClass .= "singleAd";
					make_images(4, $adImages, $adState, $ads, $numAds);
					break;

					case 2:
					$adClass .= "twoAds";
					make_images(8, $adImages, $adState, $ads, $numAds);
					break;

					case 3:
					$adClass .= "threeAds";
					make_images(8, $adImages, $adState, $ads, $numAds);
					array_push($adState["cycle"], 3, 4); // zero-based ordinals
					break;

					default:
					$adClass .= "threePlusAds";
					make_images(8, $adImages, $adState, $ads, $numAds);
					array_push($adState["cycle"], 0, 1, 2, 3, 4, 5, 6, 7); // zero-based indices. And is this correct syntax?
				}
			}
			// We don't care if the ads div is empty - we treat it the same way
			echo "<div id='ads' class='hideAds " . $adClass . "' data-adstate=" . json_encode($adState) . ">" . $adImages . "</div><!-- End ads -->";
		?>
		<div class='cornerBttn hide' id='bottomBttn' data-category='toggleMenu'></div>
		<div class='cornerBttn hide' id='topBttn' data-category='toggleMenu'></div>
	</body>
</html>
		