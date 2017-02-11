/*global Phaser, FruitFlux, f */

(function () {
	
	"use strict";
	
	f.level = 0;
	f.levelOver = true;
	f.gameStarted = false;
	f.reassignmentRunning = false;
	f.endLevelPending = false;
	f.fruitByZone = [];
	
	top.window.addEventListener('pause', function (e) { FruitFlux.game.paused = ! FruitFlux.game.paused; }, false);
	
	var 
	// fruitByZone is an array containing the background fruit,
	// ordered by zone. For eg, fruitByZone[0] is fruit for zone 0
	// each index of the array contains an object containing a targetFruit array
	// and an otherFruit array. targetFruit are the ones to click in the demo
	// if we find we have no target fruit, we'll use some from otherFruit
	
	// for the demo, we'll set the hudFruit frame to the same value as the zone
	// although they could initially pop up with a different frame
	
	// so when we position a fruit, we then store it in the fruitByZone array
	getPossZones = (function () {
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

		return function (fruitY){
			// Default middle row
			var returnVal = posZones[1];
			if(fruitY < thirdHeight){
				returnVal = posZones[0];
			}
			else if(fruitY > twoThirdsHeight){
				returnVal = posZones[2];
			}
			return returnVal;
		};
	}()),	
	getZone = (function () {
		// takes a point object with properties for x and y 
		// Returns given point's containing zone
		var thirdWidth = f.gameWidth/3,//640
		twoThirdsWidth = thirdWidth * 2;

		return function (fruitPos){
			var returnVal = getPossZones(fruitPos.y)[1];
			if(fruitPos.x < thirdWidth){
				returnVal = getPossZones(fruitPos.y)[0];
			}
			else if(fruitPos.x  > twoThirdsWidth){
				returnVal = getPossZones(fruitPos.y)[2];
			}
			return returnVal;
		};
	}()),	
	isOccluded = (function () {
		// takes a zone number and a point object with properties for x and y
		// Tests if point is occluded by the given zone's fruit hud
		var
		ow = Math.floor(f.gameWidth * 0.115),
		oh = Math.floor(f.gameHeight * 0.215),
		leftOffset1 = Math.floor(f.gameWidth * 0.026),// left zone
		leftOffset2 = Math.floor(f.gameWidth * 0.442),// middle zone
		leftOffset3 = Math.floor(f.gameWidth * 0.8574),// right zone
		leftOffset4 = Math.floor(f.gameWidth - oh),// right centre zone
		topOffset = Math.floor(f.gameHeight * 0.7875),// bottom zones
		topOffset1 = Math.floor(f.gameHeight * 0.4),// centre zone
		occlusions = [
			{x: [leftOffset1, leftOffset1 + ow], y: [0, oh]},//0
			{x: [leftOffset2, leftOffset2 + ow], y: [0, oh]},//1
			{x: [leftOffset3, leftOffset3 + ow], y: [0, oh]},//2
			{x: [leftOffset4, leftOffset4 + ow], y: [topOffset1, topOffset1 + ow]},//3
			{x: [leftOffset3, leftOffset3 + ow], y: [topOffset, topOffset + oh]},// 4
			{x: [leftOffset2, leftOffset2 + ow], y: [topOffset, topOffset + oh]},//5
			{x: [leftOffset1, leftOffset1 + ow], y: [topOffset, f.gameHeight]},//6
			{x: [0, oh], y: [topOffset1, topOffset1 + ow]},//7
			{}//8 is centre of game
		];
		
		return function (zoneNum, fruitPos){
			var returnVal;

			if(zoneNum === 8){
				// zone 8 is the centre of the game - no instructions here
				// so we don't want to add the fruit to our clickable array
				returnVal = true;
			}
			else{
				returnVal =	fruitPos.x >= occlusions[zoneNum].x[0] && fruitPos.x <= occlusions[zoneNum].x[1]
				&&			fruitPos.y >= occlusions[zoneNum].y[0] && fruitPos.y <= occlusions[zoneNum].y[1];
			}
			return returnVal;
		};
	}()),
	registerFruit = function (fruit, fruitPos) {
		var fruitZone = getZone(fruitPos);
		if(!isOccluded(fruitZone, fruitPos)){
			if(fruit.frame === fruitZone){
				f.fruitByZone[fruitZone].targetFruit.push(fruit);
			}
			else{
				f.fruitByZone[fruitZone].otherFruit.push(fruit);
			}
		}
	},
	Fruit = function (game, x, y) {

	    Phaser.Sprite.call(this, game, x, y, 'fruit');
	
		this.scaleTweenCallback = function () {
			
			this.frame = Math.floor(Math.random() * f.VARIETIES);
			if(!this.scoring){
				this.rotTween = FruitFlux.game.add.tween(this).to({angle:f.randomAngle()}, f.FRUIT_FLUX_DURATION * 0.8, Phaser.Easing.Quartic.Out, true); 
			}
			this.scoring = false;
		    this.scaleUpTween.start();			
		};
		this.anchor.setTo(0.5, 0.5);
		this.scale.x = f.FRUIT_SCALE;
		this.scale.y = f.FRUIT_SCALE;
		this.angle = f.randomAngle();
		this.scaleUpTween = FruitFlux.game.add.tween(this.scale).to({x: f.FRUIT_SCALE, y: f.FRUIT_SCALE}, f.FRUIT_TWEEN_DURATION * 15, Phaser.Easing.Elastic.Out, false);
		this.scaleTween = FruitFlux.game.add.tween(this.scale).to({x: 0, y: 0}, f.FRUIT_FLUX_DURATION, Phaser.Easing.Default, false);
		this.scaleTween.onComplete.add(this.scaleTweenCallback, this);
		
		this.flux = function () {
			this.scaleTween.start();			
		};
		this.onTap = function () {			
			f.sound[0].play(); // just play strawberry sound for demo
			this.frame = f.VARIETIES;
			this.scoreRotTween = FruitFlux.game.add.tween(this).to({angle: this.angle + 180}, f.FRUIT_FLUX_DURATION + 20, Phaser.Easing.Default, true);
			if(!this.scaleTween.isRunning){
				this.scoreScaleTween = FruitFlux.game.add.tween(this.scale).to({x: 1, y: 1}, 20, Phaser.Easing.Default, true);
				this.scoreScaleTween.onComplete.add(this.flux, this);
			}			
		};
	},
	HomeZone = function (game, x, y) {

	    Phaser.Sprite.call(this, game, x, y, 'homeZones');
	
		this.flux = function (frame) {
			this.frameNum = frame;
			this.scaleTween.start();
		};
		this.scaleUpTween = FruitFlux.game.add.tween(this.scale).to({x: this.scale.x, y: this.scale.y}, f.FRUIT_TWEEN_DURATION * 10, Phaser.Easing.Elastic.Out, false);
		this.scaleUpTween.onComplete.add(function() { f.reassignmentRunning = false; }, this);
		this.scaleTween = FruitFlux.game.add.tween(this.scale).to({x: 0, y: 0}, f.FRUIT_FLUX_DURATION/2, Phaser.Easing.Default, false);
		this.scaleTween.onComplete.add(function() { this.frame = this.frameNum; this.scaleUpTween.start(); }, this);
		this.levelOverTween = FruitFlux.game.add.tween(this.scale).to({x: 0, y: 0}, f.FRUIT_TWEEN_DURATION * 10, Phaser.Easing.Elastic.In, false);
	},
	i,
	len = f.MAX_PLAYERS;
	
	for(i = 0; i <= len; i++){ // <= len since we're counting the centre of the game as a zone, so MAX_PLAYERS + 1
		f.fruitByZone.push({targetFruit: [], otherFruit: []});
	}
	Fruit.prototype = Object.create(Phaser.Sprite.prototype);
	Fruit.prototype.constructor = Fruit;
	HomeZone.prototype = Object.create(Phaser.Sprite.prototype);
	HomeZone.prototype.constructor = Fruit;
	
	f.randomAngle = function () {
		var num = Math.floor(Math.random()*180) + 1; // get number between 1 and 180;
		num *= Math.floor(Math.random()*2) === 1 ? 1 : -1; // make negative in 50% of cases
		return num;
	};

	FruitFlux.Game = function () {
	    return this;
	};

	FruitFlux.Game.prototype = {

	    create: function () {
			
			var
			isLastPulse = function (pulseNum) {
				return pulseNum === f.NUM_COUNTDOWN_FRUIT - 1;
			},
			nextFruitNum = function (pulseNum) {		
				return 2 - pulseNum;
			},
			getNextFruit = function (pulseNum) {
				return f.countdownGroup.getAt(nextFruitNum(pulseNum));
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
				var i,
				len,
				currFruit;		

				f.level ++;
				f.gameOver = true;
				f.levelOver = false;
				f.endLevelPending = false;
				f.gameStarted = false;

				// reset countdown elements
				f.countdownGroup.visible = false;
				len = f.NUM_COUNTDOWN_FRUIT;
				for(i = 0; i < len; i++){
					currFruit = f.countdownGroup.getAt(i);
					currFruit.visible = true;
					currFruit.angle = f.randomAngle();
				}
				f.endLevel();			
			},
			gameOver = function () {
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

				FruitFlux.game.time.events.remove(f.fruitAssignmentLoop);
				removeTweens(f.allFruit, ['startLeveltween', 'endLevelTween']);

				len = f.allFruit.length;
				for(i = 0; i < len; i++){
					// FruitGroup - destroy all timers
					currElmt = f.allFruit.getAt(i);

					// Fruit - remove tweens and event handlers	
					jlen = currElmt.length;
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						removeTweens(currJelmt, ['scaleTween', 'scaleDownTween']);
						if(currJelmt.rotTween){
							removeTween(currJelmt.rotTween);
						}
						currJelmt.events.onInputDown.removeAll();
						currJelmt.inputEnabled = false;
					}
				}
				// HomeZone - remove tweens
				len = f.homeZones.length;
				for(i = 0; i < len; i++){	
					currElmt = f.homeZones.getAt(i);
					jlen = currElmt.length;

					if(currElmt.logo){
						removeTweens(currElmt.logo, ['startTween', 'pauseTween']);
					}
					removeTween(currElmt.checkFruit.pauseTween);
					removeTween(currElmt.tapScore.pauseTween);
					
					// remove common tweens from home zone children 
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						if(j === 1){
							removeTweens(currJelmt, ['scaleTween', 'scaleDownTween', 'levelOverTween']);
						}
						else{
							removeTweens(currJelmt, ['scaleTween', 'scaleDownTween']);
							if(currJelmt === currElmt.tap){
								// remove positional tweens used for demo taps
								klen = currJelmt.tweens && currJelmt.tweens.length;
								for(k = 0; k < klen; k++){
									removeTween(currJelmt.tweens[k]);
								}
							}
						}
					}
					len = f.instructionTimers.length;
					for(i = 0; i < len; i++){
						FruitFlux.game.time.events.remove(f.instructionTimers[i]);
					}		
				}
				// Countdown fruit - remove tweens
				len = f.countdownGroup.length;
				for(i = 0; i < len; i++){
					removeTweens(f.countdownGroup.getAt(i), ['scaleTween', 'scaleUpTween']);
				}
				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				FruitFlux.game.time.events.remove(f.countdownTimer);
				FruitFlux.game.time.events.remove(f.levelTimer);
				FruitFlux.game.time.events.remove(f.levelRestartTimer);
				FruitFlux.game.time.events.remove(f.endTimer);
				
				// destroy groups
				f.allFruit.destroy();
				f.countdownGroup.destroy();
				f.homeZones.destroy();
				
				// delete properties of f
				for(currElmt in f){
					if(f.hasOwnProperty(currElmt)){
						delete f[currElmt];
					}
				}
				top.window.removeEventListener('pause', function (e) { FruitFlux.game.paused = ! FruitFlux.game.paused; }, false);
				VTAPI.startGame();
		    },
			addCountdownTweens = function (currFruit) {
				currFruit.scaleTweenCallback = function () {
					if(currFruit.afterPulse === 'hide'){
						currFruit.visible = false;				
					}
					else if(currFruit.afterPulse === 'end'){
						// nextLevel();
						// gameOver();
					}
					else{
						currFruit.scaleUpTween.start();	
					}
					currFruit.afterPulse = '';	
				};
				currFruit.scaleTween = FruitFlux.game.add.tween(currFruit.scale).to({x: 0.9, y: 0.9}, 500, Phaser.Easing.Elastic.In, false);
				currFruit.scaleUpTween = FruitFlux.game.add.tween(currFruit.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Elastic.Out, false);
				currFruit.scaleTween.onComplete.add(currFruit.scaleTweenCallback, this);
			},	
			countdownOffset = function (fruitNum){
				return f.fruitWidth * (fruitNum - 1) * 1.5;
			},
			countdownFruitX = function (fruitNum) {
				return f.HALF_WIDTH + countdownOffset(fruitNum);
			},		
			addCountdownGroup = function () {
				var i,
				len,
				currFruit;

				if(!f.countdownGroup){
					f.countdownGroup = FruitFlux.game.add.group();
					len = f.NUM_COUNTDOWN_FRUIT;
					for(i = 0; i < len; i++){
						currFruit = FruitFlux.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'fruit');
						f.countdownGroup.add(currFruit);
						currFruit.anchor.setTo(0.5, 0.5);
						currFruit.x = countdownFruitX(i);
						currFruit.y = f.HALF_HEIGHT;
						currFruit.frame = 6;
						currFruit.angle = f.randomAngle();
						addCountdownTweens(currFruit);
					}
				}
				else{
					f.countdownGroup.visible = true;
				}
			},
			countdownPulse = function (pulseNum) {
				// Add countdown fruit on first pulse,
				// remove one on subsequent pulses

				var pulseNumInc = pulseNum + 1,
				lastPulse = isLastPulse(pulseNum);
				FruitFlux.game.time.events.remove(f.countdownTimer);
				// on each pulse, play sound and hide a fruit
				
				f.sound[3].play();

				if(pulseNum === 0){
					addCountdownGroup();
					f.countdownTimer = FruitFlux.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
					getNextFruit(pulseNum).afterPulse = 'hide';
					playCountdownAnim();			
				}
				else {			
					if(!lastPulse){
						getNextFruit(pulseNum).afterPulse = 'hide';			
						playCountdownAnim();
						f.countdownTimer = FruitFlux.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
					}
					else{
						// set group as invisible
						// and all children as visible
						getNextFruit(pulseNum).afterPulse = 'end';	
						playCountdownAnim();
						gameOver();			
					}
				}		
			},
			countdown = function () {
				f.sound[3].play();
				f.countdownTimer = FruitFlux.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, 0);
			},
			setLevelTimers = function () {
				f.levelTimer = FruitFlux.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, f.endLevel, this);
				f.levelRestartTimer = FruitFlux.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, countdown, this);
				f.levelTimer.start();
			},
			initFruitFrame = function (currFruit) {
				currFruit.frame = Math.floor(Math.random() * f.VARIETIES);
			},
			initFruitGroup = function (fruitGroup, groupX) {
				// add the fruit
				var i,
				fruitX = 0,
				fruitY = 0,
				currFruitX,
				currFruitY,
				currFruitPos,
				groupOffset = {x: groupX, y: f.fruitWidth/4},
				halfFruitW = f.fruitWidth/2,
				currFruit,
				currGroupNum = f.allFruit.length -1,
				firstFruit = 0,
				lastFruit = f.FRUIT_PER_COLUMN - 1;
				
				for(i = 0; i < f.FRUIT_PER_COLUMN; i++) {
					// Exclude fruit which would be out of bounds 
					if(currGroupNum * 2 < f.FRUIT_PER_COLUMN) {
						firstFruit = (f.FRUIT_PER_COLUMN - ( 1 + (currGroupNum * 2) ) );
					}
					if(currGroupNum > f.FRUIT_PER_COLUMN) {
						lastFruit = currGroupNum - (3 * (currGroupNum - f.FRUIT_PER_COLUMN) + 1);
					}
					
					currFruitX = fruitX;
					currFruitY = fruitY;
					fruitX += halfFruitW;
					fruitY += f.gameHeight/f.FRUIT_PER_COLUMN;					
					currFruitPos = {x: currFruitX + groupOffset.x, y: currFruitY + groupOffset.y};					
					if(i >= firstFruit && i <= lastFruit){
						currFruit =  new Fruit(FruitFlux.game, currFruitX, currFruitY);
						fruitGroup.add(currFruit);
						initFruitFrame(currFruit);
						registerFruit(currFruit, currFruitPos);
					}					
					fruitGroup.currFruitIndex = fruitGroup.descending ? 0 : fruitGroup.length -1;
				}
				fruitGroup.x = groupOffset.x;
				fruitGroup.y = groupOffset.y;
			},
			getRandomInt = function (min, max) {
			    return Math.floor(Math.random() * (max - min + 1)) + min;
			},
			prepareDemoFruit = function (zoneNum) {
				var //i,
				j,
				currtargets,
				requiredTargets = f.NUM_DEMO_CLICKS,
				extraTargets,
				randomOrdinal,
				otherFruit,
				targetFruitArray = f.fruitByZone[zoneNum].targetFruit;
				currtargets = f.fruitByZone[zoneNum].targetFruit.length;
				if(currtargets < requiredTargets){
					extraTargets = requiredTargets - currtargets;
					otherFruit = f.fruitByZone[zoneNum].otherFruit;
					
					for(j = 0; j < extraTargets; j++){
						randomOrdinal = getRandomInt(0, otherFruit.length -1);
						targetFruitArray.push(otherFruit.splice(randomOrdinal, 1)[0]);
						targetFruitArray[targetFruitArray.length -1].frame = zoneNum;
					}
				}
			},
			addFruitGroup = function (groupNum, colWidth) {
				// Offset groupX by width of 1 column to allow for fruit coming in from left hand side
				var groupX = (groupNum * f.fruitWidth) - colWidth + (f.fruitWidth/2),
				
				// 2nd arg alternates true/false so alternate fluxes run in different directions
				// checking for !== 0 rather than === 0 because otherwise first group (which only 
				// contains one fruit) is out of sync with others
				fruitGroup = FruitFlux.game.add.group(); 
				f.allFruit.add(fruitGroup);				
				initFruitGroup(fruitGroup, groupX);				
			},
			assignFruit = function () {				
				//initialise f.fruitAllocation
				var i,
				players = f.players;
				
				for(i = 0; i < players.length; i++){
					f.fruitAllocation[i] = players[i];
					if(players[i] !== null){
						players[i].fruitFrame = i;
					}
				}
			},
			hudZone = function (zoneNum) {
				// returns true if the current zone requires score panels at end of level
				// (the top and bottom of the table only has panels in centre zone)
				return zoneNum > 0 && zoneNum % 2 !== 0;				
			},			
			showHudFruit = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).hudFruit.scaleUpTween.start();
				}
			},			
			showCheckFruit = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).checkFruit.scaleTween.start();
					f.sound[2].play();
				}
			},
			showScoreTap = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).tapScore.scaleTween.start();
					f.sound[2].play();
				}
			},			
			showTap = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).tap.scaleTween.start();
				}
			},
			hideTap = function () {
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					f.homeZones.getAt(i).tap.scaleDownTween.start();
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
				homeZone,
				homeZoneGroup,
				i,
				rotateHomeZone = function () {
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = homeSettings[i].x;
					homeZoneGroup.y = homeSettings[i].y;
				},
				addHomeZoneFruit = function () {
					homeZone =  new HomeZone(FruitFlux.game, f.HALF_WIDTH, f.HALF_HEIGHT - 55);
					homeZone.anchor.setTo(0.5, 0.5);
					homeZone.scale.x = 0;
					homeZone.scale.y = 0;
					homeZone.frame = f.players[i].fruitFrame;
					f.fruitAllocation[i].fruitFrame = i;
					homeZoneGroup.add(homeZone);						
					homeZoneGroup.hudFruit = homeZone;
				},
				addHomeZoneLogo = function () {
					var logo = FruitFlux.game.add.sprite(0,0, 'logo');
					logo.anchor.setTo(0.5, 0.5);
					logo.x = f.HALF_WIDTH;
					logo.y = Math.floor(f.HALF_HEIGHT * 0.8);
					logo.scale.x = 0;
					logo.scale.y = 0;
					logo.startTween = FruitFlux.game.add.tween(logo.scale).to({x: 0, y: 0}, 500, Phaser.Easing.Elastic.Out, true);
					logo.scaleTween = FruitFlux.game.add.tween(logo.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					logo.pauseTween = FruitFlux.game.add.tween(logo.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Linear.InOut, false);
					logo.scaleDownTween = FruitFlux.game.add.tween(logo.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					logo.startTween.chain(logo.scaleTween, logo.pauseTween, logo.scaleDownTween);
					homeZoneGroup.logo = logo;
					homeZoneGroup.add(logo);
					f.sound[1].play();
				},
				chainTweens = function (tap) {
					var i,
					len = tap.tweens.length - 1;
					// add tweens
					for(i = 0; i < len; i++){
						tap.tweens[i].chain(tap.tweens[i+1]);
					}
				},
				demoTap = function (tapSprite) {					
					
					var zone = tapSprite.parent,
					targetFruitArray = f.fruitByZone[tapSprite.homeZone].targetFruit;
					
					targetFruitArray[zone.fruitTargetNum].onTap();
					zone.fruitTargetNum++;
				},
				makeDemo = function (tap) {
					var i = 1,
					tweenTargetGlobal,
					tweenTargetLocal,
					tweenTargets = f.fruitByZone[tap.homeZone].targetFruit,
					numTaps = f.NUM_DEMO_CLICKS,
					tweenDur = 600,
					tapGroup = tap.parent;
					
					 //add tweens
					for(i = 0; i < numTaps; i++){
						tweenTargetGlobal = tweenTargets[i];
						tweenTargetLocal = tapGroup.toLocal({x: 0, y: 0}, tweenTargetGlobal);
						tap.tweens.push(FruitFlux.game.add.tween(tap).to({x: tweenTargetLocal.x, y: tweenTargetLocal.y}, tweenDur * (i + 1), Phaser.Easing.Sinusoidal.InOut, false));
						tap.targetFruit = tweenTargetGlobal;
						tap.tweens[i].onComplete.add(function() { demoTap(tap); }, this);
					}
					chainTweens(tap);
					tap.tweens[0].start();					
				},
				addHomeZoneInstructions = function (zoneNum) {
					// make a new group and add text too
					var checkFruit = FruitFlux.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.38, 'checkFruit'),
					tapScore = FruitFlux.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.52, 'tapScore'),
					tap = FruitFlux.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.52, 'tap');
					
					checkFruit.anchor.setTo(0.5, 0.5);
					checkFruit.angle = 7;
					checkFruit.scale.x = 0;
					checkFruit.scale.y = 0;
					
					checkFruit.scaleTween = FruitFlux.game.add.tween(checkFruit.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					checkFruit.pauseTween = FruitFlux.game.add.tween(checkFruit.scale).to({x: 1, y: 1}, 300, Phaser.Easing.Linear.InOut, false);
					checkFruit.scaleDownTween = FruitFlux.game.add.tween(checkFruit.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					checkFruit.scaleTween.chain(checkFruit.pauseTween, checkFruit.scaleDownTween);
					homeZoneGroup.checkFruit = checkFruit;
					homeZoneGroup.add(checkFruit);
					
					tapScore.anchor.setTo(0.5, 0.5);
					tapScore.angle = -12;					
					tapScore.scale.x = 0;
					tapScore.scale.y = 0;
					tapScore.scaleTween = FruitFlux.game.add.tween(tapScore.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					tapScore.pauseTween = FruitFlux.game.add.tween(tapScore.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Linear.InOut, false);
					tapScore.scaleDownTween = FruitFlux.game.add.tween(tapScore.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					tapScore.scaleTween.chain(tapScore.pauseTween, tapScore.scaleDownTween);
					homeZoneGroup.tapScore = tapScore;
					homeZoneGroup.add(tapScore);
					
					tap.anchor.setTo(0.5, 0.5);
					tap.scale.x = 0;
					tap.scale.y = 0;
					tap.homeZone = zoneNum;
					tap.tweens = [];
					tap.scaleTween = FruitFlux.game.add.tween(tap.scale).to({x: 1, y: 1}, 100, Phaser.Easing.Linear.Out, false);
					tap.scaleDownTween = FruitFlux.game.add.tween(tap.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					tap.scaleDownTween.onComplete.add(function () { f.sound[4].play(); }, this);					
					tap.scaleTween.onComplete.add(function () { makeDemo(tap);  }, this, tap);
					
					homeZoneGroup.tap = tap;
					homeZoneGroup.add(tap);
				};
				f.freePlay = f.teams.length === 0;
				f.homeZones = FruitFlux.game.add.group();
				
				return function () {
					
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							homeZoneGroup = FruitFlux.game.add.group();	
							homeZoneGroup.fruitTargetNum = 0;
							addHomeZoneFruit();
							rotateHomeZone();							
							f.players[i].homeZone = homeZone;
							f.players[i].homeZoneNum = i;
							f.homeZones.add(homeZoneGroup);								
							addHomeZoneInstructions(f.players[i].homeZoneNum);															
						}
						if(hudZone(i)){							
							addHomeZoneLogo();							
						}											
					}					
					// Make sure we've got enough target fruit for demo
					for(i = 0; i < numZones; i++){
						if(i !== 8){
							prepareDemoFruit(i);
						}				
					}
				};				
			}()),
			// init fruit - within a column, each fruit
			// is horizontally offset by f.fruitWidth/2
			colWidth = (f.fruitWidth * f.FRUIT_PER_COLUMN)/2,
			i;
		
			f.sound = [
				this.game.add.audio('strawberry'),
				this.game.add.audio('logoSound'),
				this.game.add.audio('panelUp'),
				this.game.add.audio('countdown'),
				this.game.add.audio('pointer')
			];
			f.endLevel = function () {
				var 
				i,
				len;
				f.levelOver = true;
				f.endLevelPending = false;
				FruitFlux.game.time.events.remove(f.fruitAssignmentLoop);
				FruitFlux.game.sound.stopAll();
				f.allFruit.endLevelTween.start();

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					f.homeZones.getAt(i).hudFruit.levelOverTween.start();
				}
				f.levelRestartTimer.start();
				// VTAPI.startGame();
			};
			len = f.sound.length;
			for(i = 0; i < len; i++){
				f.sound[i].allowMultiple = false;
			}
			
			f.allFruit = this.game.add.group();
			// numCols is number of fruit that fit across gameWidth, 
			// plus number of fruit that fit across the mainly off-screen 
			// group on left of game			
			f.numCols = Math.floor(f.gameWidth/f.fruitWidth) + Math.floor(f.FRUIT_PER_COLUMN/2);
			
			for(i = 0; i < f.numCols; i++) {
				addFruitGroup(i, colWidth);				
			}
			// initialise f.fruitAllocation with teams - or players if no teams set
			assignFruit();
			f.homeZones = FruitFlux.game.add.group();
			addHomeZones();
			f.allFruit.currGroupNum = 0;
			f.allFruit.randomFruit = function () {
			   return Math.floor(Math.random() * f.VARIETIES);
			};
			f.allFruit.fluxAll = function (){
				var i,
				len = f.allFruit.length;
				
				if(!f.gameStarted){					
					f.sound[1].play();
					f.gameStarted = true;
					f.levelOver = false;
					f.gameStarted = true;
				}
				if(!f.levelOver){
					for(i = 0; i < len; i++){
						// Make each group perform one flux on its current fruit
						f.allFruit.getAt(i).flux();	
					}					
				}
				// This schedules flux on next fruit
				f.allFruit.timer.add(100, f.allFruit.fluxAll, this);				
			};
			
			f.allFruit.alpha = 0.2;
			f.allFruit.endLevelTween = FruitFlux.game.add.tween(f.allFruit).to({alpha: 0}, 1500, Phaser.Easing.Linear.InOut, false);
			f.allFruit.startLevelTween = FruitFlux.game.add.tween(f.allFruit).to({alpha: 1}, 1000, Phaser.Easing.Cubic.Out, false);
			
			setLevelTimers();
			
			f.instructionTimers = [FruitFlux.game.time.events.add(4800, function () { f.allFruit.startLevelTween.start();}, this)];
			f.instructionTimers.push(FruitFlux.game.time.events.add(2900, showCheckFruit, this));
			f.instructionTimers.push(FruitFlux.game.time.events.add(2750, showHudFruit, this));	
			f.instructionTimers.push(FruitFlux.game.time.events.add(5000, showScoreTap, this));	
			f.instructionTimers.push(FruitFlux.game.time.events.add(5500, showTap, this));
			f.instructionTimers.push(FruitFlux.game.time.events.add(8000, hideTap, this));
		}
	};
}());