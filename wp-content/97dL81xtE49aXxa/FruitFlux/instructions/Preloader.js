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
			this.load.audio('strawberry', ['../assets/audio/strawberry.mp3', '../assets/audio/strawberry.ogg']);
			this.load.audio('logoSound', ['../assets/audio/logo.mp3', '../assets/audio/logo.ogg']);
			this.load.audio('panelUp', ['../assets/audio/panelUp.mp3', '../assets/audio/panelUp.ogg']);
			this.load.audio('countdown', ['../assets/audio/countdown.mp3', '../assets/audio/countdown.ogg']);
			this.load.audio('pointer', ['../assets/audio/pointer.mp3', '../assets/audio/pointer.ogg']);
			this.load.spritesheet('fruit', '../assets/large/fruitSheet.png', f.fruitWidth, f.fruitWidth, f.VARIETIES + 1); // + 1 as sheet has extra frame for onTap()
			this.load.spritesheet('homeZones', '../assets/large/homeZones.png', f.homeZonesWidth, f.homeZonesWidth, f.VARIETIES);
			this.load.spritesheet('tap', '../assets/large/tap.png', f.tapHeight, f.tapHeight, 4);
			this.load.image('logo','../assets/large/logo.png');
			this.load.image('checkFruit','../assets/large/checkFruit.png');
			this.load.image('tapScore','../assets/large/tapScore.png');
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
