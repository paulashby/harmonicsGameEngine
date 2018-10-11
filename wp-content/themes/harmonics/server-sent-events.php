<?php /* Template Name: Server-sent-events */	
	
	header('Content-Type: text/event-stream');
	header('Cache-Control: no-cache');

	function getRequiredAnimations() {
		
		$currUser ="user_" . get_current_user_id();
		$hearts = get_field('hearts', $currUser);
		// $newVal = $hearts > 0 ? $hearts - 1 : 0;
		update_field('hearts', 0, $currUser);

		return $hearts;
	}
	$data = getRequiredAnimations();
	echo "data: " . $data . "\n\nretry: 250\n\n";
	flush();