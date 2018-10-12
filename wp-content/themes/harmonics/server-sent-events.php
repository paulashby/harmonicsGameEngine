<?php /* Template Name: Server-sent-events */	
	
	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');

	function getRequiredAnimations() {

		$currUsrID = get_current_user_id();

		// Communal Group for current user
		$comgroup = get_field_object('communal-group-select', 'user_' . $currUsrID);
		$communalGroup = $comgroup['value'];
		$groupID = $communalGroup->ID;

		// $communalGroup is a post with fields for hearts, bubbles etc
		$hearts = get_field('hearts', $groupID);
		update_field('hearts', 0, $groupID);

		return $hearts;		

	}
	$data = getRequiredAnimations();
	echo "data: " . $data . "\n\nretry: 250\n\n";
	flush();