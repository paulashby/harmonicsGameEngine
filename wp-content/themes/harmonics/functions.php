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

// Allow dashboard access only for administrators
function disable_dashboard() {
    if (!is_user_logged_in()) {
        return null;
    }
    if (!current_user_can('administrator') && is_admin()) {
        wp_redirect(home_url());
        exit;
    }
}
add_action('admin_init', 'disable_dashboard');


// Add Game Engine options page
if( function_exists('acf_add_options_page') ) {
    
    acf_add_options_page(array(
        'page_title'    => 'Game Engine Settings',
        'menu_title'    => 'Game Engine Settings',
        'menu_slug'     => 'game-engine-settings',
        'capability'    => 'edit_posts',
        'redirect'      => false
    ));
    
}

// Populate Game Set checkbox menu with available games
function acf_load_game_choices( $field ) {
    
    // reset choices
    $field['choices'] = array();

    $args = array(
        "category_name" => "game",
    );
        
    $query = new WP_Query( $args );

    if ( $query->have_posts() ) {
       
        while ( $query->have_posts() ) {
     
            $query->the_post();

            $postID = get_the_ID();
            $gameName = get_the_title();

            the_row();

            $value = $postID;
            $label = $gameName;   

            $field['choices'][ $value ] = $label; 
        }
    }
    return $field;    
}
add_filter('acf/load_field/name=game-set-game-checkbox', 'acf_load_game_choices');

// Populate Member Group checkbox menu with Game Sets
function acf_load_set_choices( $field ) {
    
    
    // reset choices
    $field['choices'] = array();

    if( have_rows('game-sets', 'option') ) {
        
        while( have_rows('game-sets', 'option') ) {

            the_row();

            $value = get_sub_field('title');
            $label = get_sub_field('title');
            
            $field['choices'][ $label ] = $label;            
        }        
    }
    return $field;    
}
add_filter('acf/load_field/name=member-group-set-checkbox', 'acf_load_set_choices');

// Populate Membership Group select menu with Member Groups
function acf_load_member_choices( $field ) {
    
    
    // reset choices
    $field['choices'] = array();

    // if has rows
    if( have_rows('member-groups', 'option') ) {
        
        while( have_rows('member-groups', 'option') ) {

            the_row();

            $value = get_sub_field('title');
            $label = get_sub_field('title');

            $field['choices'][ $value ] = $label;            
        }        
    }
    return $field;    
}
add_filter('acf/load_field/name=membership-group-select', 'acf_load_member_choices');

// Populate User Menu Items title select menu with Menu Item titles from Game Engine Settings page 
function acf_load_user_menu_item_choices( $field ) {
    
    
    // reset choices
    $field['choices'] = array();

    if( have_rows('menu-items', 'option') ) {
        
         while( have_rows('menu-items', 'option') ) {            

            the_row();

            $value = get_sub_field('title');
            $label = get_sub_field('title');

            $field['choices'][ $value ] = $label;            
        }        
    }
    return $field;    
}
add_filter('acf/load_field/name=user-menu-items-title', 'acf_load_user_menu_item_choices');


function registerCustomAdminCss(){
	$src = get_template_directory_uri() . '/css/custom-admin.css';
	$handle = 'customAdminCss';

	wp_register_script($handle, $src);
	wp_enqueue_style($handle, $src, array(), false, false);
}
add_action('admin_head', 'registerCustomAdminCss');