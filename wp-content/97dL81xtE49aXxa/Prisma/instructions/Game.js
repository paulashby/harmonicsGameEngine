/*global Phaser, Prisma, f, PIXI */

(function () {
	
	"use strict";
	
	f.boundsLines = [
		// clockwise from TL
		new Phaser.Line(0, 0, f.gameWidth, 0),
		new Phaser.Line(f.gameWidth,0, f.gameWidth, f.gameHeight),
		new Phaser.Line(f.gameWidth, f.gameHeight, 0, f.gameHeight),
		new Phaser.Line(0, f.gameHeight, 0, 0)
	];
	f.getPossZones = (function () {
		// takes a number (y value)
		// returns an array of zones
		// within this vertical range
		var 
		thirdHeight = f.gameHeight/3,
		twoThirdsHeight = thirdHeight * 2,
		// posZones arranged to read clockwire from TL
		posZones = [[0, 1, 2],
					[7, 8, 3], 
					[6, 5, 4]]; 

		return function (spriteY){
			// Default middle row
			var returnVal = posZones[1];
			if(spriteY < thirdHeight){
				returnVal = posZones[0];
			}
			else if(spriteY > twoThirdsHeight){
				returnVal = posZones[2];
			}
			return returnVal;
		};
	}());	
	f.getZone = (function () {
		// takes a point object with properties for x and y 
		// Returns given point's containing zone
		var thirdWidth = f.gameWidth/3,//640
		twoThirdsWidth = thirdWidth * 2;

		return function (spritePos){
			var returnVal = f.getPossZones(spritePos.y)[1];
			if(spritePos.x < thirdWidth){
				returnVal = f.getPossZones(spritePos.y)[0];
			}
			else if(spritePos.x  > twoThirdsWidth){
				returnVal = f.getPossZones(spritePos.y)[2];
			}
			return returnVal;
		};
	}());
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
		f.timers = f.timers || []; 
		f.timers.push(timer);
		timer.start();

		return timer;
	};
	f.getHypotenuse = function (width, height) {
		var h = height || width;
		return Math.sqrt(Math.pow(width, 2) + Math.pow(h, 2));
	};
	f.maxBoundsDist = f.getHypotenuse(f.gameWidth, f.gameHeight);
	f.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	f.getWorldPos = function (childElmt) {
		// Takes a displayObject, returns a point

		// get childElmt position relative to its parent
		var childAnchor = childElmt.toLocal({x: childElmt.x, y: childElmt.y}, childElmt.parent);

		// get childElmt position relative to game
		return childElmt.toGlobal({x: childAnchor.x, y: childAnchor.y});
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
	f.getRayOrigin = function (zone, wpos){
		var rayOffset = 75;
		if(zone < 3){
			wpos.y -= rayOffset;
		}
		else if(zone > 3 && zone < 7){
			wpos.y += rayOffset;
		}
		else {
			wpos.x += zone === 3 ? rayOffset : rayOffset * -1;
		}
		return wpos;
	};
	f.getRaySettings = function (shotNum, zone, onTarget) {
		// var zoneNum = zone.parent.parent.getChildIndex(zone.parent),
		var zoneNum = f.getZone({x: zone.world.x, y: zone.world.y}),
		angles,		
		worldPos = f.getWorldPos(zone),
		orig = f.getRayOrigin(zoneNum, worldPos);
		if(shotNum === 1){
			// Shoot prism 0
			angles = onTarget ? [118, 168, 236, 279, 317, 7, 49.5, 83] : [114, 160, 241, 282, 314, 12, 45, 84];			
		}
		else if(shotNum === 2){
			// shoot prism 1			
			angles = onTarget ? [139, 196, 235, 266.5, 298.5, 339.7, 47.6, 94.8] : [140, 185, 230, 265, 300, 5, 20, 93];
		}
		return {
			angle: angles[zoneNum],
			origin: orig,
			zone: zone
		};
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
	f.zapSplinter = function () {
		
			// Barrage of zaps
			var MAX_ZAP_SIZE = 140,
			RAY_SPEED = 8,
			splinterGrowth = RAY_SPEED * f.ZAP_DURATION,
			totalZaps = 3,
			splinter = f.splinterGroup.getAt(3) || f.splinterGroup.getFirstExists(true),
			timeout,
			dist,
			pos,
			timer;

			f.zapTap = f.tapGroup.getFirstExists();			
			
			if(splinter && f.zaps && f.zaps === totalZaps){
				// this one's a hit
				// pos = f.getWorldPos(splinter.shuttle);
				pos = splinter.shuttle.position;
				f.zapperGroup.add(f.getZapper({x: pos.x, y: pos.y}));				
			}
			else if(splinter){
				// get splinter origin and extend a line from there to height of splinter + maximum zapper size + speed of splinter
				dist = splinter.height + MAX_ZAP_SIZE + splinterGrowth;
				// pos = new Phaser.Line().fromAngle(splinter.world.x, splinter.world.y, splinter.rotation - (Math.PI/2), dist);
				pos = f.getWorldPos(splinter);
				pos = new Phaser.Line().fromAngle(pos.x, pos.y, splinter.rotation - (Math.PI/2), dist);
				timeout = (splinter.maximumHeight - splinter.height)/splinter.speed;

				if(f.zaps === undefined){
					f.zaps = 1;	
					f.showInstruction('instruction5');
				}
				else{
					f.zaps ++;
				}				
				f.zapperGroup.add(f.getZapper(pos.end));
				timer = f.getTimer(f, 'zapSplinter', timeout);
				timer.start();
			}
			f.sound[9].play();		
	};
	f.shootRay = function (settings) {
		var ray = f.getPrimaryRay(settings.origin, settings.zone.player);
		ray.init();
		ray.width = f.rayWH;
		ray.angle = settings.angle;
		f.rayGroup.add(ray);
		ray.setMaxH();
		f.sound[13].play();
	};
	f.demoShot = function (settings, shotNum, zone) {
		var tapStartPos = new Phaser.Line().fromAngle(settings.origin.x, settings.origin.y, zone.parent.rotation - (Math.PI/2), f.homeZoneBGHeight * 2).end,
			tapPos = new Phaser.Line().fromAngle(settings.origin.x, settings.origin.y, Phaser.Math.degToRad(settings.angle) - (Math.PI/2), f.homeZoneBGHeight * 1.2).end,
			tapSprite = zone.parent.tap;

		tapSprite.x = tapStartPos.x;
		tapSprite.y = tapStartPos.y;
		tapSprite.angle = zone.parent.angle;
		tapSprite.alphaTween = Prisma.game.add.tween(tapSprite).to({alpha: 0.3}, 600, Phaser.Easing.Cubic.In, true);
		tapSprite.posTween = Prisma.game.add.tween(tapSprite).to({x: tapPos.x, y: tapPos.y}, 1200, Phaser.Easing.Exponential.InOut, true);

		tapSprite.posTween.onComplete.add(function () {
			f.shootRay(settings);
			tapSprite.animations.play('tapAnim', 30, false);
			tapSprite.pauseTween = Prisma.game.add.tween(tapSprite).to({x: tapSprite.x, y: tapSprite.y}, 600, Phaser.Easing.Linear.InOut, true);
			tapSprite.posTween = Prisma.game.add.tween(tapSprite).to({x: settings.origin.x, y: settings.origin.y}, 1000, Phaser.Easing.Exponential.InOut, false);
			tapSprite.pauseTween.chain(tapSprite.posTween);
		}, this);
		// zone is object not number
		if(shotNum === 2) {
			f.shot2 = true;
		}
	};
	f.demoHit = function (shotNum, zone){
		f.demoShot(f.getRaySettings(shotNum, zone, true), shotNum, zone);				
	};
	f.demoMiss = function (shotNum, zone){
		if(shotNum === 1){
			f.demoShot(f.getRaySettings(shotNum, zone, false), shotNum, zone);		
		}
	};	
	f.Ray = function (game, x, y, key, shuttleGroup) {

		// Basic ray - base Object for PrimaryRay and Splinter
		Phaser.Sprite.call(this, game, x, y, key);

		this.anchor.setTo(0.5, 1);
		this.blendMode = PIXI.blendModes.SCREEN;
		this.speed = 8;
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
	};
	f.PrimaryRay = function (game, x, y, key, shuttleGroup, player) {

		f.Ray.call(this, game, x, y, key, shuttleGroup);
		this.player = player;		

		this.splinterManager = (function () {
			// private members
			var splinters = {},
			splinterSound = f.sound[12],
			scoreSound = f.sound[11],
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
				if(f.shot2){
					f.zapSplinter();					
				}
			},
			_removeSplinter = function (splinterName) {
				var currSplinter = splinters[splinterName];
				if(currSplinter){					
					if(currSplinter.transferringEnergy){
						scoreSound.play();						
					}
					currSplinter.energyPath.clear();
					currSplinter.energyPath.alpha = 0;
					delete splinters[splinterName];	

					if(Object.keys(splinters).length === 0){
						if(!f.zapping){
							// removing first set of splinters
							f.zapping = true;
						}
						else{
							// removing second set of splinters
							f.showInstruction('instruction6');
							f.prismGroup.callAll('beDragulous');
							f.collecting = true;
							f.collectPrisms();
						}
					}				
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
		this.alpha = 0.4;
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
		if(f.Ray){
			f.Ray.prototype.update.call(this);
		}
	};
	f.Splinter = function (game, x, y, key, shuttleGroup) {

		// Splinter of split light added after PrimaryRay hits prism
		f.Ray.call(this, game, x, y, key, shuttleGroup);		
	};
	f.Splinter.prototype = Object.create(f.Ray.prototype);
	f.Splinter.prototype.constructor = f.Splinter;
	f.Splinter.prototype.init = function () {
		this.alpha = 1;
		this.speed = 4;
		this.exists = true;
		this.visible = true;
		this.active = true;
		this.maximumHeight = undefined;
		this.transferringEnergy = false;
		this.isSplinter = true;
		this.initialised = true;
		this.energySound = f.sound[5];
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
		if(f.Ray){
			f.Ray.prototype.update.call(this);
		}
	};
	f.Splinter.prototype.cleanUp = function () {
		this.primaryRay.splinterManager.removeSplinter(this.splinterName);
	};
	f.Prism = function (game, x, y, key, pAngle, pNum){
		Phaser.Sprite.call(this, game, x, y, key);

		this.isPrism = true;
		this.anchor.setTo(0.5, 0.7);
		this.angle = pAngle;
		this.inputEnabled = true;
		this.prismNum = pNum;
		this.maxHits = 2;			
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

		// Remove and score if in homezone
		for(i = 0; i < len; i++) {
			currZone = f.homeZones.getAt(i);
			currZonePos = new Phaser.Point(currZone.zonePanel.world.x, currZone.zonePanel.world.y);
			if(this.position.distance(currZonePos) <= hzRadius){
				i = len; // make this last iteration of loop
				this.cleanUp();
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
			if(this.hits === 1){
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
		this.alpha = 0.9;
		this.randomiseAlphaSettings();
		this.frame = 0;
		this.innerGlow.scale.x = 0;
		this.innerGlow.scale.y = 0;
		this.innerGlow.alpha = 1;
		this.glow1.alpha = 0;
		this.glow1.scale.x = 1;
		this.glow1.scale.y = 1;
		this.glow2.scale.x = 1;
		this.glow2.scale.y = 1;
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
		this.initTween = Prisma.game.add.tween(this.scale).to({x: 1.3, y: 1.3}, 150, Phaser.Easing.Linear.In, false);
		this.initEndTween = Prisma.game.add.tween(this.scale).to({x: 1, y: 1}, 70, Phaser.Easing.Linear.In, false);
		this.initTween.chain(this.initEndTween);
		this.innerGlowTween = Prisma.game.add.tween(this.innerGlow.scale).to({x: 1.3, y: 1.3}, 150, Phaser.Easing.Linear.In, false);
		this.innerGlowEndTween = Prisma.game.add.tween(this.innerGlow.scale).to({x: 1, y: 1}, 70, Phaser.Easing.Linear.In, false);
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
		if(this.exists){
			if(!this.initialised){
				this.init();
			}
			if(f.collecting || f.fabCount === 2){
				f.collecting = true;
				this.beDragulous();
				f.ambientLoop.stop();
				if(!f.collectLoop.isPlaying){
					f.collectLoop.play(); 
				}
			}
			if(this.isDragulous){
				if (this.tap){
					this.x = this.tap.x;
					this.y = this.tap.y;
				}
				this.updateOuterGlow();
			}
			else{	
				// Only one currently being called
				this.updateInnerGlow();
			}
		}
		else{
			// Prism has been dragged to homeZone - fade out
			this.fadeOuterGlow();
			if(!this.collected){				
				f.sound[6].play();
				this.collected = true;
			}
		}
		if(this.zapper && this.position.distance(this.zapper) > f.prismHeight * 0.36){
			this.zapper = undefined;
		}
		
	};
	f.Prism.prototype.cleanUp = function () {
		f.sound[2].play();
		this.initialised = false;
		this.exists = false;
		this.tap.alpha = 0;
		this.tap.exists = false;
		if(f.prismGroup.getFirstExists() === null){
			f.endLevel();
		}
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
			nextLevel = function () {
				f.gameOver = true;
				f.endLevel();			
			},
			gameOver = function (exit) {
				var 
				removeSound = function(_sound) {
					_sound.stop();
					_sound = null;		
				},
				removeTween = function(_tween) {
					if (_tween) {
						_tween.onComplete.removeAll();
						_tween.stop();
						_tween = null;
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
				k,
				klen,
				len,
				jlen,
				currElmt,
				currJelmt;

				len = f.homeZones.length;
				for(i = 0; i < len; i++){	
					currElmt = f.homeZones.getAt(i);
					jlen = currElmt.length;

					if(currElmt.logo){
						removeTweens(currElmt.logo, ['startTween', 'pauseTween', 'scaleTween', 'scaleDownTween']);
					}

					
					// remove common tweens from home zone children 
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						if(j === 1){
							removeTweens(currJelmt, ['currJelmtTween1', 'currJelmtTween2']);
						}
						else{
							//removeTweens(currJelmt, ['scaleTween', 'scaleDownTween']);
							if(currJelmt === currElmt.tap){
								// remove positional tweens used for demo taps
								klen = currJelmt.tweens && currJelmt.tweens.length;
								for(k = 0; k < klen; k++){
									removeTween(currJelmt.tweens[k]);
								}
							}
						}
					}

					jlen = 7;
					for(j = 1; j < jlen; j++) {
						// instruction tweens
						removeTweens(currJelmt = currElmt.getAt(j), ['scaleTween', 'pauseTween', 'scaleDownTween']);
					}

					len = f.instructionTimers.length;
					for(i = 0; i < len; i++){
						Prisma.game.time.events.remove(f.instructionTimers[i]);
					}		
				}
				// Countdown Elements - remove tweens
				if(f.countdownGroup) {
					len = f.countdownGroup.length;
					for(i = 0; i < len; i++){
						removeTweens(f.countdownGroup.getAt(i), ['scaleTween', 'scaleUpTween']);
					}	
					f.countdownGroup.destroy();				
				}				
				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				Prisma.game.time.events.remove(f.countdownTimer);
				Prisma.game.time.events.remove(f.levelTimer);
				Prisma.game.time.events.remove(f.levelRestartTimer);
				Prisma.game.time.events.remove(f.endTimer);
				
				f.bg.destroy();
				
				// delete properties of f
				for(currElmt in f){
					if(f.hasOwnProperty(currElmt)){
						delete f[currElmt];
					}
				}
				top.window.removeEventListener('pause', function (e) { Prisma.game.paused = ! Prisma.game.paused; }, false);
				top.window.addEventListener('exit', function (e) { f.gameOver(true); }, false);
				if(exit) {
					VTAPI.onGameOver(true);
				} else {
					VTAPI.startGame();	
				}				
		    },
			addCountdownTweens = function (currElmt) {
				currElmt.scaleTweenCallback = function () {
					if(currElmt.afterPulse === 'hide'){
						currElmt.visible = false;				
					}
					else if(currElmt.afterPulse === 'end'){
						nextLevel();
						gameOver();
					}
					else{
						currElmt.scaleUpTween.start();	
					}
					currElmt.afterPulse = '';	
				};
				currElmt.scaleTween = Prisma.game.add.tween(currElmt.scale).to({x: 0.9, y: 0.9}, 500, Phaser.Easing.Elastic.In, false);
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
						currElmt.anchor.setTo(0.5, 0.5);
						currElmt.x = countdownElmtX(i);
						currElmt.y = f.HALF_HEIGHT;
						currElmt.frame = 6;
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
				// on each pulse, play sound and hide element
				
				f.sound[10].play();

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
				if(f.homeZones){
					f.countdownTimer = Prisma.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, 0);
				}
			},
			setLevelTimers = function () {
				f.levelTimer = Prisma.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, f.endLevel, this);
				f.levelRestartTimer = Prisma.game.time.create(false);
				f.levelRestartTimer.add(100, countdown, this);
				f.levelTimer.start();
			},
			hudZone = function (zoneNum) {
				// returns true if the current zone requires score panels at end of level
				// (the top and bottom of the table only has panels in centre zone)
				return zoneNum > 0 && zoneNum % 2 !== 0;				
			},
			showInstruction = function (instr) {
				// instr is a String - the name of the instruction to show
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i)[instr].scaleTween.start();
					f.sound[1].play();
				}
			},			
			showTap = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).tap.scaleTween.start();
				}
			},
			startCountdown = function (lastTweenComplete) {
				if(lastTweenComplete){
					countdown();	
				}
			},
			makeLevelTweens = function (elmt) {
				elmt.endLevelTween = Prisma.game.add.tween(elmt).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
				elmt.endLevelTween.onComplete.add( function(){
					var i,
					len = this.length;
					for(i = 0; i < len; i++){
						this.getAt(i).exists = false;
						startCountdown(i === len - 1);
					}
					
					}, elmt);					
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
				alphaTweenDur = 1000,
				homeZoneGroup,
				i,
				rotateHomeZone = function () {
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = homeSettings[i].x;
					homeZoneGroup.y = homeSettings[i].y;
				},
				showHomeZones = function () {
					var i, 
						len = f.homeZones.length,
						currZone,
						currZoneBG;
					for (i = 0; i < len; i++) {
						currZone = f.homeZones.getAt(i);
						currZoneBG = currZone.getAt(0);
						if(! currZoneBG.alphaTween.isRunning){
							currZoneBG.alphaTween.start();
						}
					}
				},
				addHomeZoneLogo = function () {
					var logo = Prisma.game.add.sprite(0,0, 'logo');
					logo.anchor.setTo(0.5, 0.5);
					logo.x = f.HALF_WIDTH;
					logo.y = Math.floor(f.HALF_HEIGHT * 0.8);
					logo.scale.x = 0;
					logo.scale.y = 0;
					f.sound[12].volume = 0.2;
					logo.startTween = Prisma.game.add.tween(logo.scale).to({x: 0, y: 0}, 500, Phaser.Easing.Elastic.Out, true);
					logo.scaleTween = Prisma.game.add.tween(logo.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					logo.pauseTween = Prisma.game.add.tween(logo.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Linear.InOut, false);
					logo.scaleDownTween = Prisma.game.add.tween(logo.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					logo.startTween.onComplete.add(function(){f.sound[12].play();}, this);
					logo.scaleDownTween.onComplete.add(showHomeZones, this);
					logo.startTween.chain(logo.scaleTween, logo.pauseTween, logo.scaleDownTween);
					homeZoneGroup.logo = logo;
					homeZoneGroup.add(logo);					
				},
				addZonePanel = function () {
					var hzPanel = Prisma.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT + 96, 'hzbg');
					homeZoneGroup.add(hzPanel);
					homeZoneGroup.zonePanel = hzPanel;
					hzPanel.player = f.players[i];
					hzPanel.player.homeZone = hzPanel;
					hzPanel.anchor.setTo(0.5, 1);
					hzPanel.frame = f.freePlay ? 1 : hzPanel.player.team;	
					hzPanel.alpha = 0;
					hzPanel.alphaTween = Prisma.game.add.tween(hzPanel).to({alpha: 0.5}, alphaTweenDur, Phaser.Easing.Linear.InOut, false);	
				},
				makeDemo = function (tap) {
					console.log(tap.x);
					/*
					var i = 1,
					tweenTargetGlobal,
					tweenTargetLocal,
					tweenTargets = f.elmtByZone[tap.homeZone].targetElmt,
					numTaps = f.NUM_DEMO_CLICKS,
					tweenDur = 600,
					tapGroup = tap.parent;
					
					 //add tweens
					for(i = 0; i < numTaps; i++){
						tweenTargetGlobal = tweenTargets[i];
						tweenTargetLocal = tapGroup.toLocal({x: 0, y: 0}, tweenTargetGlobal);
						tap.tweens.push(Prisma.game.add.tween(tap).to({x: tweenTargetLocal.x, y: tweenTargetLocal.y}, tweenDur * (i + 1), Phaser.Easing.Sinusoidal.InOut, false));
						tap.targetElmt = tweenTargetGlobal;
						tap.tweens[i].onComplete.add(function() { demoTap(tap); }, this);
					}
					chainTweens(tap);
					tap.tweens[0].start();
					*/					
				},
				// instOpts is an object with the properties position(object), duration(number), angle(number), textureKey(string), callback(function) 
				addInstruction = function (instOpts) {
					var instruction = Prisma.game.add.sprite(instOpts.position.x, instOpts.position.y, instOpts.textureKey);
					instruction.anchor.setTo(0.5, 0.5);
					instruction.angle = instOpts.angle;
					instruction.scale.x = 0;
					instruction.scale.y = 0;					
					instruction.scaleTween = Prisma.game.add.tween(instruction.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					instruction.pauseTween = Prisma.game.add.tween(instruction.scale).to({x: 1, y: 1}, instOpts.duration, Phaser.Easing.Linear.InOut, false);
					instruction.scaleDownTween = Prisma.game.add.tween(instruction.scale).to({x: 0, y: 0}, 550, Phaser.Easing.Elastic.In, false);
					if(instOpts.callback){instruction.scaleDownTween.onComplete.add(instOpts.callback, instruction);}					
					instruction.scaleTween.chain(instruction.pauseTween, instruction.scaleDownTween);
					homeZoneGroup[instOpts.textureKey] = instruction;
					homeZoneGroup.add(instruction);
					return instruction;
				},
				addHomeZoneInstructions = function (zoneNum, successfulHitZone) {
					var tap,
					instruction2Callback = zoneNum === successfulHitZone ? function(){f.demoHit(1, f.players[zoneNum].homeZone);} : function(){f.demoMiss(1, f.players[zoneNum].homeZone);},
					instruction4Callback = zoneNum === successfulHitZone ? function(){f.demoHit(2, f.players[zoneNum].homeZone);} : function(){f.demoMiss(2, f.players[zoneNum].homeZone);};
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 900,  angle: 0, textureKey: 'instruction1'});
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 300, angle: 0, textureKey: 'instruction2', callback: instruction2Callback});
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 300, angle: 0, textureKey: 'instruction3'});
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 300, angle: 0, textureKey: 'instruction4', callback: instruction4Callback});
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 300, angle: 0, textureKey: 'instruction5'});
					addInstruction({position: {x:f.HALF_WIDTH, y:f.gameHeight * 0.53}, duration: 300, angle: 0, textureKey: 'instruction6'});
					tap = Prisma.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.2, 'tap');
					tap.alpha = 0;
					tap.anchor.setTo(0.5, 0.5);
					tap.scale.x = 0;
					tap.scale.y = 0;
					tap.homeZone = zoneNum;
					tap.tweens = [];
					tap.animations.add('tapAnim', [1, 2, 3, 2, 1, 0]);
					tap.scaleTween = Prisma.game.add.tween(tap.scale).to({x: 1, y: 1}, 400, Phaser.Easing.Linear.Out, false);
					tap.scaleDownTween = Prisma.game.add.tween(tap.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					tap.scaleDownTween.onComplete.add(function () { f.sound[3].play(); }, this);					
					tap.scaleTween.onComplete.add(function () { makeDemo(tap);  }, this, tap);
					
					homeZoneGroup.tap = tap;
					f.tapGroup.add(tap);
				};
				f.showInstruction = showInstruction;
				f.freePlay = f.teams.length === 0;
				f.homeZones = Prisma.game.add.group();
				
				return function () {
					var successfulHitZone;
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							if(successfulHitZone === undefined){
								successfulHitZone = i;	
							}
							homeZoneGroup = Prisma.game.add.group();
							addZonePanel(i); 
							homeZoneGroup.elmtTargetNum = 0;
							rotateHomeZone();							
							f.homeZones.add(homeZoneGroup);
							addHomeZoneInstructions(i, successfulHitZone);														
						}
						if(hudZone(i)){	
							if(f.players[i] === null){						
								homeZoneGroup = Prisma.game.add.group();
								rotateHomeZone();		
							}
							addHomeZoneLogo();					
						}											
					}					
				};				
			}()),
			i,
			len,
			instructionDelay = 2750;		
			f.sound = [
				this.game.add.audio('logoSound'),//0, was N/A
				this.game.add.audio('panelUp'),//1, was N/A
				this.game.add.audio('countdown'),//2, was N/A - so which is countdown?
				this.game.add.audio('pointer'),//3 was N/A
				this.game.add.audio('prismHit'),//4, was 5
				this.game.add.audio('woosh'),//5, was 8
				this.game.add.audio('collect'),//6, was 10

				this.game.add.audio('collectLoop'),//7, was 0,
				this.game.add.audio('ambientLoop'),// 8, was 3


				this.game.add.audio('blast'),//9, was 11
				this.game.add.audio('beat'),//10, was 7
				this.game.add.audio('score'),//11, was 9,//3
				this.game.add.audio('prismRotate'),//12, was 4
				this.game.add.audio('fire')//13
			];
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
		    f.showPrisms = function () {
		    	f.prismGroup.alphaTween.start();
				f.prismGlowGroup.alphaTween.start();
		    };
		    f.collectPrisms = function () {
		    	var zoneOrig,
		    	currPrism,
		    	currZone,
		    	currTap,
		    	i,
		    	len = f.prismGroup.length,
		    	collectPrism = function () {
		    		// onComplete passes {prism: currPrism, tap: currTap} as context for this function
		    		this.prism.tap = this.tap; 
		    		this.tap.animations.play('tapAnim', 30, false);
		    	},
		    	getNearestPrism = function (tap) {
		    		var p1 = f.prismGroup.getAt(0),
			    		p2 = f.prismGroup.getAt(1),
			    		p1Dist,
		    			p2Dist;
		    		if(!f.assignedPrism){
		    			p1Dist = tap.position.distance(p1.position);
			    		p2Dist = tap.position.distance(p2.position);
			    		f.assignedPrism = p1Dist < p2Dist ? p1 : p2;
			    		return f.assignedPrism;
		    		}
		    		return p1 === f.assignedPrism ? p2 : p1;
				};
		    	for(i = 0; i < len; i++){
		    		
		    		currZone = f.homeZones.getAt(i);
		    		currTap = currZone.tap;
		    		currPrism = getNearestPrism(currTap);
		    		zoneOrig = f.getWorldPos(currZone);

		    		currTap.x = zoneOrig.x;
		    		currTap.y = zoneOrig.y;
		    		currTap.alphaTween = Prisma.game.add.tween(currTap).to({alpha: 0.3}, 600, Phaser.Easing.Cubic.In, true);
		    		currTap.posTween = Prisma.game.add.tween(currTap).to({x: currPrism.x, y: currPrism.y}, 1500, Phaser.Easing.Exponential.InOut, false);
		    		currTap.posTween.onComplete.add(collectPrism, {prism: currPrism, tap: currTap});
		    		currTap.pauseTween = Prisma.game.add.tween(currTap).to({x: currTap.x, y: currTap.y}, 300, Phaser.Easing.Linear.InOut, false);
		    		currTap.collectTween = Prisma.game.add.tween(currTap).to({x: zoneOrig.x, y: zoneOrig.y}, 500, Phaser.Easing.Exponential.In, false);		    		
		    		currTap.collectTween.onComplete.add(f.removePrism, {prism: currPrism});
		    		currTap.alphaTween.chain(currTap.posTween, currTap.pauseTween, currTap.collectTween);
		    	}	
		    };
		    f.removePrism = function () {
		    	this.prism.cleanUp();
		    };
			f.endLevel = function () {
				var 
				i,
				len = f.dynamicGroups.length;		
				
				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					f.dynamicGroups[i].endLevelTween.start();
				}
			};
			len = f.sound.length;
			for(i = 0; i < len; i++){
				f.sound[i].allowMultiple = false;
			}
			f.ambientLoop = f.sound[8];
			f.ambientLoop.volume = 0.25;
			f.ambientLoop.loop = true;
			f.ambientLoop.play();
			f.collectLoop = f.sound[7];
			f.collectLoop.volume = 0.2;
			f.collectLoop.loop = true;
			f.beat = f.sound[10];
			f.sound[1].volume = 0.5;			
			f.sound[4].allowMultiple = true;
			f.sound[4].volume = 0.25;
			f.sound[5].volume = 0;
			f.sound[6].allowMultiple = false;
			f.sound[6].volume = 0;
			f.sound[9].allowMultiple = true;
			f.sound[10].volume = 0.5;
			f.sound[11].allowMultiple = true;
			f.sound[11].volume = 0.2;
			f.sound[13].volume = 0.25;

			f.bg = Prisma.game.add.sprite(0, 0, 'bg');
			f.prismGlowGroup = this.game.add.group();
			f.prismGroup = this.game.add.group();
			f.prismGroup.add(new f.Prism(Prisma.game, 1053, 398, 'prism', 7, 0));
			f.prismGroup.add(new f.Prism(Prisma.game, f.HALF_WIDTH - 200, f.HALF_HEIGHT + 70, 'prism', -4, 1));
			f.prismGroup.getAt(0).init();
			f.prismGroup.getAt(1).init();
			f.prismGroup.alpha = 0;
			f.prismGlowGroup.alpha = 0;
			f.prismGroup.alphaTween = Prisma.game.add.tween(f.prismGroup).to({alpha: 1}, 1000, Phaser.Easing.Linear.InOut, false);
			f.prismGlowGroup.alphaTween = Prisma.game.add.tween(f.prismGlowGroup).to({alpha: 1}, 1000, Phaser.Easing.Linear.InOut, false);	

			f.homeZones = Prisma.game.add.group();
			f.tapGroup = Prisma.game.add.group();
			addHomeZones();
			f.zapperGroup = this.game.add.group();
			f.rayGroup = Prisma.game.add.group();			
			f.splinterGroup = Prisma.game.add.group();
			f.hotSpotsGroup = Prisma.game.add.group();			
			f.shuttleGroup = Prisma.game.add.group();			
			f.splinterShuttleGroup = Prisma.game.add.group();
			f.dynamicGroups = [
				// ie all groups except homezones
				// use this array to start fade tweens etc

				f.homeZones,

				f.hotSpotsGroup,
				f.splinterGroup,
				f.rayGroup,
				f.prismGroup,
				f.prismGlowGroup,
				f.splinterShuttleGroup,
				f.shuttleGroup,
				f.zapperGroup,
				f.tapGroup					
			];

			addLevelTweens(f.dynamicGroups);
			setLevelTimers();

			f.instructionTimers = [Prisma.game.time.events.add(2900, showInstruction, this, 'instruction1')];
			f.instructionTimers.push(Prisma.game.time.events.add(5500, showInstruction, this, 'instruction2'));
			f.instructionTimers.push(Prisma.game.time.events.add(6000, showTap, this));
			f.instructionTimers.push(Prisma.game.time.events.add(5000, f.showPrisms, this));
			f.instructionTimers.push(Prisma.game.time.events.add(5500 + instructionDelay, showInstruction, this, 'instruction3'));	
			f.instructionTimers.push(Prisma.game.time.events.add(5500 + (instructionDelay * 2), showInstruction, this, 'instruction4'));

			top.window.addEventListener('pause', function (e) { Prisma.game.paused = ! Prisma.game.paused; }, false);
			top.window.addEventListener('exit', function (e) { gameOver(true); }, false);			
		},
	    update: function () {
	    	var 
			i, j,
			prismGroupLen,
			shuttleGroupLength,
			zapperGroupLength,
			splinterShuttleGroupLength,
			currPrism,
			currShuttle,
			currZapper,
			currSplinterShuttle;

			// checking f.homeZones just to be sure f is not an empty object
			if(f.homeZones){
				prismGroupLen = f.prismGroup.length;
				shuttleGroupLength = f.shuttleGroup.length;
				zapperGroupLength = f.zapperGroup.length;
				splinterShuttleGroupLength = f.splinterShuttleGroup.length;

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
			}
	    }
	};
}());
