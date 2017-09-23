/*global Phaser, Prisma, f */

/*global Phaser, Prisma, f */

(function () {
	
	"use strict";
	
	Prisma.Preloader = function () {

		this.preloadBar = null;

		this.ready = false;

	};

	Prisma.Preloader.prototype = {

		preload: function () {

			this.load.bitmapFont('alphamale', '../assets/' + f.screen + '/alphamale/alphamale.png', '../assets/' + f.screen + '/alphamale/alphamale.fnt');
			
			this.load.audio('ray', ['../assets/audio/ray.mp3', 'assets/audio/ray.ogg']);
			this.load.audio('panelIn', ['../assets/audio/panelIn.mp3', 'assets/audio/panelIn.ogg']);
			this.load.audio('countdown', ['../assets/audio/countdown.mp3', 'assets/audio/countdown.ogg']);
			this.load.audio('ambientLoop', ['../assets/audio/ambientLoop.mp3', 'assets/audio/ambientLoop.ogg']);
			this.load.audio('prismRotate', ['../assets/audio/prismRotate.mp3', 'assets/audio/prismRotate.ogg']);
			this.load.audio('prismHit', ['../assets/audio/prismHit.mp3', 'assets/audio/prismHit.ogg']);
			this.load.audio('fire', ['../assets/audio/shots_1.mp3', 'assets/audio/shots_1.ogg']);
			this.load.audio('beat', ['../assets/audio/beat.mp3', 'assets/audio/beat.ogg']);
			this.load.audio('woosh', ['../assets/audio/woosh.mp3', 'assets/audio/woosh.ogg']);
			this.load.audio('score', ['../assets/audio/score.mp3', 'assets/audio/score.ogg']);
			this.load.audio('collectLoop', ['../assets/audio/collectLoop.mp3', 'assets/audio/collectLoop.ogg']);
			this.load.audio('collect', ['../assets/audio/collect.mp3', 'assets/audio/collect.ogg']);
			this.load.audio('blast', ['../assets/audio/zap.mp3', 'assets/audio/zap.ogg']);
		
			this.load.spritesheet('scorePanels', '../assets/' + f.screen + '/scorePanels.png', f.scorePanelsWidth, f.scorePanelsHeight, 6);
			this.load.spritesheet('rainbow', '../assets/' + f.screen + '/rainbow.png', f.rainbowWH, f.rainbowWH, 2);
			this.load.image('bg','../assets/' + f.screen + '/bgFade.jpg');
			this.load.image('countdown','../assets/' + f.screen + '/countdown.png');
			this.load.spritesheet('hzbg', '../assets/' + f.screen + '/homeZoneBG.png', f.homeZoneBGWidth, f.homeZoneBGHeight, 6);
			this.load.image('shuttle','../assets/' + f.screen + '/shuttle.png');
			this.load.spritesheet('prism','../assets/' + f.screen + '/prism.png', f.prismWidth, f.prismHeight, 2);
			this.load.spritesheet('prismGlow','../assets/' + f.screen + '/prismGlow.png', f.prismGlowWidth, f.prismGlowHeight, 2);
			this.load.image('ray','../assets/' + f.screen + '/ray.png');
			this.load.image('hotSpot','../assets/' + f.screen + '/hotSpot.png');
			this.load.spritesheet('zap', '../assets/' + f.screen + '/zap.png', f.zapHeight, f.zapHeight, 2);
			this.load.spritesheet('splinter', '../assets/' + f.screen + '/splinter.png', f.splinterHeight, f.splinterHeight, 7);
		},
		create: function () {

		},
		update: function () {
			this.ready = true;
			this.state.start('Game');
		}

	};
}());
