<?php /* Template Name: Game Engine */ 

	require_once("game-list.inc.php");

	// Has the state been saved?	
	if(isset($_SESSION['stateData'])) {
		$currState = $_SESSION["stateData"];
	}

?>
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=UTF-8' />
		<title>Game Engine</title>					
		<?php wp_head(); ?>				
	</head>	
	<?php 
	function get_url_by_slug($slug) {
	    $page_url_id = get_page_by_path( $slug );
	    $page_url_link = get_permalink($page_url_id);
	    return esc_url( $page_url_link );
	};
	$volfbURL = esc_url( get_template_directory_uri() . "/audio/VolFeedback.mp3" );
	$currUsrID = get_current_user_id();
	
	$menuOut = "<div id='menuContainer' class='hideMenu'>
		<audio id='volfeedback' src='" . $volfbURL . "' preload='auto'></audio>";

	$menuElmts = "";

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
		$menuOut .=  "<div class='menu " . $classString . "'>";		
	    if( have_rows("menu-items", "option") ) {

	    	$currUser ="user_" . get_current_user_id();
	    	$gamesPageURL = get_url_by_slug( 'game-engine' );				    		
	    	$linkURL = "";			    					        	 

        	$menuElmts = "</li>
    		<li class='exitBttn exitGame'><a href=''><img src='" . esc_url( get_template_directory_uri() )  . "/css/img/menu_exitgame.png' alt='exit game' data-category='exit'></a></li>
        	<li class='teamBttn changeTeams'><a href=''><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_changeteams.png' alt='change teams' data-category='teamchange'></a></li>
        	<li class='gamesBttn games'><a href='" . $gamesPageURL . "'><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_games.png' alt='games'></a></li>";

	        while( have_rows("menu-items", "option") ) {
	        	
	        	the_row();
	        	$title = get_sub_field("title");

	        	if(get_sub_field("include")){
		        	$linkURL = get_permalink( get_page_by_path( $title ) );					        	
		        	$menuElmts .= "<li class='" . $title . "'><a href='" . $linkURL . "'><img src='" . esc_url( get_template_directory_uri() . "/css/img/menu_" . $title . '.png' ) . "' alt='" . $title . "' data-category='" . $title . "'></a></li>";
			        	if("services" == $title) {
							$logOutURL = $linkURL;

							// Set generic services page for timeout of login page
							$loginTimeoutURL = content_url() . '/logInTimeoutPage/';					        		
			        	}	
				} else if("services" == $title){
					// Services is disabled, so set the timeout to go to the login page
					$logOutURL = esc_url( get_site_url() . '/wp-login.php' );					

					$loginTimeoutURL = $logOutURL;
				}

	        }
	        // Volume slider
		    $menuElmts .= "
		    <li class='slider-wrapper'>
	        <input class='volumeSlider' data-category='volume' type='range' min='0' max='10' value='10' step='1'  onchange='HarmonicsSoundManager.changeVolume(this.value)'>
			</li>";
        	$redirectURL = esc_url( $logOutURL );
			$redirectString = '[logout redirect="' . $redirectURL . '"]';
			
	        $menuOut .= "<ul>
		        <li class='logoutBttn'>" . 
		        do_shortcode( $redirectString ) . $menuElmts . "</ul>
	        </div>";
	    }
	}
	if( isset($currState) ) {

		$returnData = $currState;

	} else {
		
		$gList = makeGameList();

		// New session
		$returnData = array(

			"currState"=>null,

			"dburl"=>esc_url( site_url() . '/?page_id=6' ),

			"gameList"=>$gList["games"],

			// Set to true when loading a game
			"gameLoad"=>false,

			"inactivityTimeout"=>get_field('inactivity-timeout-duration', 'option') * 1000,
			
			"instructionsShown"=>array(),

			// static services page for logged out users
			"loginTimeoutURL"=>$loginTimeoutURL,

			// nextURL is used to load the next iframe content
			"nextURL"=>esc_url( content_url() . '/startPage/src/index.html' ),

			"reteam"=>false,

			"showDraw"=>false,

			"showResults"=>false,

			// startURL is left unchanged so we can access the url regardless of which game is loaded 
			"startURL"=>esc_url( content_url() . '/startPage/src/index.html' ),

			"teamRankings"=>array(),

			"teamState"=>array(),

			"templateDirURL"=>get_template_directory_uri(),

			 // timeout url for logged in users			
			"timeoutURL"=>$logOutURL
						
		);	
	}
	echo "<body  data-setup='" . json_encode($returnData) . "' id='bodyElmt' class='gameEngine'>";

			echo $menuOut . "</div>
			<div id='iframeContainer'>
				<iframe id='ifrm' class='hideMenu' src='about:blank'></iframe>
			</div>";
		
			// AdSet for current user
			function getAds($adSet) {

				$ads = array();

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
			
			$fieldOb = get_field_object('ad-set-select', $currUser);
			$adSet = $fieldOb['value'];
			$adsAvailable = $adSet != "Ad Free" && $adSet != "";
			if($adsAvailable) {
				$ads = getAds($adSet);
				$numAds = count($ads);
				
				$adClass = "";
				$adImages = "";
				$adState = array(
					"numAds"=>$numAds,
					"adURLs"=>array(),
					"cycle"=>false
				);
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
		