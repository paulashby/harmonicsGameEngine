/*global Phaser, StartPage, f, top, parent, VTAPI */

var StartPage = {}, // game elements in here
f = f || {}; // our members and functions in here


(function () {
	
	"use strict";
	var removeTween = function(tween) {
			if (tween) {
				tween.onComplete.removeAll();
				tween.stop();
				tween = null;
			}
	    },
	   removeEvt = function (elmt) {
	    	elmt.events.hideButton.dispose();
	    },
	    removeHomeZone = function (hz) {
	    	hz.place = null;
	    	hz.playerLabel.onUserInput = null;
	    	hz.remove(hz.playerLabel, true, true);
	    	hz.remove(hz.joinBttn, true, true);
	    	hz.remove(hz.successIcon, true, true);
	    	hz.remove(hz.teamIcon, true, true);
	    	if(hz.ResultsGroup) {
	    		hz.ResultsGroup.destroy(true, true);
	    	}
	    },
	    removeWheelPointers = function () {
	    	var i;
	    	for(i = 0; i < 4; i++) {
	    		f.teamWheel['pointers' + i].destroy(true, true);
	    	}
	    },
	    destroyOb = function (ob) {
	    	var currElmt;
			for(currElmt in ob){
				if(ob.hasOwnProperty(currElmt)){
					delete ob[currElmt];
				}
			}
	    },
	    destroyElement = function (element) {
	    	element.destroy();
	    },
	    cleanUp = function (state) {
	    	var gameURL,
		    	gameID,
	    		showInstructions;
	    	if(f.activeIcon) {
	    		gameURL = f.activeIcon.gameURL;
	    		gameID = f.activeIcon.gameID;
	    		showInstructions = f.activeIcon.instructions;
	    	}

	    	// remove signals and handlers
			f.showInterface.dispose();
			f.showResults.dispose();
			f.teamsArranged.dispose();	
			f.playersReady.dispose();
			f.gameInfoSwiped.dispose();
			f.playAgain.dispose();
			f.changePlayers.dispose();
			f.gamePlaySelected.dispose();
			f.teamWheelActivated.dispose();
			f.teamWheelDeactivated.dispose();

			f.assignedTweens.forEach(removeTween);
			f.buttons.forEach(removeEvt);
			f.emitters.forEach(destroyElement);
			f.homeZones.forEach(removeHomeZone);
			f.homeZones.destroy(true, true);
			removeWheelPointers();
			f.teamWheel.destroy(true, true);
			if(f.gameSelectionMenu) {
				f.gameSelectionMenu.destroy(true, false);
			}
			destroyOb(f);	

			// state will be falsey if not passed to cleanUp
			top.GameManager.startSession(state, gameURL, gameID, showInstructions);
	};
	f.assignedTweens = [];
	f.buttons = [];
	f.gameWidth = 1920;
	f.gameHeight = 1080;
	f.ICON_GUTTER = 40;
	f.ICON_ALPHA = 0.075;
	f.INSTRUCTION_FONT_SIZE = Math.floor(f.gameWidth/25);
	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;
	f.CENTRE_POINT = new Phaser.Point(f.HALF_WIDTH, f.HALF_HEIGHT);
	f.MAX_PLAYERS = 8;
	f.MAX_TEAMS = 4;
	f.UI_TWEEN_DUR = 500;
	f.MIN_GAMES_TO_CYCLE_MENU = 3;

	f.activeIcon;
	f.players = [];
	f.uiBttnSize = 65;
	f.playerLabelSize = f.gameHeight * 0.03;
	f.resultSize = f.gameHeight * 0.025;
	f.teamPlay = false;
	f.state = [];
	f.showInterface = new Phaser.Signal();
	f.showResults = new Phaser.Signal();
	f.teamsArranged = new Phaser.Signal();	
	f.playersReady = new Phaser.Signal();
	f.gameInfoSwiped = new Phaser.Signal();
	f.playAgain = new Phaser.Signal();
	f.changePlayers = new Phaser.Signal();
	f.gamePlaySelected = new Phaser.Signal();
	f.teamWheelActivated = new Phaser.Signal();
	f.teamWheelDeactivated = new Phaser.Signal();
	f.emitterOffsetX = 0;
	f.emitterOffsetY = 80;
	f.emitters = [];
	
		
	f.mapToRange = function (currVal, minIn, maxIn, minOut, maxOut) { 
		// map currVal in range minIn - maxIn to range minOut - maxOut
		var clamped = currVal === 0 ? maxOut : currVal / maxIn / maxOut;
		return clamped + ((1 - clamped) * minOut); 
	};
	f.normaliseAngle = function (ang) {
		return ang + 360;
	};
	f.addUItweens = function (elmt, signalOnComplete) {
		f.assignedTweens.push(elmt.scaleDownTween = StartPage.game.add.tween(elmt.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
		f.assignedTweens.push(elmt.scaleUpTween = StartPage.game.add.tween(elmt.scale).to( {x: 1, y: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Elastic.Out, false));

		if(signalOnComplete) {
			elmt.events.hideButton = new Phaser.Signal();
			f.buttons.push(elmt);
			elmt.scaleDownTween.onComplete.add(function () { 
				elmt.events.hideButton.dispatch();
			}, elmt);
		}
	};
	f.addResultsTweens = function (elmt) {
		f.assignedTweens.push(elmt.scaleDownTween = StartPage.game.add.tween(elmt.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
		f.assignedTweens.push(elmt.scaleUpTween = StartPage.game.add.tween(elmt.scale).to( {x: 1, y: 1}, f.UI_TWEEN_DUR * 3, Phaser.Easing.Elastic.Out, false));
	};
	f.arrangeTeams = function (state, reqNumTeams) {
		var  numPlayers = state.length,
		possTeamSetUps = VTAPI.getTeamSetUps().slice(numPlayers, numPlayers + 1)[0],
		i, len = possTeamSetUps.length,
		possSetUp,
		teamSetUp,
		teamNumbersArray;

		for(i = 0; i < len; i++) {
			possSetUp = possTeamSetUps[i];
			if(teamSetUp === undefined && possSetUp.length === reqNumTeams) {
				teamSetUp = possSetUp.slice();
			}
		}
		if(teamSetUp === undefined) {
			console.error('f.arrangeTeams: unable to match required number of teams');
		}
		teamNumbersArray = VTAPI.mapTeamNumbers(teamSetUp);
		return VTAPI.assignTeams(state, teamNumbersArray);
	};

	f.UIbutton = function (game, x, y, imgName) {

	    Phaser.Sprite.call(this, game, x, y, imgName);
	
		this.anchor.setTo(0.5, 0.5);

		this.inputEnabled = true;
	    this.events.onInputDown.add(this.onBttnTap, this);
	    this.scale.x = 0;
	    this.scale.y = 0;
	    this.active = true;
	    this.joined = false;
	    f.addUItweens(this, true);
	    this.scaleDownTween.onComplete.add(
	    	function () { this.cleanUp }, this);
	    f.assignedTweens.push(this.fadeOutTween = StartPage.game.add.tween(this).to( {alpha: 0}, f.UI_TWEEN_DUR * 0.1, Phaser.Easing.Linear.InOut, false));
		f.assignedTweens.push(this.fadeInTween = StartPage.game.add.tween(this).to( {alpha: 1}, f.UI_TWEEN_DUR/2, Phaser.Easing.Linear.InOut, false));
		this.fadeOutTween.onComplete.add(function () { this.visible = false; }, this);
		this.fadeInTween.onStart.add( function () { this.visible = true; }, this);
		
	    f.playersReady.add(function () {this.scaleDownTween.start();}, this);

	    // Disable buttons when teamNumRing is active
	    f.teamWheelActivated.add(function () {this.active = false; this.fadeOutTween.start();}, this);
	    f.teamWheelDeactivated.add(function () {this.active = true; this.fadeInTween.start();}, this);
	};
	
	f.UIbutton.prototype = Object.create(Phaser.Sprite.prototype);
	f.UIbutton.prototype.constructor = f.UIbutton;
	f.UIbutton.prototype.onBttnTap = function () {	
		var playerNum = f.state.length + 1;	
		if(this.active && !this.joined) {
			f.playerJoin.play();
			this.scaleDownTween.start();
			// Add player to state
			this.joined = true;	
			f.state.push({place: this.parent.place, player: playerNum, ranking: 0});							
			f.homeZones.addActive(this.parent.place);
			this.initPlayerLabel();
		}
	};
	f.UIbutton.prototype.initPlayerLabel = function () {
		var label = this.parent.playerLabel;
		label.setText('PLAYER ' + f.state.length);
		label.scaleUpTween.start();
	};
	f.UIbutton.prototype.onChangePlayers = function () {
		this.scaleUpTween.start();
	};
	f.UIbutton.prototype.onRemove = function () {
		f.removingBttn = true;
		this.scaleDownTween.start();
	};
	f.UIbutton.prototype.cleanUp = function () {
		this.events.onInputDown.removeAll();
		this.events.hideButton.removeAll();
		this.destroy();
	};

	f.UIbadge = function (game, x, y, imgName) {

		Phaser.Sprite.call(this, game, x, y, imgName);

		this.anchor.setTo(0.5, 0.5);
		this.scale.x = 0;
		this.scale.y = 0;
		f.addUItweens(this, true);			    
	    f.playersReady.add(function () {this.scaleDownTween.start();}, this);
	};
	f.UIbadge.prototype = Object.create(Phaser.Sprite.prototype);
	f.UIbadge.prototype.constructor = f.UIbadge;
	f.UIbadge.prototype.onShow = function () {
		if(!f.playersReadyDispatched){
			this.scaleUpTween.start();
			this.joined = true;
		}
	};	
	f.UIbadge.prototype.onHide = function () {
		this.scaleDownTween.start();
	};

	f.TeamBadge = function (game, x, y, imgName) {

	    f.UIbadge.call(this, game, x, y, imgName);	

	};	
	f.TeamBadge.prototype = Object.create(f.UIbadge.prototype);
	f.TeamBadge.prototype.constructor = f.TeamBadge;
	f.TeamBadge.prototype.onGamePlaySelect = function (gamePlay) {
		if(gamePlay === 'play') {
			this.frame = 0; 
		}
	};

	f.Ring = function (game, x, y, imgName, segmentAngle) {

		Phaser.Sprite.call(this, game, x, y, imgName);

	    this.anchor.setTo(0.5, 0.5);
		this.inputEnabled = true;
		this.input.pixelPerfectClick = true;
		this.segmentAngle = segmentAngle;
		this.events.onInputDown.add(this.onInputDown, this);
	    this.events.onInputUp.add(this.onInputUp, this);	    		
	    f.addUItweens(this, true);
	};
	
	f.Ring.prototype = Object.create(Phaser.Sprite.prototype);
	f.Ring.prototype.constructor = f.Ring;
	f.Ring.prototype.onInputDown = function (sprite, pointer) {
		if(! this.turning) {
			this.turning = true; 
			this.pointer = pointer;
			// Used to lock ring rotation to cursor position
			this.angDiff = this.pointer.position.angle(this.position) - this.rotation;
		}		
	};
	f.Ring.prototype.getTargetAngle = function () {
		// Find angle to centre segment on pointer at end of rotation
		var numSegments = Math.round(this.angle/this.segmentAngle);
		return numSegments * this.segmentAngle;
	};
	f.Ring.prototype.onInputUp = function () {		
		this.turning = false;
		this.pointer = undefined;
		this.targetAngle = this.getTargetAngle();
		f.assignedTweens.push(this.rotTween = StartPage.game.add.tween(this).to( {angle: this.targetAngle}, f.UI_TWEEN_DUR/2, Phaser.Easing.Quadratic.Out, true));						
	};	
	f.Ring.prototype.update = function () {
		if(this.turning === true){
			this.onTurn();
		}
	};
	f.Ring.prototype.onTurn = function () {
		this.rotation = this.pointer.position.angle(this.position) - this.angDiff;		
	};
	

	f.TeamNumRing = function (game, x, y, imgName, segmentAngle) {

		f.Ring.call(this, game, x, y, imgName, segmentAngle);

		this.segmentAngle = segmentAngle;
		this.maxTeams = 4;				
		this.alpha = 0;
		f.assignedTweens.push(this.fadeInTween = StartPage.game.add.tween(this).to( {alpha: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Linear.InOut, false));
		f.assignedTweens.push(this.fadeOutTween = StartPage.game.add.tween(this).to( {alpha: 0}, f.UI_TWEEN_DUR/3, Phaser.Easing.Linear.InOut, false));
	};	
	f.TeamNumRing.prototype = Object.create(f.Ring.prototype);
	f.TeamNumRing.prototype.constructor = f.TeamNumRing;
	f.TeamNumRing.prototype.show = function () {
		this.assignTeams();
		this.inputEnabled = true;
		this.fadeInTween.start();
	};
	f.TeamNumRing.prototype.hide = function () {
		this.inputEnabled = false;
		this.fadeOutTween.start();
	};
	f.TeamNumRing.prototype.onInputDown = function (sprite, pointer) {
		f.teamWheelActivated.dispatch();
		f.Ring.prototype.onInputDown.call(this, sprite, pointer);
	};
	f.TeamNumRing.prototype.moduloNonZero = function (dividend, divisor) {
		// returns result of modulo operation or divisor if modulo yields zero
		var mod = dividend % divisor;
		return  mod === 0 ? divisor : mod;
	};
	f.TeamNumRing.prototype.assignTeams = function () {
		
		var normalisedAngle = f.normaliseAngle(this.angle),
		ang = this.normalisedAngle === 0 ? 360 : normalisedAngle,
		numSegs = 360/this.segmentAngle,
		// We want the number of segments in the wheel if fully rotated rather than zero
		rawSegNum = (Math.abs(Math.round(ang/this.segmentAngle)) + 1) % numSegs,
		segNum = rawSegNum === 0 ? numSegs : rawSegNum,
		numTeams = this.moduloNonZero(segNum, this.maxTeams - 1) + 1;
		// Create a state based on numer of players and selected number of teams
		f.state = f.arrangeTeams(f.state, numTeams);
		f.teamsArranged.dispatch();
	};
	f.TeamNumRing.prototype.onInputUp = function () {
		// Wheel has just been turned, update state
		this.assignTeams();		
		f.teamWheelDeactivated.dispatch();
		f.Ring.prototype.onInputUp.call(this);
	};

	f.TeamNumRingFour = function (game, x, y) {
		// Available when four teams can be set
		f.TeamNumRing.call(this, game, x, y, 'teamNumRing4', 360/(f.MAX_TEAMS * 3));
	};	
	f.TeamNumRingFour.prototype = Object.create(f.TeamNumRing.prototype);
	f.TeamNumRingFour.prototype.constructor = f.TeamNumRingFour;
	f.TeamNumRingFour.prototype.updateTeamOptions = function () {
		if(f.state.length >= 4 && f.teamPlay) {
			this.show();						
		} else {
			this.hide();
		}
	};
	f.TeamNumRingFour.prototype.onInputUp = function (sprite, pointer) {
		f.TeamNumRing.prototype.onInputUp.call(this);	
		f.ringTurnTeam.fadeOut(500);
	};
	f.TeamNumRingFour.prototype.onInputDown = function (sprite, pointer) {
			f.TeamNumRing.prototype.onInputDown.call(this, sprite, pointer);
			f.ringTurnTeam.fadeIn(500, true);					
	};
	f.TeamNumRingFour.prototype.show = function () {
		f.TeamNumRing.prototype.show.call(this);
		f.ringChange.play();
	};

	f.TeamNumRingThree = function (game, x, y) {
		// Available when three teams can be set
		f.TeamNumRing.call(this, game, x, y, 'teamNumRing3', 360/(f.MAX_TEAMS * 2));
		this.maxTeams = 3;
	};	
	f.TeamNumRingThree.prototype = Object.create(f.TeamNumRing.prototype);
	f.TeamNumRingThree.prototype.constructor = f.TeamNumRingThree;
	f.TeamNumRingThree.prototype.updateTeamOptions = function () {
		if(f.state.length > 2 && f.state.length < 4 && f.teamPlay) {
			this.show();						
		} else {
			this.hide();
		}
	};
	f.TeamNumRingThree.prototype.show = function () {
		f.TeamNumRing.prototype.show.call(this);
		f.showRing.play();
	};
	f.TeamNumRingThree.prototype.onInputUp = function (sprite, pointer) {
		f.TeamNumRing.prototype.onInputUp.call(this);	
		f.ringTurnTeam.fadeOut(500);
	};
	f.TeamNumRingThree.prototype.onInputDown = function (sprite, pointer) {
			f.TeamNumRing.prototype.onInputDown.call(this, sprite, pointer);
			f.ringTurnTeam.fadeIn(500, true);
	};	
	f.GamePlayRing = function (game, x, y, imgName, segmentAngle, teamNumRing) {
		// Toggles team play
		f.Ring.call(this, game, x, y, imgName, segmentAngle);

		this.teamNumRing = teamNumRing;
	};	
	f.GamePlayRing.prototype = Object.create(f.Ring.prototype);
	f.GamePlayRing.prototype.constructor = f.GamePlayRing;
	f.GamePlayRing.prototype.onInputUp = function (sprite, pointer) {
		f.Ring.prototype.onInputUp.call(this);	
		this.onGamePlaySelect();
		f.ringTurn.fadeOut(500);
	};	
	f.GamePlayRing.prototype.onInputDown = function (sprite, pointer) {
			f.Ring.prototype.onInputDown.call(this, sprite, pointer);
			f.ringTurn.fadeIn(500, true);					
	};
	f.GamePlayRing.prototype.onGamePlaySelect = function () {
		
		if(this.targetAngle % 90 === 0) {
			f.teamPlay = true;
			if(f.state.length === 2) {
				this.assignTeams();
			}
			f.gamePlaySelected.dispatch('teamPlay');
		} else {
			this.removeTeams();			
			f.gamePlaySelected.dispatch('play');
		}
	};
	f.GamePlayRing.prototype.assignTeams = function () {		
		f.state = f.arrangeTeams(f.state, 2);
		f.teamsArranged.dispatch();
	};
	f.GamePlayRing.prototype.removeTeams = function () {
		var i, len = f.state.length;
		f.teamPlay = false;
		for (i = 0; i < len; i++) {
			delete f.state[i].team;
		}
	};

	f.StartButton = function (game, x, y, imgName) {
		
		Phaser.Sprite.call(this, game, x, y, imgName);
	    this.anchor.setTo(0.5, 0.5);
		this.inputEnabled = true;
		this.events.onInputDown.add(this.onInputDown, this);
	};	
	f.StartButton.prototype = Object.create(Phaser.Sprite.prototype);
	f.StartButton.prototype.constructor = f.StartButton;
	f.StartButton.prototype.onInputDown = function () {
		f.teamWheel.scaleDownTween.start();
		// f.startSound.play();
	};

	f.PlayButton = function (game, x, y) {		
		f.StartButton.call(this, game, x, y, 'playBttn');
	};
	f.PlayButton.prototype = Object.create(f.StartButton.prototype);
	f.PlayButton.prototype.constructor = f.PlayButton;
	f.PlayButton.prototype.onInputDown = function () {
		var state = VTAPI.cloneState(f.state);
		cleanUp(state);	
	};

	f.ResultsButton = function (game, x, y, imgName, inputDownHandler) {
		
		Phaser.Sprite.call(this, game, x, y, imgName);
	    this.inputEnabled = true;
		this.events.onInputDown.add(inputDownHandler, this);
		this.anchor.setTo(0.5, 0.5);
	};	
	f.ResultsButton.prototype = Object.create(Phaser.Sprite.prototype);
	f.ResultsButton.prototype.constructor = f.ResultsButton;	
	f.ResultsButton.prototype.update = function () {
		this.inputEnabled = this.parent.scale.x > 0;
	};
	f.PlayerNumberPanel = function (game, winner) {

		Phaser.Group.call(this, game);

		this.blankPanel = StartPage.game.add.sprite(0, f.gameHeight * 0.07, 'resultPlayerPanels', 0 , this);
		this.blankPanel.frame = winner ? 1 : 3;
		this.blankPanel.anchor.setTo(0.5, 0.5);				

		this.emitter = StartPage.game.add.emitter(f.emitterOffsetX, f.emitterOffsetY, 500);
		this.add(this.emitter);
		f.emitters.push(this.emitter);

		this.playerPanel = StartPage.game.add.sprite(0, f.gameHeight * 0.07, 'resultPlayerPanels', 0, this);
		this.playerPanel.frame = winner ? 0 : 2; 
		this.playerPanel.anchor.setTo(0.5, 0.5);
		this.playerNumTxt = StartPage.game.add.bitmapText(0, f.gameHeight * 0.05, 'luckiestGuy', '1', f.resultSize * 1.8);
		this.playerNumTxt.align = 'center';
		this.playerNumTxt.anchor.setTo(0.5, 0);
		this.add(this.playerNumTxt);		

		this.playerPanel.scale.x = 0;
		this.playerPanel.scale.y = 0;
		this.playerNumTxt.scale.x = 0;
		this.playerNumTxt.scale.y = 0;

		f.addResultsTweens(this.blankPanel);
		f.addResultsTweens(this.playerPanel);
		f.addResultsTweens(this.playerNumTxt);

		if(winner) {
			this.playerPanel.alpha = 0;
			this.playerPanel.scaleUpTween.onStart.add(function () {			
				this.emitter.makeParticles('corona');
				this.emitter.gravity = 0;
				this.emitter.minParticleSpeed.setTo(-30, -30);
			    this.emitter.maxParticleSpeed.setTo(30, 30);
				this.emitter.start(false, 800, 50);
				f.winner.play();
			}, this);
		} else {
			this.playerPanel.scaleUpTween.onStart.add(function () {					
				f.loser.play();
			}, this);
		}
	};
	f.PlayerNumberPanel.prototype = Object.create(Phaser.Group.prototype);
	f.PlayerNumberPanel.prototype.constructor = f.PlayerNumberPanel;		

	f.GameIcon = function (game, x, y, imgName) {

		Phaser.Sprite.call(this, game, x, y, imgName);

	    this.anchor.setTo(0.5, 0.5);
	    this.alpha = f.ICON_ALPHA;
		this.HALF_WIDTH = this.width/2;
		this.inputEnabled = true;
		this.events.onInputUp.add(this.onInputUp, this);		
		this.texKey = imgName;
	};
	
	f.GameIcon.prototype = Object.create(Phaser.Sprite.prototype);
	f.GameIcon.prototype.constructor = f.GameIcon;
	f.GameIcon.prototype.linkToGroupSiblings = function () {
		var	thisIndex = this.parent.getChildIndex(this);	
		if(thisIndex > 0) { this.prev = this.parent.getChildAt(thisIndex -1); }
		if(thisIndex < this.parent.children.length - 1) { this.next = this.parent.getChildAt(thisIndex +1); }
	};
	f.GameIcon.prototype.onInputUp = function () {
		if(! this.parent.swiping && this === f.activeIcon) {
			// Do we want icons to react to clicks?
		}
		// enable click detection after swipe
		this.parent.swiping = false;
	};
	f.GameIcon.prototype.update = function () {
		var distFromCentre = Phaser.Point.distance(this.worldPosition, f.CENTRE_POINT),
			first,
			last;
		
		// Sprite becomes active when it's half its width away from centre point
		if(distFromCentre <= this.HALF_WIDTH) {		
			if(this.parent.cycle) {
				if(! this.next){ 
					// No icon to right of activeIcon - move one from start
					first = this.parent.first;
					this.parent.first = first.next;
					this.parent.last = first;
					first.next.prev = undefined;
					first.next = undefined;
					this.next = first;
					first.prev = this;
					first.x = this.x + this.width/2 + first.width/2 + f.ICON_GUTTER;
				} else if(! this.prev) {
					// No icon to left of activeIcon - move one from end
					last = this.parent.last;
					this.parent.first = last;
					this.parent.last = last.prev;
					last.prev.next = undefined;
					last.prev = undefined;
					this.prev = last;
					last.next = this;
					last.x = this.x - this.width/2 - last.width/2 - f.ICON_GUTTER;
				}	
			}			
			if(this !== f.activeIcon) {
				f.activeIcon = this;
				f.gameInfoSwiped.dispatch();
			}
			this.alpha = f.mapToRange(distFromCentre, 0, this.HALF_WIDTH, f.ICON_ALPHA, 1);
		} else if(f.activeIcon && (this === f.activeIcon.prev || this === f.activeIcon.next)) {
			this.alpha = f.ICON_ALPHA;
		} else {
			this.alpha = 0;
		}
	};

	f.GameSelectionMenu = function (game) {
		Phaser.Group.call(this, game);

		this.menuWidth = 0;
		this.gameIcons = {};
		this.previousIconWidth;
		this.prev;
		this.next;
		this.gameURL;
		this.alpha = 0;
		this.cycle = StartPage.gameList.length >= f.MIN_GAMES_TO_CYCLE_MENU;

		// Icon image names retrieved dynamically from database, so we can't load them like regular assets
		this.loadIcons();
		f.assignedTweens.push(this.fadeInTween = StartPage.game.add.tween(this).to( {alpha: 1}, f.UI_TWEEN_DUR/2, Phaser.Easing.Exponential.In, true, 50));
	};
	f.GameSelectionMenu.prototype = Object.create(Phaser.Group.prototype);
	f.GameSelectionMenu.prototype.constructor = f.GameSelectionMenu;
	f.GameSelectionMenu.prototype.centreHorizontally = function (numChildren) {
		// We need an icon to be on the centre point. Icons are varying widths, so can't just centre on with of group		
		var middleChild = numChildren > 1 ? this.getChildAt(Math.floor(this.children.length/2)) : this.getChildAt(0),
		centreX = middleChild.position;
		this.x -= Phaser.Point.distance(centreX, f.CENTRE_POINT);
	};
	f.GameSelectionMenu.prototype.loadIcon = function (i) {
		var iconTextureKey = StartPage.gameList[i].iconGraphic,
			iconWidth, 
			gameIcon,
			gameData = StartPage.gameList[i];

		gameIcon = this.gameIcons[iconTextureKey] = new f.GameIcon(StartPage.game, f.HALF_WIDTH, f.HALF_HEIGHT, iconTextureKey);
		gameIcon.titleKey = iconTextureKey + 'Title';
		gameIcon.gameName = gameData.gameName;
		gameIcon.gameURL = gameData.url;
		gameIcon.instructions = gameData.instructions;
		gameIcon.description = gameData.description;
		gameIcon.gameID = gameData.id;

		iconWidth = StartPage.game.cache.getImage(iconTextureKey).width;

		if(i > 0) {
			gameIcon.x += this.menuWidth + (iconWidth/2) + f.ICON_GUTTER;
			gameIcon.swipeOffset = (iconWidth/2) + f.ICON_GUTTER;
			this.menuWidth += iconWidth + f.ICON_GUTTER;
			if(i === StartPage.gameList.length - 1) {
				this.last = gameIcon;
			}	
		} else {
			gameIcon.swipeOffset = 0;
			this.menuWidth += (iconWidth/2);
			this.first = gameIcon;
		}	
		this.add(gameIcon);
	};
	f.GameSelectionMenu.prototype.loadIcons = function () {
		var i, 
			len = StartPage.gameList.length;

		for(i = 0; i < len; i++) {
			this.loadIcon(i);
		}
		this.callAll('linkToGroupSiblings');
		if(i > 1) {
			this.centreHorizontally(i);
		}		
	};
	f.GameSelectionMenu.prototype.onSwipe = function (direction) {
		// direction = -1 or 1
		var adjacentIcon = direction === 1 ? f.activeIcon.prev : f.activeIcon.next,
			adjacentIconOffset = 0,
			targetX;
		
		if(adjacentIcon) {
			targetX = this.x + Phaser.Point.distance(f.activeIcon.worldPosition, adjacentIcon.worldPosition) * direction;
			adjacentIconOffset = adjacentIcon.HALF_WIDTH;

			// Tween should be removed automatically when completed
			StartPage.game.add.tween(this).to( {x: targetX, y: this.y}, f.UI_TWEEN_DUR/3, Phaser.Easing.Quadratic.Out, true);		
		}
	};	
	f.GameSelectionMenu.prototype.update = function () {
		Phaser.Group.prototype.update.call(this);

		var direction = f.swipe.check();
			    	  
		  if (direction!==null) {
		  	
		  	// disable click detection during swipe
		  	this.swiping = true;

		    // direction= { x: x, y: y, direction: direction }
		    switch(direction.direction) {
		       case f.swipe.DIRECTION_LEFT: this.onSwipe(-1); break;
		       case f.swipe.DIRECTION_DOWN_LEFT: this.onSwipe(-1); break;		       
		       case f.swipe.DIRECTION_UP_LEFT: this.onSwipe(-1); break;
		       
		       case f.swipe.DIRECTION_RIGHT: this.onSwipe(1); break;		       
		       case f.swipe.DIRECTION_UP_RIGHT: this.onSwipe(1); break;
		       case f.swipe.DIRECTION_DOWN_RIGHT: this.onSwipe(1); break;
		    }
		  }
	};

	f.GameInfoGroup = function (game, zoneNum) {
		Phaser.Group.call(this, game);

		this.playBttn = new f.PlayButton(StartPage.game, 0, 0);
		this.add(this.playBttn);

		this.description = StartPage.game.add.bitmapText(0, f.gameHeight * - 0.1, 'luckiestGuy', '', f.resultSize);
		this.description.align = 'center';
		this.description.anchor.setTo(0.5, 0);
		this.add(this.description);

		// gameTitle sprite will updated on swipe with the texture key stored in f.activeIcon
		this.gameTitle = StartPage.game.add.sprite(0, f.gameHeight * - 0.15, 'titlePlaceholder');
		this.gameTitle.anchor.setTo(0.5, 0.5);
		this.add(this.gameTitle);

		f.assignedTweens.push(this.scaleUpTween = StartPage.game.add.tween(this.scale).to( {x: 1, y: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Elastic.Out, false));

		// Tween has delay (last arg)
		f.assignedTweens.push(this.fadeInTween = StartPage.game.add.tween(this).to( {alpha: 1}, f.UI_TWEEN_DUR/2, Phaser.Easing.Exponential.In, false, 100));
		this.alpha = 0;

		f.playersReady.add(function () { this.fadeInTween.start(); }, this);
		f.gameInfoSwiped.add(function () {this.setDescription();}, this);							
	};
	f.GameInfoGroup.prototype = Object.create(Phaser.Group.prototype);
	f.GameInfoGroup.prototype.constructor = f.GameInfoGroup;
	f.GameInfoGroup.prototype.setDescription = function () {
		this.description.text = f.activeIcon.description.toUpperCase().replace('\\N','\n');
		this.gameTitle.loadTexture(f.activeIcon.titleKey);
		this.scale.setTo(0, 0);

		this.scaleUpTween.start();
	};

	f.ResultsGroup = function (game, zoneNum) {
		Phaser.Group.call(this, game);
		this.bgPanel = StartPage.game.add.sprite(0, - f.gameHeight * 0.135, 'resultsPanel', 0, this);
		this.bgPanel.anchor.setTo(0.5, 0.5);
		this.addPlayerPanels();
		this.addLabels();		

		this.playAgainBttn = new f.ResultsButton(StartPage.game, - f.gameWidth * 0.11, - f.gameHeight * 0.133, 'resultsBttns', function () { f.playAgain.dispatch(); });
		this.changePlayersBttn = new f.ResultsButton(StartPage.game, f.gameWidth * 0.11, - f.gameHeight * 0.133, 'resultsBttns', function () { f.changePlayers.dispatch(); });
		
		this.changePlayersBttn.frame = 2;
		this.add(this.playAgainBttn);	
		this.add(this.changePlayersBttn);

		this.playAgainBttn.scale.x = 1;
		this.playAgainBttn.scale.y = 1;
		this.changePlayersBttn.scale.x = 1;
		this.changePlayersBttn.scale.y = 1;

		this.drawTxt = StartPage.game.add.bitmapText(0, - f.gameHeight * 0.145, 'luckiestGuy', 'IT\'S A DRAW!', f.resultSize * 1.2);
		this.drawTxt.align = 'center';
		this.drawTxt.anchor.setTo(0.5, 0);
		this.drawTxt.visible = false;
		this.add(this.drawTxt);

		f.addUItweens(this);
		f.showResults.add(this.onShowResults, this);
		
		this.scaleDownTween.onComplete.add(function () { 
			if(!f.sessionStarted){
				f.sessionStarted = true; 
				cleanUp();
			}
		}, this);
		f.assignedTweens.push(this.changePlayersTween = StartPage.game.add.tween(this.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
		this.changePlayersTween.onComplete.add(function () { if(!f.playersChanging){f.playersChanging = true; top.GameManager.changePlayers();}}, this);
		f.playAgain.add(this.onPlayAgain, this);
		f.changePlayers.add(this.onChangePlayers, this);
	};
	f.ResultsGroup.prototype = Object.create(Phaser.Group.prototype);
	f.ResultsGroup.prototype.constructor = f.ResultsGroup;
	f.ResultsGroup.prototype.addLabels = function () {
		this.winnerLabel = StartPage.game.add.sprite(0, - f.gameHeight * 0.31, 'winnerLoserLabels', 0, this);
		this.winnerLabel.anchor.setTo(0.5, 0.5);
		this.winnerLabel.angle = 0.8;
		this.loserLabel = StartPage.game.add.sprite(0, f.gameHeight * 0.04, 'winnerLoserLabels', 0, this);
		this.loserLabel.anchor.setTo(0.5, 0.5);
		this.loserLabel.frame = 1;
		this.loserLabel.angle = 0.8;

		this.winnerTeamLabel = StartPage.game.add.sprite(0, - f.gameHeight * 0.31, 'winnerLoserTeamLabels', 0, this);
		this.winnerTeamLabel.anchor.setTo(0.5, 0.5);
		this.loserTeamLabel = StartPage.game.add.sprite(0, f.gameHeight * 0.04, 'winnerLoserTeamLabels', 0, this);
		this.loserTeamLabel.anchor.setTo(0.5, 0.5);
		this.loserTeamLabel.frame = 1;

		this.winnerLabel.visible = false;
		this.loserLabel.visible = false;
		this.winnerTeamLabel.visible = false;
		this.loserTeamLabel.visible = false;
	};
	f.ResultsGroup.prototype.addWinnerPanel = function (i) {
		// TODO: merge addWinnerPanel and addLoserPanel, use to Boolean to determine type of panel required
		var panel = new f.PlayerNumberPanel(StartPage.game, true),
		stepAngle = 10,
		startAngle = - (f.MAX_PLAYERS/2 - 1) * stepAngle,
		currAngle = startAngle + stepAngle * i;
		panel.angle = currAngle;
		panel.pivot.y = 450;
		panel.y += 93;

		this.add(panel);
		this['winnerPanel' + i] = panel;	
	};
	f.ResultsGroup.prototype.addLoserPanel = function (i) {
		var panel = new f.PlayerNumberPanel(StartPage.game, false),
		stepAngle = 10,
		startAngle = - (f.MAX_PLAYERS/2 - 1) * stepAngle,
		currAngle = startAngle + stepAngle * i;

		panel.angle = currAngle;
		panel.pivot.y = -300;
		panel.y -= 390;
		panel.alpha = 0.85;
		panel.playerNumTxt.fontSize = f.resultSize * 1.2;
		panel.playerNumTxt.y += 7;
		this.add(panel);
		this['loserPanel' + i] = panel;
	};
	f.ResultsGroup.prototype.addPlayerPanels = function () {
		var i, len = f.MAX_PLAYERS -1;

		for(i = 0; i < len; i++) {
			this.addWinnerPanel(i);
			this.addLoserPanel(i);
		}
	};	
	f.ResultsGroup.prototype.onPlayAgain = function () {
		this.scaleDownTween.start();
	};
	f.ResultsGroup.prototype.getWinningTeams = function () {		

		var 
		// team at 0 index have best ranking - compare to that value to detect ties
		teamRankings = parent.GameManager.getTeamRankings(),
		targetAverage = teamRankings[0].average,
		i, len = teamRankings.length, 
		winners = [];
		for (i = 0; i < len; i++) {
			if(teamRankings[i].average === targetAverage) {
				winners.push(teamRankings[i]);
			}
		}
		return winners;
	};
	f.ResultsGroup.prototype.getWinningPlayers = function () {
		var winners = [],	
		currPlayer,	
		topRanking,	
		i, len = f.results.length;

		// Sort results by ranking, winner first
		f.results.sort(function (a, b) { return a.ranking - b.ranking;});
		for (i = 0; i < len; i++) {
			currPlayer = f.results[i];
			if(i === 0) {
				topRanking = currPlayer.ranking;
				winners.push(currPlayer);
			} else if(currPlayer.ranking === topRanking) {
				winners.push(currPlayer);
			} 
		}
		return winners;
	};
	f.ResultsGroup.prototype.getWinners = function () {
		return f.results[0].team ? this.getWinningTeams() : this.getWinningPlayers();		
	};
	f.ResultsGroup.prototype.getLosingTeams = function () {
		var teamRankings = parent.GameManager.getTeamRankings(),
		targetAverage = teamRankings[teamRankings.length - 1].average,
		i, len = teamRankings.length, losers = [];
		for (i = 0; i < len; i++) {
			if(teamRankings[i].average === targetAverage) {
				losers.push(teamRankings[i]);
			}
		}
		return losers;
	};
	f.ResultsGroup.prototype.getLosingPlayers = function () {
		var worstRanking = 0,
		losers = [],
		currPlayer,
		currPlayerRanking,
		i, len = f.results.length;
		for (i = 0; i < len; i++) {
			currPlayer = f.results[i];
			currPlayerRanking = currPlayer.ranking;
			if(currPlayerRanking > worstRanking) { // Higher ranking value is worse
				worstRanking = currPlayerRanking;
				losers = [currPlayer];
			} else if (currPlayerRanking === worstRanking) {
				losers.push(currPlayer);
			}
		}
		return losers;
	};
	f.ResultsGroup.prototype.getLosers = function () {
		return f.results[0].team ? this.getLosingTeams() : this.getLosingPlayers();	
	};	
	f.ResultsGroup.prototype.getStartPos = function (len) {
		// Determines left-most player panel 
		return 4 - Math.ceil(len/2);
	};
	f.ResultsGroup.prototype.showPanel = function (panel, str, delayDur) {
		panel.playerNumTxt.setText(String(str));

		panel.playerPanel.scaleUpTween.delay(delayDur);
		panel.playerNumTxt.scaleUpTween.delay(delayDur);
		panel.playerPanel.scaleUpTween.start();
		panel.playerNumTxt.scaleUpTween.start();
	};
	f.ResultsGroup.prototype.showMembers = function (memberArr, teamPlay, numLosers) {
		// Display winning/losing player number panels
		var i, len = memberArr.length,		
		panelStr,
		initialDelay, 		
		basicDelay = 2000,
		startPos = this.getStartPos(len),
		memberType = teamPlay ? 'team' : 'player';

		if(numLosers) {
			// These are winners socres - we use numLosers to determine the delay required to show winners after losers
			panelStr = 'winnerPanel';
			initialDelay = f.UI_TWEEN_DUR * numLosers + basicDelay * 1.2;
		} else {
			panelStr = 'loserPanel';
			initialDelay = basicDelay;
		}

		if(len === 1) {
			// If single panel required, use middle one
			this.showPanel(this[panelStr + 3], memberArr[0][memberType], initialDelay);
		} else {
			// Make sure players are arranged in order
			memberArr.sort(function (a, b) {
				return a[memberType] - b[memberType];
			});
			for(i = 0; i < len; i++) {
				this.showPanel(this[panelStr + (startPos + i)], memberArr[i][memberType], (f.UI_TWEEN_DUR * i + 1) + initialDelay);
			}
		}		
	};
	f.ResultsGroup.prototype.hidePlayerPanels = function () {
		// In the event of a draw, we hide the player panels since there are no winners or losers to display
		var i, len = f.MAX_PLAYERS - 1;
		for(i = 0; i < len; i++) {
			this['winnerPanel' + i].visible = false;
			this['loserPanel' + i].visible = false;
		}
		this.winnerLabel.visible = false;
		this.loserLabel.visible = false;
	};
	f.ResultsGroup.prototype.showLabels = function (teamPlay) {
		if(teamPlay) {
			this.winnerTeamLabel.visible = true;
			this.loserTeamLabel.visible = true;
		} else {
			this.winnerLabel.visible = true;
			this.loserLabel.visible = true;
		}
	};
	f.ResultsGroup.prototype.updateResultsView = function (winners, losers, teamPlay) {
		
		if((teamPlay && winners.length === parent.GameManager.getTeamRankings().length) ||
			(!teamPlay && winners.length === f.results.length) ) {
			// Everybody won - must be draw
			this.drawTxt.visible = true;
			this.hidePlayerPanels();
		} else {
			this.showMembers(winners, teamPlay, losers.length);
			this.showMembers(losers, teamPlay);
			this.showLabels(teamPlay);
		}
	};
	f.ResultsGroup.prototype.onShowResults = function () {		

		var winningMembers,
		losingMembers,
		teamPlay = f.results[0].team;	

		if(teamPlay) {
			winningMembers = this.getWinningTeams();
			losingMembers = this.getLosingTeams();	
		} else {
			winningMembers = this.getWinningPlayers();
			losingMembers = this.getLosingPlayers();
		}
		this.updateResultsView(winningMembers, losingMembers, teamPlay);		
	};
	f.ResultsGroup.prototype.onChangePlayers = function () {
		this.changePlayersTween.start();
	};

	f.HomeZoneGroup = function (game) {

		Phaser.Group.call(this, game);

		this.activePlaces = [];
	};
	f.HomeZoneGroup.prototype = Object.create(Phaser.Group.prototype);
	f.HomeZoneGroup.prototype.constructor = f.HomeZoneGroup;	
	f.HomeZoneGroup.prototype.onPlayerJoined = function (kbd) {
		f.homeZones.removeActive(kbd.parent.place);
	};
	f.HomeZoneGroup.prototype.addActive = function (place) {
		this.activePlaces.push(place);
	};
	f.HomeZoneGroup.prototype.removeActive = function (place) {

		var i = this.activePlaces.indexOf(place);
		if(i !== -1) {
			this.activePlaces.splice(i, 1);
		}
	};

	StartPage.Boot = function () {
		
	};

	StartPage.Boot.prototype = {

	    init: function () {
		
			var i;

			this.input.maxPointers = f.MAX_PLAYERS;
			
			for(i = 0; i < this.input.maxPointers; i++){
				this.game.input.addPointer();
			}
	        this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;			
			this.game.stage.backgroundColor = 0x000000;
	    },

	    create: function () {

	        //  Preloader assets loaded to the cache
	        //  Start the real preloader going
	        this.state.start('Preloader');
	    }

	};
}());