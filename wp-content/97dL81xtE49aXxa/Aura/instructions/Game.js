/*global Phaser, Aura, f */

(function () {
	
	"use strict";

	f.level = 0;
	f.levelOver = true;
	f.gameStarted = false;
	f.elmtByZone = [];
	f.removeInstructionTweens = function (instruction) {
		f.removeTweens(instruction, ['scaleTween', 'pauseTween', 'scaleDownTween']);
	};		
	f.volumeChangeHandler = function (event) {
		Aura.game.sound.volume = parseInt(event.detail, 10)/10;
	};
	f.gameOver = function (exit) {
		var 
		removeSound = function(_sound) {
			_sound.stop();
			_sound = null;		
		},
		i,
		j,
		k,
		klen,
		len,
		jlen,
		currElmt,
		currJelmt;

		// HomeZone - remove tweens
		len = f.homeZones.length;
		for(i = 0; i < len; i++){	
			currElmt = f.homeZones.getAt(i);
			jlen = currElmt.length;

			if(f.hudZone(currElmt)){
				f.removeTweens(currElmt.logo, ['inTween', 'pauseTween', 'outTween']);
				// instructions like 'Tap to score'
				f.removeInstructionTweens(currElmt.instruction1);
				f.removeInstructionTweens(currElmt.instruction2);
				f.removeInstructionTweens(currElmt.instruction3);
			}			
			len = f.instructionTimers.length;
			for(i = 0; i < len; i++){
				Aura.game.time.events.remove(f.instructionTimers[i]);
			}		
		}
		if(f.countdownSprite) {
			f.removeTween(f.countdownSprite.alphaInTween);
			f.countdownSprite.destroy();
		}		
		len = f.sound.length;
		for(i = 0; i < len; i++){
			removeSound(f.sound[i]);
		}
		Aura.game.time.events.remove(f.countdownTimer);
		// destroy groups
		len = f.dynamicGroups.length;
		for(i = 0; i < len; i++) {
			f.dynamicGroups[i].destroy(true, true);
		}
		f.homeZones.destroy(true, true);
		f.bg.exists = false;

		top.window.removeEventListener('volume-change', f.volumeChangeHandler, false);

		// delete properties of f
		for(currElmt in f){
			if(f.hasOwnProperty(currElmt)){
				delete f[currElmt];
			}
		}
		Aura.game.paused = true;
		if(exit) {
			VTAPI.onGameOver(true);
		} else {
			VTAPI.startGame();	
		}		
    };  
    top.window.addEventListener('volume-change', f.volumeChangeHandler, false); 
    f.volumeChangeHandler({detail: top.HarmonicsSoundManager.getVolume()});

    f.startDemo = (function () {
		var addTap = function (currZone, demoDiscNum) {
				var currZoneHZBGsprite = currZone.getAt(0),
				pos = {x: currZoneHZBGsprite.world.x, y: currZoneHZBGsprite.world.y},
				tap;

			currZone.disc = f.discGroup.getAt(demoDiscNum);
			tap = new f.Tap(Aura.game, pos.x, pos.y, 'tap', currZone, true);
			currZone.tap = tap;
			currZone.tap = tap;
			f.tapGroup.add(tap);
		};
		return function (zoneNum) {
			var 
			demoDiscNum, // assigning zones so tap sprites don't cross each other on way to discs
			currZone = f.homeZones.getAt(zoneNum);
			demoDiscNum = zoneNum < 4 ? zoneNum : 7 - zoneNum; 
			addTap(currZone, demoDiscNum);
		};				
	}());	
	
	Aura.Game = function () {
	    return this;
	};

	Aura.Game.prototype = {

	    create: function () {
			
			var len,
			makeCountdown = (function () {
				var onUpdate = function () {
					f.sound[1].play();
					if(this.countdownSprite.frame === 3) {
						f.gameOver();
					}
				},
				startCountdown = function () {
					this.countdownSprite.animations.play('countdownAnim', 1, false);
				};

				return function (){
					var countdownAnimation;
					f.sound[2].stop();
					f.countdownSprite = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'countdown');
					countdownAnimation = f.countdownSprite.animations.add('countdownAnim', [0, 1, 2, 3, 4]);
					countdownAnimation.enableUpdate = true;
					countdownAnimation.onUpdate.add(onUpdate, {countdownSprite: f.countdownSprite});
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
			getRandomInt = function (min, max) {
			    return Math.floor(Math.random() * (max - min + 1)) + min;
			},			
			showInstruction = function (instr) {
				// instr is a String - the name of the instruction to show
				var i,
				len = f.homeZones.length;
				for(i=0; i < len; i++){
					if(f.hudZone(i)){
						f.homeZones.getAt(i)[instr].scaleTween.start();
						if(instr === 'instruction1'){
							f.startDemo(i);
						} else if (instr === 'instruction2') {
							f.shrinkDragZones = true;
						}
					}
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
				homeZoneGroup,
				i,
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
				addZonePanel = function () {
					var hzPanel;
					hzPanel = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT * 0.8498, 'hzbg');
					hzPanel.anchor.setTo(0.5, 0.5);
					homeZoneGroup.add(hzPanel);
					homeZoneGroup.zonePanel = hzPanel;
					if(!f.freePlay && hzPanel.player){
						hzPanel.frame = hzPanel.player.team;	
					} else {
						hzPanel.frame = 1;	
					}
					f.showAfterLogo(hzPanel);									
					f.hzPanels.push(hzPanel);
				},				
				addHomeZoneLogo = function () {
					var logo = Aura.game.add.sprite(0,0, 'logo');
					logo.anchor.setTo(0.5, 0.5);
					logo.x = f.HALF_WIDTH;
					logo.y = Math.floor(f.HALF_HEIGHT * 0.8);
					logo.alpha = 0;
					logo.inTween = Aura.game.add.tween(logo).to({alpha: 1}, 1500, Phaser.Easing.Linear.In, true);
					logo.pauseTween = Aura.game.add.tween(logo).to({alpha: 1}, 1200, Phaser.Easing.Linear.In, false);
					logo.outTween = Aura.game.add.tween(logo).to({alpha: 0}, 750, Phaser.Easing.Linear.In, false);
					logo.inTween.chain(logo.pauseTween, logo.outTween);

					logo.outTween.onComplete.add(function () { f.hideLogoSignal.dispatch(this);}, this);
					homeZoneGroup.logo = logo;
					homeZoneGroup.add(logo);
				},
				initInstructions = (function () {
					var initInstruction = function (instruction, instructionNum) {
						instruction.anchor.setTo(0.5, 0.5);
						instruction.scale.x = 0;
						instruction.scale.y = 0;
						instruction.scaleTween = Aura.game.add.tween(instruction.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
						instruction.pauseTween = Aura.game.add.tween(instruction.scale).to({x: 1, y: 1}, 300, Phaser.Easing.Linear.InOut, false);
						instruction.scaleDownTween = Aura.game.add.tween(instruction.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
						instruction.scaleTween.chain(instruction.pauseTween, instruction.scaleDownTween);
						homeZoneGroup['instruction' + instructionNum] = instruction;
						homeZoneGroup.add(instruction);
					};
					return function () {
						var i,
						len = arguments.length;
						for (i = 0; i < len; i++){
							initInstruction(arguments[i], i + 1);
						}
					};
				}()),
				addHomeZoneInstructions = function () {
					// make a new group and add text too
					var instruction1 = Aura.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 25, 'summercamp', 'CAPTURE DISCS', 24),
					instruction2 = Aura.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 25, 'summercamp', 'FLING FROM HOMEZONE TO SCORE', 24),
					instruction3 = Aura.game.add.bitmapText(f.HALF_WIDTH, f.HALF_HEIGHT + 25, 'summercamp', 'TAP TO DEFEND', 24);
					initInstructions(instruction1, instruction2, instruction3);
				},
				getFlingTarget = function (zoneNum) {
					return zoneNum < 7 ? zoneNum + 2 : 1;
				},
				getAttackingZone = function (zoneNum) {
					if(zoneNum === 1){
						return 3;
					}
					if(zoneNum === 5){
						return 7;
					}
					return null;
				};
				f.freePlay = f.teams.length === 0;
				
				
				return function () {
					var hzfg,
					dragZone;				

					for(i = 0; i < numZones; i++) {						
						homeZoneGroup = Aura.game.add.group();
						f.homeZones.add(homeZoneGroup);
						dragZone = new f.DragZone(Aura.game, f.HALF_WIDTH, f.HALF_HEIGHT);
						f.dragZones.add(dragZone);
						dragZone.pivot.x = 0;
						dragZone.pivot.y = 0;
						dragZone.angle = dragZoneSettings[i].angle;
						dragZone.x = dragZoneSettings[i].x;
						dragZone.y = dragZoneSettings[i].y;
						f.showAfterLogo(dragZone);
						addZonePanel(i);
						hzfg = Aura.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT * 0.8498, 'hzfg');
						hzfg.anchor.setTo(0.5, 0.5);
						if(!f.freePlay && f.players[i]){
							hzfg.frame = f.players[i].team;
						} else {
							hzfg.frame = 1;
						}
						f.showAfterLogo(hzfg);
						homeZoneGroup.add(hzfg);							

						homeZoneGroup.zoneNum = i;
						homeZoneGroup.flingTarget = getFlingTarget(i);
						homeZoneGroup.attackingZone = getAttackingZone(i);
						if(f.hudZone(i)){
							addHomeZoneLogo();
							addHomeZoneInstructions();
						}
						rotateHomeZone();						
					}					
				};				
			}()),
			addDiscs = function () {
				var i,
				len = 4,	
				currDisc,
				currZone = 1,				
				discOffset = f.discWH * 1.2,		
				currX = f.HALF_WIDTH - (discOffset * (len - 1)/2);				

				for(i = 0; i < len; i++) {
					currDisc = f.discGroup.add(new f.Disc(Aura.game, currX, f.HALF_HEIGHT, 'disc', currZone));
					currX += discOffset;
					currZone += 2;
				}
			},
			i;
		
			f.sound = [
				this.game.add.audio('capture'), // was4 0
				this.game.add.audio('countdown'), // was5 1
				this.game.add.audio('ambientLoop'), // was6 2
				this.game.add.audio('scoreTransfer'), // was7 3
				this.game.add.audio('zap') // was8 4
			];
			f.sound[1].volume = 0.5;
			f.sound[2].volume = 0.5;
			f.sound[2].loop = true;
			f.sound[4].volume = 0.5;
			len = f.sound.length;
			for(i = 0; i < len; i++){
				f.sound[i].allowMultiple = false;
			}		

			f.bg = Aura.game.add.sprite(0, 0, 'bg');
			f.dragZones = Aura.game.add.group();
			f.homeZones = Aura.game.add.group();
			f.discGroup = Aura.game.add.group();
			f.tapGroup = Aura.game.add.group();
			f.haloGroup = Aura.game.add.group();
			f.zapperGroup = Aura.game.add.group();
			f.dynamicGroups = [
				f.discGroup,
				f.tapGroup,
				f.haloGroup,
				f.zapperGroup,
				f.dragZones
			];
			addHomeZones();
			addDiscs();
			f.showAfterLogo(f.tapGroup);
			// Pass in countdown func to one call to showAfterLogo
			//  - it looks for this and so only calls it once
			f.showAfterLogo(f.discGroup, countdown);
			f.instructionTimers = [];
			f.instructionTimers.push(Aura.game.time.events.add(4900, showInstruction, this, 'instruction1'));
			f.instructionTimers.push(Aura.game.time.events.add(7000, showInstruction, this, 'instruction2'));
			f.instructionTimers.push(Aura.game.time.events.add(9500, showInstruction, this, 'instruction3'));
			f.sound[2].play();
		}
	};
}());