/*global window, document, volumeChangeEvent */
var HarmonicsSoundManager = (function () {

	'use strict';

	var volumeChangeEvent = new Event('volume-change'),
		volume = 10,
		newVolume = localStorage.getItem('volume')|| 10,
		pausedAudioElements,
		i,		 
		len,
		sliderBeep,
		_init = function (feedbackAudio) {
			sliderBeep = feedbackAudio;
		},		
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
			if(pausedAudioElements) {
				len = pausedAudioElements.length;
 
				for(i = 0; i < len; i++) {
					pausedAudioElements[i].play();
				}
			}			
		},
		_syncVolume = function () {
			var audioElements = getAudioElements();

			// Set volume of all audio elements to new volume value
			volume = newVolume;	
			localStorage.setItem('volume', volume);			
			
			for(i = 0; i < len; i++) {
				audioElements[i].volume = volume/10;
			}				
			// Dispatch volume change event for games
			volumeChangeEvent.detail = volume;
			window.dispatchEvent(volumeChangeEvent);
		},
		_updateVolume = function () {
			// update volume if it was adjusted while iframe was minimised
			if(volume !== newVolume) {
				// TODO: the problem with this is that there's no sound playing while volume is adjusted - so we need to add a beep to indicate current volume.	
				_syncVolume();	
			}
			playAudio();			
		},
		_setVolumeSliders = function (val) {
			var	sliders = document.getElementsByClassName('volumeSlider'),
				i, 
				len = sliders.length;

			for(i = 0; i < len; i++) {
				sliders[i].value = val;
			}
		},
		playFeedback = function () {
			if(sliderBeep) {				
				sliderBeep.volume = newVolume/10;			
				sliderBeep.currentTime = 0;
				sliderBeep.play();
			}
		},
		_changeVolume = function (val) {
			_setVolumeSliders(val);

			// Store new volume so we can apply when menu is closed			
			newVolume = parseInt(val, 10);	

			playFeedback();	
		};
	jQuery('#ifrm').ready(function(){
	     _syncVolume();
	});

	return {
		init: function (feedbackAudio) {
			return _init(feedbackAudio);
		},
		changeVolume: function (val) {
			return _changeVolume(val);
		},
		updateVolume: function () {
			return _updateVolume();
		},
		pauseAudio: function () {
			return _pauseAudio();
		},
		syncVolume: function () {
			return _syncVolume();
		},
		setVolumeSliders: function (val) {
			return _setVolumeSliders(val);
		},
		getVolume: function () {
			return volume;
		}
	};
}());