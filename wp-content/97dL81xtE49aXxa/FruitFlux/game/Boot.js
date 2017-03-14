/*global Phaser, FruitFlux, VTAPI, window */

var FruitFlux = {}, // game elements in here
f = {
	findWithAttr: function (array, attr, value) {
	
		"use strict";	
	
		var i,
		len = array.length;
		for(i = 0; i < len; i += 1) {
			if(array[i] && array[i][attr] === value) {
				return i;
			}
		}
	}
}; 


(function () {
	
	"use strict";	
	
	var maxPlayers = 8,	
	assetListing,	
	numPanels,
	len,
	i,
	// API integration /////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////
	player = {
		updateScore: function () {
			this.score[f.level] += f.SCORE_VAL * (f.level + 1);
			if(!f.freePlay){
				f.teams[this.team].score[f.level] += f.SCORE_VAL * (f.level + 1);
			}
		}
	},
	mapPlaces = (function () {
		// API numbers places differently to sytem used in game
		// returns place mapping function
		var gameToAPI = {0: 3, 1: 2, 2: 1, 3: 4, 4: 6, 5: 7, 6: 8, 7: 5}, 
		apiToGame = {}, 
		i;
		for(i=0; i < maxPlayers; i++) {
			apiToGame[gameToAPI[i]] = i;
		}
		return function (placeNum, APItoGame) {
			// returns placeNum's corresponding number in mapping determined by APItoGame boolean
			var mapOb = APItoGame ? apiToGame : gameToAPI;
			if(mapOb.hasOwnProperty(placeNum)) {
				return mapOb[placeNum];
			}
			console.error('mapPlaces: place with given number does not exist');
		};
	}()),	
	apiRawData = VTAPI.getPlayersInformation(),
	insertPlayer = function (i) {
		var rawDataIndex = f.findWithAttr(apiRawData, 'place', mapPlaces(i)),
		apiPlayer,
		currPlayer,
		fTeam,
		currPlayerTeam;

		if(typeof rawDataIndex === 'number') {			
			apiPlayer = apiRawData[rawDataIndex];
			currPlayer = Object.create(player);
			currPlayer.name = 'player ' + apiPlayer.player;
			currPlayer.playerNum = apiPlayer.player;
			currPlayer.place = apiPlayer.place;
			currPlayer.score = [0,0,0];
			currPlayerTeam = apiPlayer.team;
			f.numPlayers++;

			if(currPlayerTeam !== undefined) {
				currPlayerTeam --; // zero indexed
				currPlayer.team = currPlayerTeam;
				f.teams = f.teams || [];
				fTeam = f.teams[currPlayerTeam];
				if(!fTeam) {
					fTeam = {members: [], score: [0, 0, 0]};
					f.teams[currPlayer.team] = fTeam;
				}
				fTeam.members.push(apiPlayer.player);				
			}
		} else {
			currPlayer  = null;
		}
		return currPlayer;
	};

	f.players = [];	
	f.numPlayers = 0;
	for (i = 0; i < maxPlayers; i++) {
		f.players[i] = insertPlayer(i);
	}
	
	// API integration End /////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////
	
	// How many fingers required for gestures?
	f.POINTERS_PER_PLAYER = 1;
	f.MAX_PLAYERS = maxPlayers; 
	
	// How far apart do inputs need to be to be regarded as being from different players 
	// Say 3". Tables are 42" and 50". Split diff = 46", so tolerance is screen width *0.065;
	f.CONSECUTIVE_PLAYER_NUMS = true;
	f.DAMPING_PERCENT_OF_WIDTH = 0.065;
	f.SMALL_SCALE = 0.53;
	f.VARIETIES = 8;
	f.FRUIT_PER_COLUMN = 14;
	f.FRUIT_SCALE = 0.7;
	f.FRUIT_FLUX_DURATION = 400;
	f.FRUIT_TWEEN_DELAY = 100;
	f.GROUP_TWEEN_DELAY = (f.FRUIT_TWEEN_DELAY * f.FRUIT_PER_COLUMN) + f.FRUIT_FLUX_DURATION;
	f.FRUIT_TWEEN_DURATION = f.FRUIT_FLUX_DURATION/6;
	f.FLUX_INTERVALS = [1000 + f.FRUIT_FLUX_DURATION, 500 + f.FRUIT_FLUX_DURATION, f.FRUIT_FLUX_DURATION];
	f.REASSIGNMENT_INTERVALS = [5500, 3500, 2200]; 
	f.SCORE_VAL = 5;
	f.SCORE_PANEL_FRAMES = 6;
	f.SCORE_PANELS_OFFSET_V = 40;
	f.NUM_LEVELS = 3;
	f.LEVEL_DURATION = 60000;
	f.PANEL_DELAY = 750;// Allow fruit and scores to get out of the way
	f.LEVEL_PANEL_DELAY = 500;// Show level over before scores
	f.SCORE_PANEL_DELAY = 100;// stagger timing of panels
	f.COUNTDOWN_DELAY = 600;// Adjust arrival of countdown to coincide with removal of panels
	f.NUM_COUNTDOWN_FRUIT = 3;
	f.FINAL_RESULTS_DUR = 2000;
	
	f.fruitAllocation = [];
	f.freePlay = !f.teams;
	numPanels = f.freePlay ? f.players.length : f.teams.length;	
	f.levelBreakDuration = 2000 + (200 * numPanels);
	f.mapPlaces = mapPlaces; // game also needs this function
	
	f.srx = Math.max(window.innerWidth,window.innerHeight);
	f.sry = Math.min(window.innerWidth,window.innerHeight);

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	// assign fruitWidth now so we can use it to compute value of fruitSheetwidth in assetListing array
	// it gets overwritten by assignAssetSizes()
	f.fruitWidth = Math.floor(f.logicHeight / f.VARIETIES);//135
	
	assetListing = [		
		['fruitWidth', f.fruitWidth],
		['fruitSheetWidth', f.fruitWidth * (f.VARIETIES + 1)],
		['homeZonesWidth', 184],
		['homeZonesSheetWidth', 1472],
		['scorePanelsWidth', 225],
		['scorePanelsHeight', 45] 
	];

	f.gameWidth = 1920;
	f.gameHeight = f.gameWidth/f.aspectRatio;

	f.dampingRange = f.gameWidth * f.DAMPING_PERCENT_OF_WIDTH;

	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);
	
	// For panels which pop up at end of level
	f.SCORE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/72);
	f.TITLE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/50);
	
	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;

	len = assetListing.length;

	for (i = 0; i < len; i++){
		f[ assetListing[i][0] ] = Math.floor(assetListing[i][1]);			
	}
	
	FruitFlux.Boot = function () {

	};

	FruitFlux.Boot.prototype = {

	    init: function () {
		
			var i;

			this.input.maxPointers = f.numPlayers * f.POINTERS_PER_PLAYER;
			
			for(i = 0; i < this.input.maxPointers; i++){
				this.game.input.addPointer();
			}

	        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
	        this.stage.disableVisibilityChange = true;

	        //this.scale.pageAlignVertically = true;
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			
			this.game.stage.backgroundColor = 0x000f46;

	    },

	    preload: function () {	       

	    },

	    create: function () {

	        //  Preloader assets loaded to the cache
	        //  Start the real preloader going
	        this.state.start('Preloader');
	    }

	};
}());