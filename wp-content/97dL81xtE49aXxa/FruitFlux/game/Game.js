/*global Phaser, FruitFlux, f */

(function () {
	
	"use strict";
	
	f.level = 0;
	f.levelOver = true;
	f.gameStarted = false;
	f.reassignmentRunning = false;
	f.endLevelPending = false;
	
	var FruitGroup = function (game, descending, firstGroup, lastGroup) {

		// Extend Phaser.Group
        Phaser.Group.call(this, game);

		this.descending = descending;
		this.lastGroup = lastGroup;
		this.firstGroup = firstGroup;
		this.iterations = 0;		
		this.timer = FruitFlux.game.time.create(false);
		this.nextFluxInitiated = false;
		
		this.nextFlux = function () {
			if(!f.levelOver && this.firstGroup){
				f.playFluxSound();
			}			
			this.currFruitIndex = descending ? 0 : this.length -1;
			this.iterations = 0;
			this.nextFluxInitiated = false;
		};
		this.flux = function () {
			
			var increment = this.descending ? 1 : -1;
			
			// Flux current fruit
			if(this.iterations < f.FRUIT_PER_COLUMN){
				if(this.iterations < this.length){
					this.getAt(this.currFruitIndex).flux();									
				}
				this.currFruitIndex += increment;
				this.iterations++;				
			}
			
			else{ // All fruit have fluxed - schedule the group's next flux
				if(!this.nextFluxInitiated && !f.levelOver){
					this.timer.stop();
					this.timer.removeAll();
					// this.timer.add(f.FLUX_INTERVALS[f.level], this.nextFlux, this);
					this.timer.add(f.currStepVal, this.nextFlux, this);					
					this.timer.start();	
					this.nextFluxInitiated = true;
					if(this.lastGroup) {
						// All fruit have now fluxed - let's speed things up a bit
						f.currStepVal -= f.FLUX_STEP_VAL;
					}
				}							
			}
		};
		
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
		this.scoring = false;
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
		this.onScore = function () {
			var player = f.fruitAllocation[this.frame];
			if(player && player !== null){
				player.updateScore();
			}
		};
		this.onTap = function () {
			if(!f.levelOver){
				f.sound[this.frame].play();
				this.scoring = true;
				this.onScore();
				this.frame = f.VARIETIES;
				this.scoreRotTween = FruitFlux.game.add.tween(this).to({angle: this.angle + 180}, f.FRUIT_FLUX_DURATION + 20, Phaser.Easing.Default, true);
				if(!this.scaleTween.isRunning){
					this.scoreScaleTween = FruitFlux.game.add.tween(this.scale).to({x: 1, y: 1}, 20, Phaser.Easing.Default, true);
					this.scoreScaleTween.onComplete.add(this.flux, this);
				}
			}
		};		
	    this.inputEnabled = true;
	    this.events.onInputDown.add(this.onTap, this);
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
	};
	
	FruitGroup.prototype = Object.create(Phaser.Group.prototype);
    FruitGroup.prototype.constructor = FruitGroup;
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
				return 'TEAM ' + (indx + 1) + '   ' + score;
			},
			getPanelSettings = function (indx) { // indx is score panel number ie 0 is top panel
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
						FruitFlux.game.time.events.remove(timerArray[i]); 
					}
				}
				return [];
			},			
			onEndLevel = function (panel) {
				panel.scaleTween.start();
				f.sound[11].play();
			},
			updatePanelScores = function (panelBmapTxtOb, indx) {
				var panelSettings = getPanelSettings(indx);
				panelBmapTxtOb.setText(panelSettings.txt);
			},
			reassignFruit = function () {
				// shuffles fruitAllocation to keep players on their toes -
				// they will then score by collecting a different fruit
				var i;			
				Phaser.ArrayUtils.shuffle(f.fruitAllocation);
				f.reassignmentRunning = true;

				// Members of fruitAllocation are players, so just have to 
				// update their fruitFrame and homeZone frames
				for (i = 0; i < f.fruitAllocation.length; i++){
					if(f.fruitAllocation[i] !== null){
						f.fruitAllocation[i].fruitFrame = i;
						f.fruitAllocation[i].homeZone.flux(i);
					}
				}
				f.sound[9].play();
			},
			setFruitAssignmentLoop = function (){
				f.fruitAssignmentLoop = FruitFlux.game.time.events.loop(f.REASSIGNMENT_INTERVALS[f.level], reassignFruit, this);
			},
			accelerateFruitAssignment = function (delay){
				if(! f.assignmentTimer){
					f.assignmentTimer = FruitFlux.game.time.create(false);
				} else {
					reassignFruit();	
				}		
				f.assignmentTimer.add(delay, accelerateFruitAssignment, this, Math.ceil(delay * f.ASSIGN_STEP_FAC));
				f.assignmentTimer.start();
			},
			hideHomeZonePanel = function (panel) {
				panel.scaleDownTween.start();
			},
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
				currGroup,
				currFruit;		

				f.level ++;
				f.gameOver = f.level === f.NUM_LEVELS - 1;
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
				// Reset FruitGroup timers
				len = f.allFruit.length;
				for(i = 0; i < len; i++){
					currGroup = f.allFruit.getAt(i);
					currGroup.timer.stop();
					currGroup.timer.removeAll();
					currGroup.timer.add(f.FLUX_INTERVALS[f.level], currGroup.nextFlux, this); 
				}
				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					var currZone = f.homeZones.getAt(i);

					if(currZone.hudScore) {
						currZone.hudScore.scaleUpTween.start(); 
						currZone.hudFruit.scaleUpTween.start();
					}
					if(!f.freePlay && currZone.hudTeamScore){
						currZone.hudTeamScore.scaleTween.start();
					}
				}				
				setFruitAssignmentLoop();
				setLevelTimers();
				f.allFruit.timer.add(1000, f.allFruit.fluxAll, this);
				f.allFruit.timer.start();
				f.allFruit.startLevelTween.start();				
			},
			addCountdownTweens = function (currFruit) {
				currFruit.scaleTweenCallback = function () {
					if(currFruit.afterPulse === 'hide'){
						currFruit.visible = false;				
					}
					else if(currFruit.afterPulse === 'end'){
						nextLevel();
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
				
				f.sound[12].play();

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
					}
				}		
			},
			countdown = function () {
				f.sound[12].play();
				f.countdownTimer = FruitFlux.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, 0);
			},
			pauseHandler = function () {
				FruitFlux.game.paused = ! FruitFlux.game.paused;
			},
			exitHandler = function () {
				gameOver(true);
			},
			gameOver = function (exit) {
				var removeSound = function(_sound) {
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
					currElmt.timer.destroy();

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

					// remove scorePanel timers
					if(currElmt.scorePanels){
						clearScoreTimers(currElmt.scorePanels); 
					}

					// remove tweens from home zone children 
					// (hudTeamScore, hudFruit, hudScore and scorePanels)
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						if(j === 1){
							removeTweens(currJelmt, ['scaleTween', 'scaleDownTween', 'levelOverTween']);
						}
						else{
							removeTweens(currJelmt, ['scaleTween', 'scaleDownTween']);
						}
					}		
				}
				if(f.countdownGroup) {
					// Countdown fruit - remove tweens
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

				FruitFlux.game.time.events.remove(f.countdownTimer);
				FruitFlux.game.time.events.remove(f.levelTimer);
				FruitFlux.game.time.events.remove(f.levelRestartTimer);
				FruitFlux.game.time.events.remove(f.endTimer);
				
				f.allFruit.timer.destroy();
				if(f.assignmentTimer){
					f.assignmentTimer.destroy();
				}

				// destroy groups
				f.allFruit.destroy();
				f.homeZones.destroy();
				
				// delete properties of f
				for(currElmt in f){
					if(f.hasOwnProperty(currElmt)){
						delete f[currElmt];
					}
				}
				top.window.removeEventListener('pause', pauseHandler, false);
				top.window.removeEventListener('exit', exitHandler, false);
				if(exit) {
					VTAPI.onGameOver(true);
				} else {
					VTAPI.onGameOver();	
				}								
		    },
			startCountdown = function () {
				var 
				returnScores = function () {
					/*
						create playerResults array of player objects
							properties: place and ranking
						create teamResults array of numbers representing tram ranking
					*/
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
							// teams are zero indexed - adjust for VTAPI
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
				};
				
				if(f.gameOver){
					returnScores();
					f.endTimer = FruitFlux.game.time.events.add(f.FINAL_RESULTS_DUR, gameOver, this);
				}
				else{
					var currZone,
					i,
					j,
					len = f.homeZones.length,
					jlen,
					timerDur;

					for(i = 0; i < len; i++){
						currZone = f.homeZones.getAt(i);					

						if(currZone.scorePanels){
							// Hide score panels
							currZone.scorePanels.timers = clearScoreTimers(currZone.scorePanels);
							jlen = currZone.scorePanels.children.length - 1;

							for(j = jlen; j >= 0; j--){
								//All panels are removed at same time
								timerDur = f.PANEL_DELAY;
								currZone.scorePanels.timers.push(FruitFlux.game.time.events.add(timerDur, hideHomeZonePanel, this, currZone.scorePanels.getAt(j)));
							}
						}
					}
					currZone.scorePanels.timers.push(FruitFlux.game.time.events.add(f.COUNTDOWN_DELAY, countdown, this));
				}		
			},	
			setLevelTimers = function () {
				f.levelTimer = FruitFlux.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, f.endLevel, this);
				f.levelRestartTimer = FruitFlux.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, startCountdown, this);				
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
					if(i >= firstFruit && i <= lastFruit){
						currFruit =  new Fruit(FruitFlux.game, currFruitX, currFruitY);
						fruitGroup.add(currFruit);
						initFruitFrame(currFruit);
					}					
					fruitGroup.currFruitIndex = fruitGroup.descending ? 0 : fruitGroup.length -1;
				}
				fruitGroup.x = groupX;
				fruitGroup.y = f.fruitWidth/4;
				fruitGroup.fluxDuration = f.FRUIT_FLUX_DURATION + (f.FRUIT_TWEEN_DELAY * fruitGroup.length);
				
			},
			addFruitGroup = function (groupNum, colWidth, firstGroup, lastGroup) {
				// Offset groupX by width of 1 column to allow for fruit coming in from left hand side
				var groupX = (groupNum * f.fruitWidth) - colWidth + (f.fruitWidth/2),
				
				// 2nd arg alternates true/false so alternate fluxes run in different directions
				// checking for !== 0 rather than === 0 because otherwise first group (which only 
				// contains one fruit) is out of sync with others
				fruitGroup = new FruitGroup(FruitFlux.Game(), groupNum % 2 !== 0, firstGroup, lastGroup); 
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
			makePanel = function (indx) {
				// returns a score panel to be displayed at end of level
				var panelGroup = FruitFlux.game.add.group(),
				panel = FruitFlux.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'scorePanels'),
				panelSettings = getPanelSettings(indx),
				fontSize = indx === false ? f.TITLE_PANEL_FONT_SIZE : f.SCORE_PANEL_FONT_SIZE,
				panelText = FruitFlux.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT, 'luckiestGuy', panelSettings.txt, fontSize);
				panelText.playerNum = indx;
				
				panel.frame = panelSettings.frameNum;
				panel.anchor.setTo(0.5, 0.5);
				panel.visible = panelSettings.panelVis;
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
				homeZone,
				homeZoneGroup,
				score,
				i,
				scorePnls,
				jlen,
				j,
				rotateHomeZone = function () {
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = homeSettings[i].x;
					homeZoneGroup.y = homeSettings[i].y;
				},
				makeTween = function (currPnl, tweenName, tweenTo) {
					var easingStyle = tweenTo === 0 ? Phaser.Easing.Elastic.In : Phaser.Easing.Elastic.Out;
					currPnl[tweenName] = FruitFlux.game.add.tween(currPnl.scale).to( {x: tweenTo, y: tweenTo}, f.FRUIT_TWEEN_DURATION * 10, easingStyle, false);
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
					hudTeamScoreOffset = Math.floor(f.gameHeight/20);
					homeZoneGroup.hudTeamScore = homeZoneGroup.add(makePanel(f.players[i].team));
					homeZoneGroup.hudTeamScore.getAt(1).teamNum = f.players[indx].team;
					homeZoneGroup.hudTeamScore.getAt(1).update = function(){
						this.setText(getTeamScoreString(this.teamNum), false);
					};
					homeZoneGroup.hudTeamScore.y += hudTeamScoreOffset;
					addPanelTween(homeZoneGroup.hudTeamScore, [{tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0},{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}]);
				},
				addHomeZoneFruit = function () {
					homeZone =  new HomeZone(FruitFlux.game, f.HALF_WIDTH, f.HALF_HEIGHT);
					homeZone.y -= hudTeamScoreOffset;
					homeZone.anchor.setTo(0.5, 0.5);
					homeZone.scale.x = 0;
					homeZone.scale.y = 0;
					homeZone.frame = f.players[i].fruitFrame;
					f.fruitAllocation[i].fruitFrame = i;
					homeZoneGroup.add(homeZone);						
					homeZoneGroup.hudFruit = homeZone;
				},
				addScores = function (indx) {
					score = FruitFlux.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT, 'passion', f.players[i].score.toString(), f.INSTRUCTION_FONT_SIZE);
					score.playerScore = f.players[indx].score;
					score.update = function(){
						this.setText(this.playerScore[f.level]);
					};
					score.y += (score.height/4) - hudTeamScoreOffset;
					score.anchor.setTo(0.5, 0.5);
					score.scaleUpTween = FruitFlux.game.add.tween(score.scale).to({x: 1, y: 1}, f.FRUIT_TWEEN_DURATION, Phaser.Easing.Linear.InOut, false);
					score.scaleDownTween = FruitFlux.game.add.tween(score.scale).to({x: 0, y: 0}, f.FRUIT_TWEEN_DURATION * 10, Phaser.Easing.Elastic.In, false);
					homeZoneGroup.add(score);
					homeZoneGroup.hudScore = score;
				},
				addHud = function () {
					homeZoneGroup.scorePanels = FruitFlux.game.add.group();
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
					if(hudZone(i)){
						addHud();
					}
					else {
						rotateHomeZone();
					}
				};
				f.freePlay = !f.teams;
				f.homeZones = FruitFlux.game.add.group();
				
				return function () {
					
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							homeZoneGroup = FruitFlux.game.add.group();						

							if(!f.freePlay){
								addTeamScorePanel(i);					
							}
							addHomeZoneFruit();
							addScores(i);	

							// TODO: addScorePanels shouldn't be inside this conditional - probably needs changing on all games 
							addScorePanels();
							
							f.players[i].scoreDisplay = score;
							f.players[i].homeZone = homeZone;
							f.homeZones.add(homeZoneGroup);									
						} else if (hudZone(i)) {
							homeZoneGroup = FruitFlux.game.add.group();
							addHud();
							f.homeZones.add(homeZoneGroup);
						}
						// addScorePanels();				
					}	

					// Now that homeZones are initialised, randomise fruit assignment			
					reassignFruit();
				};				
			}()),
			// init fruit - within a column, each fruit
			// is horizontally offset by f.fruitWidth/2
			colWidth = (f.fruitWidth * f.FRUIT_PER_COLUMN)/2,
			i;
		
			// store sounds in array so we can use sprite sheet frame number to play corresponding sound 
			f.sound = [
				this.game.add.audio('banana'),
				this.game.add.audio('blueberry'),
				this.game.add.audio('cherry'),
				this.game.add.audio('lemon'),
				this.game.add.audio('orange'),
				this.game.add.audio('plum'),
				this.game.add.audio('strawberry'),
				this.game.add.audio('watermelon'),
				this.game.add.audio('flux'),
				this.game.add.audio('reassign'),
				this.game.add.audio('powerDown'),
				this.game.add.audio('panelUp'),
				this.game.add.audio('countdown'),
				this.game.add.audio('flux')
			];
			f.endLevel = function () {
				if(f.reassignmentRunning){
					f.endLevelPending = true;
				}
				else{
					var 
					currZone,
					i,
					j,
					len,
					jlen,
					timerDur,
					durrMultiplier;
					f.levelOver = true;
					f.endLevelPending = false;
					FruitFlux.game.time.events.remove(f.fruitAssignmentLoop);
					if(f.assignmentTimer){
						f.assignmentTimer.stop();
					}
					f.allFruit.timer.stop();
					FruitFlux.game.sound.stopAll();
					f.sound[10].play();			
					f.allFruit.endLevelTween.start();
					if(f.NUM_LEVELS === 1) {
						// No subsequent level - go straight to game over
						f.gameOver = true;
					}

					len = f.homeZones.length;
					for(i = 0; i < len; i++){
						currZone = f.homeZones.getAt(i);						

						if(currZone.hudScore) {
							currZone.hudScore.scaleDownTween.start(); 
							currZone.hudFruit.levelOverTween.start();
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
								//score panel delay gets shorter for each panel as order of panels in group is reversed
								durrMultiplier = f.freePlay ? currZone.scorePanels.getAt(j).playerNum : j + 1;
								timerDur = j < jlen - 1 ? f.PANEL_DELAY + f.LEVEL_PANEL_DELAY + (f.SCORE_PANEL_DELAY * durrMultiplier) : f.PANEL_DELAY;
								currZone.scorePanels.timers.push(FruitFlux.game.time.events.add(timerDur, onEndLevel, this, currZone.scorePanels.getAt(j)));
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
					// This will start countdown - don't wanna do this if single level
					f.levelRestartTimer.start();
				}
			};			
			f.sound[9].volume = 0.5;
			f.sound[10].volume = 0.5;

			f.fluxSounds = [
				f.sound[8],
				f.sound[13]
			];
			f.currFluxSoundIndex = 0;
			
			f.playFluxSound = function (){
				f.fluxSounds[f.currFluxSoundIndex % 2].play();
				f.currFluxSoundIndex++;
			}
			
			f.allFruit = this.game.add.group();
			// numCols is number of fruit that fit across gameWidth, 
			// plus number of fruit that fit across the mainly off-screen 
			// group on left of game			
			f.numCols = Math.floor(f.gameWidth/f.fruitWidth) + Math.floor(f.FRUIT_PER_COLUMN/2);
			
			for(i = 0; i < f.numCols; i++) {
				addFruitGroup(i, colWidth, i === 0, i === f.numCols - 1);
			}
			
			// initialise f.fruitAllocation with teams - or players if no teams set
			assignFruit();
			f.homeZones = FruitFlux.game.add.group();
			addHomeZones();
			if(f.NUM_LEVELS > 1) {
				setFruitAssignmentLoop();	
			} else {
				accelerateFruitAssignment(f.REASSIGNMENT_INTERVALS[0]);
			}
			

			f.allFruit.currGroupNum = 0;
			f.allFruit.randomFruit = function () {
			   return Math.floor(Math.random() * f.VARIETIES);
			};
			f.allFruit.fluxAll = function (){
				var i,
				len = f.allFruit.length;
				
				if(!f.gameStarted){					
					f.playFluxSound();
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
			f.allFruit.endLevelTween = FruitFlux.game.add.tween(f.allFruit).to({alpha: 0.2}, f.FRUIT_TWEEN_DURATION * 10, Phaser.Easing.Cubic.Out, false);
			f.allFruit.startLevelTween = FruitFlux.game.add.tween(f.allFruit).to({alpha: 1}, f.FRUIT_TWEEN_DURATION * 10, Phaser.Easing.Cubic.Out, false);
			f.allFruit.timer = FruitFlux.game.time.create(false);
			
			// This timer starts first flux of the level
			f.allFruit.timer.add(1000, f.allFruit.fluxAll, this);
			f.allFruit.timer.start();			
			setLevelTimers();

			top.window.addEventListener('pause', pauseHandler, false);
			top.window.addEventListener('exit', exitHandler, false);			
	    },

	    update: function () {
			if(f.endLevelPending && !f.reassignmentRunning){
				f.endLevel();
			}
	    }
	};
}());