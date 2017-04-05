/*global window, document*/
var AdManager = (function () {

	'use strict';

	var 
	AdManagerException = function (funcName, message) {
	   this.name = funcName;
	   this.message = message;	   
	},
	numAds,
	adURLs,
	cycleOffset = 1,
	adState = (function () {
		// adState will track assignment of ads to DOM img elements
		var state = [],
		canCycle = false,
		_addEntry = function (img, urlIndex) {
			state.push({domImage: img, currURLindex: urlIndex});
		},
		_cycle = function () {
			var i,
				len = state.length,
				currEntry;

			for(i = 0; i < len; i++) {
				currEntry = state[i];
				currEntry.currURLindex = (currEntry.currURLindex + cycleOffset) % numAds;
				currEntry.domImage.src = adURLs[currEntry.currURLindex];
			}
		};

		return {
			addEntry: function (img, urlIndex) {
				_addEntry(img, urlIndex);
			},
			setCycleMode: function (cycleMode) {
				canCycle = cycleMode;
			},
			cycle: function () {
				if(canCycle) {
					_cycle();	
				}				
			}
		}
	})(),
	_init = function () {		
		var adData = JSON.parse(document.getElementById('ads').dataset.adstate),
		adDiv = document.getElementById('ads'),		
		currImg,
		currURLindex,
		currURL,
		i;

		if(adData) {
			numAds = adData.numAds;		
			adURLs = adData.adURLs;
			adState.setCycleMode(adData.cycle);	
		} else {
			numAds = 0;
			return;
		}

		// Replace transparent placeholder images in #ads div with live ad images
		// Have deferred this till now so start page can load without ads competing for bandwidth
		
		if(numAds === 1) {
			// Load one version of ad for each side of the table
			for(i = 0; i < 4; i++) {
				currImg = adDiv.children[i];
				currURLindex = i % numAds;
				currURL = adURLs[currURLindex];
				if(currImg && currURL) {
					currImg.src = currURL;
					// create entry in adState
					adState.addEntry(currImg, currURLindex);
				} else {
					throw new AdManagerException('init', 'unexpected number of images or URLs');
				}
			}
		} else {
			// Two ads on each side of the table - 
			cycleOffset = 2; // show the next two when we cycle
			for(i = 0; i < 8; i++) {
				currImg = adDiv.children[i];				
				if(i < 4) {
					currURLindex = i % 2;
					currURL = adURLs[currURLindex];	
				} else {
					currURLindex = (i-1) % 2;
					currURL = adURLs[currURLindex];
				}				
				if(currImg && currURL){
					currImg.src = currURL;
					// create entry in adState
					adState.addEntry(currImg, currURLindex);
				} else {
					throw new AdManagerException('init', 'unexpected number of images or URLs');
				}
			}
		}
	},
	_cycleAds = function () {
		adState.cycle();
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