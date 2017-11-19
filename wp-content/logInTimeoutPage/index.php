<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta http-equiv='content-type' content='text/html; charset=utf-8' />
		<link rel="stylesheet" type="text/css" href="../themes/harmonics/css/game-engine.css">
		<script src="../../wp-includes/js/jquery/jquery.js"></script>
		<script src="../themes/harmonics/scripts/HarmonicsSoundManager.js"></script>
		
		<title>3rd Harmonics</title>		
	</head>	
	<body id='bodyElmt' class='bp'>
		<div id='menuContainer' class='hideMenu'>
			<div class='menu menuTop'>
				<ul>
			        <li class='loginBttn'><a href='../../wp-login.php'><img src='img/menu_login.png' alt='login' data-category='login'></a></li>
		        </ul>
		    </div>
		    <div class='menu menuRight'>
				<ul>
			        <li class='loginBttn'><a href='../../wp-login.php'><img src='img/menu_login.png' alt='login' data-category='login'></a></li>
		        </ul>
		    </div>
		    <div class='menu menuBottom'>
				<ul>
			        <li class='loginBttn'><a href='../../wp-login.php'><img src='img/menu_login.png' alt='login' data-category='login'></a></li>
		        </ul>
		    </div>
		    <div class='menu menuLeft'>
				<ul>
			        <li class='loginBttn'><a  href='../../wp-login.php'><img src='img/menu_login.png' alt='login' data-category='login'></a></li>
		        </ul>
		    </div>
	    </div>
	    <div id='iframeContainer'>
			<iframe id='ifrm' onload='HarmonicsSoundManager.syncVolume()' class='hideMenu' src='genericServicesPage/'></iframe>				
		</div>
		<div class='cornerBttn ' id='bottomBttn' data-category='toggleMenu'></div>
		<div class='cornerBttn ' id='topBttn' data-category='toggleMenu'></div>
		<script type="text/javascript">

			var 
			pauseEvent = new Event('pause'),
			onMenuClick = function (e) {
				var ifrm = document.getElementById('ifrm'),
					menu = document.getElementById('menuContainer'),
					hideMenu = function () {
						var audioElements,
							len, 
							ifrmDoc,
							i;

						if(ifrm.classList.contains('showMenu')) {
							// We're hiding the menu, so focus iframe
							ifrm.focus();				 
							HarmonicsSoundManager.updateVolume();
						} else {
							HarmonicsSoundManager.pauseAudio();
						}
						ifrm.classList.toggle('hideMenu');
						ifrm.classList.toggle('showMenu');
						menu.classList.toggle('hideMenu');
					};

				document.getElementById('bodyElmt').focus();
				if(e.target.dataset.category === 'toggleMenu') {
					hideMenu();
					window.dispatchEvent(pauseEvent);
				}
			},
			init = function () {
				// Add menu event listeners
				document.getElementById('topBttn').addEventListener('click', onMenuClick);
				document.getElementById('bottomBttn').addEventListener('click', onMenuClick);
				document.getElementById('menuContainer').addEventListener('click', onMenuClick);		
			};	
			window.onload = function () {
				init();
			};
		</script>
	</body>
</html>		