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

// login timeout on per user basis
add_filter('auth_cookie_expiration', 'expiration_per_user', 99, 3);
function expiration_per_user($seconds, $user_id, $remember){

    $defaultTimeout = 14 * 24 * 60 * 60;

    $currUser = 'user_' . $user_id;

    // Login timeout period for current user
    $userTimeout = get_field('login-timeout', $currUser);

    $expiration = $userTimeout ? $userTimeout * 60 : $defaultTimeout;

    //http://en.wikipedia.org/wiki/Year_2038_problem
    if ( PHP_INT_MAX - time() < $expiration ) {
        //Fix to a little bit earlier!
        $expiration =  PHP_INT_MAX - time() - 5;
    }

    return $expiration;
}

// Add message to login page
function custom_login_message() {
$message = '<p id="custom" class="message">The session has expired - please log in to continue</p><br />';
return $message;
}
add_filter('login_message', 'custom_login_message');

function enqueue_by_template() {

    if ( is_page_template( 'game-engine.php' ) ) {

        wp_enqueue_style( 'game-engine.css', esc_url( get_template_directory_uri() . '/css/game-engine.css' ) );
        wp_register_script('GameManager', esc_url( get_template_directory_uri() . '/scripts/GameManager.js' ) );
        wp_enqueue_script( 'GameManager');

    } else if ( is_page_template( 'apps-category.php' ) ) {

        wp_register_script('Phaser', esc_url( content_url() . '/appsCategory/src/phaser.js' ) );
        wp_enqueue_script( 'Phaser');
        wp_register_script('Boot', esc_url( content_url() . '/appsCategory/src/Boot.js' ) );
        wp_enqueue_script( 'Boot');
        wp_register_script('Preloader', esc_url( content_url() . '/appsCategory/src/Preloader.js' ) );
        wp_enqueue_script( 'Preloader');
        wp_register_script('Game', esc_url( content_url() . '/appsCategory/src/Game.js' ) );
        wp_enqueue_script( 'Game');
        wp_register_script('GameOver', esc_url( content_url() . '/appsCategory/src/GameOver.js' ) );
        wp_enqueue_script( 'GameOver');

    } else {
        /** Call regular enqueue */
  }
}
add_action( 'wp_enqueue_scripts', 'enqueue_by_template' );


function custom_login_stylesheet() {

    wp_enqueue_style( 'custom-login', esc_url( get_template_directory_uri() . '/css/login.css' ) );
}
add_action( 'login_enqueue_scripts', 'custom_login_stylesheet' );

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

function registerCustomAdminCss(){
	$src = esc_url( get_template_directory_uri() . '/css/custom-admin.css' );
	$handle = 'customAdminCss';

	wp_register_script($handle, $src);
	wp_enqueue_style($handle, $src, array(), false, false);
}
add_action('admin_head', 'registerCustomAdminCss');