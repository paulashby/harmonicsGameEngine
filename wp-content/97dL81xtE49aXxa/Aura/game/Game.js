/*global Phaser, Aura, f, PIXI */

(function () {

	"use strict";

	Aura.Game = function () {
	    return this;
	};

	Aura.Game.prototype = {

	    create: function () {

			var
			i, len,
			volumeChangeHandler = function (event) {
				Aura.game.sound.volume = parseInt(event.detail, 10)/10;
			},
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
				return 'TEAM' + ' ' + (indx + 1) + ': ' + score;
			},
			getPanelSettings = function (indx) {
				// returns object containing settings for score panel text, sprite frame (colour) and panel visibility (bg panel is hidden for title)
				var panelSettings = {};
				if(indx === false){
					// title panel
					panelSettings.txt = 'GAME  OVER';
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
					panelSettings.frameNum = indx;
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
						Aura.game.time.events.remove(timerArray[i]);						
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
				f.sound[3].play();
			},
			nextLevel = function () {
				var i,
				len,
				currZone;
				
				f.gameOver = f.level === f.NUM_LEVELS - 1;
				f.levelOver = false;			

				f.countdownSprite.alpha = 0;
				f.sound[5].play();

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);

					if(currZone.hudScore){
						currZone.hudScore.scaleTween.start();
					}
					if(!f.freePlay && currZone.hudTeamScore){
						currZone.hudTeamScore.scaleTween.start();
					}
				}
				f.clearDynamicTimers();
				f.setLevelTimers();
			},			
			makeCountdown = (function () {
				var onUpdate = function () {
					f.sound[11].play();
					if(this.frame === 3) {
						f.newLevelSignal.dispatch(this);
						f.level++;
						
						nextLevel();
						addDiscs();
					}
				},				
				startCountdown = function () {
					this.countdownSprite.animations.play('countdownAnim', 1, false);
				};

				return function (){
					var countdownAnimation;
					f.countdownSprite = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'countdown');
					f.countdownSprite.newLevel = false;
					countdownAnimation = f.countdownSprite.animations.add('countdownAnim', [0, 1, 2, 3, 4]);
					countdownAnimation.enableUpdate = true;
					countdownAnimation.onUpdate.add(onUpdate, f.countdownSprite);
					f.countdownSprite.anchor.setTo(0.5, 0.5);
					f.countdownSprite.alpha = 0;
					f.countdownSprite.alphaInTween = Aura.game.add.tween(f.countdownSprite).to({alpha: 1}, 100, Phaser.Easing.Linear.In, true);
					f.countdownSprite.alphaInTween.onComplete.add(startCountdown, {countdownSprite: f.countdownSprite});
				};
			}()),
			countdown = function () {
				if(!f.countdownSprite){
					makeCountdown();
				} else {
					f.countdownSprite.alphaInTween.start();
				}
			},
			pauseHandler = function () {
				Aura.game.paused = ! Aura.game.paused;
			},
			exitHandler = function () {
				gameOver(true);
			},
			pauseHandler = function () {
				Aura.game.paused = ! Aura.game.paused;
			},
			exitHandler = function () {
				gameOver(true);
			},
			gameOver = function (exit) {
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
				k,
				len,
				jlen,
				klen,
				currElmt,
				currJelmt,
				currKelmt;

				

				if(f && f.dragZones) {
					len = f.dragZones.length;
				}
				for(i = 0; i < len; i++) {
					currElmt = f.dragZones.getAt(i);

					// Remove dragzone tweens
					removeTweens(currElmt, ['alphaInTween', 'alphaOutTween']);
				}
				len = 0;
				if(f && f.homeZones) {
					len = f.homeZones.length;
				}
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
						if(j === 0){ 
							removeTweens(currJelmt, ['startLevelTween', 'endLevelTween', 'reloadTween', 'expulsionTween', 'startLevelFGTween', 'endLevelFGTween']);
						} else if(j === 2) {
							removeTweens(currJelmt, ['throbOnTween', 'throbOffTween']);
						} else if(j > 2) {
							if((j === jlen - 1)){ // length of j varies according to f.freePlay
								klen = currJelmt.length;
								for(k = 0; k < klen; k++){
									currKelmt = currJelmt.getAt(k);
									removeTweens(currKelmt, ['scaleDownTween', 'scaleTween']);
								}
							} else {
								removeTweens(currJelmt, ['scaleDownTween', 'scaleTween']);	
							}
						}
					}
				}				
				// Remove sound
				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				Aura.game.time.events.remove(f.countdownTimer);
				Aura.game.time.events.remove(f.levelTimer);
				Aura.game.time.events.remove(f.levelRestartTimer);
				Aura.game.time.events.remove(f.endTimer);

				// Remove level tweens
				len = f.dynamicGroups.length;
				for (i = 0; i < len; i++) {
					removeTweens(f.dynamicGroups[i], ['startLevelTween', 'endLevelTween']);
				}

				// Remove timers added by f.getTimer()
				f.clearDynamicTimers();

				f.discGroup.callAll('removeSound');
				// Remove dynamic groups 
				len = f.dynamicGroups.length;
				for(i = 0; i < len; i++){
					// destroy children, remove from parent and null game reference
					f.dynamicGroups[i].destroy(true, false); 
				}
				f.homeZones.destroy(true, false);
				f.dragZones.destroy(true, false);
				f.bg.destroy();

				// Remove signal
				f.newLevelSignal.removeAll();
				f.endLevelSignal.removeAll();
				f.levelCountDownSignal.removeAll();
				// delete properties of f
				for(currElmt in f){
					if(f.hasOwnProperty(currElmt)){
						delete f[currElmt];
					}
				}
				Aura.game.paused = true;
				top.window.removeEventListener('volume-change', volumeChangeHandler, false);			
				if(exit) {
					VTAPI.onGameOver(true);
				} else {
					VTAPI.onGameOver();	
				}
		    },
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
			startCountdown = function () {
				var
				currZone,
				i,
				j,
				len = f.homeZones.length,
				jlen,
				timerDur;				
				returnScores();
				f.endTimer = Aura.game.time.events.add(f.FINAL_RESULTS_DUR, gameOver, this);					
			},
			setLevelTimers = function () {
				f.levelTimer = Aura.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, function () { f.levelCountDownSignal.dispatch(); }, this);
				f.levelRestartTimer = Aura.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, startCountdown, this);
				f.levelTimer.start();
			},
			makePanel = function (indx) {
				// returns a score panel to be displayed at end of level
				var panelGroup = Aura.game.add.group(),
				panel = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'scorePanels'),
				panelSettings = getPanelSettings(indx),
				fontSize = indx === false ? f.TITLE_PANEL_FONT_SIZE : f.SCORE_PANEL_FONT_SIZE,
				panelText = Aura.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 25, 'summercamp', panelSettings.txt, fontSize);
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
			makeLevelTweens = function (elmt) {
				elmt.endLevelTween = Aura.game.add.tween(elmt).to( {alpha: 0}, f.LEVEL_FADE_DURATION, Phaser.Easing.Quadratic.In, false);
				elmt.endLevelTween.onComplete.add( function(){
					var i,
					len = this.length;
					for(i = 0; i < len; i++){
						this.getAt(i).exists = false;
					}
					if(elmt === f.discGroup){
						elmt.callAll('checkNumDiscs');	
					}

					}, elmt);
					elmt.startLevelTween = Aura.game.add.tween(elmt).to( {alpha: 1}, f.LEVEL_FADE_DURATION * 0.2, Phaser.Easing.Quadratic.In, false);
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
				var posInset = f.inset = Math.floor(f.gameWidth/20.25),
				sideInset = Math.floor(posInset * 1.7),
				innerSideL = sideInset * 3.057,
				innerSideR = f.gameWidth - innerSideL,
				rightPos = f.gameWidth - (posInset * 1.009),
				leftPos = posInset * 1.009,
				bottomPos = f.gameHeight - posInset,
				dzPosInset = posInset + 81,
				dzBottomPos = bottomPos - 81,
				dzRightPos = rightPos - 81,
				dzLeftPos = leftPos + 81,
				homeSettings = [ // Clockwise from TL
					{x: innerSideL, y: posInset , angle: 180},
					{x: f.HALF_WIDTH, y: posInset, angle: 180},
					{x: innerSideR, y: posInset, angle: 180},
					{x: rightPos, y: f.HALF_HEIGHT, angle: 270},
					{x: innerSideR, y: bottomPos, angle: 0},
					{x: f.HALF_WIDTH, y: bottomPos, angle: 0},
					{x: innerSideL, y: bottomPos, angle: 0},
					{x: leftPos, y: f.HALF_HEIGHT, angle: 90}
				],
				dragZoneSettings = [ // Clockwise from TL
					{x: innerSideL, y: dzPosInset , angle: 180},
					{x: f.HALF_WIDTH, y: dzPosInset, angle: 180},
					{x: innerSideR, y: dzPosInset, angle: 180},
					{x: dzRightPos, y: f.HALF_HEIGHT, angle: 270},
					{x: innerSideR, y: dzBottomPos, angle: 0},
					{x: f.HALF_WIDTH, y: dzBottomPos, angle: 0},
					{x: innerSideL, y: dzBottomPos, angle: 0},
					{x: dzLeftPos, y: f.HALF_HEIGHT, angle: 90}
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
					homeZoneGroup.pivot.x = f.HALF_WIDTH;
					homeZoneGroup.pivot.y = f.HALF_HEIGHT;
					homeZoneGroup.angle = homeSettings[i].angle;
					homeZoneGroup.x = homeSettings[i].x;
					homeZoneGroup.y = homeSettings[i].y;
					homeZoneGroup.sideZone = isSideZone(homeZoneGroup);
				},
				makeTween = function (currPnl, tweenName, tweenTo) {
					var easingStyle = tweenTo === 0 ? Phaser.Easing.Elastic.In : Phaser.Easing.Elastic.Out;
					currPnl[tweenName] = Aura.game.add.tween(currPnl.scale).to( {x: tweenTo, y: tweenTo}, f.SCORE_TWEEN_DURATION * 10, easingStyle, false);
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
					hudTeamScoreOffset = Math.floor(f.gameHeight/21);
					homeZoneGroup.hudTeamScore = homeZoneGroup.add(makePanel(f.players[i].team));
					homeZoneGroup.hudTeamScore.y -= f.gameHeight * 0.005;
					homeZoneGroup.hudTeamScore.getAt(1).teamNum = f.players[indx].team;
					homeZoneGroup.hudTeamScore.getAt(1).update = function(){
						this.setText(getTeamScoreString(this.teamNum), false);						
					};
					homeZoneGroup.hudTeamScore.y += hudTeamScoreOffset;
					addPanelTween(homeZoneGroup.hudTeamScore, [{tweenName: 'scaleDownTween', tweenFrom: 1, tweenTo : 0},{tweenName: 'scaleTween', tweenFrom: 0, tweenTo : 1}]);
				},
				addScores = function (indx) {
					// Add player score to homeZone
					var scoreOffset = f.freePlay ? 30 : 70;
					score = Aura.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT, 'summercamp', f.players[i].score.toString(), f.INSTRUCTION_FONT_SIZE * 0.55);
					
					score.playerScore = f.players[indx].score;
					score.update = function(){
						this.setText(this.playerScore[f.level]);
					};
					score.y += (score.height/4) - hudTeamScoreOffset + scoreOffset;
					score.anchor.setTo(0.5, 0.5);
					score.scaleTween = Aura.game.add.tween(score.scale).to({x: 1, y: 1}, f.SCORE_TWEEN_DURATION, Phaser.Easing.Linear.InOut, false);
					score.scaleDownTween = Aura.game.add.tween(score.scale).to({x: 0, y: 0}, f.SCORE_TWEEN_DURATION * 10, Phaser.Easing.Elastic.In, false);
					homeZoneGroup.add(score);
					homeZoneGroup.hudScore = score;
				},
				addHud = function (hudOnly) {
					homeZoneGroup.scorePanels = Aura.game.add.group();
					if(hudOnly) {
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
				addZonePanel = function () {
					var hzPanel;
					hzPanel = new f.HomeZonePanel(Aura.game, f.HALF_WIDTH, f.HALF_HEIGHT * 0.85, 'hzbg');
					homeZoneGroup.add(hzPanel);
					homeZoneGroup.zonePanel = hzPanel;
					hzPanel.player = f.players[i];
					hzPanel.player.homeZone = hzPanel;
					hzPanel.frame = f.freePlay ? i : hzPanel.player.team;					
					f.hzPanels.push(hzPanel);
				};
				

				f.freePlay = f.teams.length === 0;

				return function () {
					var hzfg,
					hzfgThrob,
					dragZone;

					f.dragZones = Aura.game.add.group();
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){
							// homeZoneGroup = Aura.game.add.group();
							homeZoneGroup = new f.HomeZoneGroup(Aura.Game());
							homeZoneGroup.player = i;addZonePanel(i);
							hzfg = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT * 0.8498, 'hzfg');
							hzfg.anchor.setTo(0.5, 0.5);
							hzfg.scale.x = f.hzfgScales[f.level];
							hzfg.scale.y = hzfg.scale.x;
							hzfg.frame = f.freePlay ? i : f.players[i].team;
							homeZoneGroup.hzfg = hzfg;

							homeZoneGroup.add(hzfg);
							hzfgThrob = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT * 0.8498, 'hzfg');
							hzfgThrob.anchor.setTo(0.5, 0.5);
							hzfgThrob.scale.x = hzfg.scale.x;
							hzfgThrob.scale.y = hzfg.scale.y;
							hzfgThrob.frame = 8;
							hzfgThrob.alpha = 0;
							hzfgThrob.throbOnTween = Aura.game.add.tween(hzfgThrob).to({alpha: 0.5}, 200, Phaser.Easing.Quintic.In, false);
							hzfgThrob.throbOffTween = Aura.game.add.tween(hzfgThrob).to({alpha: 0}, 200, Phaser.Easing.Quintic.In, false);
							hzfgThrob.throbOnTween.chain(hzfgThrob.throbOffTween);
							homeZoneGroup.add(hzfgThrob);
							homeZoneGroup.hzfgThrob = hzfgThrob;

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
							dragZone = new f.DragZone(Aura.game, f.HALF_WIDTH, f.HALF_HEIGHT);
							f.dragZones.add(dragZone);
							homeZoneGroup.dragZone = dragZone;
							dragZone.pivot.x = 0;
							dragZone.pivot.y = 0;
							dragZone.angle = dragZoneSettings[i].angle;
							dragZone.x = dragZoneSettings[i].x;
							dragZone.y = dragZoneSettings[i].y;
						}
						else if(hudZone(i)) {
							homeZoneGroup = Aura.game.add.group();
							addHud(true);
							f.homeZones.add(homeZoneGroup);	
						}
					}					
				};
			}()),
			addDiscs = (function (){
				var getDisc = function (pos) {
						var recycledDisc = f.discGroup.getFirstExists(false);

						if(!recycledDisc) { // No existing Disc available - make new							
							recycledDisc = new f.Disc(Aura.game, pos.x, pos.y, 'disc', f.haloGroup);	
						}						
						else{ // Use existing Disc
							recycledDisc.x = pos.x;
							recycledDisc.y = pos.y;
						}
						recycledDisc.init();
						return recycledDisc;
					};
				return function () {
					var i,
						len = f.initialDiscs,
						currDisc,
						positions = f.discPositions.length >= len ? f.discPositions.slice(0, len + 1) : f.getNewRowPositions();

					for(i = 0; i < len; i++) {
						currDisc = f.discGroup.add(getDisc(positions[i]));
					}
				};
			}());

			// store sounds in array so we can use sprite sheet frame number to play corresponding sound
			f.sound = [
				this.game.add.audio('levelOver'), //0
				this.game.add.audio('panel'), //1
				this.game.add.audio('addDisc'),//2
				this.game.add.audio('ready'),//3
				this.game.add.audio('halo'),//4
				this.game.add.audio('ambientLoop'),//5 
				this.game.add.audio('scoreTransfer'),//6
				this.game.add.audio('discDiscColl'),//7
				this.game.add.audio('zap'),//8
				this.game.add.audio('spiral'),//9
				this.game.add.audio('capture'),//10
				this.game.add.audio('countdown'),//11
				this.game.add.audio('spiralBubble'),//12
				this.game.add.audio('spiralScore'),//13
				this.game.add.audio('endLevKlaxon'),//14
				this.game.add.audio('dragPulse')//15
			];
			f.sound[0].volume = 0.5;
			f.sound[5].loop = true;
			f.sound[5].volume = 0.5;
			f.sound[7].volume = 0.05;
			f.sound[8].volume = 0.5;
			f.sound[9].volume = 0.3;
			f.sound[10].volume = 0.4;
			f.sound[12].volume = 0.7;
			f.sound[13].allowMultiple = true;
			f.sound[13].volume = 0.5;
			f.sound[14].volume = 0.7;
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
					f.endLevelSignal.dispatch(this);
					f.levelOver = true;

				Aura.game.sound.stopAll();
				f.sound[0].play();
				f.discPositions = [];

				for(i = 0; i < dynamicGroupsLen; i++){
					f.dynamicGroups[i].endLevelTween.start();
				}

				len = f.homeZones.length;
				for(i = 0; i < len; i++){
					currZone = f.homeZones.getAt(i);
					if(currZone.hudScore){
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
							//score panel delay gets shorter for each panel as order of panels in group is reversed
							// timerDur = j < jlen - 1 ? f.PANEL_DELAY + f.LEVEL_PANEL_DELAY + (f.SCORE_PANEL_DELAY * (jlen - j + 1)) : f.PANEL_DELAY;
							durrMultiplier = f.freePlay ? currZone.scorePanels.getAt(j).playerNum : j + 1;
							timerDur = j < jlen - 1 ? f.PANEL_DELAY + f.LEVEL_PANEL_DELAY + (f.SCORE_PANEL_DELAY * durrMultiplier) : f.PANEL_DELAY;
							currZone.scorePanels.timers.push(Aura.game.time.events.add(timerDur, onEndLevel, this, currZone.scorePanels.getAt(j)));
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
				f.levelRestartTimer.start();
			};
			f.clearDynamicTimers = function () {
				var len = f.timers.length,
				i;
				for(i = 0; i < len; i++){
					// Aura.game.time.events.remove(f.timers[i]);
					if(f.timers[i]){
						f.timers[i].removeAll();
						Aura.game.time.events.remove(f.timers[i]);
						f.timers[i] = null;
					}
				}
			};
			f.getZapper = function (pointer) {
				var recycledZapper = f.zapperGroup.getFirstExists(false);

				if(!recycledZapper) { // No existing Zapper available - make new
					recycledZapper = new f.Zapper(Aura.game, pointer.x, pointer.y, 'zap');
				}
				else{ // Use existing Zapper
					recycledZapper.init(pointer);
				}
				f.sound[8].play();
				return recycledZapper;
			};
			f.getClosestZone = function (pointer) {
				var i, zones = f.homeZones, len = zones.children.length, closestZone = null,
				zone;

				for(i = 0; i < len; i++) {
					zone = zones.getAt(i);
					if(!zone.hudOnly) {
						if (!closestZone) {
							closestZone = zone;
						} else if (zone && pointer.position.distance(zone.position) < pointer.position.distance(closestZone.position)) {
							closestZone = zone;				
						}	
					}						
				}
				return closestZone;		
			};
			f.getZapPermission = function (pointer) {
				// Disable rapid successive taps around homezone
				var zone = f.getClosestZone(pointer);

				if(pointer.position.distance(zone.getAt(0).worldPosition) < f.HOMEZONE_DEFENCE_ZONE) {
					if(!zone.defended) {
						zone.onDefensiveZap();
						return true;
					}
					return false;
				}
				return true;
			};
			f.addZapper = function (pointer) {
				var zapPermitted = f.getZapPermission(pointer),
				zap;
				f.stopNow = true;
				if(zapPermitted) {
					zap = f.getZapper(pointer);
					f.zapperGroup.add(zap);
				}
				
			};
			f.onTap = function (eTarget, pointer) {
				f.addZapper(pointer);	
			};
			f.bg = Aura.game.add.sprite(0, 0, 'bg');
			f.bg.inputEnabled = true;
			f.bg.events.onInputDown.add(f.onTap, this);
			f.homeZones = this.game.add.group();
			f.homeZones.isHomeZones = true;
			f.haloGroup = this.game.add.group();
			f.scoreBubbleGroup = this.game.add.group();
			f.discGroup = this.game.add.group();
			f.zapperGroup = this.game.add.group();

			Aura.game.add.existing(f.homeZones);
			addHomeZones();
			addDiscs();
			f.dynamicGroups = [
				// ie all groups except homezones
				// use this array to start fade tweens etc
				f.haloGroup,
				f.discGroup,
				f.zapperGroup,
				f.scoreBubbleGroup
			];
			addLevelTweens(f.dynamicGroups);
			setLevelTimers();
			f.sound[11].play();
			f.sound[5].play();

			// debug ////////////////////////////////////////

			// Pool of homeZones for discs to use
			f.availableZones = [];
			f.availableTargets = [];			
			len = f.homeZones.children.length;

			for (i = 0; i < len; i++) {
				f.availableZones.push(f.homeZones.getAt(i));
				f.availableTargets.push(f.homeZones.getAt(i));
			}			

			f.gameStarted = true;
			top.window.addEventListener('volume-change', volumeChangeHandler, false);
			volumeChangeHandler({detail: top.HarmonicsSoundManager.getVolume()});
	    },
	    update: function () {
	    	var i,
	    	j,
	    	iLen = f.discGroup.length,
	    	jLen,
	    	currDisc,
	    	currDiscTolerance,
	    	jDisc,
	    	jDiscTolerance,
	    	currHz,
	    	currHZbg,
	    	currZapper,
	    	currDiscCollided,
	    	discCollSize,
	    	dist;

	    	for(i = 0; i < iLen; i++) {
				currDisc = f.discGroup.getAt(i);
				currDiscCollided = false;
				currDiscTolerance = f.getTolerance(currDisc);
				// Collide discs
				jLen = f.discGroup.length;
				for(j = i + 1; j < jLen; j++) {
					jDisc = f.discGroup.getAt(j);
					// Adjust collision tolerance to allow for halos
					jDiscTolerance = f.getTolerance(jDisc);
					if(currDisc.position.distance(jDisc) < currDiscTolerance + jDiscTolerance){
						currDisc.onHit(jDisc);
						jDisc.onHit(currDisc);
						currDiscCollided = true;
					}
				}
				if(!currDiscCollided){
					currDisc.deflectors = [];
				}
				currDiscCollided = false;
				// Collide discs and homeZones
				jLen = f.homeZones.length;
				for(j = 0; j < jLen; j++) {
					currHz = f.homeZones.getAt(j);
					if(!currHz.hudOnly) {
						currHZbg = currHz.getAt(0);
						// Check f.frame so not colliding homezones before they're properly positioned
						if(f.frame > 1){						
							dist = currDisc.position.distance({x: currHZbg.world.x, y: currHZbg.world.y});
							discCollSize = (currHZbg.width/2) - currDisc.radius;
							if(dist <= discCollSize){
								currDiscCollided = true;
								// currDisc.onHit(currHZbg, dist <= discCollSize/f.difficulty[f.level]);
								currDisc.onHit(currHZbg, dist <= discCollSize);
								
							}
						}
					}				
				}
				if(!currDiscCollided){
					currDisc.onExitHomeZone();
				}
				// Collide discs and zappers
				jLen = f.zapperGroup.length;
				for(j = 0; j < jLen; j++) {
					currZapper = f.zapperGroup.getAt(j);
					currDiscTolerance = currDiscTolerance || f.getTolerance(currDisc);
					if(currZapper.exists && currDisc.position.distance(currZapper.position) <= (currZapper.width/2) + currDiscTolerance){
						currDisc.onHit(currZapper);
					}
				}
			}
			f.frame++;			  
	    },
		render: function () {
	    }
	};
}());
