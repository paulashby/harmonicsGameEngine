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

	function getFromDB( $gameSet ) {
		// TODO: $gameSet should be queried from the user's tag - haven't set this up on the backend yet
		$gameSet = "set-1";

		$args = array(
			"category_name" => "game",
			"tag" => $gameSet
		);
		
		$query = new WP_Query( $args );
		$retrievedArray = [];
	    $returnData;
		 
		// Check that we have query results.
		if ( $query->have_posts() ) {
			// Start looping over the query results.
		    while ( $query->have_posts() ) {
		 
		        $query->the_post();

		        $use_separate_instructions = get_post_meta( get_the_ID(), "instructions-checkbox", true );
		        $under_review = get_post_meta( get_the_ID(), "under-review-checkbox", true );
		        $description = get_post_meta( get_the_ID(), "game-description", true );
		        $icon_graphic = get_post_meta( get_the_ID(), "icon-graphic-name", true ); 
		        $gameName = get_the_title();

		        if( $under_review != 1 ){
					array_push($retrievedArray, [
			        	"gameName"=>$gameName,
			        	"url"=>content_url() . "/97dL81xtE49aXxa/" . $gameName, 
			        	"id"=>get_the_ID(), "instructions"=>$use_separate_instructions, 
			        	"description"=>$gameName . ": " . $description, 
			        	"iconGraphic"=>$gameName,
			        	"iconURL"=>content_url() . "/gameMenu/" . $gameName . ".png"]);
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
		// Restore original post data.
		wp_reset_postdata();

		return $returnData;
	};

	switch ($reqType) {
		case "initGameManager":	
		// TODO: Retreive the user tag to use as arg in getFromDB()
		// TODO: Setup user tags in Wordpress dashboard	
		$dbFiles = getFromDB( "set-1" );
		if( ! is_array($dbFiles) || array_key_exists ( "E_" , $dbFiles )){
			$data["E_"] = $dbFiles["E_"];
		} else {
			$data["games"] = $dbFiles["games"];
		}		
		echo json_encode( $data );
		break;

		case "suspendGame":
		$gameID = $_GET["gameID"];
		query_posts( "page_id=" . $gameID );
		while ( have_posts() ){
			the_post();
			update_post_meta(get_the_ID(), "under-review", "true");
		}
		$suspErrs = $_GET["err"];
		wp_reset_query();

		logError( 'VTAPI Game suspension: ' . '\'' . $pages->get($gameID)->title . '\' has been suspended due to the following errors - ' . $suspErrs );
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