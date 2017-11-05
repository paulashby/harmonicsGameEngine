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



	// $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'shopping'));
	// write_log('type of tagged pages = ' . gettype($taggedPages));
	// write_log('tagged_pages: ' . print_r($taggedPages, true));
	// foreach ($taggedPages as $key => $value) {
	// 	write_log('shopping page: ' . $value->post_name);
	// }

	// write_log('url of post 298 is: ' . wp_get_attachment_url( 298 ));
	// $strturl = null;
	// foreach($taggedPages as $catpage) {
	//     if ('shopping_1' == $catpage->post_name) {
	//         $strturl = $catpage->guid;
	//         break;
	//     }
	// }
	// OK, we don't need the above - the way we do this is by getting the services page for the current user.
	// If there isn't one, we use the default
	// We also need to adjust the way the default services page is set for the user - it needs a menu populated by all the services pages

	// AND THIS APPLIES TO ALL FOUR APP CAT PAGES
	// AND AND THIS WILL ALSO AFFECT THE COGS ON THE APPS CAT PAGE


	/*

		All the basic pages will be using this template, so how do we set the start page 
		- seems sensible for it to be retreived from the current page 
		- however, what IS the current page? It's not part of the backend and I'd prefer it stayed that way
		- not sure that's poss though

		Let's say this is Services1 page... in order to use the template, it needs to be set up in the back end, or it won't have access to wordpress.
		OK, but does it need access to wordpress… all we need it to do is link back to the other pages - I'm just doing it in the back end!!!

		Services, card Games, Whiteboard and shopping can all be overridden per user
		However, any given user will only have one of each.


		Services will have link to return to its start page - this will be set from a pull down menu of all start pages - 
		in order to assemble this list, we'll hopefully be able to get all pages with a given tag - in this case 'services'

		The start pages will essentially be a set of links as far as I'm concerned, so once a link is clicked, the start page is replaced just like in Game Manager
		- so these pages need to replace the iframe source themselves OR I add listeners to all their links and prevent default - probably best as long as they're straight HTML links
		- perhaps query this with SooLing.

		So what difference is there?
		The third party start pages will still need to be stored in the appsCategoryPages folder
		The names will still have to be entered somehow - unless we upload using the Media Library!



	*/
// 	echo "<body  data-db='" . esc_url( site_url() . '/?page_id=6' ) . "' data-starturl='" . esc_url( content_url() . '/startPage/src/index.html' ) . "' data-templateurl='" . get_template_directory_uri() . "' data-timeoutduration='" . get_field('inactivity-timeout-duration', 'option') . "'id='bodyElmt' class='bp " . $page_class . "'>
// <div id='menuContainer' class='hideMenu'>";	

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

			    	/*

						

						Games button is currently hidden until a game is in progress - we don't want that for this page

						Here, it may be more complicated - we want to hide the menu item for the current page - until some content is loaded

						How do we know which page we're currently on?
						

						OK so we add this to the body and then have the css hide the menu entry when the tag is on the body

						We toggle a .loaded class on the body when the iframe is loaded and use this to get the above behaviour

						
			    	*/    					        	 

		        	$out = "</li>
	        		<li class='exitBttn exitGame'><a href=''><img src='" . esc_url( get_template_directory_uri() )  . "/css/img/menu_exitgame.png' alt='exit game' data-category='exit'></a></li>
		        	<li class='teamBttn changeTeams'><a href=''><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_changeteams.png' alt='change teams' data-category='teamchange'></a></li>
		        	<li class='gamesBttn games'><a href='" . $gamesPageURL . "'><img src='" . esc_url( get_template_directory_uri() ) . "/css/img/menu_games.png' alt='games'></a></li>";

			        while( have_rows("menu-items", "option") ) {
			        	
			        	the_row();
			        	$title = get_sub_field("title");

			        	if(get_sub_field("include")){
				        	$linkURL = get_permalink( get_page_by_path( $title ) );					        	
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
			<div id='iframeContainer'>
				<iframe id='ifrm' data-servicesurl='" . $logOutURL . "' class='hideMenu' src='about:blank'></iframe>
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