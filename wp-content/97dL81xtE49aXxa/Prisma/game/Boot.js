/*global Phaser, Prisma */

var Prisma = {}, // game elements
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
	i,
	j,
	player = {
		updateScore: function (val) {
			this.score[f.level] += val * (f.level + 1);
			if(!f.freePlay){
				f.teams[this.team].score[f.level] += val * (f.level + 1);
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
			// TODO: increment numPlayers in other games
			f.numPlayers++;

			if(currPlayerTeam !== undefined) {
				currPlayerTeam --; // zero indexed
				currPlayer.team = currPlayerTeam;
				f.teams = f.teams || [];
				fTeam = f.teams[currPlayerTeam];
				if(!fTeam) {
					f.numTeams++;
					fTeam = {members: [], score: [0, 0, 0]};
					f.teams[currPlayer.team] = fTeam;
				}
				fTeam.members.push(apiPlayer.player);				
			}
		} else {
			currPlayer  = null;
		}
		return currPlayer;
	},
	borderGutter,
	rect;

	f.mapPlaces = mapPlaces; // game also needs this function

	// How many fingers required for gestures?
	f.POINTERS_PER_PLAYER = 1;
	f.MAX_PLAYERS = maxPlayers;
	f.SMALL_SCALE = 0.53;
	f.CONSECUTIVE_PLAYER_NUMS = true;
	f.HOMEZONE_ALPHA = 0.5;
	f.RELOAD = 5;
	f.LOAD_DUR = 900;
	f.PRISM_HIT_VAL = 5;
	f.PRISM_ALPHA = 0.45;
	f.SPLINTER_VAL = 10;
	f.PRISM_DRAG_VAL = 20;
	f.PRISM_RESILIENCE = [2, 3, 4];
	f.SCORE_PANEL_FRAMES = 6;
	f.SCORE_PANELS_OFFSET_V = 40;
	f.NUM_LEVELS = 3;
	f.LEVEL_DURATION = 60000;
	f.PANEL_DELAY = 750;// Allow results to get out of the way
	f.LEVEL_PANEL_DELAY = 500;// Show level over before scores
	f.SCORE_PANEL_DELAY = 100;// stagger timing of panels
	f.SCORE_TWEEN_DURATION = 66;
	f.LEVEL_FADE_DURATION = 1000;
	f.COUNTDOWN_DELAY = 600;// Adjust arrival of countdown to coincide with removal of panels
	// f.levelBreakDuration set below - after f.players array is initialised
	f.NUM_COUNTDOWN_ELMTS = 3;
	f.FINAL_RESULTS_DUR = 2000;
	f.MIN_LEN = 40; // Used when setting max height of rays
	f.NUM_SPLINTERS = 7;
	f.NUM_PRISMS = [10, 15, 20];
	f.PRISM_SIZE = [1, 0.85, 0.7];
	f.FAB_DURATION = [0, 4000, 1000];
	f.RAY_SPEED = [8, 9, 10];
	f.RAY_ALPHA = [0.4, 0.3, 0.2];
	f.SPLINTER_SPEED = [4, 6, 7];
	f.SPLINTER_ANGLE = 8;//12;
	f.W_LIGHT_W = 7;

	f.players = [];	
	// TODO: in other games, init numPlayers to 0 and declare numTeams
	f.numPlayers = 0;
	for (i = 0; i < maxPlayers; i++) {
		f.players[i] = insertPlayer(i);
	}
	f.fruitAllocation = [];

	f.freePlay = !f.teams;
	numPanels = f.freePlay ? f.players.length : f.teams.length;
	f.levelBreakDuration = 2000 + (200 * numPanels);

	f.srx = Math.max(window.innerWidth,window.innerHeight);
	f.sry = Math.min(window.innerWidth,window.innerHeight);
	// Kindle for testing is 1024 x 600
	//f.screen = f.srx < 1500 ? "small" : "large";
	f.screen = "large";

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	// assign elmtWidth now so we can use it to compute value of fruitSheetwidth in assetListing array
	// it gets overwritten by assignAssetSizes()
	f.elmtWidth = Math.floor(f.logicHeight / f.VARIETIES);//135

	assetListing = [
		// ['scorePanelsWidth', 225],
		// ['scorePanelsHeight', 1],
		['scorePanelsWidth', 316],
		['scorePanelsHeight', 37],
		['bgWH', 256],
		['homeZoneBGWidth', 316],//318
		['homeZoneBGHeight', 141],//138
		['zapWidth', 640],
		['zapHeight', 320],
		['shuttleWH', 50],
		['prismWidth', 86],
		['prismHeight', 74],
		['prismGlowWidth', 150],
		['prismGlowHeight', 139],
		['rayWH', 7],
		['splinterWidth', 49],
		['splinterHeight', 7],
		['hotSpotWH', 40],
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
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);
	// For panels which pop up at end of level
	f.SCORE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/72);
	f.TITLE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/50);

	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;
	f.DEG30_AS_RAD = Phaser.Math.degToRad(30);
	f.ZAP_DURATION = 10;

	// For as duration for timer whose frequency increases with level number
	f.EVENT_INTERVALS = [25000 + f.EVENT_DURATION, 5000 + f.EVENT_DURATION, f.EVENT_DURATION];


	// Adjusts asset sizes according to scaleFactor and assigns to variables in Prisma
	function assignAssetSizes(assetListing){
		var len = assetListing.length,
		i;
		for (i = 0; i < len; i++){
			f[ assetListing[i][0] ] = Math.floor(assetListing[i][1] * f.scaleFactor);
		}
	}
	assignAssetSizes(assetListing);

	borderGutter = f.homeZoneBGHeight;
	rect = new Phaser.Rectangle(borderGutter, borderGutter, f.gameWidth - (borderGutter * 2), f.gameHeight - (borderGutter * 2));
	f.PRISM_SPACE = f.prismHeight * 1.6;
	f.NUM_COLS = Math.floor(rect.width/f.PRISM_SPACE);
	f.NUM_ROWS = Math.floor(rect.height/f.PRISM_SPACE);
	f.GRID_WIDTH = f.PRISM_SPACE * f.NUM_COLS;
	f.GRID_HEIGHT = f.PRISM_SPACE * f.NUM_ROWS;
	f.BORDER_WIDTH = (f.gameWidth - f.GRID_WIDTH)/2;
	f.BORDER_HEIGHT = (f.gameHeight - f.GRID_HEIGHT)/2;
	f.TOTAL_PRISM_PLACES = f.NUM_COLS * f.NUM_ROWS;
	f.HALF_PRISM_SPACE = f.PRISM_SPACE/2;
	f.PRISM_OFFSET = f.prismHeight * 0.4;
	// Debug
	// f.MAX_INACTIVITY = 30000;
	f.MAX_INACTIVITY = 15000;
	// End debug
	f.VERTEX_TO_CENTRE = f.prismWidth/Math.sqrt(3);

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
	        this.stage.disableVisibilityChange = true;

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
