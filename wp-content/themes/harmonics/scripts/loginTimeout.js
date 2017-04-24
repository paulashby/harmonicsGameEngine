/*global document, top, clearTimeout, localStorage, setTimeout */
var loginTimeout = (function () {	

	'use strict';

	var 
	INACTIVITY_PERIOD = localStorage.getItem('inactivityTimeout'),
	homeURL = localStorage.getItem('homeURL'),
	inactivityTimeout,
	onTimeout,
	resetTimer;

	// INACTIVITY_PERIOD & homeURL will be available from first time 
	// machine loads games page until the browser cache is cleared
    if(INACTIVITY_PERIOD && homeURL) {
    	onTimeout = function () {
		  top.location.href = homeURL;
		};
		resetTimer = function (e) {		  
		  clearTimeout(inactivityTimeout);    
		  inactivityTimeout = setTimeout(onTimeout, INACTIVITY_PERIOD);
		}; 
		document.addEventListener("click", resetTimer, false);
		document.addEventListener("touchend", resetTimer, false);
		document.addEventListener("keypress", resetTimer, false);
		resetTimer();   	
    }
}());