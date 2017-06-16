/*global Phaser, Aura, window, setTimeout, PIXI */

var Aura = {}, // game elements in here
f = {
	POINTERS_PER_PLAYER: 1, // How many fingers required for gestures?
	MAX_PLAYERS: 8,
	SMALL_SCALE: 0.53,
	CONSECUTIVE_PLAYER_NUMS: true,
	SCORE_PANEL_FRAMES: 8,
	SCORE_PANELS_OFFSET_V: 48,
	NUM_LEVELS: 1,
	LEVEL_DURATION: 40000,
	DZ_SCALE_INC: 1/10000,
	PANEL_DELAY: 750,// Allow results to get out of the way
	LEVEL_PANEL_DELAY: 500,// Show level over before scores
	SCORE_PANEL_DELAY: 100,// stagger timing of panels
	SCORE_TWEEN_DURATION: 66,
	LEVEL_FADE_DURATION: 1000,
	COUNTDOWN_DELAY: 1400,// Adjust arrival of countdown to coincide with removal of panels
	// f.levelBreakDuration set below - after f.players array is initialised
	NUM_COUNTDOWN_ELMTS: 3,
	FINAL_RESULTS_DUR: 2000,	
	REGISTERED_DUR: 8000,
	MAX_INERTIA: 5,
	HOMEZONE_ALPHA: 0.5,
	HOMEZONE_DEFENCE_ZONE: 250,
	HOMEZONE_DEFENCE_DELAY: 1000,
	SPIRAL_SCORE_VAL: 5,

	players: [],
	discValues: [20, 40, 60],
	discPositions: [],
	hzfgScales: [1, 0.85, 0.7],
	difficulty: [1, 2, 3],
	stationaryDiscZap: true,
	timers: [],
	level: 0,
	endLevelSignal: new Phaser.Signal(),
	newLevelSignal: new Phaser.Signal(),
	levelCountDownSignal: new Phaser.Signal(),
	levelOver: false,
	hzPanels: [],
	frame: 0,
	boundsLines: [		
	],
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
	getTolerance: function (disc) {
		"use strict";
    	// Discs are assigned a player when registered with homezone
    	return disc.player ? f.discHaloWH/2 : f.discWH/2;
    },
	getNewRowPositions: (function () {

		"use strict";

		var getRowPositions = function (currRows, nextHigher) {
    		var currY,
	    		discOffset = f.discWH * 1.2,
	    		discYOffset,
	    		len = f.initialDiscs,
	    		currX = f.HALF_WIDTH - (discOffset * (len - 1)/2),
	    		currPos,
	    		row = [],
	    		i;
	    		
			if(currRows > 0){
				discYOffset = discOffset;	
			} else {
				discYOffset = nextHigher ? discOffset * -1 : discOffset;
			}
			if(f.discPositions.length > 0){
				currY = f.discPositions[f.discPositions.length -1].y + discYOffset;	
			} else {
				currY = f.HALF_HEIGHT;
			}

			for(i = 0; i < len; i++) {
				currPos = new Phaser.Point(currX, currY);
				row.push(currPos);
				f.discPositions.push(currPos);
				currX += discOffset;
			}
			return row;
    	};

		return function () {
    		var numPositions = f.discPositions.length || 0,
    		currRows = Math.floor(f.discPositions.length/f.initialDiscs),
    		nextHigher = numPositions === 0 ? false : f.discPositions[f.discPositions.length -1].y - f.HALF_HEIGHT > 0;
    		return getRowPositions(currRows, nextHigher);
    	};
   	}())	
};


