/*global window, clearTimeout, Event, document, AdManager, top, setTimeout, localStorage, jQuery */
var BasicPageBehaviour = (function () {

	'use strict';

	// TODO: Rename both this document and its function as ContentManager?
	
	var
	inactivity_period,
	inactivityTimeout,
	onTimeout,
	resetTimer,
	pauseEvent = new Event('pause'),	
	exitEvent = new Event('exit'),	
	startUrl,
	dburl,
	homeURL,
	loginTimeoutURL,
	iframeHTML,
	onMenuClick = function (e) {
		var ifrm = document.getElementById('ifrm'),
		menu = document.getElementById('menuContainer'),
		adDiv = document.getElementById('ads'),
		hideMenu = function () {
			if(ifrm.classList.contains('showMenu')) {
				// We're hiding the menu, so focus ifrm
				ifrm.focus();

				HarmonicsSoundManager.updateVolume();

				// update the ads
				AdManager.cycleAds();
			} else {
				HarmonicsSoundManager.pauseAudio();
			}
			ifrm.classList.toggle('hideMenu');
			ifrm.classList.toggle('showMenu');
			menu.classList.toggle('hideMenu');
			if(adDiv){
				adDiv.classList.toggle('showAds');
				adDiv.classList.toggle('hideAds');
			}
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
	_apiCall = function (url) {

		return new Promise(function(resolve, reject) {
			
			var req = new XMLHttpRequest();
			req.open('GET', url);

			req.onload = function() {
				// This is called even on 404 etc
				// so check the status
				if (req.status === 200) {
					// Resolve the promise with the response text
					resolve(req.response);
				}
				else {
					// Otherwise reject with the status text
					reject(new Error(req.statusText));
				}
			};
			// Handle network errors
			req.onerror = function() {
				reject(new Error("Network Error"));
			};
			// Make the request
			req.send();
		});
	},
	init = function () {
		var logoutLinks = document.getElementsByClassName('logout'),
		templateDirURL = document.body.dataset.templateurl,
		container,
		volume,
		$,
		i,
		len;

		HarmonicsSoundManager.init(document.getElementById('volfeedback'));
		volume = HarmonicsSoundManager.getVolume();
		HarmonicsSoundManager.setVolumeSliders(volume);

		iframeHTML = document.getElementById('ifrm').outerHTML;

		startUrl = document.body.dataset.starturl;		
		homeURL = document.getElementById('ifrm').dataset.servicesurl;
		dburl = dburl || document.body.dataset.db;
		loginTimeoutURL = document.getElementById('ifrm').dataset.logintimeouturl;
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
		localStorage.setItem('loginTimeoutURL', loginTimeoutURL);
		localStorage.setItem('inactivityTimeout', inactivity_period);		

		len = logoutLinks.length;
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
		// TODO: If we ever include one a cross-origin page, iframe clicks will not be detectable. We should disable the timeout, or make it very long so page will eventually return to the Apps Category page - this could interrupt someone reading a page though. Actually, how are we guarding against links to dodgy pages in these party pages?
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
		if(window.ErrorManager){
			ErrorManager.init(BasicPageBehaviour);
		}	
		if(window.AdManager){
			AdManager.init();			
		}		
	};

	return {
		
		apiCall: function (url) {
			return _apiCall(url);
		}
	}
}());