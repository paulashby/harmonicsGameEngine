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
			this.load.audio('discDiscColl', ['../assets/audio/discDiscColl.mp3', '../assets/audio/discDiscColl.ogg']);
			this.load.audio('bounce', ['../assets/audio/bounce.mp3', '../assets/audio/bounce.ogg']);
			this.load.audio('zap', ['../assets/audio/zap.mp3', '../assets/audio/zap.ogg']);
			this.load.audio('spiral', ['../assets/audio/spiral.mp3', '../assets/audio/spiral.ogg']);
			this.load.audio('capture', ['../assets/audio/capture.mp3', '../assets/audio/capture.ogg']);
			this.load.audio('countdown', ['../assets/audio/countdown.mp3', '../assets/audio/countdown.ogg']);
			this.load.audio('addDisc', ['../assets/audio/addDisc.mp3', '../assets/audio/addDisc.ogg']);
			this.load.audio('panel', ['../assets/audio/panel.mp3', '../assets/audio/panel.ogg']);
			this.load.audio('levelOver', ['../assets/audio/levelOver.mp3', '../assets/audio/levelOver.ogg']);
			this.load.audio('ready', ['../assets/audio/ready.mp3', '../assets/audio/ready.ogg']);
			this.load.audio('spiralBubble', ['../assets/audio/spiralBubble.mp3', '../assets/audio/spiralBubble.ogg']);
			this.load.audio('spiralScore', ['../assets/audio/spiralScore.mp3', '../assets/audio/spiralScore.ogg']);
			this.load.audio('endLevKlaxon', ['../assets/audio/endLevKlaxon.mp3', '../assets/audio/endLevKlaxon.ogg']);
		
			this.load.spritesheet('scorePanels', '../assets/' + f.screen + '/scorePanels.png', f.scorePanelsWidth, f.scorePanelsHeight, 8);

			this.load.spritesheet('halo', '../assets/' + f.screen + '/discHalo.png', f.discHaloWH, f.discHaloWH, 8);

			this.load.image('bg','../assets/' + f.screen + '/bgFade.jpg');
			this.load.image('disc','../assets/' + f.screen + '/disc.png');
			this.load.image('hzbg', '../assets/' + f.screen + '/homeZoneBG.png');
			this.load.spritesheet('hzfg', '../assets/' + f.screen + '/homeZoneFG.png', f.hzfgWH, f.hzfgWH, 9);
			this.load.spritesheet('countdown', '../assets/' + f.screen + '/countdownSheet.png', f.countdownW, f.countdownH, 5);
			this.load.image('zap', '../assets/' + f.screen + '/zap.png');
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
