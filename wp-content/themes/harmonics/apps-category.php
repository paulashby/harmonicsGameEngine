<?php /* Template Name: Apps Category */ 

	function logError( $err ) {
		$errStr = "unknown error type";
		if($err) {
			$errStr = $err;
		}
		write_log( date('[Y-m-d H:i e] '). $errStr );
	};
	function get_url_by_slug($slug) {
	    $page_url_id = get_page_by_path( $slug );
	    $page_url_link = get_permalink($page_url_id);
	    return esc_url( $page_url_link );
	};
	
	$gamesPageURL = get_url_by_slug( 'game-engine' );

	// Determine required category links
    $categoryArray = array('games'=>$gamesPageURL);
    $numCategories = 0;

    if( have_rows('menu-items', 'option') ) {

    	$currUser = 'user_' . get_current_user_id();
    	$linkURL = '';

		while( have_rows('menu-items', 'option') ) {

            the_row();
            
            $include = get_sub_field('include');
            $title = get_sub_field('title');

            // Exclude shopping as it only appears in slide-out menu - not as cog on apps category page
    		if($title !== 'shopping') {
    			if( $include ) {
    				$linkURL = get_permalink( get_page_by_path( $title ) );
		        	$categoryArray[$title] = $linkURL;
	            	$numCategories++;
				} else {
	            	$categoryArray[$title] = false;
	            }
	        }
        }              
    }
    if($numCategories == 0) {
    	header('Location: '. get_url_by_slug( "game-engine" ));
    }

	echo " 
<!DOCTYPE HTML>
<html>
<head>
	<meta charset='UTF-8' />
	<title>Apps Category Page</title>";
	wp_head(); 

 	echo "<style type='text/css'>
		body{
			margin: 0;
			background-image: url('wp-content/startPage/assets/bg.jpg');
    		background-color: #cccccc;
		}		
		html, body, #gameContainer{
			width: 100%;
			height: 100%;
			margin: 0;
		}
	</style>
</head>
<body id='body' data-categories='" . json_encode($categoryArray) . "'>";
?>

<div id="gameContainer"></div>

<script type="text/javascript">

window.onload = function() {
	
	AppsCategory.game = new Phaser.Game(f.GAME_WIDTH, f.GAME_HEIGHT, Phaser.AUTO, 'gameContainer', null, true);
	AppsCategory.game.state.add('Boot', AppsCategory.Boot);
	AppsCategory.game.state.add('Preloader', AppsCategory.Preloader);
	AppsCategory.game.state.add('Game', AppsCategory.Game);
	AppsCategory.game.state.add('GameOver', AppsCategory.GameOver);
	AppsCategory.game.state.start('Boot');
};

</script>
</body>
</html>