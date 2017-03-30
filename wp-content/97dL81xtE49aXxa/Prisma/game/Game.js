/*global Phaser, Prisma, f, PIXI */

(function () {

	"use strict";	

	f.fabIndices = [];
	f.demo = false;
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
	f.timers = [];
	f.level = 0;
	f.endLevelSignal = new Phaser.Signal();
	f.newLevelSignal = new Phaser.Signal();
	f.fabCount = 0;
	f.levelOver = false;
	f.gameStarted = true;
	f.draggedPrisms = 0;
	f.boundsLines = [
		// clockwise from TL
		new Phaser.Line(0, 0, f.gameWidth, 0),
		new Phaser.Line(f.gameWidth,0, f.gameWidth, f.gameHeight),
		new Phaser.Line(f.gameWidth, f.gameHeight, 0, f.gameHeight),
		new Phaser.Line(0, f.gameHeight, 0, 0)
	];
	f.hzPanels = [];
	f.selected = []; // used to serve random prisms
	f.updateSelectedArray = function () {
		// Reset f.selected when all positions have been taken
		// else we search recursively for positions when none
		// are available resulting in stack overflow.
		f.selected = [];
		f.prismGroup.forEachExists(function (prism) {
			f.selected.push(prism.prismNum);
		}, this);
	};
	f.maxBoundsDist = f.getHypotenuse(f.gameWidth, f.gameHeight);
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
		var timer = Prisma.game.time.create(false),
		timeout = typeof delay === 'number' ? delay : f.getRandomInt(delay.min, delay.max),
		timeoutFunc = function() {
			obj[func]();
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

	f.Ray = function (game, x, y, key, shuttleGroup) {

		// Basic ray - base Object for PrimaryRay and Splinter
		Phaser.Sprite.call(this, game, x, y, key);

		this.anchor.setTo(0.5, 1);
		this.blendMode = PIXI.blendModes.SCREEN;
		this.speed = f.RAY_SPEED[f.level];
		this.isRay = true;
		this.shuttle = f.getShuttle(this, shuttleGroup);
		this.initialised = false;		
	};
	f.Ray.prototype = Object.create(Phaser.Sprite.prototype);
	f.Ray.prototype.constructor = f.Ray;	
	f.Ray.prototype.init = function () {
		this.height = 0;
		this.boundsPoint = null;
		this.maxHeight = undefined;
		this.prism = undefined;
		this.exists = true;
		this.active = true;
		// shuttle moves with leading edge of ray as a
		// low cost collion detector.
		// Set position here to avoid issues with
		// Prism collision detection
		this.shuttle.x = this.x;
		this.shuttle.y = this.y;
		this.shuttleActive = true;
		this.shuttle.exists = true;
		this.shuttle.collider = undefined;
		this.shuttleDistance = 0;
		this.initialised = true;
	};
	f.Ray.prototype.findIntersection = function (origin, boundFinder) {
		var boundsPoint,
		i,
			len = f.boundsLines.length,
			intersects,
			thisDist = 0,
			prevDist = 0;


		for(i = 0; i < len; i++){

			// intersects is the point where boundsFinder crosses this game bounds line, or null if they don't cross
			intersects = boundFinder.intersects(f.boundsLines[i], true);

			if(intersects !== null){
				thisDist = origin.distance(intersects, true);

				// As sprites are positioned off-screen, make sure we're checking distance to FAR edge of game
				if(thisDist > prevDist){
					boundsPoint = intersects;
					prevDist = thisDist;
					this.borderNum = i;
				}
			}
		}
		return boundsPoint;
	};
	f.Ray.prototype.getBoundsPoint = function (worldPos) {
		// extend line to find bounds
		var boundFinder = new Phaser.Line().fromAngle(worldPos.x, worldPos.y, this.rotation + Phaser.Math.degToRad(-90), f.maxBoundsDist);

		return this.findIntersection(worldPos, boundFinder);
	};
	f.Ray.prototype.setMaxH = function () {
		this.maxHeight = this.getMaxHeight();
	};
	f.Ray.prototype.getMaxHeight = function () {
		// returns the distance from sprite origin to game bounds
		// Doesn't get called until after the homeZone has been rotated so we get correct values
		var
		worldPos = this.position;
		this.boundsPoint = this.getBoundsPoint(worldPos);

		return worldPos.distance(this.boundsPoint, true);
	};
	f.Ray.prototype.updateShuttle = function () {
		var shuttlePos,
		rot,
		// find horizontal mid-point of ray
		baseMidPt = new Phaser.Point(this.world.x, this.world.y);

		this.shuttleDistance = this.height * -1;
		rot = this.parent.sideZone ? this.rotation + this.parent.rotation + 1.57 : this.rotation - this.parent.rotation + 1.57;
		shuttlePos = baseMidPt;

		// Position shuttle using Point.rotate to project midpoint along length of ray
		shuttlePos.rotate(baseMidPt.x, baseMidPt.y, rot, false, this.shuttleDistance);
		this.shuttle.position = shuttlePos;
		this.shuttle.angle = this.angle;
		// Prevent momentary flash of shuttle at its previous origin
		this.shuttle.alpha = Math.min(this.shuttleDistance * -1, 1);
	};
	f.Ray.prototype.onExit = function (){
		if(this.shuttle){
			this.shuttleActive = false;
			this.shuttle.exists = false;
		}
		this.active = false;
		this.cleanUp();
		this.initialised = false;
		this.exists = false;
	};
	f.Ray.prototype.update = function () {
		if(! f.levelOver){
			if(this.exists && !this.initialised){
				this.init();
			}
			if(this.active){
				this.updateShuttle();
				if(this.transferringEnergy){
					this.height -= this.speed;
					this.speed *= 1.08;
				}
				else{
					this.height += this.speed;
				}
				if(this.maxHeight && this.height >= this.maxHeight){
					this.maxHeight = undefined;
					this.onExit();
				}
			}
		}
	};

	f.PrimaryRay = function (game, x, y, key, shuttleGroup, player) {

		f.Ray.call(this, game, x, y, key, shuttleGroup);
		this.anchor.setTo(0.5, 1);
		this.player = player;		

		this.splinterManager = (function () {
			// private members
			var splinters = {},
			splinterSound = f.sound[3],
			scoreSound = f.sound[8],
			getSplinter = function (pos) {
				var recycledSplinter = f.splinterGroup.getFirstExists(false);

				if(!recycledSplinter) { // No existing Splinter available - make new
					recycledSplinter = new f.Splinter(Prisma.game, pos.x, pos.y, 'splinter', f.splinterShuttleGroup);
				}
				else{ // Use existing Splinter
					recycledSplinter.shuttle.x = -100;
					recycledSplinter.shuttle.y = -100;
					recycledSplinter.x = pos.x;
					recycledSplinter.y = pos.y;
				}
				recycledSplinter.primaryRay = this;
				return recycledSplinter;
			},
			checkPrism = function (splinterName) {
				// If all splinters have reached edge of screen
				// prism enters its fabulous draggable state
				var collidedPrism;
				if(splinters[splinterName] && (Object.keys(splinters).length === 1)){
					collidedPrism = splinters[splinterName].primaryRay.shuttle.currPrism;
					if(collidedPrism){
						collidedPrism.beFabulous();
					}
				}
			},
			_splinter = function (primaryRay) {

				// Splinters look after their own collision/exit status
				// When they die, they report to splinterManager
				// When all are dead, this PrimaryRay dies too
				var i,
				currSplinter,
				refractPoint = primaryRay.shuttle.position;
				for(i = 0; i < f.NUM_SPLINTERS; i++) {
					currSplinter = getSplinter(refractPoint);
					currSplinter.init();
					currSplinter.frame = i;
					currSplinter.angle = primaryRay.angle - 45 + (f.SPLINTER_ANGLE * i);
					f.splinterGroup.add(currSplinter);
					currSplinter.splinterName = 'splinter' + i;
					splinters[currSplinter.splinterName] = currSplinter;
					currSplinter.primaryRay = primaryRay;
					currSplinter.hz = primaryRay.player.homeZone;
					currSplinter.epCol = '0xffffff';
					currSplinter.energyPath = Prisma.game.add.graphics(0, 0);
					currSplinter.energyPath.alpha = 0.3;
					currSplinter.setMaxH();
					primaryRay.numSplinters++;
					splinterSound.play();
				}
				primaryRay.getHotSpot(refractPoint);
			},
			_removeSplinter = function (splinterName) {
				var currSplinter = splinters[splinterName];
				if(currSplinter){
					if(currSplinter.transferringEnergy){
						currSplinter.primaryRay.player.updateScore(f.SPLINTER_VAL);
						scoreSound.play();
					}
					currSplinter.energyPath.clear();
					currSplinter.energyPath.alpha = 0;
					delete splinters[splinterName];					
				}
			},
			_checkSplinters = function (primaryRay) {
				if(Object.keys(splinters).length < 1) {
					primaryRay.onExit();
				}
			};
			splinterSound.volume = 0.3;
			scoreSound.volume = 0.2;

			// interface
			return {

				splinter: function(primaryRay) {
					_splinter(primaryRay);
				},
				removeSplinter: function(splinterName) {
					checkPrism(splinterName);
					_removeSplinter(splinterName);
				},
				checkSplinters: function(primaryRay) {
					_checkSplinters(primaryRay);
				}
			};
		}());		
	};
	f.PrimaryRay.prototype = Object.create(f.Ray.prototype);
	f.PrimaryRay.prototype.constructor = f.PrimaryRay;
	f.PrimaryRay.prototype.init = function () {
		this.active = true;
		this.alpha = f.RAY_ALPHA[f.level];
		this.shuttle.init();
		this.numSplinters = 0;
		f.Ray.prototype.init.call(this);
	};
	f.PrimaryRay.prototype.getHotSpot = function (refractPoint) {
		if(!this.hotSpot){
			this.hotSpot = Prisma.game.add.sprite(refractPoint.x, refractPoint.y, 'hotSpot');
			this.hotSpot.anchor.setTo(0.5, 0.5);
			f.hotSpotsGroup.add(this.hotSpot);
		}
		else{
			this.hotSpot.x = refractPoint.x;
			this.hotSpot.y = refractPoint.y;
			this.hotSpot.exists = true;
		}
	};
	f.PrimaryRay.prototype.splinter = function () {
		this.primary = false;
		this.active = false;
		this.shuttle.exists = false;
		this.splinterManager.splinter(this);
	};
	f.PrimaryRay.prototype.cleanUp = function () {
		// Clean up anything peculiar to this object
		if(this.hotSpot){
			this.hotSpot.exists = false;
		}
	};
	f.PrimaryRay.prototype.update = function (){
		if(!this.active){
			if(this.numSplinters < 1){
				this.alpha = 0;
				if(this.hotSpot){
					this.hotSpot.exists = false;
				}
			}
			this.splinterManager.checkSplinters(this);
		}
		if(f.collecting){
			f.Ray.prototype.onExit.call(this);
		}
		f.Ray.prototype.update.call(this);
	};
	f.Splinter = function (game, x, y, key, shuttleGroup) {

		// Splinter of split light added after PrimaryRay hits prism
		f.Ray.call(this, game, x, y, key, shuttleGroup);		
	};
	f.Splinter.prototype = Object.create(f.Ray.prototype);
	f.Splinter.prototype.constructor = f.Splinter;
	f.Splinter.prototype.init = function () {
		this.alpha = 1;
		this.speed = f.SPLINTER_SPEED[f.level];
		this.exists = true;
		this.visible = true;
		this.active = true;
		this.maximumHeight = undefined;
		this.transferringEnergy = false;
		this.isSplinter = true;
		this.initialised = true;
		this.energySound = f.sound[7];
		this.energySound.allowMultiple = true;
		this.energySound.volume = 0.4;
		f.Ray.prototype.init.call(this);
	};
	f.Splinter.prototype.setMaxH = function () {
		this.maximumHeight = f.Ray.prototype.getMaxHeight.apply(this);
	};
	f.Splinter.prototype.onHit = function (){
		this.primaryRay.numSplinters--;
		this.onExit();
	};
	f.Splinter.prototype.update = function () {
		if(!this.transferringEnergy && (this.maximumHeight && this.height >= this.maximumHeight)){
			// Splinter has left screen - reposition it so shuttle can 'ride it' back to homeZone
			this.transferringEnergy = true;
			this.energyPath.clear();
			this.alpha = 0;
			this.primaryRay.numSplinters--;
			this.newPos = new Phaser.Point (this.shuttle.world.x, this.shuttle.world.y);
			this.endPos = new Phaser.Point (this.primaryRay.world.x, this.primaryRay.world.y);
			this.angle = Phaser.Math.radToDeg(this.endPos.angle(this.newPos)) + 90;
			this.height = Phaser.Point.distance(this.newPos, this.endPos);
			this.x = this.endPos.x;
			this.y = this.endPos.y;
			this.energySound.play();
		}
		else{
			if(this.transferringEnergy){
					if(this.height <= 0){
						// Shuttle has reached homeZone - remove splinter
						this.active = false;
						this.initialised = false;
						this.primaryRay.player.updateScore(f.PRISM_HIT_VAL);
						this.energyPath.clear();
						this.energyPath.alpha = 0;
						this.onExit();
						this.transferringEnergy = false;
					}
			}
			else if(this.exists){
				// Connect ray to user's homezone
				this.energyPath.clear();
				this.energyPath.lineStyle(2, this.epCol, 1);
				this.energyPath.moveTo(this.primaryRay.world.x, this.primaryRay.world.y);
				this.energyPath.lineTo(this.shuttle.world.x, this.shuttle.world.y);
			}
		}
		f.Ray.prototype.update.call(this);
	};
	f.Splinter.prototype.cleanUp = function () {
		this.primaryRay.splinterManager.removeSplinter(this.splinterName);
	};
	f.HomeZonePanel = function (game, x, y, key){
		Phaser.Sprite.call(this, game, x, y, key);

		this.endLevelTween = Prisma.game.add.tween(this).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
		this.reloadTween = Prisma.game.add.tween(this).to( {alpha: f.HOMEZONE_ALPHA}, f.LOAD_DUR, Phaser.Easing.Quintic.In, false);		
		this.init();		
		// listen for new level signal
		f.newLevelSignal.add(this.newLevel, this);
	};
	f.HomeZonePanel.prototype = Object.create(Phaser.Sprite.prototype);
	f.HomeZonePanel.prototype.constructor = f.HomeZonePanel;
	f.HomeZonePanel.prototype.getRayOrigin = function (worldPos){
		var zNum = this.parent.zoneNum,
		wpos = worldPos,
		rayOffset = 3;
		if(zNum < 3){
			wpos.y -= rayOffset;
		}
		else if(zNum > 3 && zNum < 7){
			wpos.y += rayOffset;
		}
		else {
			wpos.x += zNum === 3 ? rayOffset : rayOffset * -1;
		}
		return wpos;
	};
	f.HomeZonePanel.prototype.getRaySettings = function(pointer){
		var worldPos = f.getWorldPos(this),
		orig = this.getRayOrigin(worldPos);
		return {
			angle: worldPos.angle(pointer.position, true) + 90,
			origin: orig
		};
	};
	f.HomeZonePanel.prototype.init = function (){
		this.anchor.setTo(0.5, 1);
		this.y += 95;
		this.isHZ = true;
		this.inputEnabled = true;
		this.events.onInputDown.add(f.onTap, this);
		this.input.pixelPerfectClick = true;
		this.alpha = 0.5;
		this.shotsRemaining = f.RELOAD;
	};
	f.HomeZonePanel.prototype.newLevel = function () {
		this.faded = false;
		this.alpha = f.HOMEZONE_ALPHA;
	};
	f.HomeZonePanel.prototype.loaded = function () {
		return this.shotsRemaining > 0;
	};
	f.HomeZonePanel.prototype.updateAmmo = function () {
		this.shotsRemaining --;
	};
	f.HomeZonePanel.prototype.reload = function () {
		this.shotsRemaining = f.RELOAD;
	};
	f.HomeZonePanel.prototype.update = function () {
		if(! f.levelOver){
			if(this.shotsRemaining === 0){
				if(!this.reloadTimer || this.reloadTimer.expired){
					this.reloadTimer = f.getTimer(this, 'reload', f.LOAD_DUR);
					this.reloadTween.start();
				}
			}
		}
		else if(! this.faded){
			this.endLevelTween.start();
			this.faded = true;
		}
	};

	f.HomeZonePanelAuto = function (game, x, y, key){

		f.HomeZonePanel.call(this, game, x, y, key);

		this.startFiringEvent = Prisma.game.time.events.add(1500, this.setRayTimer, this);
	};
	f.HomeZonePanelAuto.prototype = Object.create(f.HomeZonePanel.prototype);
	f.HomeZonePanelAuto.prototype.constructor = f.HomeZonePanelAuto;
	f.HomeZonePanelAuto.prototype.setRayTimer = function () {
		Prisma.game.time.events.remove(this.startFiringEvent);
		this.addRay(this, this.player);
		this.rayTimer = f.getTimer(this, 'addRay', {min: 3000, max: 10000}, true);
		f.endLevelSignal.add(this.rayTimer.removeAll, this);
		f.newLevelSignal.add(this.setRayTimer, this);
	};
	f.HomeZonePanelAuto.prototype.getOrigin = function () {
		// returns random origin within home zone
		// emulates user click
		return {position: new Phaser.Point(f.getRandomInt(this.x - (this.width * 2), this.x + (this.width * 2)), f.getRandomInt(this.y, this.y + this.height))};
	};
	f.HomeZonePanelAuto.prototype.fireRandomRay = function (eTarget, player){
		f.fireRay(eTarget, this.getOrigin(), player);
		f.sound[5].play();
	};
	f.HomeZonePanelAuto.prototype.addRay = function (){		
		this.shotOffsetTimer = Prisma.game.time.events.repeat(500, f.RELOAD - 3, this.fireRandomRay, this, this, this.player);
	};
	f.HomeZonePanelAuto.prototype.update = function () {
		if(f.fabCount === f.NUM_PRISMS[f.level]){
			this.rayTimer.destroy();
			Prisma.game.time.events.remove(this.shotOffsetTimer);
		}
		f.HomeZonePanel.prototype.update.call(this);
	};

	f.Prism = function (game, x, y, key, pAngle, pNum){
		Phaser.Sprite.call(this, game, x, y, key);

		this.isPrism = true;
		this.anchor.setTo(0.5, 0.7);
		this.angle = pAngle;
		this.inputEnabled = true;
		this.prismNum = pNum;
		this.maxHits = f.PRISM_RESILIENCE[f.level];			
		this.rotIncMin = 0.013;
		this.rotIncMax = 0.014;
		this.rotIncrement = this.getRandomNum(this.rotIncMin, this.rotIncMax);
		this.quiverRot = 0;
		this.maxRot = this.rotIncrement;
		this.minRot = this.maxRot * -1;
		this.innerGlow = Prisma.game.add.sprite(0,0,'prism');
		this.glow1 = Prisma.game.add.sprite(0,0,'prismGlow');
		this.glow2 = Prisma.game.add.sprite(0,0,'prismGlow');
		this.innerGlow.anchor.setTo(0.5, 0.7);
		this.glow1.anchor.setTo(0.5, 0.6);
		this.glow2.anchor.setTo(0.5, 0.6);
		this.alphaAdj = 0.0075;
		this.innerGlow.frame = 1;
		this.glow1.frame = 0;
		this.glow2.frame = 1; 
		this.glow1.blendMode = PIXI.blendModes.SCREEN;
		this.glow2.blendMode = PIXI.blendModes.SCREEN;
		this.minAlpha = this.getRandomNum(0.1, 0.5);
		this.maxAlpha = this.getRandomNum(0.51, 1);
		this.hitSound = f.sound[4];
		this.hitSound.volume = 0.15;					
		f.prismGlowGroup.add(this.innerGlow);		
		f.prismGlowGroup.add(this.glow1);
		f.prismGlowGroup.add(this.glow2);
	};
	f.Prism.prototype = Object.create(Phaser.Sprite.prototype);
	f.Prism.prototype.constructor = f.Prism;
	f.Prism.prototype.getRandomNum = function (minNum, maxNum) {
		return f.getRandomInt(minNum * 100, maxNum * 100)/100;
	};
	f.Prism.prototype.startInitTweens = function () {			
		this.initTween.start();
		this.innerGlowTween.start();
	};
	f.Prism.prototype.startDrag = function () {
		f.draggedPrisms++;
		this.drag = true;
		this.startDragPos = new Phaser.Point(this.position.x, this.position.y);
	};
	f.Prism.prototype.endDrag = function () {
		var len = f.homeZones.length,
		hzRadius = f.homeZoneBGWidth/2,
		i,
		currZone,
		currZonePos,
		prisms,
		currPrism;
		this.drag = false;

		f.draggedPrisms--;

		// Remove and score if in homezone
		for(i = 0; i < len; i++) {
			currZone = f.homeZones.getAt(i);
			if(!currZone.hudOnly){
				currZonePos = new Phaser.Point(currZone.zonePanel.world.x, currZone.zonePanel.world.y);
				if(this.position.distance(currZonePos) <= hzRadius){
					currZone.zonePanel.player.updateScore(f.PRISM_DRAG_VAL);
					i = len; // make this last iteration of loop
					this.cleanUp();
				}
			}			
		}
		// Undo drag if prisms would be overlapping
		if(this.exists){
			prisms = f.prismGroup;
			len = prisms.length;
			for(i = 0; i < len; i++) {
				currPrism = prisms.getAt(i);
				if(currPrism !== this && currPrism.position.distance(this.position) < (f.prismHeight * currPrism.scale.x)){
					this.x = this.startDragPos.x;
					this.y = this.startDragPos.y;
				}
			}
		}
	};
	f.Prism.prototype.beFabulous = function() {
		this.isFabulous = true;
		f.fabCount++;
		this.inputEnabled = true;
		this.frame = 1;
		this.alpha = 1;
	};
	f.Prism.prototype.beDragulous = function() {
		this.isDragulous = true;
		this.input.enableDrag();
		this.events.onDragStart.add(this.startDrag, this);
		this.events.onDragStop.add(this.endDrag, this);
	};
	f.Prism.prototype.willRefract = function () {
		if(!this.refracting){
			if(this.hits === f.PRISM_RESILIENCE[f.level]){
				this.refracting = true;
			}
			return this.refracting;
		}
	};
	f.Prism.prototype.playSound = function () {
		this.prismSound.play();	
	};
	f.Prism.prototype.startSoundLoop = function () {
		this.soundTimer = f.getTimer(this, 'playSound', f.getRandomInt(2000, 5000), true);
	};
	f.Prism.prototype.init = function (prismPosition, prismAngle, prismNum) {
		this.exists = true;
		this.refracting = false;
		this.hits = 0;
		this.zapper = undefined;
		this.isFabulous = false;
		this.isDragulous = false;
		this.drag = false;
		this.alpha = f.PRISM_ALPHA;
		this.randomiseAlphaSettings();
		this.frame = 0;
		this.scale.x = 0;
		this.scale.y = 0;
		this.innerGlow.scale.x = 0;
		this.innerGlow.scale.y = 0;
		this.innerGlow.alpha = 1;
		this.glow1.alpha = 0;
		this.glow1.scale.x = f.PRISM_SIZE[f.level];
		this.glow1.scale.y = f.PRISM_SIZE[f.level];
		this.glow2.scale.x = f.PRISM_SIZE[f.level];
		this.glow2.scale.y = f.PRISM_SIZE[f.level];
		this.glow2.alpha = 0;
		this.glowStrength = 1;
		this.tickCount = 0; // Used to track duration of inner glow
		this.targetTick = 0; // Used to track duration of inner glow			
		if(prismPosition){
			this.x = prismPosition.x;
			this.y = prismPosition.y;
		}
		if(prismAngle){
			this.angle = prismAngle;
		}
		if(prismNum){
			this.prismNum = prismNum;
		}
		this.initTween = Prisma.game.add.tween(this.scale).to({x: f.PRISM_SIZE[f.level] * 1.3, y: f.PRISM_SIZE[f.level] * 1.3}, 150, Phaser.Easing.Linear.In, false);
		this.initEndTween = Prisma.game.add.tween(this.scale).to({x: f.PRISM_SIZE[f.level], y: f.PRISM_SIZE[f.level]}, 70, Phaser.Easing.Linear.In, false);
		this.initTween.chain(this.initEndTween);
		this.innerGlowTween = Prisma.game.add.tween(this.innerGlow.scale).to({x: f.PRISM_SIZE[f.level] * 1.3, y: f.PRISM_SIZE[f.level] * 1.3}, 150, Phaser.Easing.Linear.In, false);
		this.innerGlowEndTween = Prisma.game.add.tween(this.innerGlow.scale).to({x: f.PRISM_SIZE[f.level], y: f.PRISM_SIZE[f.level]}, 70, Phaser.Easing.Linear.In, false);
		this.innerGlowTween.chain(this.innerGlowEndTween);
		this.startInitTweens();
		this.inputEnabled = false;
		this.input.disableDrag();
		this.initialised = true;
		this.collected = false;
	};
	f.Prism.prototype.onHit = function () {
		if(!this.refracting){
			this.hits++;
			if(!this.hitTween || ! this.hitTween.isRunning){
				this.hitTween = Prisma.game.add.tween(this).to({angle: this.angle + 180}, 300, Phaser.Easing.Quadratic.Out, true);
				this.hitSound.play();
			}
		}
	};
	f.Prism.prototype.randomiseAlphaSettings = function () {
		this.alphaAdj *= -1;
		this.minAlpha = this.getRandomNum(0.4, 0.5);
		this.maxAlpha = this.getRandomNum(0.5001, 0.9);
	};
	f.Prism.prototype.randomiseOuterGlow = function () {
		this.innerGlow.alpha = 0;
		this.alpha = 1;
		this.glow1.alpha = 0.4;
		if(this.getRandomNum(0, 1) > 0.5){
			this.glow2.alpha = this.getRandomNum(0.85, 1);
		}	
	};
	f.Prism.prototype.positionOuterGlow = function () {
		this.glow1.x = this.x;
		this.glow1.y = this.y;
		this.glow1.rotation = this.rotation;					
		this.glow1.visible = true;
		this.glow2.x = this.x;
		this.glow2.y = this.y;					
		this.glow2.visible = true;
		this.glow2.rotation = this.rotation;
	};
	f.Prism.prototype.updateOuterGlow = function () {
		this.randomiseOuterGlow();
		this.positionOuterGlow();			
	};
	f.Prism.prototype.fadeOuterGlow = function () {
		this.glowStrength = this.glowStrength < 0.02 ? 0 : this.glowStrength - 0.02;
		this.glow1.alpha *= this.glowStrength;
		this.glow2.alpha *= this.glowStrength;
	};
	f.Prism.prototype.randomiseInnerGlow = function () {
		// Actually, adjust this alpha so innerGlow shows through
		if(this.alpha <= this.minAlpha || this.alpha >= this.maxAlpha){
			this.randomiseAlphaSettings();
		}
		this.alpha += this.alphaAdj;
	};
	f.Prism.prototype.positionInnerGlow = function () {
		this.innerGlow.x = this.x;
		this.innerGlow.y = this.y;
		this.innerGlow.rotation = this.rotation;					
		this.innerGlow.visible = true;
	};
	f.Prism.prototype.updateInnerGlow = function () {
		this.randomiseInnerGlow();
		this.positionInnerGlow();
	};
	f.Prism.prototype.update = function () {
		if(! f.levelOver){	
			if(this.exists){
				if(!this.initialised){
					this.init();
				}
				if(f.collecting || f.fabCount === f.NUM_PRISMS[f.level]){
					f.collecting = true;
					this.beDragulous();
					f.ambientLoop.stop();
					if(!f.collectLoop.isPlaying){
						f.collectLoop.play(); 
					}
				}
				if(this.isDragulous){
					this.updateOuterGlow();
				}
				else{						
					this.updateInnerGlow();
				}
			}
			else{
				// Prism has been dragged to homeZone - fade out
				this.fadeOuterGlow();
				if(!this.collected){
					f.sound[9].play();
					this.collected = true;
				}
			}
			if(this.zapper && this.position.distance(this.zapper) > f.prismHeight * 0.36){
				this.zapper = undefined;
			}
		}
	};
	f.Prism.prototype.cleanUp = function () {
		this.initialised = false;
		this.exists = false;
		if(f.prismGroup.getFirstExists() === null){
			f.endLevel();
		}
	};
	f.Zapper = function (game, x, y, key){

		var scaleTweenCallback = function () {
			this.frame = 1;
		},
		completeCallback = function () {
			this.exists = false;
		};

		Phaser.Sprite.call(this, game, x, y, key);
		this.anchor.setTo(0.5, 0.5);
		this.scaleTween = Prisma.game.add.tween(this.scale).to({x: 0.2, y: 0.2}, f.ZAP_DURATION * 5, Phaser.Easing.Default, false);
		this.scaleDownTween = Prisma.game.add.tween(this.scale).to({x: 0, y: 0}, f.ZAP_DURATION * 15, Phaser.Easing.Default, false);
		this.scaleActiveUpTween = Prisma.game.add.tween(this.scale).to({x: 0.4, y: 0.4}, f.ZAP_DURATION, Phaser.Easing.Default, false);
		this.scaleActiveDownTween = Prisma.game.add.tween(this.scale).to({x: 0, y: 0}, f.ZAP_DURATION, Phaser.Easing.Default, false);
		this.scaleDownTween.onComplete.add(scaleTweenCallback, this);
		this.scaleActiveDownTween.onComplete.add(completeCallback, this);
		this.scaleTween.chain(this.scaleDownTween, this.scaleActiveUpTween, this.scaleActiveDownTween);		
		this.init();
	};
	f.Zapper.prototype = Object.create(Phaser.Sprite.prototype);
	f.Zapper.prototype.constructor = f.Zapper;
	f.Zapper.prototype.init = function (position) {
		if(position){
			this.x = position.x;
			this.y = position.y;
		}
		this.exists = true;
		this.scale.x = 0;
		this.scale.y = 0;
		this.frame = 0;
		// this.collider = undefined;
		this.colliders = [];
		this.scaleTween.start();
	};
	f.randomSign = function (num) {
		var sign = Math.floor(Math.random()*2) === 1 ? 1 : -1;
		return num * sign;
	};
	f.randomAngle = function () {
		return f.randomSign(Math.floor(Math.random()*180) + 1);
	};
	f.getPrimaryRay = function (pos, player) {
		var recycledRay = f.rayGroup.getFirstExists(false);

		if(!recycledRay) { // No existing Ray available - make new
			recycledRay = new f.PrimaryRay(Prisma.game, pos.x, pos.y, 'ray', f.shuttleGroup, player);
		}
		else{ // Use existing Ray
			recycledRay.shuttle.x = -100;
			recycledRay.shuttle.y = -100;
			recycledRay.x = pos.x;
			recycledRay.y = pos.y;
			recycledRay.player = player;
		}
		return recycledRay;
	};
	f.getPrism = function (prismPosition, prismAngle, prismNum) {
		var recycledPrism = f.prismGroup.getFirstExists(false);

		if(!recycledPrism) { // No existing prism available - make new
			recycledPrism = new f.Prism(Prisma.game, prismPosition.x, prismPosition.y, 'prism', prismAngle, prismNum);
		}
		else{ // Use existing prism
			recycledPrism.init(prismPosition, prismAngle, prismNum);
		}
		return recycledPrism;
	};
	f.getShuttle = function (ray, shuttleGroup) {
		// This only gets called when a new ray is created.
		// The ray is given a property referencing its shuttle.
		// This link is maintained throughout the game,
		// so we know that the only time we need a new shuttle is when
		// we need a new ray.
		var shuttle;
		shuttle = Prisma.game.add.sprite(-100, -100, 'shuttle');
		shuttle.width = 10;
		shuttle.height = 20;
		shuttle.ray = ray;
		shuttle.anchor.setTo(0.5, 0.5);
		shuttle.visible = false;
		shuttle.currPrism = undefined;
		shuttle.hasEntered = function (prism) {
			return shuttle.position.distance(prism.position) <= f.prismHeight * 0.2;
		};
		shuttle.onEnterPrism = function (prism) {
			shuttle.currPrism = prism;
			if(prism.willRefract()){
				shuttle.ray.splinter();
			}
			else if(!prism.isFabulous){
				shuttle.ray.onExit();
			}
		};

		shuttle.init = function () {
			shuttle.currPrism = undefined;
		};
		shuttleGroup.add(shuttle);
		return shuttle;
	};
	f.getZapper = function (pointer) {
		var recycledZapper = f.zapperGroup.getFirstExists(false);

		if(!recycledZapper) { // No existing Zapper available - make new
			recycledZapper = new f.Zapper(Prisma.game, pointer.x, pointer.y, 'zap');
		}
		else{ // Use existing Zapper
			recycledZapper.init(pointer);
		}
		return recycledZapper;
	};
	Prisma.Game = function () {
	    return this;
	};

	Prisma.Game.prototype = {

	    create: function () {

			var
			totalScore = function(entity){
				var i,
				len = entity.score.length,
				total = 0;
				for(i = 0; i < len; i++){
					total += entity.score[i];
				}
				return total;
			},
			getTeamScoreString = function (indx, levelOver) {
				var score = levelOver ? totalScore(f.teams[indx]).toString() : f.teams[indx].score[f.level].toString();
				return 'TEAM' + '  ' + (indx + 1) + '   ' + score;
			},
			getPanelSettings = function (indx) {
				// returns object containing settings for score panel text, sprite frame (colour) and panel visibility (bg panel is hidden for title)
				var panelSettings = {},
				currPlayer;
				if(indx === false){
					// title panel
					panelSettings.txt = f.gameOver ? 'GAME  OVER' : 'LEVEL  '  + (f.level + 1) + '  OVER';
					panelSettings.frameNum = f.SCORE_PANEL_FRAMES -1;
					panelSettings.panelVis = false;
				}
				else if(f.freePlay){
					// player panel
					currPlayer = f.players[f.findWithAttr (f.players, 'place', f.mapPlaces(indx))];
					panelSettings.txt  = 'PLAYER ' + currPlayer.playerNum + '   ' + totalScore(currPlayer).toString();
					panelSettings.frameNum = 0;
					panelSettings.panelVis = true;
				}
				else{
					// team panel
					panelSettings.txt = getTeamScoreString(indx, true);
					panelSettings.frameNum = indx;
					panelSettings.panelVis = true;
				}
				return panelSettings;
			},
			clearScoreTimers = function (scorePanelGroup) {
				var i,
				timerArray = scorePanelGroup.timers,
				len = timerArray && timerArray.length;
				if(len > 0){
					for(i = 0; i < len; i++){
						Prisma.game.time.events.remove(timerArray[i]);
					}
				}
				return [];
			},
			onEndLevel = function (panel) {
				panel.scaleTween.start();
				f.sound[1].play();
			},
			updatePanelScores = function (panelBmapTxtOb, indx) {
				var panelSettings = getPanelSettings(indx);
				panelBmapTxtOb.setText(panelSettings.txt);
			},
			hideHomeZonePanel = function (panel) {
				panel.scaleDownTween.start();
			},
			isLastPulse = function (pulseNum) {
				return pulseNum === f.NUM_COUNTDOWN_ELMTS - 1;
			},
			nextElmtNum = function (pulseNum) {
				return 2 - pulseNum;
			},
			getNextElmt = function (pulseNum) {
				return f.countdownGroup.getAt(nextElmtNum(pulseNum));
			},
			playCountdownAnim = function (){
				var i,
				cdGroup = f.countdownGroup,
				len = cdGroup.length;

				for(i = 0; i < len; i++){
					cdGroup.getAt(i).scaleTween.start();
				}
			},
			resetCountdownScale = function () {
				var i,
				cdGroup = f.countdownGroup,
				len = cdGroup.length,
				currElmt;

				for(i = 0; i < len; i++){
					currElmt = cdGroup.getAt(i);
					currElmt.scale.x = 1;
					currElmt.scale.y = 1;
				}
			},
			nextLevel = function () {
				var i,
				len,
				currElmt,
				currZone;

				f.fabIndices = [];

				f.newLevelSignal.dispatch(this);
				resetCountdownScale();

				f.level++;
				f.gameOver = f.level === f.NUM_LEVELS - 1;
				f.levelOver = false;
				f.gameStarted = true;
				f.fabCount = 0;	
				f.collecting = false;			

				// reset countdown elements
				f.countdownGroup.visible = false;
				len = f.NUM_COUNTDOWN_ELMTS;
				for(i = 0; i < len; i++){
					currElmt = f.countdownGroup.getAt(i);
					currElmt.visible = true;
					// currElmt.angle = f.randomAngle();
				}

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);

					if(currZone.hudScore){
						currZone.hudScore.scaleUpTween.start();	
					}
					
					if(!f.freePlay && currZone.hudScore){
						currZone.hudTeamScore.scaleTween.start();
					}
				}
				f.clearDynamicTimers();
				f.setLevelTimers();
				f.collectLoop.stop();
				f.ambientLoop.play();
				f.beat.play();
			},
			addCountdownTweens = function (currElmt) {
				currElmt.scaleTweenCallback = function () {
					if(currElmt.afterPulse === 'hide'){
						currElmt.visible = false;
					}
					else if(currElmt.afterPulse === 'end'){
						nextLevel();
					}
					else{
						currElmt.scaleUpTween.start();
					}
					currElmt.afterPulse = '';
				};
				currElmt.scaleTween = Prisma.game.add.tween(currElmt.scale).to({x: 0.7, y: 0.7}, 500, Phaser.Easing.Elastic.In, false);
				currElmt.scaleUpTween = Prisma.game.add.tween(currElmt.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Elastic.Out, false);
				currElmt.scaleTween.onComplete.add(currElmt.scaleTweenCallback, this);
			},
			countdownOffset = function (elmtNum){
				return f.countdownWH * (elmtNum - 1) * 1.5;
			},
			countdownElmtX = function (elmtNum) {
				return f.HALF_WIDTH + countdownOffset(elmtNum);
			},
			addCountdownGroup = function () {
				var i,
				len,
				currElmt;

				if(!f.countdownGroup){
					f.countdownGroup = Prisma.game.add.group();
					len = f.NUM_COUNTDOWN_ELMTS;
					for(i = 0; i < len; i++){
						currElmt = Prisma.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'countdown');
						f.countdownGroup.add(currElmt);
						currElmt.anchor.setTo(0.5, 0.7);
						currElmt.x = countdownElmtX(i);
						currElmt.y = f.HALF_HEIGHT;
						// currElmt.angle = f.randomAngle();
						currElmt.angle = 15;
						addCountdownTweens(currElmt);
					}
				}
				else{
					f.countdownGroup.visible = true;
				}
			},
			countdownPulse = function (pulseNum) {
				// Add countdown element on first pulse,
				// remove one on subsequent pulses

				var pulseNumInc = pulseNum + 1,
				lastPulse = isLastPulse(pulseNum);
				Prisma.game.time.events.remove(f.countdownTimer);
				// on each pulse, play sound and hide an element

				f.sound[6].play();

				if(pulseNum === 0){
					addCountdownGroup();
					f.countdownTimer = Prisma.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
					getNextElmt(pulseNum).afterPulse = 'hide';
					playCountdownAnim();
				}
				else {
					if(!lastPulse){
						getNextElmt(pulseNum).afterPulse = 'hide';
						playCountdownAnim();
						f.countdownTimer = Prisma.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
					}
					else{
						// set group as invisible
						// and all children as visible
						getNextElmt(pulseNum).afterPulse = 'end';
						playCountdownAnim();
					}
				}
			},
			countdown = function () {
				f.countdownTimer = Prisma.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, 0);
			},
			pauseHandler = function () {
				Prisma.game.paused = ! Prisma.game.paused;
			},
			exitHandler = function () {
				gameOver(true);
			},
			gameOver = function (gameTimeout, exit) {
				var
				removeSound = function(sound) {
					sound.stop();
					sound = null;
				},
				removeTween = function(tween) {
					if (tween) {
						tween.onComplete.removeAll();
						tween.stop();
						tween = null;
					}
			    },
				removeTweens = function (elmt, tweenNames) {
					// args: Object & Array of tween names
					var i,
					len = tweenNames.length;
					for(i = 0; i < len; i++){
						removeTween(elmt[tweenNames[i]]);
					}
				},
				i,
				j,
				len,
				jlen,
				currElmt,
				currJelmt;

				len = f.homeZones.length;

				for(i = 0; i < len; i++){
					currElmt = f.homeZones.getAt(i);

					// Remove homezone tweens
					removeTweens(currElmt, ['endLevelTween', 'reloadTween']);

					jlen = currElmt.length;

					// remove scorePanel timers
					if(currElmt.scorePanels){
						clearScoreTimers(currElmt.scorePanels);
					}

					// remove tweens from home zone children
					// (hudTeamScore, hudFruit, hudScore and scorePanels)
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						removeTweens(currJelmt, ['currJelmtTween1', 'currJelmtTween2']);
					}
				}
				// Remove prism tweens
				len = f.prismGroup.length;
				for(i = 0; i < len; i++){
					removeTweens(f.prismGroup.getAt(i), ['initTween', 'initEndTween', 'innerGlowTween', 'innerGlowEndTween', 'hitTween']);
				}
				// Remove zapper tweens 
				len = f.zapperGroup.length;
				for(i = 0; i < len; i++){
					removeTweens(f.zapperGroup.getAt(i), ['scaleTween', 'scaleDownTween', 'scaleActiveUpTween', 'scaleActiveDownTween']);
				}				
				// Remove countdown tweens
				if(f.countdownGroup) {
					len = f.countdownGroup.length;
					for(i = 0; i < len; i++){
						removeTweens(f.countdownGroup.getAt(i), ['scaleTween', 'scaleUpTween']);
					}	
					f.countdownGroup.destroy(true, false);
				}				
				// Remove sound
				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				Prisma.game.time.events.remove(f.countdownTimer);
				Prisma.game.time.events.remove(f.levelTimer);
				Prisma.game.time.events.remove(f.levelRestartTimer);
				Prisma.game.time.events.remove(f.endTimer);
				Prisma.game.time.events.remove(f.addPrismTimer);

				// Remove level tweens
				len = f.dynamicGroups.length;
				for (i = 0; i < len; i++) {
					removeTweens(f.dynamicGroups[i], ['startLevelTween', 'endLevelTween']);
				}

				// Remove timers added by f.getTimer()
				f.clearDynamicTimers();

				// Remove dynamic groups 
				len = f.dynamicGroups.length;
				for(i = 0; i < len; i++){
					// destroy children, remove from parent and null game reference
					f.dynamicGroups[i].destroy(true, false); 
				}
				
				f.homeZones.destroy(true, false);
				f.bg.destroy();

				// Remove signal
				f.newLevelSignal.removeAll();
				f.endLevelSignal.removeAll();

				// delete properties of f
				for(currElmt in f){
					if(f.hasOwnProperty(currElmt)){
						delete f[currElmt];
					}
				}
				Prisma.game.paused = true;
				top.window.removeEventListener('pause', pauseHandler, false);
				top.window.removeEventListener('exit', exitHandler, false);
				if (exit) {
					VTAPI.onGameOver(true);
				} else {
					VTAPI.onGameOver();
				}				
		    },
			startCountdown = function () {
				var
				returnScores = function () {
					var rankElements = function (arr, rankingAttr) {
						var prevElmt,
						currElmt,
						i, len = arr.length;

						for (i = 0; i < len; i++) {
							currElmt = arr[i];
							if(i === 0) {
								currElmt.ranking = 1;
							} else {
								prevElmt = arr[i - 1];
								currElmt.ranking = currElmt[rankingAttr] === prevElmt[rankingAttr] ? prevElmt.ranking : prevElmt.ranking + 1;
							}
							// teams are zero indexed - set to actual number for VTAPI
							currElmt.team++;
						}
						return arr;
					},
					removeNullElements = function (arr) {
						var i, len = arr.length,
						result = [];
						for (i = 0; i < len; i++) {
							if (arr[i] !== null) {
								result.push(arr[i]);
							}
						}
						return result;
					},
					sumScores = function (arr) {
						var i, len = arr.length;

						for (i = 0; i < len; i++) {							
							arr[i].score = totalScore(arr[i]);							
						}						
						return arr;
					},
					optimiseState = function (arr, reqKeys) {
						var result = [],
						currOb,
						i, j, len = arr.length, jlen = reqKeys.length;
						for(i = 0; i < len; i++) {
							currOb = {};
							for(j = 0; j < jlen; j++) {
								currOb[reqKeys[j]] = arr[i][reqKeys[j]];
							}
							result.push(currOb);
						}
						return result;
					},
					playersByScore = sumScores(removeNullElements(f.players)).sort(function (a, b) {
						return b.score - a.score;
					}),
					rankedPlayers = optimiseState(rankElements(playersByScore, 'score'), ['place', 'ranking']);
					VTAPI.insertScores(rankedPlayers);
				},
				currZone,
				i,
				j,
				len = f.homeZones.length,
				jlen,
				timerDur;
				
				if(f.gameOver){
					returnScores();
					f.endTimer = Prisma.game.time.events.add(f.FINAL_RESULTS_DUR, gameOver, this);					
				}
				else{
					for(i = 0; i < len; i++){
						currZone = f.homeZones.getAt(i);

						if(currZone.scorePanels){
							// Hide score panels
							currZone.scorePanels.timers = clearScoreTimers(currZone.scorePanels);
							jlen = currZone.scorePanels.children.length - 1;

							for(j = jlen; j >= 0; j--){
								//All panels are removed at same time
								timerDur = f.PANEL_DELAY;
								currZone.scorePanels.timers.push(Prisma.game.time.events.add(timerDur, hideHomeZonePanel, this, currZone.scorePanels.getAt(j)));
							}							
						}

					}
					currZone.scorePanels.timers.push(Prisma.game.time.events.add(f.COUNTDOWN_DELAY, countdown, this));
				}
			},
			setLevelTimers = function () {
				f.levelTimer = Prisma.game.time.create(false);
				//f.levelTimer.add(f.LEVEL_DURATION, f.endLevel, this);
				f.levelRestartTimer = Prisma.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, startCountdown, this);
				f.levelTimer.start();
			},
			makePanel = function (indx) {
				// returns a score panel to be displayed at end of level
				var panelGroup = Prisma.game.add.group(),
				panel = Prisma.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'scorePanels'),
				panelSettings = getPanelSettings(indx),
				fontSize = indx === false ? f.TITLE_PANEL_FONT_SIZE : f.SCORE_PANEL_FONT_SIZE,
				panelText = Prisma.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 5, 'alphamale', panelSettings.txt, fontSize);
				panelText.playerNum = indx;

				panel.frame = panelSettings.frameNum;
				panel.anchor.setTo(0.5, 0.5);
				panel.visible = panelSettings.panelVis;
				panel.alpha = 0.25;
				panelGroup.add(panel);
				panelText.anchor.setTo(0.5, 0.5);
				panelGroup.add(panelText);
				panelGroup.pWidth = panel.width;
				panelGroup.pHeight = panel.height;

				return panelGroup;
			},
			hudZone = function (zoneNum) {
				// returns true if the current zone requires score panels at end of level
				// (the top and bottom of the table only has panels in centre zone)
				return zoneNum > 0 && zoneNum % 2 !== 0;
			},
			// TODO: This is a rewrite - update in other games
			initScorePanels = function (scorePanelsGroup, freePlay) {

				// initialise score panels to display at end of each level
				var i,
				panelGroup,
				// vertical position varies according to number of panels
				panelXoffset = f.scorePanelsWidth/8,
				numTeams = f.teams ? f.teams.length : 0,
				freePlay = f.freePlay,
				len = freePlay ? f.players.length : numTeams,
				addPanel = function (indx) {
					var numPanels = freePlay ? f.numPlayers : numTeams;
					scorePanelsGroup.add(panelGroup = makePanel(indx));					

					if(indx === false){
						panelGroup.y = - Math.floor(f.SCORE_PANELS_OFFSET_V * (numPanels + 0.5));
					} else {
						if(freePlay) {
							panelGroup.x = panelXoffset * f.players[indx].playerNum;
							panelGroup.y = - (f.SCORE_PANELS_OFFSET_V * (numPanels - f.players[indx].playerNum));
							panelGroup.playerNum = f.players[indx].playerNum;
						} else {
							panelGroup.x = panelXoffset * (indx + 1);
							panelGroup.y =  - f.SCORE_PANELS_OFFSET_V * (numPanels - indx - 1);
						}
						
					}
				};
				for(i = 0; i < len; i++) {
					if(!freePlay || f.players[i] !== null){
						addPanel(i);
					}
				}
				// add title panel
				addPanel(false);
			},
			getGridLocation = function (prismNum) {
				// Returns object containing prismNum's column and row numbers
				var gridLoc = {col: Math.floor(prismNum/f.NUM_ROWS)};
				gridLoc.row = prismNum - (gridLoc.col * f.NUM_ROWS);
				return gridLoc;
			},
			offsetPos = function (coord) {
				return coord + f.randomSign(f.getRandomInt(0, f.PRISM_OFFSET));
			},
			getEmptySpace = function (prismNum) {
				/*
					get grid loc
					convert to offset position
					check against all existing in prismGroup
					if OK, return position, else try again
				*/
				var gridLoc = getGridLocation(prismNum),
				posToCheck = {
					x: (offsetPos(gridLoc.col * f.PRISM_SPACE) + f.BORDER_WIDTH + f.HALF_PRISM_SPACE),
					y: (offsetPos(gridLoc.row * f.PRISM_SPACE) + f.BORDER_HEIGHT + f.HALF_PRISM_SPACE)
				},
				i,
				prisms = f.prismGroup,
				currPrism,
				safeDist = f.PRISM_SPACE,
				len = prisms.length;
				for(i = 0; i < len; i++){
					currPrism = prisms.getAt(i);
					if(currPrism.exists){
						if(currPrism.position.distance(posToCheck) < safeDist){
							return getEmptySpace(f.getRandomInt(0, f.TOTAL_PRISM_PLACES -1));
						}
					}
				}
				return posToCheck;
			},
			getPrismSettings = function (prismNum) {
				var emptySpace = getEmptySpace(prismNum);
				return {
					prismNum: prismNum,
					position: {
						x: emptySpace.x,
						y: emptySpace.y
					},
					angle: f.randomAngle()
				};
			},
			randomSelection = function () {
				// get unique prism selection
				var prismNum = f.getRandomInt(0, f.TOTAL_PRISM_PLACES -1);
				return f.selected.indexOf(prismNum) > -1 ? randomSelection(f.selected) : prismNum;
			},
			psuedoRandomSelection = function (i) {
				// get unique prism selection
				var colNum = i % f.NUM_COLS,
				startIndex = colNum * f.NUM_ROWS,
				endIndex = startIndex + f.NUM_ROWS - 1,
				prismNum = f.getRandomInt(startIndex, endIndex);
				return f.selected.indexOf(prismNum) > -1 ? randomSelection(f.selected) : prismNum;
			},
			addPrism = function () {
				var nextPrism = randomSelection(),
				prismSettings = getPrismSettings(nextPrism),
				prism;
				f.selected.push(nextPrism);
				prism = f.prismGroup.add(f.getPrism(prismSettings.position, prismSettings.angle));
				prism.init();
			},
			addPrisms = function () {

				var numPrisms = f.NUM_PRISMS[f.level],
				prismSettings,
				i,
				nextPrism,
				prism;
				for(i = 0; i < numPrisms; i++) {
					nextPrism = psuedoRandomSelection(i);
					f.selected.push(nextPrism);
					prismSettings = getPrismSettings(nextPrism);
					prism = f.prismGroup.add(f.getPrism(prismSettings.position, prismSettings.angle, prismSettings.prismNum));
					prism.init();
				}
			},
			makeLevelTweens = function (elmt) {
				elmt.endLevelTween = Prisma.game.add.tween(elmt).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
				elmt.endLevelTween.onComplete.add( function(){
					var i,
					len = this.length;
					for(i = 0; i < len; i++){
						this.getAt(i).exists = false;
					}}, elmt);
					elmt.startLevelTween = Prisma.game.add.tween(elmt).to( {alpha: 1}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
					// listen for new level signal
					f.newLevelSignal.add(function(){elmt.startLevelTween.start();}, elmt);
			},
			addLevelTweens = function (elmts) {
				// Adds fade out tweens to all elements in given array
				var i,
					len = elmts.length;
					for(i = 0; i < len; i++) {
						makeLevelTweens(elmts[i]);
					}
			},
			addHomeZones = (function (){
				var posInset = f.inset = Math.floor(f.gameWidth/20),
				sideInset = Math.floor(posInset * 1.7),
				innerSideL = sideInset,
				innerSideR = f.gameWidth - sideInset,
				rightPos = f.gameWidth - posInset,
				bottomPos = f.gameHeight - posInset,
				homeSettings = [ // Clockwise from TL
					{x: innerSideL, y: posInset , angle: 180},
					{x: f.HALF_WIDTH, y: posInset, angle: 180},
					{x: innerSideR, y: posInset, angle: 180},
					{x: rightPos, y: f.HALF_HEIGHT, angle: 270},
					{x: innerSideR, y: bottomPos, angle: 0},
					{x: f.HALF_WIDTH, y: bottomPos, angle: 0},
					{x: innerSideL, y: bottomPos, angle: 0},
					{x: posInset, y: f.HALF_HEIGHT, angle: 90}
				],
				numZones = f.MAX_PLAYERS,
				hudTeamScoreOffset = 0, // This gets adjusted for team play to allow space for team score panel
				//homeZone,
				homeZoneGroup,
				score,
				i,
				scorePnls,
				jlen,
				j,
				isSideZone = function (group) {
					return group.angle % 180 > 0;
				},
				rotateHomeZone = function () {
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = homeSettings[i].x;
					homeZoneGroup.y = homeSettings[i].y;
					homeZoneGroup.sideZone = isSideZone(homeZoneGroup);
				},
				makeTween = function (currPnl, tweenName, tweenTo) {
					var easingStyle = tweenTo === 0 ? Phaser.Easing.Elastic.In : Phaser.Easing.Elastic.Out;
					currPnl[tweenName] = Prisma.game.add.tween(currPnl.scale).to( {x: tweenTo, y: tweenTo}, f.SCORE_TWEEN_DURATION * 10, easingStyle, false);
				},
				addPanelTween = function (currPnl, tweenSettings){

					// tweenSettings is either an object containing settings for a single tween
					// or an Array of objects, each containing settings for a separate tween
					// In the latter case, startScale in the first object determnes the initial
					// scale of currPnl

					var multipleTweens = Object.prototype.toString.call(tweenSettings) === '[object Array]',
					startScale = multipleTweens ? tweenSettings[0].tweenFrom : tweenSettings.tweenFrom,
					len = multipleTweens ? tweenSettings.length : null,
					i;
					currPnl.pivot.x = currPnl.getAt(0).x;
					currPnl.pivot.y = currPnl.getAt(0).y;
					currPnl.x += f.HALF_WIDTH;
					currPnl.y += f.HALF_HEIGHT;
					currPnl.scale = {x: startScale, y: startScale};

					if(multipleTweens){
						for(i = 0; i < len; i++){
							makeTween(currPnl, tweenSettings[i].tweenName, tweenSettings[i].tweenTo);
						}
					}
					else{
						makeTween(currPnl, tweenSettings.tweenName, tweenSettings.tweenTo);
					}
				},
				addTeamScorePanel = function (indx) {
					// Add team score to homeZone
					hudTeamScoreOffset = Math.floor(f.gameHeight/20);
					homeZoneGroup.hudTeamScore = homeZoneGroup.add(makePanel(f.players[i].team));
					homeZoneGroup.hudTeamScore.y += f.gameHeight/80;
					homeZoneGroup.hudTeamScore.getAt(1).teamNum = f.players[indx].team;
					homeZoneGroup.hudTeamScore.getAt(1).update = function(){
						this.setText(getTeamScoreString(this.teamNum), false);
					};
					homeZoneGroup.hudTeamScore.getAt(0).alpha = 0;
					homeZoneGroup.hudTeamScore.y += hudTeamScoreOffset;
					addPanelTween(homeZoneGroup.hudTeamScore, [{tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0},{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}]);
				},
				addScores = function (indx) {
					// Add player score to homeZone
					var scoreOffset = f.freePlay ? 30 : 60;
					score = Prisma.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT, 'alphamale', f.players[i].score.toString(), f.INSTRUCTION_FONT_SIZE * 0.85);
					score.playerScore = f.players[indx].score;
					score.update = function(){
						this.setText(this.playerScore[f.level]);
					};
					score.y += (score.height/4) - hudTeamScoreOffset + scoreOffset;
					score.anchor.setTo(0.5, 0.5);
					score.alpha =0.9;
					score.scaleUpTween = Prisma.game.add.tween(score.scale).to({x: 1, y: 1}, f.SCORE_TWEEN_DURATION, Phaser.Easing.Linear.InOut, false);
					score.scaleDownTween = Prisma.game.add.tween(score.scale).to({x: 0, y: 0}, f.SCORE_TWEEN_DURATION * 10, Phaser.Easing.Elastic.In, false);
					homeZoneGroup.add(score);
					homeZoneGroup.hudScore = score;
				},
				addHud = function (hudOnly) {
					homeZoneGroup.scorePanels = Prisma.game.add.group();
					if(hudOnly){
						homeZoneGroup.hudOnly = true;
					}
					homeZoneGroup.add(homeZoneGroup.scorePanels);
					initScorePanels(homeZoneGroup.scorePanels, f.freePlay);
					rotateHomeZone();
					scorePnls = homeZoneGroup.scorePanels;
					jlen = scorePnls.children.length;
					for(j = 0; j < jlen; j++){
						addPanelTween(scorePnls.getAt(j), [{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}, {tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0}]);
					}
				},
				addScorePanels = function () {
					// Add score panels for end of level
					if(hudZone(i)){
						addHud();
					}
					else{
						rotateHomeZone();
					}
				},
				addZonePanel = function (zoneNum) {
					var hzPanel;

					if(zoneNum !== 5 && f.demo){
						hzPanel = new f.HomeZonePanelAuto(Prisma.game, f.HALF_WIDTH, f.HALF_HEIGHT, 'hzbg');
					}
					else{
						hzPanel = new f.HomeZonePanel(Prisma.game, f.HALF_WIDTH, f.HALF_HEIGHT, 'hzbg');
					}
					homeZoneGroup.add(hzPanel);
					homeZoneGroup.zonePanel = hzPanel;
					hzPanel.player = f.players[i];
					hzPanel.player.homeZone = hzPanel;
					hzPanel.frame = f.freePlay ? 1 : hzPanel.player.team;
					// for hit tests - get zoneNum via f.hzPanels[i].parent.zoneNum,
					// just using its index in hzPanels array won't work, since there
					// may be empty spaces at table
					f.hzPanels.push(hzPanel);
				};

				return function () {

					var currChild,
					currZone;
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							homeZoneGroup = Prisma.game.add.group();
							addZonePanel(i);
							if(!f.freePlay){
								// Add team score to homeZone
								addTeamScorePanel(i);
							}
							// Add player score to homeZone
							addScores(i);

							// Add score panels for end of level
							addScorePanels();

							f.players[i].scoreDisplay = score;

							homeZoneGroup.zoneNum = i;
							f.homeZones.add(homeZoneGroup);
						} else if (hudZone(i)) {
							homeZoneGroup = Prisma.game.add.group();
							addHud(true);
							f.homeZones.add(homeZoneGroup);
						}
					}
					for(i = 0; i < numZones; i++) {
						// Need this for programatically added rays.
						// Dynamically added rays will be added to a
						// properly initialised group, so can call setMaxH on themselves when added
						currZone = f.homeZones.getAt(i);
						jlen = currZone.length;
						for(j = 0; j < jlen; j++){
						currChild = currZone.getAt(j);
							if(currChild.isRay){
								currChild.setMaxH();
							}
						}
					}
				};
			}());

			Prisma.game.time.advancedTiming = true;
			f.addPrismTimer = Prisma.game.time.create(false);
			f.addPrismTimer.start();
			f.addPrism = addPrism; // so we can call function from within Prism
			f.addPrisms = addPrisms;

			// store sounds in array so we can use sprite sheet frame number to play corresponding sound
			f.sound = [
				this.game.add.audio('collectLoop'),//0
				this.game.add.audio('panelIn'),//1
				this.game.add.audio('ambientLoop'),//3
				this.game.add.audio('prismRotate'),//4
				this.game.add.audio('prismHit'),//5
				this.game.add.audio('fire'),//6
				this.game.add.audio('beat'),//7
				this.game.add.audio('woosh'),//8
				this.game.add.audio('score'),//9
				this.game.add.audio('collect'),//10
				this.game.add.audio('blast')//11
			];
			f.setLevelTimers = setLevelTimers;
			f.endLevel = function () {
				var currZone,
					i,
					j,
					len,
					jlen,
					timerDur,
					dynamicGroupsLen = f.dynamicGroups.length,
					durrMultiplier;
					f.levelOver = true;

				f.draggedPrisms = 0;
				Prisma.game.sound.stopAll();
				f.selected = [];

				for(i = 0; i < dynamicGroupsLen; i++){
					f.dynamicGroups[i].endLevelTween.start();
				}

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);

					if(currZone.hudScore) {
						currZone.hudScore.scaleDownTween.start();
					}					

					// Hide homeZone teamScore
					if(!f.freePlay && currZone.hudTeamScore){
						currZone.hudTeamScore.scaleDownTween.start();
					}

					if(currZone.scorePanels){
						// Show score panels
						currZone.scorePanels.timers = clearScoreTimers(currZone.scorePanels);
						jlen = currZone.scorePanels.children.length;

						for(j = 0; j < jlen; j++){
							durrMultiplier = f.freePlay ? currZone.scorePanels.getAt(j).playerNum : j + 1;
							timerDur = j < jlen - 1 ? f.PANEL_DELAY + f.LEVEL_PANEL_DELAY + (f.SCORE_PANEL_DELAY * durrMultiplier) : f.PANEL_DELAY;
							currZone.scorePanels.timers.push(Prisma.game.time.events.add(timerDur, onEndLevel, this, currZone.scorePanels.getAt(j)));
							// update score panel text here
							if(j < jlen - 1){
								// update score for the player/team. i = zone number, j = score panel number

								if(j === jlen - 1){
									// Title
									updatePanelScores(currZone.scorePanels.getAt(j).getAt(1), false);
								}
								else{
									updatePanelScores(currZone.scorePanels.getAt(j).getAt(1), f.homeZones.getAt(i).scorePanels.getAt(j).getAt(1).playerNum);
								}
							}
							else{
								updatePanelScores(currZone.scorePanels.getAt(j).getAt(1), false);
							}
						}
					}
				}
				f.gameStarted = false;
				f.levelRestartTimer.start();
			};
			f.clearDynamicTimers = function () {
				var len = f.timers.length,
				i;
				for(i = 0; i < len; i++){
					Prisma.game.time.events.remove(f.timers[i]);
				}
			};
			f.fireRay = function(eTarget, pointer, player) {
				//settings properties: angle, origin
				var settings = eTarget.getRaySettings(pointer),
				ray = f.getPrimaryRay(settings.origin, player);
				ray.init();
				ray.width = f.rayWH;
				ray.angle = settings.angle;
				f.rayGroup.add(ray);
				ray.setMaxH();
			};
			f.addZapper = function (pointer) {
				var zap = f.getZapper(pointer);
				f.zapperGroup.add(zap);
			};
			f.onTap = function (eTarget, pointer) {
				if(!f.collecting){
					if(eTarget.isHZ){
						if(eTarget.loaded()){
							f.fireRay(eTarget, pointer, eTarget.player);
							eTarget.updateAmmo();
							f.sound[5].play();
						}
					}
					else{
						if(!eTarget.isFabulous){
							f.addZapper(pointer);
							f.sound[10].play();
						}
					}
				}
			};
			f.newCollision = function (shuttle, zapper) {
		    	var i,
		    	len = zapper.colliders.length;
		    	for(i = 0; i < len; i++) {
		    		if(shuttle === zapper.colliders[i]) {
		    			return false;
		    		}
		    	}
		    	zapper.colliders.push(shuttle);
		    	return true;
		    };
			f.bg = Prisma.game.add.sprite(0, 0, 'bg');
			f.bg.inputEnabled = true;
			f.bg.events.onInputDown.add(f.onTap, this);
			f.homeZones = this.game.add.group();
			f.homeZones.isHomeZones = true;
			f.zapperGroup = this.game.add.group();
			f.prismGlowGroup = Prisma.game.add.group();
			f.prismGroup = Prisma.game.add.group();
			f.shuttleGroup = Prisma.game.add.group();			
			f.splinterShuttleGroup = Prisma.game.add.group();
			f.rayGroup = Prisma.game.add.group();
			f.splinterGroup = Prisma.game.add.group();
			f.hotSpotsGroup = Prisma.game.add.group();

			f.dynamicGroups = [
				// ie all groups except homezones
				// use this array to start fade tweens etc
				f.hotSpotsGroup,
				f.splinterGroup,
				f.rayGroup,
				f.prismGroup,
				f.prismGlowGroup,
				f.splinterShuttleGroup,
				f.shuttleGroup,
				f.zapperGroup
			];
			addLevelTweens(f.dynamicGroups);
			f.setAddPrismTimer = function () {
				f.addPrismTimer.removeAll();
				f.addPrismTimer.add(f.LEVEL_FADE_DURATION, f.addPrisms, this);
			};
			f.newLevelSignal.add(f.setAddPrismTimer, this);

			Prisma.game.add.existing(f.homeZones);
			addHomeZones();
			addPrisms();
			setLevelTimers();
			f.ambientLoop = f.sound[2];
			f.ambientLoop.volume = 0.25;
			f.ambientLoop.loop = true;
			f.ambientLoop.play();
			f.collectLoop = f.sound[0];
			f.collectLoop.volume = 0.2;
			f.collectLoop.loop = true;
			f.beat = f.sound[6];
			f.beat.volume = 0.5;			
			f.sound[5].allowMultiple = true;
			f.sound[5].volume = 0.25;
			f.sound[8].volume = 0;
			f.sound[9].allowMultiple = true;
			f.sound[9].volume = 0.2;
			f.sound[10].allowMultiple = true;

			f.beat.play();
			top.window.addEventListener('pause', pauseHandler, false);
			top.window.addEventListener('exit', exitHandler, false);
	    },
	    update: function () {
	    	// checking f.homeZones just to be sure f is not an empty object
			if(f.homeZones && f.gameStarted){
				var i,
					j,
					k,
					prismGroupLen = f.prismGroup.length,
					shuttleGroupLength = f.shuttleGroup.length,
					zapperGroupLength = f.zapperGroup.length,
					splinterShuttleGroupLength = f.splinterShuttleGroup.length,
					currPrism,
					currShuttle,
					currZapper,
					currSplinterShuttle;

				// Collide prisms and PrimaryRay shuttles
				for(i = 0; i < prismGroupLen; i++) {
					currPrism = f.prismGroup.getAt(i);
					for(j = 0; j < shuttleGroupLength; j++) {
						currShuttle = f.shuttleGroup.getAt(j);

						if(currPrism.exists && currPrism !== currShuttle.currPrism && currShuttle.hasEntered(currPrism)){
							currPrism.onHit(currShuttle.ray);
							currShuttle.onEnterPrism(currPrism);
						}
					}
				}
				// Collide zappers and Splinter shuttles
				for(i = 0; i < zapperGroupLength; i++) {
					currZapper = f.zapperGroup.getAt(i);
					for(j = 0; j < splinterShuttleGroupLength; j++) {
						currSplinterShuttle = f.splinterShuttleGroup.getAt(j);

						if(currZapper.position.distance(currSplinterShuttle) <= currZapper.width/2 && f.newCollision(currSplinterShuttle, currZapper)) {
							currSplinterShuttle.ray.onHit();
						}
					}
				}
				if(f.selected.length === f.TOTAL_PRISM_PLACES){
					f.updateSelectedArray();
				}
			}
	    }
	};
}());
