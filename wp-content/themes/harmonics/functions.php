<?php
/**
 * Harmonics functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package WordPress
 * @subpackage Harmonics
 * @since 1.0
 */

function enqueue_by_template() {

	if ( is_page_template( 'game-engine.php' ) ) {
  	/** Call game-engine enqueue */
  	wp_enqueue_style( 'game-engine.css', get_template_directory_uri() . '/css/game-engine.css' );
    wp_register_script('GameManager', get_template_directory_uri() . '/scripts/GameManager.js' );
    wp_enqueue_script( 'GameManager');
    
  } else {
    /** Call regular enqueue */
  }
}

add_action( 'wp_enqueue_scripts', 'enqueue_by_template' );
/* Remove admin bar for all logged in users - else shows when viewing site */
add_filter( 'show_admin_bar', '__return_false' );

add_filter( 'rwmb_meta_boxes', 'harmonics_meta_boxes' );
function harmonics_meta_boxes( $meta_boxes ) {

    $prefix = 'hm_';

    $meta_boxes[] = array(
        'title'      => __( 'Game options', 'textdomain' ),
        'post_types' => 'post',
        'fields'     => array(
            array(
                'id'   => 'instructions-checkbox',
                'name' => __( 'Instructions are separate', 'textdomain' ),
                'type' => 'checkbox',
            ),
            array(
                'id'      => 'under-review-checkbox',
                'name'    => __( 'Under review', 'textdomain' ),
                'type'    => 'checkbox',
            ),
            array(
                'id'      => 'game-description',
                'name'    => __( 'Game description', 'textdomain' ),
                'desc'    => __( 'For game selection menu' ),
                'type'    => 'text',
            ),
        ),
    );
    return $meta_boxes;
}



// function harmonics_user_meta_boxes( $meta_boxes ) {

//     $prefix = 'hm_';

//     $meta_boxes[] = array(
//         'title'      => __( 'Game engine information', 'textdomain' ),
//         'type' => 'user',
//         'fields'     => array(
//             array(
//                 'id'   => 'card-games-checkbox',
//                 'name' => __( 'Show Card games link', 'textdomain' ),
//                 'type' => 'checkbox',
//             ),
//             array(
//                 'id'      => 'whiteboard-checkbox',
//                 'name'    => __( 'Show Whiteboard link', 'textdomain' ),
//                 'type'    => 'checkbox',
//             ),
//             array(
//                 'id'      => 'services-checkbox',
//                 'name'    => __( 'Show Services link', 'textdomain' ),
//                 'type'    => 'checkbox',
//             ),
//             array(
//                 'id'      => 'shopping-checkbox',
//                 'name'    => __( 'Show Shopping link', 'textdomain' ),
//                 'type'    => 'checkbox',
//             ),
//         ),
//     );
//     return $meta_boxes;
// }


/*
function custom_meta_box_markup($object) {
	wp_nonce_field(basename(__FILE__), "meta-box-nonce");

    echo "<div>";
            
    $checkbox_value = get_post_meta($object->ID, "instructions-checkbox", true);

    if($checkbox_value == "") {
    	echo "<input name='instructions-checkbox' type='checkbox' value='true'>";    
    }
    else if($checkbox_value == "true")
    {
    	echo "<input name='instructions-checkbox' type='checkbox' value='true' checked>";
    }
	echo "<label for='instructions-checkbox' id='instructions-checkbox'>Instructions are separate</label>
    	</div>";  
}

function add_instructions_checkbox() {
    add_meta_box("instructions-checkbox", "Game configuration", "custom_meta_box_markup", "post", "side", "high", null);
}

add_action("add_meta_boxes", "add_instructions_checkbox");


function save_custom_meta_box($post_id, $post, $update)
{
    if (!isset($_POST["meta-box-nonce"]) || !wp_verify_nonce($_POST["meta-box-nonce"], basename(__FILE__)))
        return $post_id;

    if(!current_user_can("edit_post", $post_id))
        return $post_id;

    if(defined("DOING_AUTOSAVE") && DOING_AUTOSAVE)
        return $post_id;

    $slug = "post";
    if($slug != $post->post_type)
        return $post_id;

    $meta_box_checkbox_value = "";

        if(isset($_POST["instructions-checkbox"]))
    {
        $meta_box_checkbox_value = $_POST["instructions-checkbox"];
    }   
    update_post_meta($post_id, "instructions-checkbox", $meta_box_checkbox_value);
}

add_action("save_post", "save_custom_meta_box", 10, 3);
*/

function registerCustomAdminCss(){
	$src = get_template_directory_uri() . '/css/custom-admin.css';
	$handle = 'customAdminCss';

	wp_register_script($handle, $src);
	wp_enqueue_style($handle, $src, array(), false, false);
}
add_action('admin_head', 'registerCustomAdminCss');
//add_action('wp_head', 'bawpvc_main');