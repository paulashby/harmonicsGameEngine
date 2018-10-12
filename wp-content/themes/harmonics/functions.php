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
    // return $expiration;
    return 14 * 24 * 60 * 60;
}
add_filter('auth_cookie_expiration', 'expiration_per_user', 99, 3);

// Add message to login page
function custom_login_message() {
    $message = '<p id="custom" class="message">The session has expired - please log in to continue</p><br />';
return $message;
}
add_filter('login_message', 'custom_login_message');

// Add harmonicsAdmin.css to HarmonicsErrorLog admin page
function load_custom_wp_admin_style($hook) {
        // Load only on ?page=mypluginname
        if( 'toplevel_page_harmonics-error-log' != $hook ) {
                return;
        }
        wp_enqueue_style( 'harmonics-admin.css', esc_url( get_template_directory_uri() . '/css/harmonics-admin.css' ) );
}
add_action( 'admin_enqueue_scripts', 'load_custom_wp_admin_style' );

// Add LogManager.js to HarmonicsErrorLog admin page
function enqueue_custom_admin_scripts($hook) {    
    if ( 'toplevel_page_harmonics-error-log' != $hook ) {
        return;
    }
    wp_enqueue_script( 'my_custom_script', get_template_directory_uri() . '/scripts/LogManager.js' );
}
add_action( 'admin_enqueue_scripts', 'enqueue_custom_admin_scripts' );

// Add timeout to login page
function enqueue_login_timeout( $page ) {
    wp_enqueue_script( 'login-timeout', esc_url( get_template_directory_uri() . '/scripts/loginTimeout.js' ), null, null, true );
}
add_action( 'login_enqueue_scripts', 'enqueue_login_timeout' );

function enqueue_by_template() {

    if ( is_page_template( 'game-engine.php' ) ) {

        wp_enqueue_style( 'game-engine.css', esc_url( get_template_directory_uri() . '/css/game-engine.css' ) );
        
        // Monitor memory
        // wp_register_script('memoryMonitor', esc_url( get_template_directory_uri() . '/scripts/memoryMonitor.js' ) );
        // wp_enqueue_script( 'memoryMonitor'); 
                
        wp_register_script('HarmonicsSoundManager', esc_url( get_template_directory_uri() . '/scripts/HarmonicsSoundManager.js' ) );
        wp_enqueue_script( 'HarmonicsSoundManager');
        wp_register_script('AdManager', esc_url( get_template_directory_uri() . '/scripts/AdManager.js' ) );
        wp_enqueue_script( 'AdManager');                        
        wp_register_script('ErrorManager', esc_url( get_template_directory_uri() . '/scripts/ErrorManager.js' ) );
        wp_enqueue_script( 'ErrorManager');        
        wp_register_script('GameManager', esc_url( get_template_directory_uri() . '/scripts/GameManager.js' ) );
        wp_enqueue_script( 'GameManager');

    } else if ( is_page_template( 'basic-page.php' ) ) {
        wp_enqueue_style( 'game-engine.css', esc_url( get_template_directory_uri() . '/css/game-engine.css' ) );

        // Monitor memory
        // wp_register_script('memoryMonitor', esc_url( get_template_directory_uri() . '/scripts/memoryMonitor.js' ) );
        // wp_enqueue_script( 'memoryMonitor'); 

        wp_register_script('HarmonicsSoundManager', esc_url( get_template_directory_uri() . '/scripts/HarmonicsSoundManager.js' ) );
        wp_enqueue_script( 'HarmonicsSoundManager');
        wp_register_script('AdManager', esc_url( get_template_directory_uri() . '/scripts/AdManager.js' ) );
        wp_enqueue_script( 'AdManager');                       
        wp_register_script('ErrorManager', esc_url( get_template_directory_uri() . '/scripts/ErrorManager.js' ) );
        wp_enqueue_script( 'ErrorManager');        
        wp_register_script('BasicPageBehaviour', esc_url( get_template_directory_uri() . '/scripts/BasicPageBehaviour.js' ) );
        wp_enqueue_script( 'BasicPageBehaviour');        

    } else if ( is_page_template( 'apps-category.php' ) ) {

        // Monitor memory
        wp_register_script('memoryMonitor', esc_url( get_template_directory_uri() . '/scripts/memoryMonitor.js' ) );
        wp_enqueue_script( 'memoryMonitor');   
        
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
        if(SHOW_MEMORY_USAGE) { // Set above
            wp_register_script('memoryMonitor', esc_url( get_template_directory_uri() . '/scripts/memoryMonitor.js' ) );
            wp_enqueue_script( 'memoryMonitor');   
        }
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

// Populate Menu Items menu with Media Library items tagged as 'cardgames'
function acf_load_menu_item_choices( $field ) {

    // reset choices
    $field['choices'] = array();

    // Need to sort this query
    $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'cardgames,services,shopping,whiteboard'));

    foreach ($taggedPages as $pg) {
        $value = $pg->ID;
        $label = $pg->post_name;   

        $field['choices'][ $value ] = $label;
    }
    return $field;    
}
add_filter('acf/load_field/name=default-page', 'acf_load_menu_item_choices');

