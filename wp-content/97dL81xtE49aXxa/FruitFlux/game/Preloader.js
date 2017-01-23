/*global Phaser, FruitFlux, f */

(function () {
	
	"use strict";
	
	FruitFlux.Preloader = function () {

		this.preloadBar = null;

		this.ready = false;

	};

	FruitFlux.Preloader.prototype = {

		preload: function () {

			this.load.bitmapFont('passion', '../assets/large/passion/passion.png', '../assets/large/passion/passion.fnt');
			this.load.bitmapFont('luckiestGuy', '../assets/large/luckiestGuy/luckiestGuy.png', '../assets/large/luckiestGuy/luckiestGuy.fnt');
			this.load.audio('banana', ['../assets/audio/banana.mp3', '../assets/audio/banana.ogg']);
			this.load.audio('blueberry', ['../assets/audio/blueberry.mp3', '../assets/audio/blueberry.ogg']);
			this.load.audio('cherry', ['../assets/audio/cherry.mp3', '../assets/audio/cherry.ogg']);
			this.load.audio('lemon', ['../assets/audio/lemon.mp3', '../assets/audio/lemon.ogg']);
			this.load.audio('orange', ['../assets/audio/orange.mp3', '../assets/audio/orange.ogg']);
			this.load.audio('plum', ['../assets/audio/plum.mp3', '../assets/audio/plum.ogg']);
			this.load.audio('strawberry', ['../assets/audio/strawberry.mp3', '../assets/audio/strawberry.ogg']);
			this.load.audio('watermelon', ['../assets/audio/watermelon.mp3', '../assets/audio/watermelon.ogg']);
			this.load.audio('flux', ['../assets/audio/flux.mp3', '../assets/audio/flux.ogg']);
			this.load.audio('reassign', ['../assets/audio/reassign.mp3', '../assets/audio/reassign.ogg']);
			this.load.audio('powerDown', ['../assets/audio/powerDown.mp3', '../assets/audio/powerDown.ogg']);
			this.load.audio('panelUp', ['../assets/audio/panelUp.mp3', '../assets/audio/panelUp.ogg']);
			this.load.audio('countdown', ['../assets/audio/countdown.mp3', '../assets/audio/countdown.ogg']);
			this.load.spritesheet('fruit', '../assets/large/fruitSheet.png', f.fruitWidth, f.fruitWidth, f.VARIETIES + 1); // + 1 as sheet has extra frame for onTap()
			this.load.spritesheet('homeZones', '../assets/large/homeZones.png', f.homeZonesWidth, f.homeZonesWidth, f.VARIETIES);
			this.load.spritesheet('scorePanels', '../assets/large/scorePanels.png', f.scorePanelsWidth, f.scorePanelsHeight, 6);
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}
	};

}());
