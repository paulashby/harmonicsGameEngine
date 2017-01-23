<?php
/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package WordPress
 * @subpackage Harmonics
 * @since 1.0
 * @version 1.0
 */
?>
<!DOCTYPE HTML> 
<meta charset='UTF-8'>
<?php
//wp_head();
$separate_instructions = (string)get_post_meta( get_the_id(), 'instructions-checkbox', true ); 
echo do_shortcode( '[post_view]');
/* Redirect to instructions if separate, else straight to game */
$url_suffix = $separate_instructions === 'true' ? 'instructions' : 'game';
wp_safe_redirect( content_url( '97dL81xtE49aXxa/' ) . get_the_title() . '/' . $url_suffix);
exit;
?>