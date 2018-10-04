<?php 
	 /* Template Name: Database Interactions */ 

	// TODO: Uncomment email error alerts

	require_once("game-list.inc.php");

	$reqType = $_GET["reqType"];
	$data = array("startPageUrl"=>content_url() . "/startPage/src/");
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

	switch ($reqType) {
		case "initGameManager":

			echo json_encode( makeGameList() );

			break;

		case "initLogManager":

			// get log data from user profile page

			$currUsrID = get_current_user_id();	

			$logData = get_field("error_log", "user_" . $currUsrID);

			if($logData) {
				echo get_field("error_log", "user_" . $currUsrID);	
			} else {
				$errMssg = array('Error' => 'db-interactions-initLogManager: No log data has been set');
				echo json_encode($errMssg);
			}			

			break;

		case "contentChange":

			$stateData = $_GET["stateData"];		

			if( $stateData ) {

				$_SESSION['stateData'] = $stateData;

				echo "Success: call made to store stateData in SESSION";

			} else {
				$errMssg = array('Error' => 'db-interactions-contentChange: No state provided');
				echo json_encode($errMssg);
			}

			break;

		case "suspendGame":

			$gameID = $_GET["gameID"];

			if( $gameID ){
				$gameID = (int)$gameID;
						
				$args = array(
			        "page_id" => $gameID,
			        "post_type" => "post"
			    );
	
				// Set this game to be suspended via the post loading_options field
	
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
	
						$newVal = $instructionsRequired ? array("instructions", "suspended") : array("suspended");
	
						update_field( "loading-options", $newVal, get_the_ID() );
	
						$gameTitle = get_the_title();
					}					 
				}
	
				$suspErrs = $_GET["err"];
	
			    wp_reset_query();

				echo json_encode( makeGameList() );
	
			} else {
				$errMssg = array('Error' => 'db-interactions-suspendGAme: No game id provided');
				echo json_encode($errMssg);
			}

			break;

		case "gameTimeout":

			session_destroy (); 

			echo "success: SESSION destroyed";

			break;

		case "errMssg":	

			// GameManager encountered an error - notify administrator
			// wp_mail( $adminEmail, "VTAPI GameManager issue", $_GET["messageText"], $emailHeaders );
			logError("VTAPI GameManager issue: " . $_GET["messageText"]);
			break;

		default:
			//wp_mail( $adminEmail, "VTAPI GameManager issue", "db-interactions.php encountered an unknown reqType", $emailHeaders );
		
	}