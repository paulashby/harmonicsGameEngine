<?php /* Template Name: Communal-interactions */

	$reqType = $_GET["reqType"];
	write_log( date('[Y-m-d H:i e] '). 'Communal interactions requesting ' . $reqType . ' animation' );
	if($reqType) {

		$currUser ="user_" . get_current_user_id();

		switch($reqType) {
			case "heart":		
			$hearts = get_field('hearts', $currUser);
			$newVal = $hearts + 1;
			update_field('hearts', $newVal, $currUser);
		}
		
	}


?>