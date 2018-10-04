/*global Phaser, Prisma */

var Prisma = {}, // game elements in here
f = {}; // our members and functions in here


(function () {
	
	"use strict";	
	
	// store asset dimensions as key/value pairs
	// Using production screen size for value
	var assetListing,
	i,
	j,	
	player = {
		
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
	// How many fingers required for gestures?
	f.POINTERS_PER_PLAYER = 1;
	f.MAX_PLAYERS = 8; 	
	f.SMALL_SCALE = 0.53;
	f.NUM_DEMO_CLICKS = 2;
	f.NUM_COUNTDOWN_ELMTS = 3;
	f.PANEL_DELAY = 750;
	
	f.players = [];
	
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
	
	// Data from API: ///////////////////////
	// Player name, position
	// Let's assume for now it's organised as an array with null entries for empty zones
	//f.players = [null, 'Graham', 'John', 'TerryG', null, 'TerryJ', 'Eric', 'Michael'];
	f.teams = [];
	f.numPlayers = 0;
	
	// Populate team and player arrays with data from API	
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
	// Kindle for testing is 1024 x 600
	f.screen = f.srx < 1500 ? "small" : "large";

	f.screen = "large";

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	assetListing = [		
		['homeZoneBGWidth', 316],
		['homeZoneBGHeight', 141],
		['prismWidth', 86],
		['prismHeight', 74],
		['prismGlowWidth', 150],
		['prismGlowHeight', 139],
		['zapWidth', 640],
		['zapHeight', 320],
		['rayWH', 7],
		['splinterWidth', 49],
		['splinterHeight', 7],
		['hotSpotWH', 40],
		['tapWidth', 368],
		['tapHeight', 92],
		['countdownWH', 135]		 
	];

	if(f.screen === "large"){		
		f.scaleFactor = 1;
		f.gameWidth = 1920;
	}
	else{
		f.scaleFactor = f.SMALL_SCALE;
		f.gameWidth = 1024;
	}
	f.gameHeight = f.gameWidth/f.aspectRatio;
	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);	
	f.NUM_SPLINTERS = 7;
	f.SPLINTER_ANGLE = 8;
	f.ZAP_DURATION = 10;
	
	///////////////////////////////////////////////////////////
	// DEVELOPMENT ONLY - this logs required assets with sizes
	
	function logAssetSizes () {
		var i,
		smallSize;
		
		for(i = 0; i < assetListing.length; i++){
			smallSize = Math.floor(assetListing[i][1] * f.SMALL_SCALE);
			//console.log(assetListing[i][0] + ': ' + assetListing[i][1] + ', ' + smallSize + '\n');
		}
	}
	logAssetSizes();
	
	///////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////
	
	// Adjusts asset sizes according to scaleFactor and assigns to variables in Prisma
	function assignAssetSizes(assetListing){
		var len = assetListing.length,
		i;
		for (i = 0; i < len; i++){
			f[ assetListing[i][0] ] = Math.floor(assetListing[i][1] * f.scaleFactor);
		}
	}
	assignAssetSizes(assetListing);
	
	Prisma.Boot = function () {

	};

	Prisma.Boot.prototype = {

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