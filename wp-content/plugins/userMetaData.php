<?php
/*
Plugin Name: User Meta Data
*/

/* Add new fields above 'Update' button.
 *
 * @param WP_User $user User object.
 */
function tm_additional_profile_fields( $user ) {

    $hm_sets     = array( 'Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Set 6' );
    $default    = array( 'hm-set' => 'Jnuary', );
    $hm_game_sets = wp_parse_args( get_the_author_meta( 'hm_game_sets', $user->ID ), $default );

    ?>
    <h3>Extra profile information</h3>

    <table class="form-table">
     <tr>
         <th><label for="hm-user-set">Game set</label></th>
         <td>x
             <select id="hm-user-set" name="hm_game_sets[hm-set]"><?php
                 foreach ( $hm_sets as $hm_set ) {
                     printf( '<option value="%1$s" %2$s>%1$s</option>', $hm_set, selected( $hm_game_sets['hm-set'], $hm_set, false ) );
                 }
             ?></select>
         </td>
     </tr>
    </table>
    <?php
}

add_action( 'show_user_profile', 'tm_additional_profile_fields' );
add_action( 'edit_user_profile', 'tm_additional_profile_fields' );

/**
 * Save additional profile fields.
 *
 * @param  int $user_id Current user ID.
 */
function tm_save_profile_fields( $user_id ) {

    if ( ! current_user_can( 'edit_user', $user_id ) ) {
     return false;
    }

    if ( empty( $_POST['hm_game_sets'] ) ) {
     return false;
    }

    update_user_meta( $user_id, 'hm_game_sets', $_POST['hm_game_sets'] );
}

add_action( 'personal_options_update', 'tm_save_profile_fields' );
add_action( 'edit_user_profile_update', 'tm_save_profile_fields' );