(function () {

	"use strict";

	// store asset dimensions as key/value pairs
	// Using production screen size for value
	var assetListing,	
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
		for(i=0; i < f.MAX_PLAYERS; i++) {
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
	};

	f.getHypotenuse = function (width, height) {
		var h = height || width;
		return Math.sqrt(Math.pow(width, 2) + Math.pow(h, 2));
	};
	f.getWorldPos = function (childElmt) {
		// Takes a displayObject, returns a point

		// get childElmt position relative to its parent
		var childAnchor = childElmt.toLocal({x: childElmt.x, y: childElmt.y}, childElmt.parent);

		// get childElmt position relative to game
		return childElmt.toGlobal({x: childAnchor.x, y: childAnchor.y});
	};
	f.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	/*
	 * Returns timer calling the given func on the given object. 
	 * If repeat is true, it will fire multiple times
	 * If delay is a number, it will repeat at the given interval.
	 * If delay is an object in the form {min: 0, max: 1000}. it will fire
	 * after a random interval with the given time range.  
	 * Parameters:
	 * obj: Object
	 * func: String
	 * delay: Number/Object in the form {min: 0, max: 1000}
	 * repeat: Nunber
	 * args: Array
	 */
	f.getTimer = function (obj, func, delay, repeat, args) {
		var timer = Aura.game.time.create(false),
		timeout = typeof delay === 'number' ? delay : f.getRandomInt(delay.min, delay.max),
		timeoutFunc = function() {
			obj[func].apply(obj, args);
			if(repeat){
				f.getTimer(obj, func, delay, repeat, args);
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
		// returned timer now has timersIndex property - this timer's index number in the f.timers array
		timer.timersIndex = f.timers.push(timer)-1;
		timer.start();

		return timer;
	};
	f.getBounceAngle = function(currentRotation) {
		return - currentRotation + Math.PI;
	};
	f.HomeZoneGroup = function (game) {

		// Extend Phaser.Group
        Phaser.Group.call(this, game);
    };
    f.HomeZoneGroup.prototype = Object.create(Phaser.Group.prototype);
    f.HomeZoneGroup.prototype.constructor = f.HomeZoneGroup;
    f.HomeZoneGroup.prototype.defensiveZapCallback = function (zone) {
		zone.defended = false;
	};
    f.HomeZoneGroup.prototype.onDefensiveZap = function() {
		this.defended = true;
		setTimeout(this.defensiveZapCallback, f.HOMEZONE_DEFENCE_DELAY, this);
	};	

	f.DragZone = function(game, x, y){

		Phaser.Sprite.call(this, game, x, y, 'dragZone');
		this.anchor.setTo(0.5, 0.5);
		this.active = true;
		f.endLevelSignal.add(this.endLevel, this);		
		this.alpha = 0.4;
		this.scale.x = 0.73;
		this.scale.y = 0.73;
	};
	f.DragZone.prototype = Object.create(Phaser.Sprite.prototype);
	f.DragZone.prototype.constructor = f.DragZone;
	f.DragZone.prototype.update = function () {
		if(this.active) {
			this.scale.x = this.scale.x = this.scale.x - f.DZ_SCALE_INC;
			this.scale.y = this.scale.y = this.scale.y - f.DZ_SCALE_INC;			
		}
	};
	f.DragZone.prototype.endLevel = function () {
		this.active = false;
	};


	f.HomeZonePanel = function (game, x, y, key){
		Phaser.Sprite.call(this, game, x, y, key);
		this.startLevelTween = Aura.game.add.tween(this).to( {alpha: 1}, f.LEVEL_FADE_DURATION * 0.35, Phaser.Easing.Quadratic.In, false);
		this.endLevelTween = Aura.game.add.tween(this).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
		this.reloadTween = Aura.game.add.tween(this).to( {alpha: f.HOMEZONE_ALPHA}, f.LOAD_DUR, Phaser.Easing.Quintic.In, false);	
		this.expulsionTween = Aura.game.add.tween(this).to( {angle: this.angle + 270}, 1000, Phaser.Easing.Quintic.In, false);
		this.expulsionTween.onComplete.add(this.expel, this);

		this.anchor.setTo(0.5, 0.5);
		this.isHomeZone = true;	
		this.angle = 180;
		this.alpha = f.HOMEZONE_ALPHA;
		this.countdownTimer = Aura.game.time.create(false);
		this.pulseNum = 0;
		f.timers.push(this.countdownTimer);


		f.endLevelSignal.add(this.endLevel, this);	
		f.levelCountDownSignal.add(this.endLevelCountdown, this);


		f.newLevelSignal.add(this.newLevel, this);
	};
	f.HomeZonePanel.prototype = Object.create(Phaser.Sprite.prototype);
	f.HomeZonePanel.prototype.constructor = f.HomeZonePanel;
	f.HomeZonePanel.prototype.newLevel = function () {
		var fgSprite = this.parent.getAt(1);
		this.faded = false;
		fgSprite.scale.x = f.hzfgScales[f.level];
		fgSprite.scale.y = fgSprite.scale.x;
		this.startLevelFGTween = this.startLevelFGTween || Aura.game.add.tween(fgSprite).to( {alpha: 1}, f.LEVEL_FADE_DURATION * 0.35, Phaser.Easing.Quadratic.In, false);
		this.startLevelTween.start();
		this.startLevelFGTween.start();
	};
	f.HomeZonePanel.prototype.endLevel = function () {	
		this.expellee = null;
		this.parent.hzfgThrob.throbOnTween.stop();
		this.parent.hzfgThrob.alpha = 0;
		this.endLevelFGTween = this.endLevelFGTween || Aura.game.add.tween(this.parent.getAt(1)).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
		this.endLevelTween.start();
		this.endLevelFGTween.start();
	};
	f.HomeZonePanel.prototype.endLevelCountdown = function () {
		if(this.pulseNum < 3) {
			this.pulseOn();
			f.sound[14].play();
			this.countdownTimer.add(500, this.pulseOff, this);	
			this.countdownTimer.start();	
			this.pulseNum ++;	
		} else {
			this.countdownTimer.stop();
			this.pulseNum = 0;
			f.endLevel();
		}
	};
	f.HomeZonePanel.prototype.pulseOn = function () {
		this.fgSprite = this.fgSprite || this.parent.getAt(1);
		this.offFrame = this.offFrame || this.fgSprite.frame;
		this.fgSprite.frame = 8;
	};
	f.HomeZonePanel.prototype.pulseOff = function () {
		this.fgSprite.frame = this.offFrame;
		this.countdownTimer.add(600, this.endLevelCountdown, this);
	};
	f.HomeZonePanel.prototype.expel = function () {
		if(!f.levelOver && this.expellee) {
			this.expellee.exitHomeZone();
		}
	};
	f.HomeZonePanel.prototype.startExpulsion = function (disc) {
		if(!f.levelOver){
			disc.expeller = this;
			this.expellee = disc;
			disc.halo.scoreTween.start();
			this.expulsionTween.start();
			
			if(disc.target && disc.target.parent && disc.target.parent.hzfgThrob) {
				disc.target.parent.hzfgThrob.throbOnTween.start();	
			}				
		}		
	};
	f.Disc = function (game, x, y, key, haloGroup){
		Phaser.Sprite.call(this, game, x, y, key);

		this.acceleration = 0.95;
		this.anchor.setTo(0.5, 0.5);
		this.inputEnabled = true;		
		this.events.onInputDown.add(this.onCapture, this);
		this.events.onInputUp.add(this.onRelease, this);
		this.target = null;
		this.rotDir = null;
		this.radius = this.width/2;
		this.isDisc = true;		
		this.halo = Aura.game.add.sprite(x, y, 'halo');
		this.halo.anchor.setTo(0.5, 0.5);
		this.halo.blendMode = PIXI.blendModes.SCREEN;
		this.scoreLineCol = '0xFFFFFF';
		this.halo.alpha = 0;
		this.halo.alphaTween = Aura.game.add.tween(this.halo).to( {alpha: 0.8}, 100, Phaser.Easing.Linear.In, false);
		this.halo.alphaOutTween = Aura.game.add.tween(this.halo).to( {alpha: 0}, 350, Phaser.Easing.Linear.In, false);
		this.halo.scoreTween = Aura.game.add.tween(this.halo.scale).to( {x: 0, y: 0}, 1000, Phaser.Easing.Quintic.In, false);
		this.halo.scoreTween.onComplete.add(this.scoreTweenCallback, this);
		this.deflectSound = this.game.add.audio('discDiscColl');
		this.deflectSound.volume = 0.5;
		this.bounceSound = this.game.add.audio('bounce');
		this.bounceSound.volume = 0.7;
		this.deflectors = [];
		this.positions = [];	
		this.defaultHitArea = 130;	
		haloGroup.add(this.halo);
		f.endLevelSignal.add(this.endLevel, this);
	};
	f.Disc.prototype = Object.create(Phaser.Sprite.prototype);
	f.Disc.prototype.constructor = f.Disc;
	f.Disc.prototype.init = function () {
		this.exists = true;
		this.draggable = true;
		this.fired = false;	
		this.target = null;
		this.player = null;
		this.scoring = false;
		this.deflection = false; // false or Point Object
		this.pointer = undefined;
		this.halo.exists = true;
		this.halo.alpha = 0;
		this.halo.scale.x = 1;
		this.halo.scale.y = 1;
		this.rotDir = null;
		this.expelTimer = null;
		this.expeller = null;
		this.bounceSoundPlayed = false;
		this.deflectors = [];
		// initalMomentum is added to disc when released or deflected
		this.initialMomentum = 1.5;
		this.preWrapDelta = false;
		// Size of hitArea will increase with speed, so fast-moving discs are easier to capture.
		// Specifying a hitArea also optimises the hitTest function that the interactionManager will use 
		// (as it will not need to hit test all the children)
		this.hitArea = new Phaser.Circle(0, 0, this.defaultHitArea, this.defaultHitArea);
	};
	f.Disc.prototype.onBoundsTimeout = function () {
		this.exitHomeZone();
	};
	f.Disc.prototype.endLevel = function () {
		if(this.registeredTimer){
			this.registeredTimer.destroy();
			this.registeredTimer = null;
		}
		this.expeller = null;
		this.exists = false;
	};
	f.Disc.prototype.checkNumDiscs = function () {
		if(f.level < f.discValues.length && f.discGroup.length > f.initialDiscs)	{
			this.halo.destroy();
			this.destroy();
		}
	};
	f.Disc.prototype.onCapture = function (eTarget, pointer) {
		if(!this.scoring){		
			this.pointer = pointer;
			this.pointerOffsetX = this.x - pointer.x;
			this.pointerOffsetY = this.y - pointer.y;
			this.deflection = false;
			this.fired = false;	
			if(!this.registrationZone){	
				this.unregisterPlayer();
			}
			if(this.expelTimer){
				this.expelTimer.stop();
				this.expelTimer = null;
			}
			f.sound[10].play();
		}				
	};
	f.Disc.prototype.onRelease = function (eTarget, pointer) {
		this.pointer = undefined;
		if(pointer.withinGame){
			this.shotPosition = new Phaser.Point(this.world.x, this.world.y);
			this.fired = true;
			// momentum added for initial speed boost
			this.momentum = this.initialMomentum;
		}
	};
	f.Disc.prototype.scoreTweenCallback = function () {
		this.scoring = false;
		this.halo.alpha = 0;
		this.halo.scale.x = 1;
		this.halo.scale.y = 1;
	};
	f.Disc.prototype.onSpiralComplete = function () {
		this.scoring = true;
		this.expelTimer = f.getTimer(this.target, 'startExpulsion', 500, false, [this]);
		f.sound[9].stop();
		if(!f.levelOver){
			f.sound[6].play();
		}
	};
	f.Disc.prototype.getScoreBubble = function (pos, scoringZone) {
		var recycledBubble = f.scoreBubbleGroup.getFirstExists(false);

		if(!recycledBubble) { // No existing Bubble available - make new
			recycledBubble = new f.ScoreBubble(Aura.game, pos.x, pos.y, 'halo');
		}
		else{ // Use existing Bubble
			recycledBubble.x = pos.x;
			recycledBubble.y = pos.y;
		}
		recycledBubble.init(scoringZone);
		return recycledBubble;
	};
	f.Disc.prototype.onScore = function () {
		var haloScale = this.halo.scale.x,
			scoreVal = f.level < 1 ? 1 : 2,
			scoringZone,
			scoreBubble;

		if(haloScale < 0.999 && this.nowScoring < f.discValues[f.level]){
			if(this.player){
				this.nowScoring += scoreVal;
				this.player.updateScore(scoreVal);
				scoringZone = this.player.homeZone;
				scoreBubble = this.getScoreBubble({x: this.world.x, y: this.world.y}, this.player.homeZone);
				scoreBubble.frame = this.player.homeZone.parent.hzfg.frame;
				f.scoreBubbleGroup.add(scoreBubble);
			}
		}		
	};
	f.Disc.prototype.unregisterPlayer = function () {
		if(this.player){
			this.player = null;
			this.halo.alphaOutTween.start();
		}
	};
	f.Disc.prototype.endRegisteredPeriod = function () {
		this.unregisterPlayer();
	};
	f.Disc.prototype.registerPlayer = function (zone) {
		this.player = zone.player;
		if(!this.registrationZone){
			this.halo.frame = f.freePlay ? zone.parent.hzfg.frame : this.player.team;			
			this.halo.alphaTween.start();
			f.sound[4].play();
			if(this.registeredTimer){
				// Remove timer from events and f.timers Array 
				this.registeredTimer.removeAll();
				f.timers.splice(this.registeredTimer.timersIndex, 1);
				this.registeredTimer.destroy();
				this.registeredTimer = null;
			}
			this.registeredTimer = f.getTimer(this, 'endRegisteredPeriod', f.REGISTERED_DUR);
			zone.parent.hzfgThrob.throbOnTween.start();
			// registrationZone is used to determine if disc has been released
			// while still in its registered player's zone 
			this.registrationZone = zone;
		}
	};
	f.Disc.prototype.onHomeZoneHit = function (zone, onTarget) {
		if(this.fired) {
			this.target = onTarget ? zone : null;
		}
		else{
			this.target = null;		
			this.registerPlayer(zone);					
		}
	};
	f.Disc.prototype.onDeflect = (function () {
		var angle,
			dist,
			posLine,
			newPos,				
			newHaloCollision = (function () {
				var checkHalo = function (collider, dist) {
					return collider.halo.alpha > 0 && dist < collider.halo.width/2;
				};
				return function (collider1, collider2) {
					return checkHalo(collider1, dist) || checkHalo(collider2, dist);
				};
			}()),
			getDeflection = function (that, deflector) {
				var thatDist = that.position.distance(that.previousPosition),
				deflectorDist = deflector.position.distance(deflector.previousPosition);
				if(newHaloCollision(that, deflector, deflectorDist)){ 
					// Discs now collide due to newly added halo
					deflectorDist = deflector.halo.width/40;
				}
				return Math.abs(thatDist - deflectorDist);				
			};
		return function (deflector) {
			angle = this.position.angle(deflector.position);
			dist = deflector.isDisc ? getDeflection(this, deflector) : deflector.deflection;
			posLine = new Phaser.Line().fromAngle(this.x, this.y, angle, dist);
			newPos = posLine.end;

			// momentum less than 1 to damp deflection
			this.momentum = 0.9;
			if(f.stationaryDiscZap){
				this.fired = true;
			}
			this.deflectors.push(deflector);
			this.deflection = {x: this.x - newPos.x, y: this.y - newPos.y};
			if(!this.deflectSound.isPlaying){
				this.deflectSound.play();	
			}
		};
	}());
	f.Disc.prototype.unCollide = function (collider) {
		var angle = this.position.angle(collider.position),
		dist = this.position.distance(collider.position),
		newPos = new Phaser.Line().fromAngle(this.x, this.y, angle, dist * - 1).end;
		this.x = newPos.x;
		this.y = newPos.y;
	};
	f.Disc.prototype.hasChanged = function (delta) {
		// returns true if more than 1 form zero
		// return 1 - Math.abs(this[delta]) > 0;
		return this[delta] < -0.1 || this[delta] > 0.1; 
	};
	f.Disc.prototype.inMotion = function () {
		// We only deflect moving discs
		return this.hasChanged('deltaX')  || this.hasChanged('deltaY');
	};
	f.Disc.prototype.onHit = function (collider, onTarget) {
		if(collider.isHomeZone){
			this.onHomeZoneHit(collider, onTarget);
		} else{
			if(this.deflectors.indexOf(collider) >= 0) {
				this.unCollide(collider);
			} else if(this.inMotion()) {
				this.onDeflect(collider);	
			}
		}				
	};
	f.Disc.prototype.resetPosition = (function () {
		var getPosition = function (positions) {
			var ilen = positions.length,
			jlen = f.discGroup.length,
			currPos,
			currDisc,
			currDiscTolerance;

			for(i = 0; i < ilen; i++){
				currPos = positions[i];
				for(j = 0; j < jlen; j++){
					currDisc = f.discGroup.getAt(j);
					currDiscTolerance = f.getTolerance(currDisc);
					if(currPos.distance(currDisc) < currDiscTolerance + f.discWH/2) {
						break;
					} 
					if (j === jlen - 1) {
						return currPos;
					}
				}
			}
			// No positions available, make a new row
			return getPosition(f.getNewRowPositions());
		};
		return function () {
			var newPosition = getPosition(f.discPositions);			
			this.x = newPosition.x;
			this.y = newPosition.y;
		};
	}());
	f.Disc.prototype.exitHomeZone = function () {		
		this.init();
		this.halo.scale.x = 1;
		this.halo.scale.y = 1;
		this.halo.position = this.position;
		this.resetPosition();
		f.sound[2].play();						
	};
	f.Disc.prototype.onExitHomeZone = function () {
		this.registrationZone = null;
		this.rotDir = null;
		this.target = null;
		this.exiting = false;
		this.expelTimer = null;
		this.scoring = false;
		this.nowScoring = 0;
	};
	f.Disc.prototype.removeSound = function () {
		this.deflectSound.stop();		
		this.deflectSound = null;
		this.bounceSound.stop();
		this.bounceSound = null;
	};
	f.Disc.prototype.preventDrag = function () {
		this.draggable = false;
		// this.unregisterPlayer();
	};
	f.Disc.prototype.update = (function () {

		var getIntersection = function (that) {
			var intersection, boundsFinder, i, result;

			// In the event of an extremely fast shot, disc may have left the screen.
			// In this case, boundsFinder will intersect with two edges.
			// To ensure we have the correct intersection, we use the one furthest from our current position			

			boundsFinder = new Phaser.Line().fromAngle(that.x, that.y, that.position.angle(that.previousPosition), f.gameWidth * f.gameHeight);
			for(i = 0; i < 4; i++) {
				result = boundsFinder.intersects(f.boundsLines[i]);
				if(result) {
					intersection = intersection && that.position.distance(intersection) > that.position.distance(result) ? intersection : result;
				}
			}
			return intersection;
		},
		getYcornerPos = function (atBounds) {
			if(atBounds.top) {
				return f.gameHeight;
			}
			if(atBounds.bottom) {
				return 0;
			}
			return false;
		},
		getCornerWrap = function (atBounds) {
			var yPosCorner = getYcornerPos(atBounds); 
			if(yPosCorner) {
				if(atBounds.left){
					return {x: f.gameWidth, y: yPosCorner};
				}
				if(atBounds.right){
					return {x: 0, y: yPosCorner};
				}
			} 
			return false;			
		},
		getFreePosition = function (that) {
			var dx,
				dy,
				newOffsetX,
				newOffsetY,
				currMomentum,
				tolerance = that.player ? f.discHaloWH/2 : f.discWH/2,
				hitAreaSize,
				cornerWrap,
				atBounds = {
					left: that.x - tolerance < 0, 
					right: that.x + tolerance > f.gameWidth, 
					top: that.y - tolerance < 0, 
					bottom: that.y + tolerance > f.gameHeight
				};

			if(that.deflection) {
				dx = that.deflection.x;
				dy = that.deflection.y;
				that.deflection = false;
			}
			else if(that.exiting){
				// if exiting homeZone, that.exiting is object with properties for dx and dy OR Boolean false
				dx = that.exiting.dx;
				dy = that.exiting.dy;
			}
			else{				
				if(that.preWrapDelta) {
					// Disc has wrapped from other side of screen
					dx = that.preWrapDelta.x;
					dy = that.preWrapDelta.y;
				} else {
					dx = that.deltaX;
					dy = that.deltaY;
				}		
			}			
			if(atBounds.left || atBounds.right || atBounds.top || atBounds.bottom) {
				if(!that.preWrapDelta){
					// Have just entered edge zone - store delta data so we can continue on same bearing after wrapping
					that.preWrapDelta = {x: that.deltaX, y: that.deltaY};
					cornerWrap = getCornerWrap(atBounds, that);
					return cornerWrap || getIntersection(that);					
				}
			} else {
				// Have just left edge zone - remove delta data
				that.preWrapDelta = false;	
			}
			// assigning to currentMomentum so we can use unaltered momentum value in return expression 
			// after reducing value of momentum  
			currMomentum = that.momentum;
			if(that.momentum > 1) {
				that.momentum -= 0.09;	
			}
			newOffsetX = dx * that.acceleration * currMomentum;
			newOffsetY = dy * that.acceleration * currMomentum;
			hitAreaSize = Math.abs(newOffsetX + newOffsetY);
			that.hitArea = Math.max(new Phaser.Circle(0, 0, that.defaultHitArea, that.defaultHitArea), new Phaser.Circle(0, 0, hitAreaSize, hitAreaSize));
			return {x: that.x + newOffsetX, y: that.y + newOffsetY};
		},
		goClockwise = function (that) {
			var zone = that.target,
			zoneWorldPos = new Phaser.Point(zone.world.x, zone.world.y),
			thatWorldPos = new Phaser.Point(that.world.x, that.world.y),
			lineOfApproach = new Phaser.Line().fromAngle(that.shotPosition.x, that.shotPosition.y, that.shotPosition.angle(thatWorldPos), that.shotPosition.distance(thatWorldPos) + zone.width),
			pt0 = lineOfApproach.start,
			pt1 = lineOfApproach.end,
			pt2 = zoneWorldPos;
			return ((pt1.x - pt0.x) * (pt2.y - pt0.y)) - ((pt2.x - pt0.x) * (pt1.y - pt0.y)) > 0;
		},
		getInZonePosition = function (that) {	
			var targetWorldPos = new Phaser.Point(that.target.world.x, that.target.world.y),
			ang = targetWorldPos.angle(that.position),
			dist = targetWorldPos.distance(that.position)-1;// check previous angle

			if(that.rotDir === null){
				that.rotDir = goClockwise(that) ? 1 : -1;
			}
			if(dist < 0 && !that.expelTimer){
				that.onSpiralComplete();				
			}			
			return new Phaser.Line().fromAngle(targetWorldPos.x, targetWorldPos.y, ang + (0.4 * that.rotDir), dist).end;
		},
		successfulShot = (function () {
			var friendlyZone = function (that) {
				if(!f.freePlay) {
					return that.target.player.team === that.player.team;
				}
				return false;
			};
			return function (that) {
				return that.target && !that.registrationZone &&!that.exiting && that.player && that.target !== that.player.homeZone && !friendlyZone(that);
			};
		
		}()),
		getFiredPosition = function (that){
			var spiralling = successfulShot(that),
			scoreBubble;
			if(!f.levelOver && spiralling){				
				if(!f.sound[9].isPlaying && !that.scoring){
					f.sound[9].play();
					scoreBubble = that.getScoreBubble({x: that.world.x, y: that.world.y}, that.player.homeZone);
					scoreBubble.spiralScore = true;
					scoreBubble.player = that.player;
					scoreBubble.frame = that.player.homeZone.parent.hzfg.frame;
					f.scoreBubbleGroup.add(scoreBubble);
					f.sound[12].play();
				}
				return getInZonePosition(that);
			}
			return getFreePosition(that);
		},
		getDraggedPosition = function (that) {			
			var pos;
			if(!that.inertia){
				that.inertia = f.MAX_INERTIA;
			}				
			pos = {x: that.x + (that.pointer.x - that.x)/that.inertia, y: that.y + (that.pointer.y - that.y)/that.inertia};
			that.inertia = that.inertia > 0 ? that.interia - 2 : 0;
			return pos;
		},
		updatePosition = function (that, fired) {
			var pos = fired === true ? getFiredPosition(that) : getDraggedPosition(that);	
			if(pos) {
				that.x = pos.x;
				that.y = pos.y;
				that.halo.x = pos.x;
				that.halo.y = pos.y;
			}				
		},
		withinDragZone = function (that) {
			return that.world.distance(that.player.homeZone.parent.dragZone.world) + that.width/2 <  that.player.homeZone.parent.dragZone.width/2;
		};
		return function () {
			if(f.gameStarted && !this.inWorld) {
				// Out of play
				this.onBoundsTimeout();
			}
			if(this.fired){
				// Disc has been released or fired
				this.draggable = true;
				updatePosition(this, true);
			} else if(this.pointer && this.draggable){
				// disc has been touched/is being dragged
				if( ! this.player){
					updatePosition(this,false);	
				} else {
					if(withinDragZone(this)){
						updatePosition(this,false);
					} else {
						// Aim here is to become undraggable when registered with player, but outside zone
						this.preventDrag();
					}
				} 				
			} else {
				// Disc is untouched at its start position
				this.hitArea = new Phaser.Circle(0, 0, this.defaultHitArea, this.defaultHitArea);
			}
			if(this.scoring){
				// Disc is transferring score to registered zone
				this.onScore();
			}
		};
	}());

	f.ScoreBubble = function (game, x, y, key){
		Phaser.Sprite.call(this, game, x, y, key);
		
		this.anchor.setTo(0.5, 0.5);
		this.blendMode = PIXI.blendModes.SCREEN;	
	};	
	f.ScoreBubble.prototype = Object.create(Phaser.Sprite.prototype);
	f.ScoreBubble.prototype.constructor = f.ScoreBubble;
	f.ScoreBubble.prototype.init = function (scoringZone) {
		this.spiralScore = false;
		this.scale.x = 0.7;
		this.scale.y = 0.7;
		this.alpha = 1;
		this.exists = true;
		this.setTweens(scoringZone);
	};
	f.ScoreBubble.prototype.onSpiralScore = function () {
		if(this.player){
			this.player.updateScore(f.SPIRAL_SCORE_VAL);
			f.sound[13].play();
		}
	};
	f.ScoreBubble.prototype.setTweens = function (scoringZone) {
		var MIN_SCALE = 0.3,
		SCALE_TWEEN_DUR = 501,
		MIN_ALPHA = 0.3,
		TRANSLATE_TWEEN_DUR = 500;
		this.translateTween = Aura.game.add.tween(this).to({alpha: MIN_ALPHA, x: scoringZone.world.x, y: scoringZone.world.y}, TRANSLATE_TWEEN_DUR, Phaser.Easing.Linear.In, true);
		this.scaleDownTween = Aura.game.add.tween(this.scale).to({x: MIN_SCALE, y: MIN_SCALE}, SCALE_TWEEN_DUR, Phaser.Easing.Linear.In, true);
		this.scaleDownTween.onComplete.add(function () {this.alpha = 0; this.exists = false; if(this.spiralScore){ this.onSpiralScore(); }}, this);
	};

	f.Zapper = function (game, x, y, key){

		var scaleTweenCallback = function () {
			this.frame = 1;
			this.exists = false;
		};
		
		Phaser.Sprite.call(this, game, x, y, key);
		this.blendMode = PIXI.blendModes.SCREEN;
		this.anchor.setTo(0.5, 0.5);
		this.scaleTween = Aura.game.add.tween(this.scale).to({x: 0.5, y: 0.5}, f.ZAP_DURATION * 10, Phaser.Easing.Linear.In, false);
		this.scaleDownTween = Aura.game.add.tween(this.scale).to({x: 0, y: 0}, f.ZAP_DURATION * 10, Phaser.Easing.Linear.In, false);
		this.scaleDownTween.onComplete.add(scaleTweenCallback, this);
		this.scaleTween.chain(this.scaleDownTween);
		this.deflection = 30;

		this.init = function (position) {
			if(position){
				this.x = position.x;
				this.y = position.y;
			}
			this.alpha = 0.5;
			this.exists = true;
			this.scale.x = 0;
			this.scale.y = 0;
			this.frame = 0;
			this.collider = undefined;
			this.scaleTween.start();
		};
		this.init();
	};
	f.Zapper.prototype = Object.create(Phaser.Sprite.prototype);
	f.Zapper.prototype.constructor = f.Zapper;

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

	f.players = [];	
	f.numPlayers = 0;
	for (i = 0; i < f.MAX_PLAYERS; i++) {
		f.players[i] = insertPlayer(i);
	}

	f.initialDiscs = Math.min(5, f.numPlayers -1);
	f.freePlay = !f.teams;
	numPanels = f.freePlay ? f.players.length : f.teams.length;
	f.levelBreakDuration = 2000 + (200 * numPanels);

	f.srx = Math.max(window.innerWidth,window.innerHeight);
	f.sry = Math.min(window.innerWidth,window.innerHeight);
	
	f.screen = "large";

	f.logicWidth = 1920;
	f.logicHeight = 1080;
	f.aspectRatio = f.logicWidth/f.logicHeight;

	// assign elmtWidth now so we can use it to compute value of fruitSheetwidth in assetListing array
	// it gets overwritten by assignAssetSizes()
	f.elmtWidth = Math.floor(f.logicHeight / f.VARIETIES);//135

	assetListing = [
		['scorePanelsWidth', 316],
		['scorePanelsHeight', 2],
		['homeZoneBGWidth', 316],
		['homeZoneBGHeight', 141],
		['hzfgWH', 134],
		['zapWidth', 640],
		['zapHeight', 320],
		['discWH', 84],
		['discHaloWH', 260],		
		['countdownW', 323],
		['countdownH', 179]
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
	f.corners = [
		{x: 0, y: 0, angle: 135 + 180},
		{x: f.gameWidth, y: 0, angle: 225 + 180},
		{x: f.gameWidth, y: f.gameHeight, angle: 315 + 180},
		{x: 0, y: f.gameHeight, angle: 45 + 180}
	];
	f.boundsLines.push(new Phaser.Line(0, 0, f.gameWidth, 0));
	f.boundsLines.push(new Phaser.Line(f.gameWidth, 0, f.gameWidth, f.gameHeight));
	f.boundsLines.push(new Phaser.Line(f.gameWidth, f.gameHeight, 0, f.gameHeight));
	f.boundsLines.push(new Phaser.Line(0, f.gameHeight, 0, 0));
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);
	// For panels which pop up at end of level
	f.SCORE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/92);
	f.TITLE_PANEL_FONT_SIZE = Math.floor(f.gameWidth/82);

	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;
	f.DEG30_AS_RAD = Phaser.Math.degToRad(30);
	f.ZAP_DURATION = 10;

	// For as duration for timer whose frequency increases with level number
	f.EVENT_INTERVALS = [25000 + f.EVENT_DURATION, 5000 + f.EVENT_DURATION, f.EVENT_DURATION];


	///////////////////////////////////////////////////////////
	// DEVELOPMENT ONLY - this logs required assets with sizes

	function logAssetSizes () {
		var i,
		smallSize;

		for(i = 0; i < assetListing.length; i++){
			smallSize = Math.floor(assetListing[i][1] * f.SMALL_SCALE);
			console.log(assetListing[i][0] + ': ' + assetListing[i][1] + ', ' + smallSize + '\n');
		}
	}
	//logAssetSizes();

	///////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////


	// Adjusts asset sizes according to scaleFactor and assigns to variables in Aura
	function assignAssetSizes(assetListing){
		var len = assetListing.length,
		i;
		for (i = 0; i < len; i++){
			f[ assetListing[i][0] ] = Math.floor(assetListing[i][1] * f.scaleFactor);
		}
	}
	assignAssetSizes(assetListing);
	
	Aura.Boot = function () {

	};

	Aura.Boot.prototype = {

	    init: function () {

			var i;

			this.input.maxPointers = f.numPlayers * f.POINTERS_PER_PLAYER;

			for(i = 0; i < this.input.maxPointers; i++){
				this.game.input.addPointer();
			}

	        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
	        this.stage.disableVisibilityChange = true;

	        this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
	        
			this.game.stage.backgroundColor = 0x000000;

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
