/*global Phaser, Aura, f */

(function () {
	
	"use strict";
	
	Aura.Preloader = function () {

		this.preloadBar = null;

		this.ready = false;

	};

	Aura.Preloader.prototype = {

		preload: function () {

			this.load.bitmapFont('summercamp', '../assets/' + f.screen + '/summercamp/summercamp.png', '../assets/' + f.screen + '/summercamp/summercamp.fnt');
			
			this.load.audio('halo', ['../assets/audio/halo.mp3', '../assets/audio/halo.ogg']);
			this.load.audio('ambientLoop', ['../assets/audio/ambientLoop.mp3', '../assets/audio/ambientLoop.ogg']);
			this.load.audio('scoreTransfer', ['../assets/audio/scoreTransfer.mp3', '../assets/audio/scoreTransfer.ogg']);
			this.load.audio('zap', ['../assets/audio/zap.mp3', '../assets/audio/zap.ogg']);
			this.load.audio('capture', ['../assets/audio/capture.mp3', '../assets/audio/capture.ogg']);
			this.load.audio('countdown', ['../assets/audio/countdown.mp3', '../assets/audio/countdown.ogg']);

			this.load.image('bg','../assets/' + f.screen + '/bgFade.jpg');
			this.load.image('disc','../assets/' + f.screen + '/disc.png');
			this.load.spritesheet('halo', '../assets/' + f.screen + '/discHalo.png', f.discHaloWH, f.discHaloWH, 8);
			this.load.image('hzbg', '../assets/' + f.screen + '/homeZoneBG.png');
			this.load.spritesheet('hzfg', '../assets/' + f.screen + '/homeZoneFG.png', f.hzfgWH, f.hzfgWH, 7);
			this.load.spritesheet('countdown', '../assets/' + f.screen + '/countdownSheet.png', f.countdownW, f.countdownH, 5);
			this.load.image('zap', '../assets/' + f.screen + '/zap.png');
			this.load.image('logo', '../assets/' + f.screen + '/logo.png');	
			this.load.spritesheet('tap', '../assets/' + f.screen + '/tap.png', f.tapHeight, f.tapHeight, 4);		
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
