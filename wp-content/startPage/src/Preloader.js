/*global Phaser, StartPage, f */

(function () {
	
	"use strict";

	
	StartPage.gameIconsLoaded = false;
	StartPage.onGameIconLoad = function () {
		var len, i;
		StartPage.gameList = top.GameManager.getGameList();
		if(StartPage.gameList) {
			len = StartPage.gameList.length;
			for(i = 0; i < len; i++) {
				StartPage.game.load.image(StartPage.gameList[i].iconGraphic, StartPage.gameList[i].iconURL + '.png');
				StartPage.game.load.image(StartPage.gameList[i].iconGraphic + 'Title', StartPage.gameList[i].iconURL + 'Title.png');
			}
			StartPage.game.load.onLoadComplete.add(function () { StartPage.gameIconsLoaded = true; }, this);
			StartPage.game.load.start();	
		} else {
			// TODO: Rather than generating an error here, we could display a message so users aren't confronted by a black screen
			// The error is already reported via the db-interactions file
			console.error('Error: StartPage.onGameIconLoad expected at least one game')
		}		
	};	
	StartPage.Preloader = function () {

		this.preloadBar = null;
		this.ready = false;

	};

	StartPage.Preloader.prototype = {
		
		preload: function () {
			var gameList;
			this.load.bitmapFont('luckiestGuy', '../assets/LuckiestGuy/LuckiestGuy.png', '../assets/LuckiestGuy/LuckiestGuy.fnt');
			this.load.bitmapFont('chelseaMarket', '../assets/chelseaMarket/chelseaMarket.png', '../assets/chelseaMarket/chelseaMarket.fnt');

			this.load.audio('activeLoop', ['../assets/audio/bellMastera.mp3', '../assets/audio/bellMastera.ogg']);
			this.load.audio('ringTurn', ['../assets/audio/symphoidJanglesMinus8db.mp3', '../assets/audio/symphoidJanglesMinus8db.ogg']);
			this.load.audio('ringTurnTeam', ['../assets/audio/symphoidJanglesNumTeams.mp3', '../assets/audio/symphoidJanglesNumTeams.ogg']);
			this.load.audio('playerJoin', ['../assets/audio/playerJoin.mp3', '../assets/audio/playerJoin.ogg']);
			this.load.audio('showRing', ['../assets/audio/showRing.mp3', '../assets/audio/showRing.ogg']);
			this.load.audio('ringChange', ['../assets/audio/ringChange.mp3', '../assets/audio/ringChange.ogg']);
			this.load.audio('start', ['../assets/audio/start.mp3', '../assets/audio/start.ogg']);
			this.load.audio('winner', ['../assets/audio/winner.mp3', '../assets/audio/winner.ogg']);
			this.load.audio('loser', ['../assets/audio/loser.mp3', '../assets/audio/loser.ogg']);
			this.load.audio('showResults', ['../assets/audio/showResults.mp3', '../assets/audio/showResults.ogg']);	
			this.load.audio('swoosh', ['../assets/audio/swoosh.mp3', '../assets/audio/swoosh.ogg']);
			this.load.audio('bump', ['../assets/audio/bump.mp3', '../assets/audio/bump.ogg']);
			
			this.load.image('corona', '../assets/particlePink.png');

			this.load.image('bg', '../assets/bg.jpg');
			this.load.spritesheet('startBttns', '../assets/startButtons.png', 82, 82, 7);
			this.load.image('titlePlaceholder', '../../gameMenu/TitlePlaceholder.png');
			this.load.image('teamNumRing4', '../assets/trTeamNums4.png');
			this.load.image('teamNumRing3', '../assets/trTeamNums3.png');
			this.load.image('gamePlayRing', '../assets/trGamePlay.png');
			this.load.image('playBttn', '../assets/playBttn.png');
			this.load.image('drawLabel', '../assets/drawLabel.png');
			this.load.image('turnRing', '../assets/turnRing.png');	
			this.load.spritesheet('harmonicsLogo', '../assets/3rdHarmonicsLogo.png', 484, 120, 2);		
			this.load.spritesheet('pointers', '../assets/ringPointers.png', 152, 70, 2);
			this.load.spritesheet('winnerLoserLabels', '../assets/winnerLoserLabels.png', 227, 33, 2);
			this.load.spritesheet('winnerLoserTeamLabels', '../assets/winnerLoserTeamLabels.png', 224, 33, 2);
			this.load.spritesheet('ringBttns', '../assets/ringButtons.png', 179, 179, 2);
			this.load.image('resultsPanel', '../assets/resultsPanel.png');
			this.load.spritesheet('resultPlayerPanels', '../assets/resultPlayerPanels.png', 64, 82, 4);
			this.load.spritesheet('resultsBttns', '../assets/resultsButtons.png', 177, 97, 3);

			StartPage.onGameIconLoad();		
			
		},
		create: function () {

		},
		update: function () {
			if (StartPage.gameIconsLoaded) {
				this.ready = true;
				this.state.start('Game');
			}			
		}
	};
}());
