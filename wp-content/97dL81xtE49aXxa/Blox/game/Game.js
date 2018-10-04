/*global Phaser, Blox, f, PIXI */

(function () {

	"use strict";

	f.removeTween = function(tween) {
		if (tween) {
			tween.onComplete.removeAll();
			tween.stop();
			tween = null;
		}
    };

	Blox.Game = function () {
	    return this;
	};

	Blox.Game.prototype = {

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
				return 'TEAM' + '  ' + (indx + 1) + ' :  ' + score;
			},
			getPanelSettings = function (indx) {
				// returns object containing settings for score panel text, sprite frame (colour) and panel visibility (bg panel is hidden for title)
				var panelSettings = {};
				if(indx === false){
					// title panel
					panelSettings.txt = f.gameOver ? 'GAME  OVER' : 'LEVEL  '  + (f.level + 1) + '  OVER';
					panelSettings.frameNum = f.SCORE_PANEL_FRAMES -1;
					panelSettings.panelVis = false;
				}
				else if(f.freePlay){
					// player panel
					if(f.CONSECUTIVE_PLAYER_NUMS){
						panelSettings.txt  = 'PLAYER ' + f.players[indx].playerNum + '   ' + totalScore(f.players[indx]).toString();
					}
					else{
						panelSettings.txt  = 'PLAYER ' + (indx + 1) + '   ' + totalScore(f.players[indx]).toString();
					}
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
						Blox.game.time.events.remove(timerArray[i]);
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

				f.newLevelSignal.dispatch(this);
				resetCountdownScale();

				f.level++;
				f.gameOver = f.level === f.NUM_LEVELS - 1;
				f.levelOver = false;
				f.gameStarted = true;			

				// reset countdown elements
				f.countdownGroup.visible = false;
				len = f.NUM_COUNTDOWN_ELMTS;
				for(i = 0; i < len; i++){
					currElmt = f.countdownGroup.getAt(i);
					currElmt.visible = true;
				}

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);

					currZone.hudScore.scaleUpTween.start();
					if(!f.freePlay){
						currZone.hudTeamScore.scaleTween.start();
					}
				}
				f.clearDynamicTimers();
				f.setLevelTimers();
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
				currElmt.scaleTween = Blox.game.add.tween(currElmt.scale).to({x: 0.7, y: 0.7}, 500, Phaser.Easing.Elastic.In, false);
				currElmt.scaleUpTween = Blox.game.add.tween(currElmt.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Elastic.Out, false);
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
					f.countdownGroup = Blox.game.add.group();
					len = f.NUM_COUNTDOWN_ELMTS;
					for(i = 0; i < len; i++){
						currElmt = Blox.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'countdown');
						f.countdownGroup.add(currElmt);
						currElmt.anchor.setTo(0.5, 0.7);
						currElmt.x = countdownElmtX(i);
						currElmt.y = f.HALF_HEIGHT;
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
				Blox.game.time.events.remove(f.countdownTimer);
				// on each pulse, play sound and hide an element

				f.sound[6].play();

				if(pulseNum === 0){
					addCountdownGroup();
					f.countdownTimer = Blox.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
					getNextElmt(pulseNum).afterPulse = 'hide';
					playCountdownAnim();
				}
				else {
					if(!lastPulse){
						getNextElmt(pulseNum).afterPulse = 'hide';
						playCountdownAnim();
						f.countdownTimer = Blox.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, pulseNumInc);
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
				f.countdownTimer = Blox.game.time.events.add(f.PANEL_DELAY, countdownPulse, this, 0);
			},
			volumeChangeHandler = function (event) {
				Blox.game.sound.volume = parseInt(event.detail, 10)/10;
			},
			gameOver = function (exit) {
				var
				removeSound = function(sound) {
					sound.stop();
					sound = null;
				},
				removeTweens = function (elmt, tweenNames) {
					// args: Object & Array of tween names
					var i,
					len = tweenNames.length;
					for(i = 0; i < len; i++){
						f.removeTween(elmt[tweenNames[i]]);
					}
				},
				i,
				j,
				len,
				jlen,
				currElmt,
				currJelmt,
				tween;

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
					// (hudTeamScore, hudScore and scorePanels)
					for(j = 0; j < jlen; j++){
						currJelmt = currElmt.getAt(j);
						removeTweens(currJelmt, ['currJelmtTween1', 'currJelmtTween2']);
					}
				}	

				len = f.blocks.length;

				for(i = 0; i < len; i++) {
					currElmt = f.blocks.getAt(i);

					if(currElmt.scaleTween) {
						currElmt.scaleTween = null;
					}

					// remove block tweens
					for (tween in currElmt.tweens) {
					    if (currElmt.tweens.hasOwnProperty(tween)) {
					        removetween(currElmt.tweens[tween]);
					    }
					}
				}	

				len = f.shimmerBlocks.length;

				for(i = 0; i < len; i++) {
					currElmt = f.shimmerBlocks.getAt(i);

					if(currElmt.scaleTween) {
						currElmt.scaleTween = null;
					}

					// remove block tweens
					for (tween in currElmt.tweens) {
					    if (currElmt.tweens.hasOwnProperty(tween)) {
					        removetween(currElmt.tweens[tween]);
					    }
					}
				}

				// Remove countdown tweens
				if(f.countdownGroup) {
					len = f.countdownGroup.length;
					for(i = 0; i < len; i++){
						removeTweens(f.countdownGroup.getAt(i), ['scaleTween', 'scaleUpTween']);
					}
				}
				
				// Remove sound
				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				Blox.game.time.events.remove(f.countdownTimer);
				Blox.game.time.events.remove(f.levelTimer);
				Blox.game.time.events.remove(f.levelRestartTimer);
				Blox.game.time.events.remove(f.endTimer);

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
				if(f.countdownGroup) {
					f.countdownGroup.destroy(true, false);
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
				top.window.removeEventListener('volume-change', volumeChangeHandler, false);			
				
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
				},
				currZone,
				i,
				j,
				len = f.homeZones.length,
				jlen,
				timerDur;
				
				if(f.gameOver){
					returnScores();
					f.endTimer = Blox.game.time.events.add(f.FINAL_RESULTS_DUR, gameOver, this);					
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
								currZone.scorePanels.timers.push(Blox.game.time.events.add(timerDur, hideHomeZonePanel, this, currZone.scorePanels.getAt(j)));
							}
						}
					}
					currZone.scorePanels.timers.push(Blox.game.time.events.add(f.COUNTDOWN_DELAY, countdown, this));
				}
			},
			setLevelTimers = function () {
				f.levelTimer = Blox.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, f.transitionLevel, this);
				f.levelRestartTimer = Blox.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, startCountdown, this);
				f.levelTimer.start();
			},
			makePanel = function (indx, teamHUD) {
				// returns a score panel to be displayed at end of level
				var panelGroup = Blox.game.add.group(),
				panel = Blox.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'scorePanels'),
				panelSettings = getPanelSettings(indx),
				fontSize = indx === false ? f.TITLE_PANEL_FONT_SIZE : f.SCORE_PANEL_FONT_SIZE,
				font = indx === false ? 'pixelCaps' : 'pixelCapsWhite',
				panelText;				

				if(teamHUD) {
					fontSize = f.TEAM_HUD_FONT_SIZE * f.blockSetUps[Math.ceil(f.numPlayers/2) -1].teamScoreSettings.sizeFactor;					
				} else {
					fontSize = indx === false ? f.TITLE_PANEL_FONT_SIZE : f.SCORE_PANEL_FONT_SIZE;
				}
				panelText = Blox.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 5, font, panelSettings.txt, fontSize);
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
			getStartOffsetX = function (panelGroupWidth, freePlay) {
				// returns x position of first score panel in a homeZone
				var offsetVal = freePlay ? f.numPlayers * (panelGroupWidth/30) : f.teams.length * (panelGroupWidth/30);
				return offsetVal;
			},
			getStartOffsetY = function (freePlay) {
				// returns y position of first score panel in a homeZone
				var reqPanels = freePlay ? f.numPlayers : f.teams.length;
				return f.SCORE_PANELS_OFFSET_V - (f.SCORE_PANELS_OFFSET_V * Math.ceil((f.MAX_PLAYERS - reqPanels)/2)) - 20;
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
				pWidth = f.scorePanelsWidth,
				panelXstartOffset = getStartOffsetX(pWidth, freePlay),
				panelX = (pWidth/4) + panelXstartOffset,

				// vertical position varies according to number of panels
				panelYstartOffset = getStartOffsetY(freePlay),
				panelY = panelYstartOffset,
				panelXoffset,
				panelYoffset,
				len,
				addPanel = function (indx) {
					scorePanelsGroup.add(panelGroup = makePanel(indx));
					panelGroup.x = Math.floor(panelX -= panelXoffset);
					panelGroup.y = Math.floor(panelY -= panelYoffset) + f.SCORE_PANELS_OFFSET_V/2;
					if(indx === false){
						panelGroup.y = panelY + f.PANEL_TITLE_OFFSET;
					}
				};
				panelXoffset = pWidth/8;
				panelYoffset = f.SCORE_PANELS_OFFSET_V * 0.82;

				len = freePlay ? f.players.length - 1 : f.teams.length - 1;
				for(i = len; i >= 0; i--){
					if(!freePlay || f.players[i] !== null){
						addPanel(i);
					}
				}
				// add title panel
				addPanel(false);
			},
			makeLevelTweens = function (elmt) {
				elmt.endLevelTween = Blox.game.add.tween(elmt).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
				elmt.endLevelTween.onComplete.add( function(){
					var i,
					len = this.length;
					for(i = 0; i < len; i++){
						this.getAt(i).exists = false;
					}}, elmt);
					elmt.startLevelTween = Blox.game.add.tween(elmt).to( {alpha: 1}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
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
			addBlocks = function () {
				var i,
					len,
					j,
					jlen,				
					currGroup,
					currBlock,
					currShimmerGroup,
					currShimmerBlock,
					zoneFrame = 0,
					currX;

				f.blocks = Blox.game.add.group();
				f.shimmerBlocks = Blox.game.add.group();
				f.dynamicGroups.push(f.blocks);
				f.dynamicGroups.push(f.shimmerBlocks);
				len = f.blocksPerRow;
				jlen = f.blocksPerCol;

				for(i = 0; i < len; i++){	
					currGroup = Blox.game.add.group();
					currGroup.colNum = i;
					f.blocks.add(currGroup);

					currShimmerGroup = Blox.game.add.group();
					currShimmerGroup.colNum = i;
					f.shimmerBlocks.add(currShimmerGroup);

					for(j = 0; j < jlen; j++){	
						currX = f.squaresW * i + f.squaresW/2;						
						currBlock = new f.Block(Blox.game, currX, f.squaresH * j + f.squaresH/2, 'squares');
						currBlock.colNum = i;
						currBlock.rowNum = j;
						currBlock.frame = 8;
						currGroup.add(currBlock);
						
						currShimmerBlock = new f.ShimmerBlock(Blox.game, currX, f.squaresH * j + f.squaresH/2, 'shimmer', currBlock);
						currBlock.pairedBlock = currShimmerBlock;
						currShimmerGroup.add(currShimmerBlock);						
					}
				}					
			},
			addHomeZones = (function (){
				var posInset = f.inset = Math.floor(f.gameWidth/20),
				sideInset = Math.floor(posInset * 1.7),
				innerSideL = sideInset,
				innerSideR = f.gameWidth - sideInset,
				rightPos = f.gameWidth - posInset,
				bottomPos = f.gameHeight - posInset,
				homeSettings = [ 
				/*
				 *	Clockwise from TL
				 *	- x and y are used to determine which blocks are homeZones
				 *	- angle sets zone angle
				 *	- hudOffset sets the offset of the HUD score from the edge of the game
				 */
					{x: innerSideL, y: posInset , angle: 180, hudOffset: {x: 0, y: f.squaresH/2}},
					{x: f.HALF_WIDTH, y: posInset, angle: 180, hudOffset: {x: 0, y: f.squaresH/2}},
					{x: innerSideR, y: posInset, angle: 180, hudOffset: {x: 0, y: f.squaresH/2}},
					{x: rightPos, y: f.HALF_HEIGHT, angle: 270, hudOffset: {x: - f.squaresW/2, y: 0}},
					{x: innerSideR, y: bottomPos, angle: 0, hudOffset: {x: 0, y: - f.squaresH/2}},
					{x: f.HALF_WIDTH, y: bottomPos, angle: 0, hudOffset: {x: 0, y: - f.squaresH/2}},
					{x: innerSideL, y: bottomPos, angle: 0, hudOffset: {x: 0, y: - f.squaresH/2}},
					{x: posInset, y: f.HALF_HEIGHT, angle: 90, hudOffset: {x: f.squaresW/2, y: 0}}
				],
				numZones = f.MAX_PLAYERS,
				hudTeamScoreOffset = 0, // This gets adjusted for team play to allow space for team score panel
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
					var settings = f.homeSettings[i] ? f.homeSettings : homeSettings;
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = settings[i].x;
					homeZoneGroup.y = settings[i].y;
					homeZoneGroup.sideZone = isSideZone(homeZoneGroup);
				},
				makeTween = function (currPnl, tweenName, tweenTo) {
					var easingStyle = tweenTo === 0 ? Phaser.Easing.Elastic.In : Phaser.Easing.Elastic.Out;
					currPnl[tweenName] = Blox.game.add.tween(currPnl.scale).to( {x: tweenTo, y: tweenTo}, f.SCORE_TWEEN_DURATION * 10, easingStyle, false);
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
					homeZoneGroup.hudTeamScore = homeZoneGroup.add(makePanel(f.players[i].team, true));

					homeZoneGroup.hudTeamScore.y += f.blockSetUps[Math.ceil(f.numPlayers/2) -1].teamScoreSettings.offset;

					homeZoneGroup.hudTeamScore.getAt(1).teamNum = f.players[indx].team;
					homeZoneGroup.hudTeamScore.getAt(1).update = function(){
						this.setText(getTeamScoreString(this.teamNum), false);
					};
					homeZoneGroup.hudTeamScore.getAt(0).alpha = 0;
					addPanelTween(homeZoneGroup.hudTeamScore, [{tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0},{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}]);
				},
				addScores = function (indx) {
					// Add player score to homeZone
					var prop = f.freePlay ? 'freePlay' : 'teamPlay',
					scoreOffset = f.blockSetUps[Math.ceil(f.numPlayers/2) -1].playerScoreSettings[prop].offset,
					scoreFactor = f.blockSetUps[Math.ceil(f.numPlayers/2) -1].playerScoreSettings[prop].sizeFactor;

					score = Blox.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT, 'pixelCaps', f.players[i].score.toString(), f.INSTRUCTION_FONT_SIZE * scoreFactor);
					score.playerScore = f.players[indx].score;
					score.update = function(){
						var currScore = this.playerScore[f.level];
						if(currScore >= 0) {
							this.setText(currScore);
						}						
					};
					score.y += (score.height/4) - hudTeamScoreOffset + scoreOffset;
					score.anchor.setTo(0.5, 0.5);
					score.scaleUpTween = Blox.game.add.tween(score.scale).to({x: 1, y: 1}, f.SCORE_TWEEN_DURATION, Phaser.Easing.Linear.InOut, false);
					score.scaleDownTween = Blox.game.add.tween(score.scale).to({x: 0, y: 0}, f.SCORE_TWEEN_DURATION * 10, Phaser.Easing.Elastic.In, false);
					homeZoneGroup.add(score);
					homeZoneGroup.hudScore = score;
				},
				addScorePanels = function () {
					// Add score panels for end of level
					if(hudZone(i)){
						homeZoneGroup.scorePanels = Blox.game.add.group();
						homeZoneGroup.add(homeZoneGroup.scorePanels);
						initScorePanels(homeZoneGroup.scorePanels, f.freePlay);
						rotateHomeZone();
						scorePnls = homeZoneGroup.scorePanels;
						jlen = scorePnls.children.length;
						for(j = 0; j < jlen; j++){
							addPanelTween(scorePnls.getAt(j), [{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}, {tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0}]);
						}
					}
					else{
						rotateHomeZone();
					}
				},
				assignHomeBlock = function () {
					var blockPosition = f.homeBlockPositions[i],
						zoneCol,
						homeBlock;

					zoneCol = f.blocks.getAt(blockPosition[0]);					

					if(zoneCol !== -1) {
						homeBlock = zoneCol.getAt(blockPosition[1]);

						if(homeBlock !== -1) {
							homeBlock.homeZone = true;
							homeBlock.frame = f.freePlay ? i : f.players[i].team;

							homeBlock.captureSound = f.sound[i];
							homeBlock.captureSound.allowMultiple = true;

							homeBlock.bonusSound = f.sound[10];
							homeBlock.bonusSound.volume = 0.8;

							homeBlock.hazardSound = f.sound[11];
							homeBlock.hazardSound.volume = 0.45;
							
							homeBlock.hazardShortSound = f.sound[12];
							homeBlock.hazardShortSound.volume = 0.7;

							homeBlock.bonusSound.allowMultiple = true;
							homeBlock.hazardSound.allowMultiple = true;

							homeBlock.isHomeZone = true;
							homeBlock.player = f.players[i];

							// Add position to f.homeSettings so we can position the HUD score correctly
							f.homeSettings[i] = {x: homeBlock.x + homeSettings[i].hudOffset.x, y: homeBlock.y + homeSettings[i].hudOffset.y};
						} else {
							console.error('assignHomeBlock: no such block');
						}
					} else {
						console.error('assignHomeBlock: no such column');
					}
				}				
				return function () {

					var currChild,
					currZone,
					goal;
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							homeZoneGroup = Blox.game.add.group();

							assignHomeBlock();

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
						}
					}					
				};
			}());			

			f.setLevelTimers = setLevelTimers;
			f.pulseBlockGroups = function () {
				// set pulse tweens
				f.blocksAlphaOutTween = Blox.game.add.tween(f.blocks).to({alpha: 0.2}, 300, Phaser.Easing.Quartic.Out, true);
				f.blocksAlphaInTween = Blox.game.add.tween(f.blocks).to({alpha: 1}, 100, Phaser.Easing.Linear.InOut, false);
				f.blocksAlphaOutTween.chain(f.blocksAlphaInTween);

				f.shimmerBlocksAlphaOutTween = Blox.game.add.tween(f.shimmerBlocks).to({alpha: 0.2}, 200, Phaser.Easing.Quartic.Out, true);
				f.shimmerBlocksAlphaInTween = Blox.game.add.tween(f.shimmerBlocks).to({alpha: 1}, 100, Phaser.Easing.Linear.InOut, false);
				f.shimmerBlocksAlphaOutTween.chain(f.shimmerBlocksAlphaInTween);

				if(f.currPulse < 2) {				
					f.sound[9].play();
					f.sound[9].volume += 0.2;
					f.currPulse++;					
				} else {
					// When f.endTransition is true, Game.update will check 
					// f.endAlertCompleted and f.blockFadeCompleted
					// to see if the game is over
					f.endTransition = true;
					f.sound[9].play();
					f.shimmerBlocksAlphaOutTween.onComplete.add(function () {
						f.blockFadeCompleted = true;
					}, this);					
				}
			};
			f.transitionLevel = function () {
				// Alert players to fact that layer is about to end				
				f.currPulse = 0;
				f.pulseBlockGroups();
				f.transitionLoop = Blox.game.time.events.loop(1500 , f.pulseBlockGroups, this);
			};
			f.endLevel = function () {
				var currZone,
					i,
					j,
					len,
					jlen,
					timerDur,
					dynamicGroupsLen = f.dynamicGroups.length;
					f.levelOver = true;

				f.sound[8].onFadeComplete.add(function() {
					Blox.game.sound.stopAll();
				});
				f.sound[8].fadeOut(200);
				f.selected = [];
				f.sound[0].play();

				for(i = 0; i < dynamicGroupsLen; i++){
					if(f.dynamicGroups[i] !== f.blocks) {
						f.dynamicGroups[i].endLevelTween.start();	
					}					
				}

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);

					currZone.hudScore.scaleDownTween.start();

					// Hide homeZone teamScore
					if(!f.freePlay){
						currZone.hudTeamScore.scaleDownTween.start();
					}

					if(currZone.scorePanels){
						// Show score panels
						currZone.scorePanels.timers = clearScoreTimers(currZone.scorePanels);
						jlen = currZone.scorePanels.children.length;

						for(j = 0; j < jlen; j++){
							//score panel delay gets shorter for each panel as order of panels in group is reversed
							timerDur = j < jlen - 1 ? f.PANEL_DELAY + f.LEVEL_PANEL_DELAY + (f.SCORE_PANEL_DELAY * (jlen - j + 1)) : f.PANEL_DELAY;
							currZone.scorePanels.timers.push(Blox.game.time.events.add(timerDur, onEndLevel, this, currZone.scorePanels.getAt(j)));
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
					Blox.game.time.events.remove(f.timers[i]);
				}
			};
			

			f.homeZones = this.game.add.group();
			f.homeZones.isHomeZones = true;
			f.dynamicGroups = [
				// All groups except homezones
				// use this array to start fade tweens etc
				
			];
			f.sound = [
				Blox.game.add.audio('g2'),
				Blox.game.add.audio('b2'),
				Blox.game.add.audio('d3'),
				Blox.game.add.audio('f3'),
				Blox.game.add.audio('a3'),
				Blox.game.add.audio('c4'),
				Blox.game.add.audio('e4'),
				Blox.game.add.audio('g4'),
				Blox.game.add.audio('loop'),
				Blox.game.add.audio('endAlert'),
				Blox.game.add.audio('bonus'),
				Blox.game.add.audio('hazard'),
				Blox.game.add.audio('hazardShort')
			];

			
			f.bg = this.game.add.sprite(0, 0, 'tone');
			f.bg.blendMode = PIXI.blendModes.MULTIPLY;f
			addBlocks();
			addLevelTweens(f.dynamicGroups);						
			Blox.game.add.existing(f.homeZones);
			addHomeZones();
			Blox.game.world.bringToTop(f.shimmerBlocks);
			Blox.game.world.bringToTop(f.homeZones);	
			for(var i = 0; i < 8; i++) {
				f.sound[i].volume = 0.8;
			}
			f.sound[8].loop = true;	
			f.sound[8].play();
			f.sound[9].volume = 0.6;

			f.makeChains( // Array of chain descriptions - homezone num, {numBlocks, dir}
				[ 
					// [ 4, [{numBlocks: 25, dir: 4}, {numBlocks: 10, dir: 3}], 6000 ],
					// [ 2, [{numBlocks: 10, dir: 4}, {numBlocks: 8, dir: 3}] ],
					// [ 3, [{numBlocks: 4, dir: 3}, {numBlocks: 8, dir: 4}] ],
					// [ 4, [{numBlocks: 7, dir: 4}, {numBlocks: 2, dir: 3}] ],
					// [ 5, [{numBlocks: 7, dir: 1}, {numBlocks: 4, dir: 4}] ],
					// [ 6, [{numBlocks: 7, dir: 1}, {numBlocks: 3, dir: 2}] ],
					// [ 7, [{numBlocks: 3, dir: 1}, {numBlocks: 2, dir: 2}] ],
					// [ 8, [{numBlocks: 7, dir: 2}, {numBlocks: 2, dir: 3}] ]
				]
			);			
			setLevelTimers();
			
			top.window.addEventListener('volume-change', volumeChangeHandler, false);
			volumeChangeHandler({detail: top.HarmonicsSoundManager.getVolume()});
		},
	    update: function () {
	    	var pointers = this.game.input.pointers,
	    		i,
	    		ilen = pointers.length,
	    		currPointer,
	    		currCol;

	    	// Check for game over	    		
			if(f.endTransition && f.blockFadeCompleted) {
	    		// Only once
	    		f.endTransition = false;
	    		f.removeTween(f.blocksAlphaOutTween);
				f.removeTween(f.blocksAlphaInTween);
				f.removeTween(f.shimmerBlocksAlphaOutTween);
				f.removeTween(f.shimmerBlocksAlphaInTween);

				// remove transitionLoop
				Blox.game.time.events.remove(f.transitionLoop);
				f.gameOver = true;				
				f.endLevel();
	    	}

	    	// Assign Blocks to pointers to facilitate onEnter and onRelease for Blocks

	    	// we're not using the standard input events as once the standard onInputOver
	    	// has fired for a given sprite, it won't fire again until it gets the 
	    	// corresponding onInputOut event.
	    	// This means an onInputUp event would leave the block under the pointer 
	    	// with an 'open' onInputOver and so, when the pointer next enters this block, 
	    	// it doesn't fire onInputOver

	    	// We're not using input.pointers as this requires touch events and the game tables,  
	    	// strangely, don't seem to be dispatching them

	    	for (var pointerKey in f.activePointers) {

			    if (f.activePointers.hasOwnProperty(pointerKey)) {
			        
			        currPointer = f.activePointers[pointerKey];

			        currCol =  f.blocks.getAt(Math.floor(currPointer.x / f.squaresW));
	    			if(currCol !== -1) {
	    				currPointer.block = currCol.getAt( Math.floor(currPointer.y / f.squaresH));
		    			if(currPointer.block !== -1 && currPointer.block !== currPointer.prevBlock) {
		    				currPointer.prevBlock = currPointer.block;
		    				currPointer.block.onEnter(currPointer);
		    			}	
	    			}
			    }
			}
	    	
	    	f.masterSpecialsCounter++;	    	
    	}			    
	};
}());
