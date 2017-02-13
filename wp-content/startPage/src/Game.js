/*global Phaser, StartPage, f, PIXI, parent */

(function () {
	
	"use strict";
	
	StartPage.Game = function () {
	    return this;
	};

	StartPage.Game.prototype = {

	    create: function () {
			
			var 
			hudZone = function (zoneNum) {
				// returns true if the current zone requires score panels at end of level
				// (the top and bottom of the table only has panels in centre zone)
				return zoneNum > 0 && zoneNum % 2 !== 0;				
			},	
			posInset = f.inset = Math.floor(f.gameWidth/20),
			sideInset = Math.floor(posInset * 2.4),
			innerSideL = sideInset,
			innerSideR = f.gameWidth - sideInset,
			rightPos = f.gameWidth - posInset,
			bottomPos = f.gameHeight - posInset,
			homeSettings = [
				// Clockwise from TL
				{x: innerSideL, y: posInset , angle: 180},
				{x: f.HALF_WIDTH, y: posInset, angle: 180},
				{x: innerSideR, y: posInset, angle: 180},
				{x: rightPos, y: f.HALF_HEIGHT, angle: 270},
				{x: innerSideR, y: bottomPos, angle: 0},
				{x: f.HALF_WIDTH, y: bottomPos, angle: 0},
				{x: innerSideL, y: bottomPos, angle: 0},
				{x: posInset, y: f.HALF_HEIGHT, angle: 90}					
			],
			addSound = function (soundName, loopSound, playNow) {
				// store sounds in array for easy destruction			
				var newSound = StartPage.game.add.audio(soundName);
				f.sound = f.sound || [];
				f.sound.push(newSound);
				if(loopSound) {
					newSound.loop = true;
				}
				if(playNow) {
					// TODO: Uncomment start page sound
					//newSound.play();
				}
				return newSound;
			},
			rotateUIelmt = function (elmt, settingIndex) {					
				elmt.angle = homeSettings[settingIndex].angle;
			},	
			showTeamWheel = function () {
				if(f.teamWheel.visible === false && f.state.length > 1) {
					f.teamWheel.visible = true;
					f.teamWheel.scaleUpTween.start();
					f.showRing = addSound('showRing', false, true);	
					f.showRing.volume = 0.2;			
				}				
			},
			addHomeZones = (function (){
				var placeMapping = {0: 3, 1: 2, 2: 1, 3: 4, 4: 6, 5: 7, 6: 8, 7: 5},
				numZones = f.MAX_PLAYERS,
				homeZoneGroup,
				i,
				scaleUp = function () {
					this.scaleUpTween.start();
				},
				scaleDown = function () {
					this.scaleDownTween.start();
				},
				showTeamBadges = function () { 
					// Display badge if player has joined game
					var currOb, i, len = f.state.length;
					for(i = 0; i < len; i++) {
						currOb = f.state[i];
						if(currOb.place === this.parent.place) {
							this.frame = currOb.team;
							this.onShow();
							break;	
						}
					}							
				},
				j;
				f.homeZones = StartPage.game.add.group();
				f.swipe = new Swipe(StartPage.game);
				
				return function () {
					
					for(i = 0; i < numZones; i++) {
						homeZoneGroup = StartPage.game.add.group();	
						homeZoneGroup.place = placeMapping[i];
						homeZoneGroup.x = homeSettings[i].x;
						homeZoneGroup.y = homeSettings[i].y;

						if(hudZone(i)) {
							homeZoneGroup.isHUDzone = true;
							homeZoneGroup.gameInfoGroup = new f.GameInfoGroup(StartPage.game);
							homeZoneGroup.add(homeZoneGroup.gameInfoGroup);
							
							homeZoneGroup.resultsGroup = new f.ResultsGroup(StartPage.game);
							homeZoneGroup.add(homeZoneGroup.resultsGroup);
							homeZoneGroup.resultsGroup.scale.x = 0;
							homeZoneGroup.resultsGroup.scale.y = 0;							

							f.showResults.add(scaleUp, homeZoneGroup.resultsGroup);
						}
						
						homeZoneGroup.joinBttn = new f.UIbutton(StartPage.game, 0, 0, 'startBttns');						
						homeZoneGroup.joinBttn.frame = 5;
						homeZoneGroup.add(homeZoneGroup.joinBttn);
						f.changePlayers.add(homeZoneGroup.joinBttn.onChangePlayers, homeZoneGroup.joinBttn);
						f.showInterface.add(scaleUp, homeZoneGroup.joinBttn);

						homeZoneGroup.playerLabel = StartPage.game.add.bitmapText(0, f.gameHeight/15, 'luckiestGuy', '', f.playerLabelSize);
						homeZoneGroup.playerLabel.align = 'center';
						homeZoneGroup.playerLabel.anchor.setTo(0.5, 0.5);	
						// homeZoneGroup.playerLabel.onUserInput = initPlayerLabel;
						homeZoneGroup.playerLabel.scale.x = 0;
						homeZoneGroup.playerLabel.scale.y = 0;
						f.addUItweens(homeZoneGroup.playerLabel);					
						homeZoneGroup.add(homeZoneGroup.playerLabel);
						// homeZoneGroup.joinBttn.events.hideButton.add(homeZoneGroup.playerLabel.onUserInput, homeZoneGroup.playerLabel);
						f.playersReady.add(scaleDown, homeZoneGroup.playerLabel);

						f.homeZones.add(homeZoneGroup);
						homeZoneGroup.successIcon = new f.UIbadge(StartPage.game, 0, 0, 'startBttns');
						homeZoneGroup.add(homeZoneGroup.successIcon);

						homeZoneGroup.teamIcon = new f.TeamBadge(StartPage.game, 0, 0, 'startBttns');
						f.gamePlaySelected.add(homeZoneGroup.teamIcon.onGamePlaySelect, homeZoneGroup.teamIcon);
						homeZoneGroup.add(homeZoneGroup.teamIcon);

						homeZoneGroup.joinBttn.events.hideButton.add(homeZoneGroup.successIcon.onShow, homeZoneGroup.successIcon);
						homeZoneGroup.joinBttn.events.hideButton.add(showTeamWheel, this);
						homeZoneGroup.joinBttn.events.hideButton.add(f.teamNumRing3.updateTeamOptions, f.teamNumRing3);
						homeZoneGroup.joinBttn.events.hideButton.add(f.teamNumRing4.updateTeamOptions, f.teamNumRing4);												

						f.teamsArranged.add(homeZoneGroup.successIcon.onHide, homeZoneGroup.successIcon);
						f.teamsArranged.add(showTeamBadges, homeZoneGroup.teamIcon);

						for(j = 0; j < 4; j++) {							
							homeZoneGroup.joinBttn.events.hideButton.add(f.teamWheel['pointers' + j].teamNumPointer.onGameplaySelect, f.teamWheel['pointers' + j].teamNumPointer);	
						}
						
						homeZoneGroup.zoneNum = i;
						rotateUIelmt(homeZoneGroup, i);
					}
				};				
			}()),
			i,
			currPointerGroup,
			positionPointerGroup = function (group, i) {
				group.pivot.x = f.HALF_WIDTH;
				group.pivot.y = f.HALF_HEIGHT;				
				rotateUIelmt(group, i * 2 + 1);
				group.x = f.HALF_WIDTH;
				group.y = f.HALF_HEIGHT;
			},
			addWheelPointers = function (group, i) {
				var gamePlayPointer = StartPage.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.715, 'pointers'),
				teamNumPointer = StartPage.game.add.sprite(f.HALF_WIDTH, f.gameHeight * 0.83, 'pointers');
				teamNumPointer.frame = 1;

				gamePlayPointer.anchor.setTo(0.5, 0.5);
				teamNumPointer.anchor.setTo(0.5, 0.5);
				teamNumPointer.alpha = 0;
				f.assignedTweens.push(teamNumPointer.fadeInTween = StartPage.game.add.tween(teamNumPointer).to( {alpha: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Linear.InOut, false));
				f.assignedTweens.push(teamNumPointer.fadeOutTween = StartPage.game.add.tween(teamNumPointer).to( {alpha: 0}, f.UI_TWEEN_DUR/3, Phaser.Easing.Linear.InOut, false));
				teamNumPointer.onGameplaySelect = function () {
					if(f.teamPlay && f.state.length > 2) {
						this.fadeInTween.start();
					} else {
						this.fadeOutTween.start();
					}
				};
				f.gamePlaySelected.add(teamNumPointer.onGameplaySelect, teamNumPointer);
				group.teamNumPointer = teamNumPointer;
				group.add(gamePlayPointer);
				group.add(teamNumPointer);
				positionPointerGroup(currPointerGroup, i);
			},
			addTeamWheel = function () {
				f.teamWheel = StartPage.game.add.group();
				f.teamWheel.pivot.x = f.HALF_WIDTH;
				f.teamWheel.pivot.y = f.HALF_HEIGHT;
				f.teamWheel.x = f.HALF_WIDTH;
				f.teamWheel.y = f.HALF_HEIGHT;

				f.teamNumRing3 = new f.TeamNumRingThree(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT);
				f.teamNumRing4 = new f.TeamNumRingFour(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT);

				f.teamNumRing3.name = 'teamNumRing3';
				f.teamNumRing4.name = 'teamNumRing4';

				f.gamePlayRing = new f.GamePlayRing(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT, 'gamePlayRing', 360/8, f.teamNumRing);
				f.gamePlayRing.angle = 45;

				f.gamePlaySelected.add(f.teamNumRing3.updateTeamOptions, f.teamNumRing3);
				f.gamePlaySelected.add(f.teamNumRing4.updateTeamOptions, f.teamNumRing4);
				f.assignedTweens.push(f.gamePlayRing.scaleDownTween = StartPage.game.add.tween(f.gamePlayRing.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
				
				f.teamWheel.add(f.teamNumRing3);
				f.teamWheel.add(f.teamNumRing4);
				f.teamWheel.add(f.gamePlayRing);

				for (i = 0; i < 4; i++) {
					currPointerGroup = f.teamWheel['pointers' + i] = StartPage.game.add.group();
					addWheelPointers(currPointerGroup, i);				
					f.teamWheel.add(currPointerGroup);
				}
				f.startButton = new f.StartButton(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT, 'ringBttns');
				f.startSound = addSound('start', false, false);	
				f.startSound.volume = 0.5;
				
				f.teamWheel.add(f.startButton);
				f.teamWheel.scale.x = 0.01;
				f.teamWheel.scale.y = 0.01;
				f.teamWheel.visible = false;
				
				f.assignedTweens.push(f.teamWheel.scaleDownTween = StartPage.game.add.tween(f.teamWheel.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
				f.assignedTweens.push(f.teamWheel.scaleUpTween = StartPage.game.add.tween(f.teamWheel.scale).to( {x: 1, y: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Elastic.Out, false));	
	    		f.playersReady.add(function () {f.teamWheel.scaleDownTween.start();}, f.teamWheel);

				f.teamWheel.scaleDownTween.onComplete.add(function () { 
					if(!f.playersReadyDispatched){
						f.playersReady.dispatch();
						f.playersReadyDispatched = true;
					}
					
				}, this);				 
			};			
			f.bg = new Phaser.TileSprite(StartPage.game, 0, 0, f.gameWidth, f.gameHeight, 'bg');
			f.bg.autoScroll(80, 20);
			f.bg1 = new Phaser.TileSprite(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT, f.gameWidth, f.gameHeight, 'bg');
			f.bg1.angle = 180;
			f.bg1.autoScroll(200, 50);
			f.bg1.anchor.setTo(0.5, 0.5);
			f.bg1.blendMode = PIXI.blendModes.MULTIPLY;
			f.bg1.alpha = 0.5;
			StartPage.game.add.existing(f.bg);
			StartPage.game.add.existing(f.bg1);
			f.homeZones = new f.HomeZoneGroup(StartPage.game);
			addTeamWheel();
			addHomeZones();

			f.results = parent.GameManager.getResults();			
			
			f.activeLoop = addSound('activeLoop', true, true);			
			f.ringTurn = addSound('ringTurn', true);
			f.ringTurnTeam = addSound('ringTurnTeam', true);
			f.playerJoin = addSound('playerJoin');
			f.playerJoin.volume = 0.6;
			f.ringChange = addSound('ringChange');
			f.ringChange.volume = 0.05;
			f.winner = addSound('winner');
			f.loser = addSound('loser');
			f.loser.volume = 0.4;
			f.showResultsSound = addSound('showResults');

			if(f.results) {
				// We're returning to start page at end of a session
				f.showResults.dispatch();
				f.showResultsSound.play();
				// Now we've shown results, reset mode
				parent.GameManager.setResultsMode(false);				
			} else {
				// We're waiting for players to join
				f.showInterface.dispatch();
			}			

			f.playersReady.add(function () {
				// Add game selection menu
				if(! f.gameSelectionMenu) {
					f.gameSelectionMenu = new this.GameSelectionMenu(StartPage.game, this.HALF_WIDTH, this.HALF_HEIGHT);	
				} else {
					f.gameSelectionMenu.fadeInTween.start();
				}				
				f.gameChanging = false;
			}, f);			
	    },
	    update: function () {	    	  
	    }
	};
}());