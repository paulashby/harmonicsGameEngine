/*global Phaser, Blox, window */

var Blox = {}, // game elements in here
f = {
	BG_COL: 0x37175f,
	MAX_PLAYERS: 8,
	SMALL_SCALE: 0.53,
	CONSECUTIVE_PLAYER_NUMS: true,
	LEVEL_DURATION: 5000,
	// f.levelBreakDuration set below - after f.players array is initialised
	FLIP_DURATION: 100,
	RELEASE_DURATION: 100,
	REENTER_DURATION: 300,
	BLANK_FRAME: 8,
	BLOCKS_TO_CAPTURE: 5, // Num blocks captured in demo
	INSTRUCTION_BLOCK: 3, // How many blocks is instruction from homeZone?
	pointers: [],
	endTransition: false,
	
	players: [],
	countdownBlocks: [],
	blockSetUps: [
		{
			numColsNrows: [27, 15],
			skipBttnY: 490,
			playerScoreSettings: {
				freePlay: {offset: 27, sizeFactor: 0.48},
				teamPlay: {offset: 50, sizeFactor: 0.5}
			},
			teamScoreSettings: {
				offset: 45, sizeFactor: 0.9
			}
		},
		{
			numColsNrows: [31, 17],
			skipBttnY: 507,
			playerScoreSettings: {
				freePlay: {offset: 25, sizeFactor: 0.45},
				teamPlay: {offset: 40, sizeFactor: 0.45}
			},
			teamScoreSettings: {
				offset: 40, sizeFactor: 0.8
			}
		},
		{
			numColsNrows: [35, 19],
			skipBttnY: 522,
			playerScoreSettings: {
				freePlay: {offset: 22, sizeFactor: 0.4},
				teamPlay: {offset: 40, sizeFactor: 0.4}
			},
			teamScoreSettings: {
				offset: 37, sizeFactor: 0.75
			}
		},
		{
			numColsNrows: [37, 21],
			skipBttnY: 532,
			playerScoreSettings: {
				freePlay: {offset: 19, sizeFactor: 0.37},
				teamPlay: {offset: 45, sizeFactor: 0.35}
			},
			teamScoreSettings: {
				offset: 30, sizeFactor: 0.7
			}
		}
	],
	homeZoneBlocks: [],
	demo: true,
	timers: [],
	level: 0,
	endLevelSignal: new Phaser.Signal(),
	newLevelSignal: new Phaser.Signal(),
	levelOver: false,
	homeSettings: [],
	findWithAttr: function (array, attr, value) {
	
		"use strict";	
	
		var i,
		len = array.length;
		for(i = 0; i < len; i += 1) {
			if(array[i] && array[i][attr] === value) {
				return i;
			}
		}
	},
	/*	
	 * @param 	{Number} start - the zone number CW from TL
	 * @param 	{Array} steps - an array of step objects
	 * @param 		{Number} steps[n].num - num steps before turning
	 * @param 		{Number} steps[n].dir - 1: up, 2: right, 3: down or 4: left
	 * @param 	{Number} life - set timeout to remove chain
	*/
	makeChain: function (zone, steps, life) {

		"use strict";			

		var zoneDetails = f.homeBlockPositions[zone - 1],
			currCol = zoneDetails[0],
			currRow = zoneDetails[1],
			currBlock = f.blocks.getAt(currCol).getAt(currRow),		
			frame = currBlock.frame,
			i,
			ilen = steps.length,
			j,
			jlen,
			pointer = {};

			currBlock.onTap(currBlock, pointer);

			// traverse steps array
			for(i = 0; i < ilen; i++) {

				// process step object
				jlen = steps[i].numBlocks;

				for(j = 0; j < jlen; j++) {
					// change row or column
					switch(steps[i].dir) {
						case 1:
						currRow--;
						break;

						case 2:
						currCol++;
						break;

						case 3:
						currRow++;
						break;

						default:
						currCol--;
					}
					currBlock = f.blocks.getAt(currCol).getAt(currRow);

					// Skip block if already taken 
					currBlock.onEnter(pointer);									
				}				
			}
			if(life) {
				window.setTimeout(function (block, pointer) {
					block.onRelease(pointer);}, life, pointer.blocks[0], pointer);
			}
	},
	/*	
	 * @param {Array} spec comprising chain descriptions for the f.makeChain() function
	*/
	makeChains: function (spec) {

		"use strict";	
	
		var i,
		ilen = spec.length;

		for(i = 0; i < ilen; i++) {
			f.makeChain(spec[i][0], spec[i][1], spec[i][2]);
		}
	}	
};


