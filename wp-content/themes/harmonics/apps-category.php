<?php /* Template Name: Apps Category */ 

	function logError( $err ) {
		$errStr = "unknown error type";
		if($err) {
			$errStr = $err;
		}
		write_log( date('[Y-m-d H:i e] '). $errStr );
	};
	$adminEmail = get_option( 'admin_email' );
	// TODO: Need 'from' address for error emails
	$emailHeaders = 'From: AppsCategory <info@primitive.co>' . "\r\n";

	// Determine required category links
    $categoryArray = [];
    $numCategories = 0;
    $gamesEnabled = false;

    if( have_rows('menu-items', 'option') ) {
        
        while( have_rows('menu-items', 'option') ) {

            the_row();
            
            $include = get_sub_field('include');
            $title = get_sub_field('title');            
            $url = get_sub_field('link-url');
            if( $title == 'services' ) {
            	$currUser = 'user_' . get_current_user_id();
            	$ServicesPageName = get_field('services-page-name', $currUser);
            	$url = esc_url( content_url(). '/servicespages/' . $ServicesPageName );
            }

            if( $title == 'games' && ! $url ) {			        			
    			$url = get_home_url();
    			if($include) {
    				$gamesEnabled = true;	
    			}
    		}
    		if($title !== 'shopping') {
	            if( $include ) {
	            	$categoryArray[$title] = $url;
	            	$numCategories++;
	            } else {
	            	$categoryArray[$title] = false;
	            }
	        }
        }              
    }
    if($numCategories < 2) {
    	if($gamesEnabled) {
    		// Only games available - go straight to Game Engine
    		header('Location: '. get_home_url());	
    	} else {
    		// Error - we expect games to be available - notify administrator
			// wp_mail( $adminEmail, "AppsCategory issue: Games disabled in Game Engine Settings"], $emailHeaders );
			logError("AppsCategory issue: Games disabled in Game Engine Settings");
    	}    	
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