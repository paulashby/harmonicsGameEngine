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





if( function_exists('acf_add_options_page') ) {
    
    acf_add_options_page(array(
        'page_title'    => 'Game Engine Settings',
        'menu_title'    => 'Game Engine Settings',
        'menu_slug'     => 'game-engine-settings',
        'capability'    => 'edit_posts',
        'redirect'      => false
    ));
    
}

/*

    Requirements:

    Repeater which contains checkbox of all available games

*/

function acf_load_game_choices( $field ) {
    
    // reset choices
    $field['choices'] = array();

    $args = array(
        "category_name" => "game",
    );
        
    $query = new WP_Query( $args );

    // Check that we have query results.
    if ( $query->have_posts() ) {
        // Start looping over the query results.
        while ( $query->have_posts() ) {
     
            $query->the_post();

            $postID = get_the_ID();
            $use_separate_instructions = false;
            $under_review = false;
            $description = get_field("game-description", $postID);
            $gameName = get_the_title();

            // instantiate row
            the_row();

            $value = $postID;
            $label = $gameName;   

            // append to choices
            $field['choices'][ $value ] = $label; 
        }
    }

    // return the field
    return $field;    
}

add_filter('acf/load_field/name=game-set-game-checkbox', 'acf_load_game_choices');















function registerCustomAdminCss(){
	$src = get_template_directory_uri() . '/css/custom-admin.css';
	$handle = 'customAdminCss';

	wp_register_script($handle, $src);
	wp_enqueue_style($handle, $src, array(), false, false);
}
add_action('admin_head', 'registerCustomAdminCss');
//add_action('wp_head', 'bawpvc_main');