// Populate Card Games Page menu with Media Library items tagged as 'cardgames'
function acf_load_cardgame_choices( $field ) {

    // reset choices
    $field['choices'] = array();

    $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'cardgames'));

    $field['choices'][ 'none' ] = 'none';

    foreach ($taggedPages as $pg) {
        $value = $pg->ID;
        $label = $pg->post_name;   

        $field['choices'][ $value ] = $label;
    }
    return $field;    
}
add_filter('acf/load_field/name=cardgames-page-select', 'acf_load_cardgame_choices');

// Populate Services Page menu with Media Library items tagged as 'services'
function acf_load_service_choices( $field ) {

    // reset choices
    $field['choices'] = array();

    $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'services'));

    $field['choices'][ 'none' ] = 'none';

    foreach ($taggedPages as $pg) {
        $value = $pg->ID;
        $label = $pg->post_name;   

        $field['choices'][ $value ] = $label;
    }
    return $field;    
}
add_filter('acf/load_field/name=services-page-select', 'acf_load_service_choices');

// Populate Shopping Page menu with Media Library items tagged as 'shopping'
function acf_load_shopping_choices( $field ) {

    // reset choices
    $field['choices'] = array();

    $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'shopping'));

    $field['choices'][ 'none' ] = 'none';

    foreach ($taggedPages as $pg) {
        $value = $pg->ID;
        $label = $pg->post_name;

        $field['choices'][ $value ] = $label;
    }
    return $field;    

}
add_filter('acf/load_field/name=shopping-page-select', 'acf_load_shopping_choices');

// Populate Whiteboard Page menu with Media Library items tagged as 'whiteboard'
function acf_load_whiteboard_choices( $field ) {

    // reset choices
    $field['choices'] = array();

    $taggedPages = get_attachments_by_media_tags(array('media_tags'=>'whiteboard'));

    $field['choices'][ 'none' ] = 'none';

    foreach ($taggedPages as $pg) {
        $value = $pg->ID;
        $label = $pg->post_name;   

        $field['choices'][ $value ] = $label;
    }
    return $field;    
}
add_filter('acf/load_field/name=whiteboard-page-select', 'acf_load_whiteboard_choices');


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

// Populate Communal Group select menu with Communal Groups
function acf_load_communal_choices( $field ) { 

    // reset choices
    $field['choices'] = array();   

    $args = array(
        "category_name" => 'communalgroup',
    );

    // Get all communal groups
    $query = new WP_Query( $args );

    if ( $query->have_posts() ) {
        
        while ( $query->have_posts() ) {
     
            $query->the_post();

            $value = get_the_title();
            $label = get_the_title();

            $field['choices'][ $value ] = $label;
        }
    }
    return $field;    
}
add_filter('acf/load_field/name=communal-group-select', 'acf_load_communal_choices');

// Populate Ad Set select menu with Ad Sets
function acf_load_ad_set_choices( $field ) {
    
    
    // reset choices
    $field['choices'] = array();

    // if has rows
    if( have_rows('ad-set', 'option') ) {
        
        while( have_rows('ad-set', 'option') ) {

            the_row();

            $value = get_sub_field('title');
            $label = get_sub_field('title');

            $field['choices'][ $value ] = $label;            
        }        
    }
    return $field;    
}
add_filter('acf/load_field/name=ad-set-select', 'acf_load_ad_set_choices');

function registerCustomAdminCss(){
	$src = esc_url( get_template_directory_uri() . '/css/custom-admin.css' );
	$handle = 'customAdminCss';

	wp_register_script($handle, $src);
	wp_enqueue_style($handle, $src, array(), false, false);
}
add_action('admin_head', 'registerCustomAdminCss');