(function () {

	"use strict";

	// store asset dimensions as key/value pairs
	// Using production screen size for value
	var assetListing,
	i,
	j,
	// API integration /////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////
	numPanels,
	// API_players = ['null', 'Graham', 'John', 'TerryG', 'null', 'TerryJ', 'Eric', 'Michael'],
	// API_teams = [
	// 	// This should be any empty Array if no teams
	// 	{members: [3, 5, 7], score: 0},
	// 	{members: [1, 2, 6], score: 0},
	// 	{members: [0, 4], score: 0}
	// ],
	maxPlayers = 8,	
	player = {
		updateScore: function (val) {
			var newScore = this.score[f.level] + (val * (f.level + 1)),
				newTeamScore;
			this.score[f.level] = Math.max(0, newScore);
			if(!f.freePlay){
				newTeamScore = f.teams[this.team].score[f.level] + (val * (f.level + 1));
				f.teams[this.team].score[f.level] = Math.max(0, newTeamScore);
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
	countPlayer = function (i) {
		// Counting actual number of players as number of blocks in grid varies with number of players
		var rawDataIndex = f.findWithAttr(apiRawData, 'place', mapPlaces(i));

		if(typeof rawDataIndex === 'number') {	
			f.numPlayers++;
		}
	};

	f.numPlayers = 0;
	for (i = 0; i < maxPlayers; i++) {
		countPlayer(i);
	}
	
	// API integration End /////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////

	f.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	/*
	 * Returns timer calling the given func on the given object. 
	 * If repeat is true, it will fire multiple times
	 * If delay is a number, it will repeat at the given interval.
	 * If delay is an object in the form {min: 0, max: 1000}. it will fire
	 * after a random interval with the given time range  
	 */
	f.getTimer = function (obj, func, delay, repeat) {
		var timer = Blox.game.time.create(false),
		timeout = typeof delay === 'number' ? delay : f.getRandomInt(delay.min, delay.max),
		timeoutFunc = function() {
			if(typeof func === 'function') {
				func.apply(obj);
			} else {				
				obj[func]();
			}
			
			if(repeat){
				f.getTimer(obj, func, delay, repeat);
			}
		};
		try{
			if(typeof delay === 'number'){
				timeout = delay;
			}
			else if(typeof delay.min === 'number' && typeof delay.max === 'number'){
				f.getRandomInt(delay.min, delay.max);
			}
			else{
				throw {
				   name: "getTimer()",
				   message: "Expected number or object with min and max properties, saw '" + delay + "'"
				};
			}
		}
		catch(e)
		{
			if(console){
				console.error(e.name + ": " + e.message);
			}
		}
		timer.add(timeout, timeoutFunc, this);
		f.timers.push(timer);
		timer.start();

		return timer;
	};

	f.Block = function (game, x, y, key){
		Phaser.Sprite.call(this, game, x, y, key);

		this.resetScale = this.getResetScale(f.squaresW, f.squaresH);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(this.resetScale.x, this.resetScale.y);		
		this.inputEnabled = true;
		this.events.onInputDown.add(this.onTap, this);
		this.tweens = {}; // tweens object for ease of control
		
		this.init();
	};
	f.Block.prototype = Object.create(Phaser.Sprite.prototype);
	f.Block.prototype.constructor = f.Block;	
	f.Block.prototype.init = function () {	

		this.released = true;
		this.frame = f.BLANK_FRAME;
		this.isCaptured = false;
		this.flipped = false;
		this.blocks = undefined;
	};
	f.Block.prototype.getResetScale = function (targetW, targetH) {
		var scaleX = targetW/f.squaresTextureFrameSize,
			scaleY = targetH/f.squaresTextureFrameSize;

		return {x: scaleX, y: scaleY};
	};
	f.Block.prototype.notDiagonal = function (prevBlock) {

		if(prevBlock.colNum === this.colNum){
			// Adjacent row?
			if( Math.abs(prevBlock.rowNum - this.rowNum) === 1 ) {				
				return {x: false, y: true};
			}
		}
		else if(prevBlock.rowNum === this.rowNum){
			// Adjacent column?
			if( Math.abs(prevBlock.colNum - this.colNum) === 1 ) {
				return  {x: true, y: false};
			}
		}
		return false;
	};
	f.Block.prototype.available = function (pointer) {
		// isFree when frame is blank frame, hazard/bonus or same as homeZone frame (already captured)
		return this.notDiagonal(pointer.blocks[pointer.blocks.length - 1]);	
	};
	f.Block.prototype.onTap = function (eTarget, pointer) {
		// Register homezone with pointer
		if(!f.gameOver){
			pointer.blocks = [this];
		}
	};
	f.Block.prototype.getTween = (function (tweenType, tertiaryTween) {

		var setScale = function (xVal, yVal, duration, autoStart, that) {
				return that.game.add.tween(that.scale).to({x: xVal, y: yVal}, duration, Phaser.Easing.Linear.InOut, autoStart);
			},
			setAlpha = function (aVal, duration, that) {
				return that.game.add.tween(that).to({alpha: aVal}, duration, Phaser.Easing.Linear.InOut, false);
			}; 
		return function (tweenType, tertiaryTween) {

			switch (tweenType) {
				case 'flip':
				this.tweens.primaryTween = setScale(this.resetScale.x, 0, f.FLIP_DURATION, true, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.FLIP_DURATION, false, this);
				break;

				case 'flipX':
				this.tweens.primaryTween = setScale(0, this.resetScale.y, f.FLIP_DURATION, false, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.FLIP_DURATION, false, this);
				break;

				case 'flipY':
				this.tweens.primaryTween = setScale(this.resetScale.x, 0, f.FLIP_DURATION, false, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.FLIP_DURATION, false, this);
				break;

				case 'release':
				this.tweens.primaryTween = setScale(0, 0, f.RELEASE_DURATION, true, this);
				this.tweens.primaryTween.onComplete.add(function () { this.frame = f.BLANK_FRAME; }, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.RELEASE_DURATION, false, this);
				break;

				case 'reenter':
				this.tweens.primaryTween = setAlpha(0.5, f.REENTER_DURATION, this);
				this.tweens.secondaryTween = setAlpha(1, f.REENTER_DURATION, this);
				break;

				case 'hazard':
				this.tweens.primaryTween = setScale(0, 0, f.FLIP_DURATION/2, false, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.FLIP_DURATION/2, false, this);
				this.tweens.primaryTween.onComplete.add(function(){this.frame = f.BLANK_FRAME;}, this);
				break;

				default:
				console.error('Block.getTween: unknown tween type');
			}	
			this.tweens.primaryTween.chain(this.tweens.secondaryTween);

			return this.tweens.primaryTween;	
		};		
	}());	
	f.Block.prototype.getPointerBlocks = function (pointer) {
		var i = pointer.blocks.length,
			clonedArray = [];

		while (i--) {
			clonedArray[i] = pointer.blocks[i];
			if(i !== 0) {
				clonedArray[i].homeBlock = pointer.blocks[0];	
			}
		}
		return clonedArray;
	};	
	f.Block.prototype.releaseBlock = function () {
		var block,
			sameHZ = function (element) {
				return element === this.blocks[0];	
			},
			czIndex;
		
		if(this.blocks) {
			if(this.blocks.length === 1) {
				this.blocks[0].releaseTimer.destroy();
				this.blocks[0].repeated = false;
				this.blocks = undefined;					
			} else {				
				block = this.blocks.pop();

				if( ! block.isHomeZone){

					this.blocks[0].hazardShortSound.play();				
					block.init();												
				}																
				this.blocks[0].releaseTimer.add(f.RELEASE_DURATION, this.releaseBlock, this);								
			}
		}		
	};
	f.Block.prototype.onRelease = function (pointer, hazard) {
		if(! f.gameOver) {
			if(this.blocks && this.blocks.length > 0) {
				this.blocks = this.blocks.concat(this.getPointerBlocks(pointer));
			} else {
				this.blocks = this.getPointerBlocks(pointer);
			}
			pointer.blocks = undefined;

			this.releaseTimer = Blox.game.time.create(false);
			this.releaseTimer.add(f.RELEASE_DURATION, this.releaseBlock, this);
			this.releaseTimer.start();	
		}
	};	
	f.Block.prototype.addToChain = function (available) {

		// Add this to blocks array so we can remove the blocks in sequence on release or hazard collision
		this.pointer.blocks.push(this);

		// flip block in appropriate direction
		this.isCaptured = true;
		this.frame = this.pointer.blocks[0].frame;
		this.tweens.scaleTween = available.x ? this.getTween('flipX') :  this.getTween('flipY');
		this.tweens.scaleTween.start();
		this.pointer.blocks[0].captureSound.play();
			
	};
	f.Block.prototype.showBonus = function () {
		this.tweens.bonusTween = this.getTween('flipY');
		this.tweens.bonusTween.onComplete.add(function () {
			this.loadTexture('shimmer', 3);
			f.sound[4].play();
		}, this);
		this.tweens.bonusTween.start();
	};
	f.Block.prototype.showHazard = function () {
		this.tweens.hazardTween = this.getTween('flipY');
		this.tweens.hazardTween.onComplete.add(function () {
			this.frame = 8;
			f.sound[4].play();
		}, this);
		this.tweens.hazardTween.start();
	};
	f.Block.prototype.onEnter = function (pointer) {
		var available;

		// Does chain of blocks exist?
		if(pointer.blocks){
			available = this.available(pointer);
			this.pointer = pointer;
			this.addToChain(available);			 
		}
	};
	f.Block.prototype.update = function () {

		if(f.endTransition) {
			this.frame = f.BLANK_FRAME;
		}
	};

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
	// Allows us to get number of poperties in an object
	if (typeof Object.keys !== 'function') {
	    Object.keys = function (obj) {
	        var keys = [],
	            k;
	        for (k in obj) {
	            if (Object.prototype.hasOwnProperty.call(obj, k)) {
	                keys.push(k);
	            }
	        }
	        return keys;
	    };
	}

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
	f.players = [{}, {}, {}, {}, {}, {}, {}, {}];
	f.teams = [];

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

	// for(i = 0; i < API_players.length; i++) {
	// 	if(API_players[i] !== null){
	// 		f.players[i] = Object.create(player);
	// 		f.players[i].playerNum = playerNum;
	// 		playerNum++;
	// 		f.players[i].name = API_players[i];
	// 		f.players[i].score = [0, 0, 0];
	// 		f.players[i].scoreDisplay = null;
	// 		f.players[i].homeZone = null;
	// 		f.players[i].team = getTeam(i);
	// 		f.numPlayers++;
	// 	}
	// 	else {
	// 		f.players[i] = null;
	// 	}
	// }

	f.blocksPerRow = f.blockSetUps[Math.ceil(f.numPlayers/2) -1].numColsNrows[0];
	f.blocksPerCol = f.blockSetUps[Math.ceil(f.numPlayers/2) -1].numColsNrows[1];

	f.levelBreakDuration = 2000 + (200 * numPanels);

	 /*
	  * Block positions - 
	  * child index in column group, child index in row group
	  * so get column:
	  * col = f.blocks.getAt(f.homeBlockPositions[n][0]);
	  * then get block:
	  * block = col.getAt(f.homeBlockPositions[n][1]);
	  */
	f.homeBlockPositions =  [
		[4,0],
		[Math.floor(f.blocksPerRow/2), 0],
		[f.blocksPerRow - 5, 0],
		[f.blocksPerRow - 1, Math.floor(f.blocksPerCol/2)],
		[f.blocksPerRow - 5, f.blocksPerCol - 1],
		[Math.floor(f.blocksPerRow/2), f.blocksPerCol - 1],
		[4,f.blocksPerCol - 1],
		[0, Math.floor(f.blocksPerCol/2)]
	];

	// for(i = 0; i < API_teams.length; i++) {
	// 	f.teams[i] = {};

	// 	f.teams[i].score = [0, 0, 0];
	// 	f.teams[i].members = API_teams[i].members  || [];

	// 	for(j = 0; j < API_teams[i].members.length; j++){
	// 		f.teams[i].members[j] = f.players[API_teams[i].members[j]];
	// 		f.teams[i].members[j].team = i;
	// 	}
	// }
	// f.freePlay = f.teams.length === 0;

	f.freePlay = !f.teams;
	numPanels = f.freePlay ? f.players.length : f.teams.length;
	f.levelBreakDuration = 2000 + (200 * numPanels);

	f.srx = Math.max(window.innerWidth,window.innerHeight);
	f.sry = Math.min(window.innerWidth,window.innerHeight);
	
	f.screen = "large";

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	if(f.screen === "large"){
		f.scaleFactor = 1;
		f.gameWidth = 1920;
	}
	else{
		f.scaleFactor = f.SMALL_SCALE;
		f.gameWidth = 1024;
	}
	f.gameHeight = f.gameWidth/f.aspectRatio;
	f.corners = [
		{x: 0, y: 0, angle: 135 + 180},
		{x: f.gameWidth, y: 0, angle: 225 + 180},
		{x: f.gameWidth, y: f.gameHeight, angle: 315 + 180},
		{x: 0, y: f.gameHeight, angle: 45 + 180}
	];

	assetListing = [
		
		['squaresW', f.gameWidth/f.blocksPerRow],
		['squaresH', f.gameHeight/f.blocksPerCol],
		['squaresTextureFrameSize', 77], // Width and height of squares texture		
		['scorePanelsWidth', 316]
	];
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/110);
	// For panels which pop up at end of level
	f.SCORE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/100);
	f.TITLE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/70);
	f.TEAM_HUD_FONT_SIZE = Math.floor(f.gameWidth/100);

	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;


	// Adjusts asset sizes according to scaleFactor and assigns to variables in Blox
	function assignAssetSizes(assetListing){
		var len = assetListing.length,
		i;
		for (i = 0; i < len; i++){
			f[ assetListing[i][0] ] = assetListing[i][1] * f.scaleFactor;
		}
	}
	assignAssetSizes(assetListing);
	
	Blox.Boot = function () {

	};

	Blox.Boot.prototype = {

	    init: function () {

			// this.stage.disableVisibilityChange = true;
	        this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
	        this.game.stage.backgroundColor = f.BG_COL;

	    },

	    preload: function () {

	    },

	    create: function () {

	        this.state.start('Preloader');
	    }
	};	
}());
