/*global Phaser, Blox, f */

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
			
			this.load.spritesheet('squares', '../assets/' + f.screen + '/squares.png', 78, 78, 17);
			this.load.spritesheet('shimmer', '../assets/' + f.screen + '/shimmer.png', 78, 78, 13);
			this.load.spritesheet('scorePanels', '../assets/' + f.screen + '/scorePanels.png', f.scorePanelsWidth, f.scorePanelsHeight, 6);
			this.load.image('countdown','../assets/' + f.screen + '/countdown.png');
			this.load.image('tone','../assets/' + f.screen + '/tone.jpg');

			this.load.audio('g2', ['../assets/audio/g2.mp3']);
			this.load.audio('b2', ['../assets/audio/b2.mp3']);
			this.load.audio('d3', ['../assets/audio/d3.mp3']);
			this.load.audio('f3', ['../assets/audio/f3.mp3']);
			this.load.audio('a3', ['../assets/audio/a3.mp3']);
			this.load.audio('c4', ['../assets/audio/c4.mp3']);
			this.load.audio('e4', ['../assets/audio/e4.mp3']);
			this.load.audio('g4', ['../assets/audio/g4.mp3']);
			this.load.audio('bonus', ['../assets/audio/bonus.mp3']);
			this.load.audio('hazard', ['../assets/audio/hazard.mp3']);
			this.load.audio('hazardShort', ['../assets/audio/hazardShort.mp3']);
			this.load.audio('endAlert', ['../assets/audio/endAlert2.mp3']);
			this.load.audio('loop', ['../assets/audio/loop.mp3']);
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
