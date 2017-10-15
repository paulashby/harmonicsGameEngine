<?php 
	 /* Template Name: Database Interactions */ 
	// TODO: Uncomment email error alerts
	$reqType = $_GET["reqType"];
	$data = ["startPageUrl"=>content_url() . "/startPage/src/"];
	$adminEmail = get_option( 'admin_email' );
	// TODO: Need 'from' address for error emails
	$emailHeaders = 'From: VTAPI <info@primitive.co>' . "\r\n";

	function logError( $err ) {
		$errStr = "unknown error type";
		if($err) {
			$errStr = $err;
		}
		write_log( date('[Y-m-d H:i e] '). $errStr );
	};	

	function noGamesError() {
		// TODO: Limit number of emails sent per error
		// TODO: Test mail sending once on remote server - won't work from localhost
		// wp_mail( $adminEmail, "VTAPI GameManager issue", "The server was unable to return any games to the GameManager.", $emailHeaders );
		logError( "VTAPI GameManager issue: " . "The server was unable to return any games to the GameManager.");
		return ["E_"=>"no games found"];
	};

	function getGameSets($membershipGroup) {

		$gameSets = [];

		if( have_rows('member-groups', 'option') ) {
	        
	        while( have_rows('member-groups', 'option') ) {

	            the_row();

	            $group = get_sub_field('title');

				if( $membershipGroup == $group ) {

	            	// Get array of selected checkbox choices(Set 1 etc)
	            	$valueArray = get_sub_field('member-group-set-checkbox'); 	
	            	
	            	// Get array of possible sets to check against
	            	$possibleSets = [];

	            	if( have_rows('game-sets', 'option') ) {
				        
				        while( have_rows('game-sets', 'option') ) {

				            // instantiate row
				            the_row();

				            array_push( $possibleSets,  get_sub_field('title') );			            
				        }			        
				    }
				    // Add required game sets to $gameSets array
				    foreach ($possibleSets as &$possSet) {
				    	if ( in_array( $possSet, $valueArray ) ) {

				    		array_push($gameSets, $possSet);
				    	}
					}	           	
	            }
	        }        
	    }
	    return $gameSets;
	};

	function getPossibleGames() {

		$possibleGames = [];

		$args = array(
	        "category_name" => "game",
	    );

	    // Get all games
	    $query = new WP_Query( $args );

	    if ( $query->have_posts() ) {
	        
	        while ( $query->have_posts() ) {
	     
	            $query->the_post();

	            $postID = get_the_ID();
	            $gameName = get_the_title();
	            
	            array_push($possibleGames, $gameName);
	        }
	    }
	    return $possibleGames;
	};

	function getGameData($gamesToLoad) {

		$args = array(
		   "post__in" => $gamesToLoad,
		);

		// Get game data from database
		$query = new WP_Query( $args );
    
		$retrievedArray = [];
		$returnData;
		 
		if ( $query->have_posts() ) {
			
			while ( $query->have_posts() ) {

		    	$query->the_post();

		        $postID = get_the_ID();
		        $instructions_url = false;
		        $under_review = false;
		        $description = get_field("game-description", $postID);
		        $gameName = get_the_title();
		        
		        $loading_options = get_field("loading-options", $postID);
		        if(gettype($loading_options) == "array") {
		        	foreach ($loading_options as $optn) {

		        		if($optn["value"] == "instructions") {
		        			$instructions_url = esc_url( content_url() . "/97dL81xtE49aXxa/" . $gameName . "/instructions/" );
		        		} else if($optn["value"] == "suspended") {
		        			$under_review = true;
		        		}
		        	}		        	
		        }
		        if( $under_review != 1 ){
					array_push($retrievedArray, [
			        	"gameName"=>$gameName,
			        	"url"=>get_permalink($postID),
			        	"id"=>$postID, 
			        	"instructions"=>$instructions_url, 
			        	"description"=>$description, 
			        	"iconGraphic"=>$gameName,
			        	"iconURL"=>esc_url( content_url() . "/gameMenu/" . $gameName )]);
			    }
		    }
		    if( count( $retrievedArray ) > 0 ){	
		    	$returnData = ["games"=>$retrievedArray];	
		    } else {

		    	$returnData = noGamesError();		
		    }
		} else {
			$returnData = noGamesError();
		}
		// Restore original post data
		wp_reset_postdata();

		return $returnData;
	}

	function getFromDB() {

		$currUsrID = get_current_user_id();

		// Membership Group for current user
		$membershipGroup = get_field_object('membership-group-select', 'user_' . $currUsrID)['value'];
		
		// Game Sets from current user's Membership Group
		$gameSets = getGameSets($membershipGroup);

		// Array of possible games
		$possibleGames = getPossibleGames();

		// Array of game post ids to load
		$gamesToLoad = []; 

		if( have_rows('game-sets', 'option') ) {
		        
	        while( have_rows('game-sets', 'option') ) {

        		// Array of required games to check against
				$requiredGames = [];

				// Array of Game/id name value pairs
				$gameIDs = []; 

	        	the_row();

	            // 'Set 1', 'Set 2' etc
	            $gameSet = get_sub_field('title');            

	            // Check game set should be loaded
				if( in_array($gameSet, $gameSets) ) {

					// Get array of selected checkbox choices(FruitFlux etc)
	            	$valueArray = get_sub_field('game-set-game-checkbox'); 		            	
	            	
	            	// Populate $gameIDs array
	            	foreach ($valueArray as $value) {
	            		// array_push($requiredGames, $value['label']);

	            		/*
							This triggers PHP Warning:  Invalid argument supplied for foreach()
							it's an Advanced Cutsom Fields bug and can be ignored 
							https://support.advancedcustomfields.com/forums/topic/getting-error-in-admin-warning-invalid-argument-supplied-for-foreach/
	            		*/

						// eg: $label = 'FruitFlux', $value = 14
	            		$gameIDs[$value['label']] = $value['value'];
	            	}

	            	// Add required games to $gamesToLoad
				    foreach ($possibleGames as &$possGame) {				    	
				    	if(array_key_exists($possGame, $gameIDs)) {
				    		array_push($gamesToLoad, $gameIDs[$possGame]);	
				    	}
					}	           	
	            }
	        }        
	    }
	   	return getGameData($gamesToLoad);
	};

	switch ($reqType) {
		case "initGameManager":
		$dbFiles = getFromDB();
		if( ! is_array($dbFiles) || array_key_exists ( "E_" , $dbFiles )){
			$data["E_"] = $dbFiles["E_"];
		} else {
			$data["games"] = $dbFiles["games"];
		}		
		echo json_encode( $data );
		break;

		case "suspendGame":
		$gameID = $_GET["gameID"];
		$gameID = (int)$gameID;
		$args = array(
	        "page_id" => $gameID,
	        "post_type" => "post"
	    );

		// Set the this game to suspended in its loading_options field

		$query = new WP_Query( $args );

	    if ( $query->have_posts() ) {
	        
			while ( $query->have_posts() ){

				$query->the_post();

				$loading_options = get_field("loading-options");

				$instructionsRequired = false;

				foreach ($loading_options as $optn) {
					if(in_array("instructions", $optn)) {
						$instructionsRequired = true;						
					}
				}

				$newVal = $instructionsRequired ? ["instructions", "suspended"] : ["suspended"];

				update_field( "loading-options", $newVal, get_the_ID() );

				$gameTitle = get_the_title();
			}
			$suspErrs = $_GET["err"];				
	    }

	    wp_reset_query();

		logError( 'VTAPI Game suspension: ' . '\'' . $gameTitle . '\' has been suspended due to the following errors - ' . $suspErrs );
		$games = getFromDB("set-1");
		echo json_encode( $games );
		break;

		case "errMssg":	

		// GameManager encountered an error - notify administrator
		// wp_mail( $adminEmail, "VTAPI GameManager issue", $_GET["messageText"], $emailHeaders );
		logError("VTAPI GameManager issue: " . $_GET["messageText"]);
		break;

		default:
		//wp_mail( $adminEmail, "VTAPI GameManager issue", "db-interactions.php encountered an unknown reqType", $emailHeaders );
		
	}