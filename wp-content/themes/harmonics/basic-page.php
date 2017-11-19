<?php /* Template Name: Basic Page */ 	
	$page_class = strtolower(str_replace(' ', '', wp_title('', false)));
	?>
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<title><?php the_title(); ?></title>					
		<?php wp_head(); ?>				
	</head>	
	<?php 
	function get_url_by_slug($slug) {
	    $page_url_id = get_page_by_path( $slug );
	    $page_url_link = get_permalink($page_url_id);
	    return esc_url( $page_url_link );
	};
		$currUser ="user_" . get_current_user_id();
		$post_slug=$post->post_name;
		$page_field = $post_slug . '-page-select';

		// / Check for user override		        		 
		$attachment_id = get_field_object($page_field, $currUser)['value'];	        		
		
		if( $attachment_id == 'none' ) {		        			
			// Override unavailable, use Game Engine settings
			// This page is only accessible when 'include' checkbox is ticked, so don't need to worry about that here			
			if( have_rows('menu-items', 'option') ) {

		    	$currUser = 'user_' . get_current_user_id();
		    	$linkURL = '';

		    	while( have_rows('menu-items', 'option') ) {

		            the_row();		

		            $title = get_sub_field('title');		            

		            if( $title === $post_slug) {
		            	write_log('title: ' . $title);
		            	$attachment_id = get_sub_field_object('default-page')['value'];	
		            }	            
		        }
		    }
		}	
		$linkURL = wp_get_attachment_url( $attachment_id );
			echo "<body  data-db='" . esc_url( site_url() . '/?page_id=6' ) . "' data-starturl='" . esc_url( $linkURL ) . "' data-templateurl='" . get_template_directory_uri() . "' data-timeoutduration='" . get_field('inactivity-timeout-duration', 'option') . "'id='bodyElmt' class='bp " . $page_class . "'>
<div id='menuContainer' class='hideMenu'>";	
			
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
		        	<li class='gamesBttn games'><a href='" . $gamesPageURL . "'><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_games.png' alt='games'></a></li>";

			        while( have_rows("menu-items", "option") ) {
			        	
			        	the_row();
			        	$title = get_sub_field("title");

			        	if(get_sub_field("include")){
				        	$linkURL = get_permalink( get_page_by_path( $title ) );					        	
				        	$out .= "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . esc_url( get_template_directory_uri() . "/css/img/menu_" . $title . '.png' ) . "' alt='" . $title . "' data-category='" . $title . "'></a></li>";	
				        	if("services" == $title) {
								$logOutURL = $linkURL;

								// Set generic services page for timeout of login page
								$loginTimeoutURL = content_url() . '/logInTimeoutPage/';	
								write_log('login-timeout-destination: ' . $loginTimeoutDestination)	;			        		
				        	}		        	
				        } else if("services" == $title){
							// Services is disabled, so set the timeout to go to the login page
							$logOutURL = esc_url( get_site_url() . '/wp-login.php' );

							// TODO: Is there a better page to redirect to when login page times out and services is disabled?
							// Set timeout of login page to return to... itself - not really anywhere it can go
							$loginTimeoutURL = $logOutURL;
						}
			        }
			        // Volume slider
			        $out .= "<li class='slider-wrapper'>
					  <input class='volumeSlider' type='range' min='0' max='10' value='10' step='1' onchange='HarmonicsSoundManager.changeVolume(this.value)'>
					</li>";

		        	$redirectURL = esc_url( $logOutURL );
					$redirectString = '[logout redirect="' . $redirectURL . '"]';
					
			        echo "<ul>
				        <li class='logoutBttn'>" . 
				        do_shortcode( $redirectString ) . $out . "</ul>
			        </div>";
			    }
			}
			echo "</div>
			<div id='iframeContainer'>
				<iframe id='ifrm' data-servicesurl='" . $logOutURL . "' data-logintimeouturl='" . $loginTimeoutURL . "' onload='HarmonicsSoundManager.syncVolume()' class='hideMenu' src='about:blank'></iframe>				
			</div>";
		
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
					"cycle"=>false
				];
				function make_images($numImages, &$adImages, &$adState, &$ads, &$numAds) {

					$blankImageString = "data:image/png;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

					for($i = 0; $i < $numImages; $i++) {						
						$adImages .= "<img id='ad" . ($i + 1) . "' src='" . $blankImageString . "'>";													
					}
					for($i = 0; $i < $numAds; $i++){
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

					default:
					$adClass .= "twoPlusAds";
					make_images(8, $adImages, $adState, $ads, $numAds);
					$adState["cycle"] = true;
				}
				echo "<div id='ads' class='hideAds " . $adClass . "' data-adstate=" . json_encode($adState) . ">" . $adImages . "</div><!-- End ads -->";
			}
			
		?>
		<div class='cornerBttn ' id='bottomBttn' data-category='toggleMenu'></div>
		<div class='cornerBttn ' id='topBttn' data-category='toggleMenu'></div>
	</body>
</html>		