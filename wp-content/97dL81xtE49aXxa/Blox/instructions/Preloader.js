/*global Phaser, Blox, f */

(function () {
	
	"use strict";
	
	Blox.Preloader = function () {

		this.preloadBar = null;

		this.ready = false;

	};

	Blox.Preloader.prototype = {

		preload: function () {
			this.load.bitmapFont('pixelCaps', '../assets/' + f.screen + '/pixelCaps/pixelCaps.png', '../assets/' + f.screen + '/pixelCaps/pixelCaps.fnt');
			this.load.bitmapFont('pixelCapsWhite', '../assets/' + f.screen + '/pixelCapsWhite/pixelCaps.png', '../assets/' + f.screen + '/pixelCapsWhite/pixelCaps.fnt');
			
			this.load.spritesheet('shimmer', '../assets/' + f.screen + '/shimmer.png', 78, 78, 13);
			// this.load.audio('logoSound', ['../assets/audio/logo.mp3', '../assets/audio/logo.ogg']);
			// this.load.spritesheet('tap', '../assets/' + f.screen + '/tap.png', f.tapHeight, f.tapHeight, 4);
			this.load.image('logo','../assets/' + f.screen + '/logo.png');
			this.load.image('pointer','../assets/' + f.screen + '/pointer.png');
			this.load.spritesheet('squares', '../assets/' + f.screen + '/squares.png', 78, 78, 17);
			this.load.spritesheet('scorePanels', '../assets/' + f.screen + '/scorePanels.png', f.scorePanelsWidth, f.scorePanelsHeight, 6);
			this.load.image('countdown','../assets/' + f.screen + '/countdown.png');
			this.load.image('tone','../assets/' + f.screen + '/tone.jpg');
			this.load.image('skipBttn','../assets/' + f.screen + '/skipBttn.png');				
			
			this.load.audio('loop', ['../assets/audio/loop.mp3']);
			this.load.audio('a3', ['../assets/audio/a3.mp3']);	
			this.load.audio('g4', ['../assets/audio/g4.mp3']);
			this.load.audio('hazardShort', ['../assets/audio/hazardShort.mp3']);
			this.load.audio('endAlert', ['../assets/audio/endAlert2.mp3']);	
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
