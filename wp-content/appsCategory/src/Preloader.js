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
			
			this.load.image('buttonBG', 'wp-content/appsCategory/assets/buttonBG.png');
			this.load.image('services', 'wp-content/appsCategory/assets/services.png');
			this.load.image('games', 'wp-content/appsCategory/assets/games.png');
			this.load.image('cardgames', 'wp-content/appsCategory/assets/cardgames.png');
			this.load.image('whiteboard', 'wp-content/appsCategory/assets/whiteboard.png');

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
