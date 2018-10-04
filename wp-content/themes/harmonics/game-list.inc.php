<?php
function noGamesError() {
	write_log( "Game Engine settings issue: " . "The server was unable to return any games to the GameManager.");
	return array("E_"=>"no games found");
};

function getGameSets($membershipGroup) {

	$gameSets = array();

	if( have_rows('member-groups', 'option') ) {
        
        while( have_rows('member-groups', 'option') ) {

            the_row();

            $group = get_sub_field('title');

			if( $membershipGroup == $group ) {

            	// Get array of selected checkbox choices(Set 1 etc)
            	$valueArray = get_sub_field('member-group-set-checkbox'); 	
            	
            	// Get array of possible sets to check against
            	$possibleSets = array();

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

	$possibleGames = array();

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

	$retrievedArray = array();
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
				array_push($retrievedArray, array(
		        	"gameName"=>$gameName,
		        	"url"=>get_permalink($postID),
		        	"id"=>$postID, 
		        	"instructions"=>$instructions_url, 
		        	"description"=>$description, 
		        	"iconGraphic"=>$gameName,
		        	"iconURL"=>esc_url( content_url() . "/gameMenu/" . $gameName )));
		    }
	    }
	    if( count( $retrievedArray ) > 0 ){	
	    	$returnData = array("games"=>$retrievedArray);	
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
	$memGroup = get_field_object('membership-group-select', 'user_' . $currUsrID);
	$membershipGroup = $memGroup['value'];
	
	// Game Sets from current user's Membership Group
	$gameSets = getGameSets($membershipGroup);

	// Array of possible games
	$possibleGames = getPossibleGames();

	// Array of game post ids to load
	$gamesToLoad = array(); 

	if( have_rows('game-sets', 'option') ) {
	        
        while( have_rows('game-sets', 'option') ) {

    		// Array of required games to check against
			$requiredGames = array();

			// Array of Game/id name value pairs
			$gameIDs = array(); 

        	the_row();

            // 'Set 1', 'Set 2' etc
            $gameSet = get_sub_field('title');            

            // Check game set should be loaded
			if( in_array($gameSet, $gameSets) ) {

				// Get array of selected checkbox choices(FruitFlux etc)
            	$valueArray = get_sub_field('game-set-game-checkbox'); 		            	
            	
            	// Populate $gameIDs array
            	foreach ((array) $valueArray as $value) {
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

function makeGameList() {

	$dbFiles = getFromDB();
	if( ! is_array($dbFiles) || array_key_exists ( "E_" , $dbFiles )){
		$data["games"] = array();
	} else {
		$data["games"] = $dbFiles["games"];
	}		
	return $data;
}
?>