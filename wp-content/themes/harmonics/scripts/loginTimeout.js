/*global document, top, clearTimeout, localStorage, setTimeout */
var loginTimeout = (function () {	

	/*
	 * Sets the timeout for the login page - once INACTIVITY_PERIOD has expired, homeURL will be loaded
	*/

	'use strict';

	var 
	MIN_INACTIVITY_PERIOD = 15000, // Prevent ridiculously short timeout
	INACTIVITY_PERIOD = localStorage.getItem('inactivityTimeout'),
	homeURL = localStorage.getItem('homeURL'),
	loginTimeoutURL = localStorage.getItem('loginTimeoutURL'),
	inactivityTimeout,
	onTimeout,
	resetTimer;

	if(INACTIVITY_PERIOD && homeURL) {

    	INACTIVITY_PERIOD = Math.max(MIN_INACTIVITY_PERIOD, parseInt(INACTIVITY_PERIOD, 10));    	

    		onTimeout = function () {
    			var timeoutURL = loginTimeoutURL || window.location.href;
    			top.location.href = timeoutURL;
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