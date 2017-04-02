/*global window */
var AdManager = (function () {

	'use strict';

	var 
	AdManagerException = function (funcName, message) {
	   this.name = funcName;
	   this.message = message;	   
	},
	cycle = false,
	adState = [],
	numAds,
	adURLs,
	_init = function () {		
		var adData = JSON.parse(document.getElementById('ads').dataset.adstate),
		adDiv = document.getElementById('ads'),
		numAds = adData.numAds,		
		adURLs = adData.adURLs,
		cycle = adData.cycle,
		currImg,
		currURL,
		endIndex,
		i;

		// #ads div is currently populated with transparent placeholder images
		// Replace those with the ad images
		// Have deferred this till now so start page can load without competing for bandwidth
		switch(numAds) {
			case 1:
			// Load one version of ad for each side of the table
			for(i = 0; i < 4; i++) {
				currImg = adDiv.children[i];
				currURL = adURLs[i];
				if(currImg && currURL) {
					currImg.src = currURL;
				} else {
					throw new AdManagerException('init', 'unexpected number of images or URLs');
				}
			}
			break;

			case 3:
			// Load three ads to go along each of the long sides of the table
			// plus one for each end which will be cycled
			endIndex = adURLs.length - 1;
			for(i = 0; i < 8; i++) {
				currImg = adDiv.children[i];
				
				if(currImg){
					if(i < 3){
						currURL = adURLs[i];
						if(currURL) {
							currImg.src = currURL;	
						} else {
							throw new AdManagerException('init', 'unexpected number of URLs');	
						}
							
					} else if (i > 4){
						currURL = adURLs[endIndex - i];
						if(currURL) {
							currImg.src = currURL;
						} else {
							throw new AdManagerException('init', 'unexpected number of URLs');	
						}
						
					} else {
						currURL = adURLs[0];
						if(currURL) {
							currImg.src = adURLs[0];
						} else {
							throw new AdManagerException('init', 'unexpected number of URLs');	
						}
					}
					
				} else {
					throw new AdManagerException('init', 'unexpected number of images');
				}
			}
			break;
			
			default:
			// Two ads on each side of the table - 
			// If there are more than two ads, all will cycle (cycling is taken care of elsewhere)
			// We're only intersted in loading the images here
			for(i = 0; i < 8; i++) {
				currImg = adDiv.children[i];				
				if(i < 4) {
					currURL = adURLs[i % 2];	
				} else {
					// currURL = adURLs[(i%2)+1];
					currURL = adURLs[(i-1) % 2];
				}
				
				if(currImg && currURL){
					currImg.src = currURL;
				} else {
					throw new AdManagerException('init', 'unexpected number of images or URLs');
				}
			}
		}
	},
	_cycleAds = function () {
		// Check whether we should be cycling
		if(cycle) {

		}
	};



	return {
		init: function () {
			_init();
		},
		cycleAds: function () {
			_cycleAds();
		}		
	};
}());