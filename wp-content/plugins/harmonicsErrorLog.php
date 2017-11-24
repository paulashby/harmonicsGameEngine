<?php
/*
Plugin name: Harmonics Error Log
Plugin URI: 
Description: Adds an admin page to view game error logs
Author: Paul Ashby
Author URI: 
Version: 0.1
*/
add_action('admin_menu', 'test_plugin_setup_menu');
 
function test_plugin_setup_menu(){
        add_menu_page( 'Error Log', 'Error log', 'read_private_pages', 'harmonics-error-log', 'init_log' );
}
 
function init_log(){
		$currUsrID = get_current_user_id();
        $out = "<h1 id='logHead' data-db='" . esc_url( site_url() . '/?page_id=6' ) . "'>Error Log</h1>
        <table id='logView'>
        <thead>
        	<tr>
        		<th class='date'>Date</th>
        		<th class='game'>Game</th>
        		<th class='function'>Function</th>        		
        		<th class='errDescription'>Error</th>
			 </tr>
		 </thead>
        </table>";
        echo $out;
}