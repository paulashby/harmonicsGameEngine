/*global Phaser, Blox, window */

var Blox = {}, // game elements in here
f = {
	BG_COL: 0x37175f,
	POINTERS_PER_PLAYER: 1, // How many fingers required for gestures?
	MAX_PLAYERS: 8,
	SMALL_SCALE: 0.53,
	CONSECUTIVE_PLAYER_NUMS: true,
	SCORE_PANEL_FRAMES: 6,
	SCORE_PANELS_OFFSET_V: 48,
	PANEL_TITLE_OFFSET: 5,
	NUM_LEVELS: 1,
	LEVEL_DURATION: 40000,
	PANEL_DELAY: 750,// Allow results to get out of the way
	LEVEL_PANEL_DELAY: 500,// Show level over before scores
	SCORE_PANEL_DELAY: 100,// stagger timing of panels
	SCORE_TWEEN_DURATION: 66,
	LEVEL_FADE_DURATION: 1000,
	COUNTDOWN_DELAY: 600,// Adjust arrival of countdown to coincide with removal of panels
	// f.levelBreakDuration set below - after f.players array is initialised
	NUM_COUNTDOWN_ELMTS: 3,
	FINAL_RESULTS_DUR: 1000,
	FLIP_DURATION: 100,
	RELEASE_DURATION: 20,
	REENTER_DURATION: 300,
	BLANK_FRAME: 8,
	FRAME_OFFSET: 9,
	HAZARD_FRAME: 8,
	HAZARD_PENALTY: - 2,
	BONUS_SCORE: 23, // We include standard score here, so works out as 25
	STANDARD_SCORE: 2,
	
	// Range for shimmer interval (how often ShimmerBlocks appear)
	SHIMMER_INTERVAL_MIN: 3000,
	SHIMMER_INTERVAL_MAX: 10000,

	// Percentage of shimmerBlocks which are hazards
	HAZARD_FREQUENCY: 50,

	SHIMMER_TRANS_DURATION: 500,
	SHIMMER_HAZARD_TRANS_DURATION: 500,
	SHIMMER_HAZARD_RELEASE_DURATION: 100,
	SHIMMER_HOLD_DUR: 2000,
	SHIMMER_HAZARD_HOLD_DUR: 1000,
	SHIMMER_ALPHA_LOW: 0.999,

	masterSpecialsCounter: 0,
	activePointers: {},
	players: [],
	blockSetUps: [
		{
			numColsNrows: [27, 15],
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
	gameStarted: true,
	hzPanels: [],
	HOMEZONE_ALPHA: 1,
	homeSettings: [],
	uniqueNumber: function () {
	
		"use strict";	
	
		var date = Date.now();
	    
		if (date <= f.uniqueNumber.previous) {
			date = ++f.uniqueNumber.previous;
		} else {
			f.uniqueNumber.previous = date;
		}

		return date;
	},
	id: function (){
		return f.uniqueNumber();
	},
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
f.uniqueNumber.previous = 0;


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
		// API numbers places differently to system used in game
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


	f.ShimmerBlock = function (game, x, y, key, pair){
		var alphaVal,
			transDur,
			shimmerHold;

		Phaser.Sprite.call(this, game, x, y, key);

		// pairedBlock is the f.Block instance in the same position as this 
		this.pairedBlock = pair;
		this.resetScale = this.pairedBlock.getResetScale(f.squaresW, f.squaresH);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(this.resetScale.x, this.resetScale.y);	
		this.alpha = 0;
		this.tweens = {}; // tweens object for ease of control
		
		this.shimmering = false;
		this.resetFrame = f.getRandomInt(0, 7);
		this.frame = this.resetFrame;
		this.bonusAnim = this.animations.add('bonus', [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12]);
		this.bonusAnim.onComplete.add(function () { this.playingAnim = false; this.alpha = 0; this.frame = this.resetFrame;}, this);

		// Adjust proportion of hazards
		if(this.frame !== 8) {
			this.frame = f.getRandomInt(0, 100) >= 100 - f.HAZARD_FREQUENCY ? 8: f.getRandomInt(0, 7);
		}
		this.hazard = this.frame === 8;		
		this.shimmerInterval = f.getRandomInt(f.SHIMMER_INTERVAL_MIN, f.SHIMMER_INTERVAL_MAX);
		this.shimmerCount = f.getRandomInt(0, this.shimmerInterval);
		

		if(this.hazard) {
			alphaVal = 1;
			transDur = f.SHIMMER_HAZARD_TRANS_DURATION;
			shimmerHold = f.SHIMMER_HAZARD_HOLD_DUR;
		} else {
			alphaVal = f.SHIMMER_ALPHA_LOW;
			transDur = f.SHIMMER_TRANS_DURATION;
			shimmerHold = f.SHIMMER_HOLD_DUR;
		}
		this.tweens.shimmerTween = this.game.add.tween(this).to({alpha: alphaVal}, transDur, Phaser.Easing.Linear.InOut, false);
		this.tweens.shimmerHoldTween = this.game.add.tween(this).to({alpha: alphaVal}, shimmerHold, Phaser.Easing.Linear.InOut, false);
		this.tweens.endShimmerTween = this.game.add.tween(this).to({alpha: 0}, transDur, Phaser.Easing.Linear.InOut, false);

		this.tweens.shimmerTween.chain(this.tweens.shimmerHoldTween, this.tweens.endShimmerTween);		
	};
	f.ShimmerBlock.prototype = Object.create(Phaser.Sprite.prototype);
	f.ShimmerBlock.prototype.constructor = f.ShimmerBlock;
	f.ShimmerBlock.prototype.update = function () {
		if(this.playingAnim) {
			this.alpha = 1;
		} else {			
			if (this.pairedBlock.frame === f.BLANK_FRAME) {		
				// PairedBlock is free - OK to shimmer 
				if (this.shimmerCount === this.shimmerInterval) {
					this.tweens.endShimmerTween.stop();			
					this.tweens.shimmerTween.start();
					this.shimmerCount = 0;
				}			
			} else {
				// No shimmer if pairedBlock is captured
				this.tweens.shimmerTween.stop();
				this.tweens.shimmerHoldTween.stop();
				this.tweens.endShimmerTween.stop();
				this.alpha = 0;
			}		
			this.shimmerCount ++;
		}		
	};

	f.Block = function (game, x, y, key){
		Phaser.Sprite.call(this, game, x, y, key);

		this.resetScale = this.getResetScale(f.squaresW, f.squaresH);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(this.resetScale.x, this.resetScale.y);		
		this.inputEnabled = true;
		this.events.onInputDown.add(this.onTap, this);
		this.events.onInputUp.add(this.onUp, this);
		this.tweens = {}; // tweens object for ease of control

		this.init();
	};
	f.Block.prototype = Object.create(Phaser.Sprite.prototype);
	f.Block.prototype.constructor = f.Block;	
	f.Block.prototype.init = function () {	

		this.released = true;

		// Repeated tracks whether a block appears more than once in a chain
		this.repeated = false;
		this.frame = f.BLANK_FRAME;

		this.isCaptured = false;
		this.flipped = false;
		this.bonusAvailable = true;
		this.blocks = undefined;
		this.capturingZones = []; // Array of homeZones to track when block is shared by multiple chains
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
	f.Block.prototype.permitted = function (pointer) {
		var prevCapture = pointer.blocks[pointer.blocks.length -1],
			hz = pointer.blocks[0];
		// previous block in chain must match homezone - else it was added erroneously
		if(prevCapture.frame !== hz.frame && prevCapture.frame !== hz.frame + f.FRAME_OFFSET){
			return false;
		}
		// previous block in chain must match block we've just left
		if(prevCapture !== pointer.exited) {
			return false;
		}
		return true;
	}
	f.Block.prototype.available = function (pointer) {
		// isFree when frame is blank frame, hazard/bonus or same as homeZone frame (already captured)
		var isFree = (this.frame === f.BLANK_FRAME || this.frame === pointer.blocks[0].frame),
			isPermitted = this.permitted(pointer);

		if(isPermitted && isFree) {
			return this.notDiagonal(pointer.blocks[pointer.blocks.length - 1]);	
		}
		return false;
	};
	f.Block.prototype.onCapture = function () {
		if(this.pointer && this.pointer.blocks) {
				
			if( ! this.isHomeZone && ! this.repeated && this.pointer.blocks[0].player) {
				// Increment score!
				this.pointer.blocks[0].player.updateScore(f.STANDARD_SCORE);
			}			
		}
	};
	f.Block.prototype.onTap = function (eTarget, pointer) {

		var pointerID = f.id();

		// Register homezone with pointer

		// Add to activePointers array so we can track which pointers are down
		// This is necessary because when game is loaded in Game Engine, 
		// and touch events are disabled, pointer.isDown is always false.
		// The game tables seem to behave as if they're not receiving touch events

		// So now, if a pointer is in activePointers, it's down
		pointer.bloxid = pointerID;
		f.activePointers[pointerID] = pointer;		

		if(!f.gameOver && this.isHomeZone && ! this.releasing){
			pointer.blocks = [this];
			pointer.exited = this;
		}
	};
	f.Block.prototype.onUp = function (eTarget, pointer) {

		// Release the chain of blocks
		if(pointer.blocks) {
			pointer.blocks[0].onRelease(pointer);	
		}
		pointer.block = undefined;
		pointer.prevBlock = undefined;

		// Remove pointer from activePointers object
		delete f.activePointers[pointer.bloxid];
		pointer.bloxid = undefined;
	};
	f.Block.prototype.getBonus = function (available) {

		var tertiaryTweenOb = available;
		this.tweens.scaleTween = this.getTween('bonus', tertiaryTweenOb);
		this.tweens.scaleTween.start();
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
				this.tweens.primaryTween.onComplete.add(this.onCapture, this);
				this.tweens.secondaryTween = setScale(this.resetScale.x, this.resetScale.y, f.FLIP_DURATION, false, this);
				break;

				case 'flipY':
				this.tweens.primaryTween = setScale(this.resetScale.x, 0, f.FLIP_DURATION, false, this);
				this.tweens.primaryTween.onComplete.add(this.onCapture, this);
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
				this.releasing = false;					
			} else {				
				block = this.blocks.pop();

				if( ! block.isHomeZone){

					// Get index of this chain's home zone in capturingZones array
					czIndex = block.capturingZones.findIndex(function(elmt) {
						return elmt === this;
					}, this.blocks[0]);
					
					// remove this chain's home zone from capturingZones array
					if(czIndex > -1) {
						block.capturingZones.splice(czIndex, 1);
					}

					// If no more capturing zones in array, block can be removed
					if(block.capturingZones.length === 0) {
						this.blocks[0].hazardShortSound.play();				
						block.init();

						// Player won't exist when spoofing chains for testing
						if(this.player){						
							this.player.updateScore(f.HAZARD_PENALTY);
						}
					}												
				}																
				this.blocks[0].releaseTimer.add(f.RELEASE_DURATION, this.releaseBlock, this);								
			}
		}		
	};
	f.Block.prototype.onRelease = function (pointer, hazard) {

		// this is called on first block in chain

		// Set flag to prevent new paths from this block while blocks remain in chain
		// this to prevent player recapturing a block which is due to be released 
		this.releasing = true;

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
	f.Block.prototype.addToChain = function (available, registered) {

		if( ! registered) {
			// Add homeZone to capturingZones array		
			this.capturingZones.push(this.pointer.blocks[0]);
		}		

		// Add this to blocks array so we can remove the blocks in sequence on release or hazard collision
		this.pointer.blocks.push(this);

		// Is paired block displaying a hazard or bonus? 
		if(this.pairedBlock.alpha !== 0) {

			this.frame = this.pointer.blocks[0].frame;
			this.pairedBlock.tweens.endShimmerTween.start();
			
			if(this.pairedBlock.frame === f.HAZARD_FRAME) {
				// Hazard - remove entire chain
				this.pointer.blocks[0].hazardSound.play();
				this.pointer.blocks[0].onRelease(this.pointer, true);
				this.tweens.scaleTween = this.getTween('hazard', available);
				this.pairedBlock.tweens.releaseTween = this.game.add.tween(this).to({alpha: 0}, f.SHIMMER_HAZARD_RELEASE_DURATION, Phaser.Easing.Linear.InOut, true);													
			} else {
				// Bonus - be nice				
				this.pointer.blocks[0].bonusSound.play();
				this.tweens.scaleTween = available.x ? this.getTween('flipX') :  this.getTween('flipY');
				this.pointer.blocks[0].player.updateScore(f.BONUS_SCORE);
				this.pairedBlock.playingAnim = true;
				this.pairedBlock.animations.play('bonus');
			}
			this.tweens.scaleTween.start();
		} else {
			// flip block in appropriate direction
			this.isCaptured = true;
			this.frame = this.pointer.blocks[0].frame;
			this.tweens.scaleTween = available.x ? this.getTween('flipX') :  this.getTween('flipY');
			this.tweens.scaleTween.start();
			this.pointer.blocks[0].captureSound.play();
		}	
	};
	f.Block.prototype.pruneChain = function () {
		var prev = this.pointer.blocks[this.pointer.blocks.length -1];

		if(prev.repeated) {
			// Prev has been crossed multiple times. We only want the release animation to play
			// for its first appearance in the chain, so remove this new occurence from the blocks array
			this.pointer.blocks.pop();
		}
	};
	f.Block.prototype.onEnter = function (pointer) {
		var available;

		// Does chain of blocks exist?
		if(! f.gameOver && pointer.blocks){

			available = this.available(pointer);

			if(available){

				this.pointer = pointer;
				this.pruneChain();

				// Has this block already been captured? 
				if(this.capturingZones.length > 0) {

					// Play animation to acknowledge entry
					this.tweens.scaleTween = this.getTween('reenter');

					// Has this block already been captured by this pointer's chain?
					if(this.capturingZones.find(function(elmt) { return elmt === this; }, this.pointer.blocks[0])) {

						// Set as repeated so we don't score
						this.repeated = true;

						this.addToChain(available, true);
					} 
					else {
						// Add to chain with no further checks
						this.addToChain(available);
					}

				} else {
					// Add to chain with no further checks
					this.addToChain(available);
				}
			} 
		}
		pointer.exited = this;
	};
	f.Block.prototype.update = function () {

		if(f.endTransition) {
			this.frame = f.BLANK_FRAME;
		} else {
			if(this.pairedBlock.playingAnim) {
				this.alpha = 0;
			} else {
				this.alpha = 1;
			}

			// Ghost the leading block in case players lose track of end of chain
			if(this.pointer && this.pointer.blocks) {			
				if(this === this.pointer.blocks[this.pointer.blocks.length -1]){
					this.frame = this.frame < f.BLANK_FRAME ? this.frame + f.FRAME_OFFSET : this.frame;			
					
				} else {
					this.frame = this.frame > f.BLANK_FRAME ? this.frame - f.FRAME_OFFSET : this.frame;
				}
			} else {
				this.frame = this.frame > f.BLANK_FRAME ? this.frame - f.FRAME_OFFSET : this.frame;
			}
		}
	}

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
	//f.players = [null, 'Graham', 'John', 'TerryG', null, 'TerryJ', 'Eric', 'Michael'];
	// f.teams = [];

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
	
	

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	f.screen = "large";
	f.scaleFactor = 1;
	f.gameWidth = 1920;	
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
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);
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

			var i;

			this.input.maxPointers = f.numPlayers * f.POINTERS_PER_PLAYER;

			for(i = 0; i < this.input.maxPointers; i++){
				this.game.input.addPointer();
			}

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
