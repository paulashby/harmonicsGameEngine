/*global window, document, volumeChangeEvent */
var HarmonicsSoundManager = (function () {

	'use strict';
	
	var volumeChangeEvent = new Event('volume-change'),
		volume = 10,
		newVolume = 10,
		pausedAudioElements,
		i,		 
		len,
		getAudioElements = function () {
			// Get all instances of audio and video in iframe page
			var ifrmDoc = document.getElementById('ifrm').contentDocument,
				audioElements = Array.prototype.slice.call(ifrmDoc.getElementsByTagName("audio"), 0);

				audioElements.concat(Array.prototype.slice.call(ifrmDoc.getElementsByTagName("video"), 0));
				len = audioElements.length;

				return audioElements;
		},
		_pauseAudio = function () {
			var audioElements = getAudioElements(),
				currEl;

			pausedAudioElements = [];

			// Pause all audio 
			for(i = 0; i < len; i++) {
				currEl = audioElements[i];
				if(! currEl.paused) {
					currEl.pause();

					// Add to pausedAudioElements so we can unpause only those elements which were originally playing
					pausedAudioElements.push(currEl);
				}				
			}
		},
		playAudio = function () {

			// restart all paused audio we earlier paused
			len = pausedAudioElements.length;
 
			for(i = 0; i < len; i++) {
				pausedAudioElements[i].play();
			}
		},
		_updateVolume = function () {
			var audioElements; 

			// update volume if it was adjusted while iframe was minimised
			if(volume !== newVolume) {
				// TODO: the problem with this is that there's no sound playing while volume is adjusted - so we need to add a beep to indicate current volume.			
				
				audioElements = getAudioElements();

				// Set volume of all audio elements to new volume value
				volume = newVolume;				
				
				for(i = 0; i < len; i++) {
					audioElements[i].volume = volume/10;
				}				
				// Dispatch volume change event for games
				volumeChangeEvent.detail = volume;
				window.dispatchEvent(volumeChangeEvent);	
			}
			playAudio();			
		},
		_changeVolume = function (val) {
			// Store new volume so we can apply when menu is closed
			newVolume = parseInt(val, 10);		
		};

	return {
		changeVolume: function (val) {
			return _changeVolume(val);
		},
		updateVolume: function () {
			return _updateVolume();
		},
		pauseAudio: function () {
			return _pauseAudio();
		}
	};
}());