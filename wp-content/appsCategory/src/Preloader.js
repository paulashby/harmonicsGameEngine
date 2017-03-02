/*global Phaser, AppsCategory, f */

(function () {
	
	"use strict";

	
	AppsCategory.Preloader = function () {

		this.preloadBar = null;
		this.ready = false;

	};

	AppsCategory.Preloader.prototype = {
		
		preload: function () {
			// this.load.bitmapFont('luckiestGuy', '../assets/LuckiestGuy/LuckiestGuy.png', '../assets/LuckiestGuy/LuckiestGuy.fnt');

			// this.load.audio('showResults', ['../assets/audio/showResults.mp3', '../assets/audio/showResults.ogg']);	
			
			// this.load.image('corona', '../assets/particlePink.png');

			this.load.spritesheet('gears', 'wp-content/appsCategory/assets/gears.png', 460, 460, 3);

		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}
	};
}());
