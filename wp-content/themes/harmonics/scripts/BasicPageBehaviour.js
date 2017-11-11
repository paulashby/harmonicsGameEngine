/*global window, clearTimeout, Event, document, AdManager, top, setTimeout, localStorage, jQuery */
var GameManager = (function () {

	'use strict';
	
	var
	inactivity_period,
	inactivityTimeout,
	onTimeout,
	resetTimer,
	pauseEvent = new Event('pause'),	
	exitEvent = new Event('exit'),	
	startUrl,
	homeURL,
	iframeHTML,
	onMenuClick = function (e) {
		var ifrm = document.getElementById('ifrm'),
		menu = document.getElementById('menuContainer'),
		adDiv = document.getElementById('ads'),
		hideMenu = function () {
			if(ifrm.classList.contains('showMenu')) {
				// We're hiding the menu, so focus ifrm
				ifrm.focus();
				// update the ads
				AdManager.cycleAds();
			}
			ifrm.classList.toggle('hideMenu');
			ifrm.classList.toggle('showMenu');
			menu.classList.toggle('hideMenu');
			adDiv.classList.toggle('showAds');
			adDiv.classList.toggle('hideAds');
		};
		document.getElementById('bodyElmt').focus();
		if(e.target.dataset.category === 'exit') {
			e.preventDefault();
			if(document.getElementById('menuContainer').classList.contains('showGameButtons')){				
				window.dispatchEvent(exitEvent);
				hideMenu();
			}			
		} else if(e.target.dataset.category === 'teamchange') {
			e.preventDefault();			
			if(document.getElementById('menuContainer').classList.contains('showGameButtons')){
				reteam = true;
				window.dispatchEvent(exitEvent);
				hideMenu();
			}			
		} else if(e.target.dataset.category === 'toggleMenu') {
			hideMenu();
			window.dispatchEvent(pauseEvent);
		}
	},
	init = function () {
		var logoutLinks = document.getElementsByClassName('logout'),
		templateDirURL = document.body.dataset.templateurl,
		container,
		$, i, len = logoutLinks.length;

		iframeHTML = document.getElementById('ifrm').outerHTML;

		startUrl = document.body.dataset.starturl;		
		homeURL = document.getElementById('ifrm').dataset.servicesurl;
		inactivity_period = document.body.dataset.timeoutduration * 1000;

		onTimeout = function () {
			top.location.href = homeURL;
		};
		resetTimer = function (e) {
		  if(e) {
		    e.preventDefault();
		  }
		  clearTimeout(inactivityTimeout);    
		  inactivityTimeout = setTimeout(onTimeout, inactivity_period);
		};
		resetTimer();
		// Store homeURL and inactivityTimeout in local storage so we can query it for login page timeout (when user won't be logged in)
		// This will be available from first time machine loads games page until the browser cache is cleared
		localStorage.setItem('homeURL', homeURL);
		localStorage.setItem('inactivityTimeout', inactivityTimeout);			

		for(i = 0; i < len; i++) {
			logoutLinks[i].innerHTML = "<img src='" + templateDirURL + "/css/img/menu_logout.png' alt='logout' data-category='logout'>";
		}		
		container = document.getElementById('iframeContainer');
		container.innerHTML = iframeHTML;
		document.getElementById('ifrm').src = startUrl;

		// Add menu event listeners
		document.getElementById('topBttn').addEventListener('click', onMenuClick);
		document.getElementById('bottomBttn').addEventListener('click', onMenuClick);
		document.getElementById('menuContainer').addEventListener('click', onMenuClick);

		$ = jQuery;
		// Listen for clicks within iframe to reset inactivity timeout
		// TODO: If we load a cross-origin page, iframe clicks are no longer detectable… check with SooLing how to deal with this - we either simply disable the timeout, or set it to a very long timeout so page will eventually return to the Apps Category page - this could interrupt someone reading a page though. Actually, how are we guarding against links to dodgy pages in these party pages?
		/*
			"Failed to read the 'contentDocument' property from 'HTMLIFrameElement': Blocked a frame with origin "http://localhost" from accessing a cross-origin frame."

		*/
		$('#ifrm').load(function(){	
			console.log('iframe load');			     
		     var contents = $(this).contents(); // contents of the iframe
		     $(contents).find("html").on('click', function() { 
		     	resetTimer();
		     	console.log('iframe click detected by BasicPageBehaviour - reset timeout'); 
		     });
		 });
	};
	window.onload = function () {
		init();
		if(AdManager){
			AdManager.init();			
		}					
	};
}());