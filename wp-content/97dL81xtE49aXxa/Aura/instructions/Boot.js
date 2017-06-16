/*global Phaser, Aura */

var Aura = {}, // game elements in here
f = {
	hzPanels: [],
	hideLogoSignal: new Phaser.Signal(),
	endDemoSignal: new Phaser.Signal(),
	endLevelSignal: new Phaser.Signal(),
	ZAP_DURATION: 10,
	DZ_SCALE_INC: 1/3000,
	shrinkDragZones: false
}; // our members and functions in here

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
	API_players = [null, 'Graham', 'John', 'TerryG', null, 'TerryJ', 'Eric', 'Michael'],
	API_teams = [
		// This should be any empty Array if no teams
		{members: [3, 5, 7], score: 0},
		{members: [1, 2, 6], score: 0}

		// {members: [3, 5, 7], score: 0},
		// {members: [1, 2, 6], score: 0},
		// {members: [0, 4], score: 0}
	];
	f.removeTween = function(_tween) {
		if (_tween) {
			_tween.onComplete.removeAll();
			_tween.stop();
			_tween = null;
		}
    };
    f.removeTweens = function (elmt, tweenNames) {
		// args: Object & Array of tween names
		var i,
		len = tweenNames.length;
		for(i = 0; i < len; i++){
			f.removeTween(elmt[tweenNames[i]]);
		} 
	};
	f.hudZone = function (zoneNum) {
		// returns true if the current zone requires score panels at end of level
		// (the top and bottom of the table only has panels in centre zone)
		return zoneNum > 0 && zoneNum % 2 !== 0;				
	};
	f.showAfterLogo = function (elmt, countdownFunc) {
		elmt.alpha = 0;
		elmt.showTween = Aura.game.add.tween(elmt).to( {alpha: 1}, 1200, Phaser.Easing.Quintic.In, false);
		elmt.hideTween = Aura.game.add.tween(elmt).to( {alpha: 0}, 1200, Phaser.Easing.Quintic.Out, false);
		elmt.hideTween.onComplete.add(function () { f.removeTweens(elmt, 'showTween', 'hideTween');})
		f.hideLogoSignal.add(function(){elmt.showTween.start();}, elmt);
		f.endDemoSignal.add(function(){elmt.hideTween.start();}, elmt);
		if(countdownFunc){
			elmt.hideTween.onComplete.add(function () {countdownFunc.call();});
		}
	};
	f.Tap = function (game, x, y, key, currZone, attack){
		Phaser.Sprite.call(this, game, x, y, key);

		this.anchor.setTo(0.5, 0.5);
		this.scale.x = 1;
		this.scale.y = 1;
		this.alpha = 0.4;
		this.angle = currZone.angle;
		this.tweens = [];
		this.scaleTween = Aura.game.add.tween(this.scale).to({x: 1, y: 1}, 100, Phaser.Easing.Linear.Out, false);
		this.scaleDownTween = Aura.game.add.tween(this.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
		this.scaleDownTween.onComplete.add(function () { f.sound[3].play(); }, this);
		if(attack){
			this.addDemoTweens(currZone);
			this.scaleTween.onComplete.add(function () { makeDemo(this);  }, this, this);
		}				
	};
	f.Tap.prototype = Object.create(Phaser.Sprite.prototype);
	f.Tap.prototype.constructor = f.Tap;
	f.Tap.prototype.addDemoTweens = function (currZone){
		var currZoneSprite = currZone.getAt(0),
			currZoneSpritePos = new Phaser.Point(currZoneSprite.world.x, currZoneSprite.world.y),
			flingTarget = f.homeZones.getAt(currZone.flingTarget).getAt(0),
			flingTargetPosition = new Phaser.Point(flingTarget.world.x, flingTarget.world.y),
			flingPoint = new Phaser.Line().fromAngle(currZoneSpritePos.x, currZoneSpritePos.y, currZoneSpritePos.angle(flingTargetPosition), currZoneSpritePos.distance(flingTargetPosition)*0.2).end;

		this.captureTween = Aura.game.add.tween(this).to( {x: currZone.disc.x, y: currZone.disc.y}, 1000, Phaser.Easing.Cubic.InOut, true);
		this.registerTween = Aura.game.add.tween(this).to( {x: this.x, y: this.y}, 1100, Phaser.Easing.Cubic.InOut, false );
		this.pauseTween = Aura.game.add.tween(this).to({}, 1000, Phaser.Easing.Linear.InOut, false);
		this.flingTween = Aura.game.add.tween(this).to( {x: flingPoint.x, y: flingPoint.y}, 400, Phaser.Easing.Back.In, false );
		this.discReleaseTween = Aura.game.add.tween(currZone.disc).to({x: flingTargetPosition.x, y: flingTargetPosition.y}, 300, Phaser.Easing.Quadratic.Out, false);
		this.pause1Tween = Aura.game.add.tween(this).to({}, 1000, Phaser.Easing.Linear.InOut, false);

		this.captureTween.onComplete.add(function () {f.sound[0].play(); currZone.disc.pointer = currZone.tap;}, this);
		this.registerTween.onComplete.add(function () {currZone.disc.onRegister();}, this);
		this.flingTween.onComplete.add(function () {currZone.disc.onRelease();}, this);
		this.pause1Tween.onComplete.add(function () {currZone.disc.onScore();}, this);

		this.captureTween.chain(this.registerTween, this.pauseTween, this.flingTween, this.discReleaseTween, this.pause1Tween);							
	};
	f.Zapper = function (game, x, y, key){

		var scaleTweenCallback = function () {
			this.frame = 1;
			this.exists = false;
		},
		completeCallback = function () {
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
			f.sound[4].play();
		};
		this.init();
	};
	f.Zapper.prototype = Object.create(Phaser.Sprite.prototype);
	f.Zapper.prototype.constructor = f.Zapper;
	f.DragZone = function(game, x, y){

		Phaser.Sprite.call(this, game, x, y, 'dragZone');
		this.anchor.setTo(0.5, 0.5);
		f.endLevelSignal.add(this.endLevel, this);		
		this.alpha = 0.4;
		this.scale.x = 0.73;
		this.scale.y = 0.73;
	};
	f.DragZone.prototype = Object.create(Phaser.Sprite.prototype);
	f.DragZone.prototype.constructor = f.DragZone;
	f.DragZone.prototype.update = function () {
		if(f.shrinkDragZones) {
			this.scale.x = this.scale.x = this.scale.x - f.DZ_SCALE_INC;
			this.scale.y = this.scale.y = this.scale.y - f.DZ_SCALE_INC;			
		}
	};
	f.DragZone.prototype.endLevel = function () {
		f.shrinkDragZones = false;
	};

	f.Disc = function (game, x, y, key, zoneNum){
		Phaser.Sprite.call(this, game, x, y, key);

		this.zoneNum = zoneNum;
		this.anchor.setTo(0.5, 0.5);
		this.startPosition = new Phaser.Point(x, y);
		this.scaleDownTween = Aura.game.add.tween(this.scale).to( {x: 0, y: 0}, 200, Phaser.Easing.Linear.In, false);
		this.scaleUpTween = Aura.game.add.tween(this.scale).to( {x: 1, y: 1}, 100, Phaser.Easing.Linear.In, false);
		this.scaleDownTween.onComplete.add(this.scaleDownCallback, this);
		this.scaleDownTween.onComplete.add(this.scaleDownCallback, this);
		this.scaleUpTween.onComplete.add(this.scaleUpCallback, this);
		this.halo = Aura.game.add.sprite(x, y, 'halo');
		this.halo.anchor.setTo(0.5, 0.5);
		this.halo.blendMode = PIXI.blendModes.SCREEN;
		this.halo.alpha = 0;
		this.halo.alphaTween = Aura.game.add.tween(this.halo).to( {alpha: 0.8}, 100, Phaser.Easing.Linear.In, false);
		this.halo.alphaOutTween = Aura.game.add.tween(this.halo).to( {alpha: 0}, 350, Phaser.Easing.Linear.In, false);
		this.haloSound = this.game.add.audio('halo');
		this.haloSound.volume = 0.25;
		f.haloGroup.add(this.halo);
	};
	f.Disc.prototype = Object.create(Phaser.Sprite.prototype);
	f.Disc.prototype.constructor = f.Disc;
	f.Disc.prototype.update = function () {
		var reboundPos,
		currZoneSprite,
		currZoneSpritePos;

		this.halo.x = this.x;
		this.halo.y = this.y;
		if(this.pointer && !this.released){
			this.x = this.pointer.x;
			this.y = this.pointer.y;
		}
		if(this.zapper){
			if(!this.rebounding && this.position.distance(this.zapper.position) < (this.halo.width/2) + (this.zapper.width/2)){
				this.rebounding = true;
				this.pointer = null;
				this.postZapTween.stop();
				this.halo.alphaOutTween.start();
				currZoneSprite = f.homeZones.getAt(this.zoneNum).getAt(0);
				currZoneSpritePos = new Phaser.Point(currZoneSprite.world.x, currZoneSprite.world.y);
				reboundPos = new Phaser.Line().fromAngle(currZoneSpritePos.x, currZoneSpritePos.y, currZoneSpritePos.angle(this.flingTargetPosition) + Math.PI, currZoneSpritePos.distance(this.flingTargetPosition)).end;				
				this.reboundTween = Aura.game.add.tween(this).to({x: reboundPos.x, y: reboundPos.y}, 600, Phaser.Easing.Linear.InOut, true);
				this.reboundTween.onComplete.add(function () { if(!f.demoOver){f.demoOver = true; f.endDemoSignal.dispatch(this);}}, this);
			}
		}
	};
	f.Disc.prototype.onRegister = function () {
		this.halo.alphaTween.start();
		this.haloSound.play();
	};
	f.Disc.prototype.onRelease = function () {
		this.released = true;
	};
	f.Disc.prototype.scaleDownCallback = function () {
		this.x = this.startPosition.x;
		this.y = this.startPosition.y;
		if(f.homeZones.getAt(this.zoneNum).attackingZone){
			this.released = false;
			this.pointer = null;
			this.scaleUpTween.start();	
		}
		else{			
			f.removeTweens(this.pointer, 'captureTween', 'registerTween', 'pauseTween', 'flingTween', 'discReleaseTween', 'pause1Tween');
			this.pointer = null;
			f.homeZones.getAt(this.zoneNum).tap.destroy();
			this.destroy();
		}		
	};		
	f.Disc.prototype.scaleUpCallback = function () {
		var currZone = f.homeZones.getAt(this.zoneNum).getAt(0),
		currZoneSpritePos = new Phaser.Point(currZone.world.x, currZone.world.y),
		flingTarget = this.flingTargetPosition = f.homeZones.getAt(currZone.parent.attackingZone).getAt(0),
		flingTargetPosition = new Phaser.Point(flingTarget.world.x, flingTarget.world.y),
		zapPoint = new Phaser.Line().fromAngle(currZoneSpritePos.x, currZoneSpritePos.y, currZoneSpritePos.angle(flingTargetPosition), currZoneSpritePos.distance(flingTargetPosition) * 0.65).end,
		zapperPos = new Phaser.Line().fromAngle(currZoneSpritePos.x, currZoneSpritePos.y, currZoneSpritePos.angle(flingTargetPosition), currZoneSpritePos.distance(flingTargetPosition) * 0.75).end,
		flingPoint = new Phaser.Line().fromAngle(currZoneSpritePos.x, currZoneSpritePos.y, currZoneSpritePos.angle(flingTargetPosition), currZoneSpritePos.distance(flingTargetPosition) * 0.2).end,
		defensiveTapAdj = this.zoneNum === 1 ? 1 : -1;
		
		this.defensiveTap = new f.Tap(Aura.game, zapperPos.x + (10 * defensiveTapAdj), zapperPos.y + (10 * defensiveTapAdj), 'tap', currZone);
		this.defensiveTapTween = Aura.game.add.tween(this.defensiveTap).to({x: zapperPos.x, y: zapperPos.y}, 400, Phaser.Easing.Quintic.In, false);
		this.defensiveTap.angle = -90 * defensiveTapAdj;
		f.tapGroup.add(this.defensiveTap);
		this.defencePointer = f.tapGroup.getChildAt(f.discGroup.getChildIndex(this));
		f.tapGroup.add(this.defencePointer);
		
		this.defenceCaptureTween = Aura.game.add.tween(this.defencePointer).to( {x: this.x, y: this.y}, 400, Phaser.Easing.Cubic.InOut, true);
		this.defenceRegisterTween = Aura.game.add.tween(this.defencePointer).to( {x: currZone.world.x, y: currZone.world.y}, 500, Phaser.Easing.Cubic.InOut, false );
		this.pauseTween = Aura.game.add.tween(this.defencePointer).to({}, 200, Phaser.Easing.Linear.InOut, false);
		this.flingTween = Aura.game.add.tween(this.defencePointer).to( {x: flingPoint.x, y: flingPoint.y}, 400, Phaser.Easing.Back.In, false );
		this.discReleaseTween = Aura.game.add.tween(this).to({x: zapPoint.x, y: zapPoint.y}, 300, Phaser.Easing.Linear.InOut, false);
		this.postZapTween = Aura.game.add.tween(this).to({x: flingTargetPosition.x, y: flingTargetPosition.y}, 300, Phaser.Easing.Linear.InOut, false);
		this.defenceCaptureTween.chain(this.defenceRegisterTween, this.pauseTween, this.flingTween, this.discReleaseTween, this.postZapTween);
		this.defenceCaptureTween.onComplete.add(function () {f.sound[0].play(); this.pointer = this.defencePointer;}, this);
		this.defenceRegisterTween.onComplete.add(this.onRegister, this);
		this.flingTween.onComplete.add(function () {this.onRelease();this.defensiveTapTween.start()}, this);
		this.discReleaseTween.onComplete.add(function () { this.zapper = f.zapperGroup.add(new f.Zapper(Aura.game, zapperPos.x, zapperPos.y, 'zap'));}, this);
	};
	f.Disc.prototype.onScore = function () {
		this.scaleDownTween.start();	
		this.halo.alphaOutTween.start();
	};
	f.Disc.prototype.destroy = function () {
		this.haloSound.stop();
		this.haloSound = null;
		if(this.defensiveTap) {
			this.defensiveTap.destroy();
			this.defensiveTap = null;
			this.defencePointer = null; // destroyed along with f.tapGroup
		}			
		f.removeTweens(this, 'defensiveTapTween', 'defenceCaptureTween', 'defenceRegisterTween', 'pauseTween', 'flingTween', 'discReleaseTween', 'postZapTween', 'reboundTween');

		Phaser.Sprite.prototype.destroy.call(this);
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
	// How many fingers required for gestures?
	f.POINTERS_PER_PLAYER = 1;
	f.MAX_PLAYERS = 8; 	
	f.SMALL_SCALE = 0.53;
	f.NUM_DEMO_CLICKS = 2;
	f.NUM_COUNTDOWN_ELMTS = 3;
	
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
		['countdownH', 179],
		['tapWidth', 368],
		['tapHeight', 92]		 
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

	        //this.scale.pageAlignVertically = true;
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