/*global Phaser, FruitFlux, f, document, window, harmonicsAPI */

var FruitFlux = {}, // game elements in here
f = {};


(function () {
	
	"use strict";	
	
	// store asset dimensions as key/value pairs
	// Using production screen size for value
	var assetListing,
	len,
	i,
	j,	
	player = {
		updateScore: function () {
			this.score[f.level] += f.SCORE_VAL * (f.level + 1);
			if(!f.freePlay){
				f.teams[this.team].score[f.level] += f.SCORE_VAL * (f.level + 1);
			}
		}
	},
	playerNum = 1, // Used when setting the playerNum property of the player objects (the property is used only when displaying scores)
	numPanels,
	// API_ var standing in for data passed by API
	API_players = ['null', 'Graham', 'John', 'TerryG', 'null', 'TerryJ', 'Eric', 'Michael'],
	API_teams = [
		// This should be any empty Array if no teams
		{members: [3, 5, 7], score: 0},
		{members: [1, 2, 6], score: 0},
		{members: [0, 4], score: 0}
	];
	
	// if(f.apiTest.runAsTest){
	// 	gameAPI.startTest('Victor', 'victortan1', true);		
	// };

	// Allows us to augment types
	Function.prototype.method = function (name, func) {
		if(! this.prototype.hasOwnProperty(name)){
			this.prototype[name] = func;
			return this;
		}
	};
	// Allows us to create new objects based
	// on the prototype of exisiting objects
	if (typeof Object.create !== 'function') {
		Object.create = function (o) {
			var F = function () {};
			F.prototype = o;
			return new F();
		};
	}	
	
	// Add Fisher-Yates shuffle() method to Array type
	Array.method('shuffle', function () {
	  var currentIndex = this.length, temporaryValue, randomIndex;

	  // While there remain elements to shuffle...
	  while (0 !== currentIndex) {

	    // Pick a remaining element...
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex -= 1;

	    // And swap it with the current element.
	    temporaryValue = this[currentIndex];
	    this[currentIndex] = this[randomIndex];
	    this[randomIndex] = temporaryValue;
	  }
	});	
	
	// How many fingers required for gestures?
	f.POINTERS_PER_PLAYER = 1;
	f.MAX_PLAYERS = 8; 
	
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
	f.NUM_LEVELS = 1;
	f.NUM_DEMO_CLICKS = 2;
	
	f.LEVEL_DURATION = 8500;
	
	f.PANEL_DELAY = 750;// Allow fruit and scores to get out of the way
	f.LEVEL_PANEL_DELAY = 500;// Show level over before scores
	f.SCORE_PANEL_DELAY = 100;// stagger timing of panels
	f.COUNTDOWN_DELAY = 60;// Schedules start of countdown - not used in instructions
	// f.levelBreakDuration set below - after f.players array is initialised
	f.NUM_COUNTDOWN_FRUIT = 3;
	f.PAUSE_FOR_COUNTDOWN = 4000;
	
	f.players = [];
	f.fruitAllocation = [];
	
	
	function getTeam (playerNum) {
		var i;
		// Return team number if this player is in a team
		for(i = 0; i < f.teams.length; i++){
			if(f.teams[i].members.indexOf(playerNum) !== -1){
				return i;
			}			
		}
		return false;
	}
	
	/*
		Challenge - 
		can't distinguish between multiple fingers of same player and 
		tightly bunched taps from multiple players.		
		
		let's look at each game:
		Fruit Flux:
		the fruit gets collected, so no biggie
		
		Disc: Defensive taps affected.		
		
		Rainbox Stripes: Taps outside home zone affected.
		
		For the above two scenarios, set a v short timer, disabling taps in 
		close proximity. The distance should probably be approx separation
		of three fingers... will have to refine, but building it in at
		this stage will allow us to tweak the constant	
		
		f.dampingRange	
		  
	*/
	
	// Data from API: ///////////////////////
	// Player name, position
	// Let's assume for now it's organised as an array with null entries for empty zones
	//f.players = [null, 'Graham', 'John', 'TerryG', null, 'TerryJ', 'Eric', 'Michael'];
	
	
	f.teams = [];
	f.numPlayers = 0;
	f.fruitAllocation = [];
	
	
	// Populate team and player arrays with data from API
	
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
	//
	//  I'm giving the player object a playerNum property so we can
	//  number the players consecutively - else, if there are physical spaces 
	//  between players around the table, we'd get players 2,4,5 and 7 for eg
	//
	//	This affects ONLY the player numbers listed 
	//	when scores are displayed at end of level/game. 
	//	Throughout the rest of the game, the players are handled according
	//	to their position in the f.players array
	//
	//	To list the scores according to position in f.players array
	//	(adjusted for zero index - so player 0 is listed as player 1),
	//	set f.CONSECUTIVE_PLAYER_NUMS to false
	//	
	//
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	
	for(i = 0; i < API_players.length; i++) {
		if(API_players[i] !== null){
			f.players[i] = Object.create(player);
			f.players[i].playerNum = playerNum;
			playerNum++;
			f.players[i].name = API_players[i];
			f.players[i].score = [0, 0, 0];
			f.players[i].scoreDisplay = null;
			f.players[i].homeZone = null;
			f.players[i].team = getTeam(i);
			f.numPlayers++;
		}
		else {
			f.players[i] = null;
		}
	}
	for(i = 0; i < API_teams.length; i++) {
		f.teams[i] = {};
		
		f.teams[i].score = [0, 0, 0];
		f.teams[i].members = API_teams[i].members  || [];
		
		for(j = 0; j < API_teams[i].members.length; j++){
			f.teams[i].members[j] = f.players[API_teams[i].members[j]];
			f.teams[i].members[j].team = i;
		}		
	}
	f.freePlay = f.teams.length === 0;
	numPanels = f.freePlay ? f.players.length : f.teams.length;	
	f.levelBreakDuration = 0;// Schedules startCountdown
	
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
		['scorePanelsHeight', 45],
		['logoWidth', 326],
		['logoHeight', 383],
		
		['panelCheckFruitWidth', 235],
		['panelTapToScoreWidth', 187],
		['tapWidth', 368],
		['tapHeight', 92]
		 
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
	        // this.stage.disableVisibilityChange = true;

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