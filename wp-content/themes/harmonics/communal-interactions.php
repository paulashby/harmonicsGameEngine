<?php /* Template Name: Communal-interactions */

	$reqType = $_GET["reqType"];
	write_log( date('[Y-m-d H:i e] '). 'Communal interactions requesting ' . $reqType . ' animation' );
	if($reqType) {

		$currUsrID = get_current_user_id();

		// Communal Group for current user
		$comgroup = get_field_object('communal-group-select', 'user_' . $currUsrID);
		$communalGroup = $comgroup['value'];
		$groupID = $communalGroup->ID;

		// $communalGroup is a post with fields for hearts, bubbles etc
		switch($reqType) {
			case "heart":		
			$hearts = get_field('hearts', $groupID);
			$newVal = $hearts + 1;
			update_field('hearts', $newVal, $groupID);
		}		
	}
?>