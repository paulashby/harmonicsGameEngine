/*global Phaser, Blox, f */

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
			nextLevel = function () {
								
				f.endLevel();			
			},
			volumeChangeHandler = function (event) {
				Blox.game.sound.volume = parseInt(event.detail, 10)/10;
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

				// HomeZone - remove tweens
				len = f.homeZones.length;
				for(i = 0; i < len; i++){	
					currElmt = f.homeZones.getAt(i);
					jlen = currElmt.length;

					if(currElmt.logo){
						removeTweens(currElmt.logo, ['startTween', 'scaleTween', 'scaleDownTween','pauseTween']);
					}

					if(currElmt.hud){
						// instructions like 'Tap to score'
						removeTweens(currElmt.instruction1, ['scaleTween', 'scaleDownTween', 'pauseTween']);
						removeTweens(currElmt.instruction2, ['scaleTween', 'scaleDownTween', 'pauseTween']);
						removeTweens(currElmt.instruction3, ['scaleTween', 'scaleDownTween']);
						removeTweens(currElmt.instruction4, ['scaleTween', 'scaleDownTween']);
					}					
					
					len = f.instructionTimers.length;
					for(i = 0; i < len; i++){
						Blox.game.time.events.remove(f.instructionTimers[i]);
					}		
				}
				len = f.pointers.length;
				for(i = 0; i < len; i++){
					removeTweens(f.pointers[i], ['scaleDownTween']);
				}

				len = f.sound.length;
				for(i = 0; i < len; i++){
					removeSound(f.sound[i]);
				}

				Blox.game.time.events.remove(f.countdownTimer);
				Blox.game.time.events.remove(f.levelTimer);
				Blox.game.time.events.remove(f.levelRestartTimer);
				Blox.game.time.events.remove(f.endTimer);

				// destroy groups
				len = f.dynamicGroups.length;
				for(i = 0; i < len; i++) {
					f.dynamicGroups[i].destroy(true, true);
				}
				f.homeZones.destroy(true, true);
				f.bg.exists = false;
				
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
					VTAPI.startGame();	
				}
		    },
		    countdown = function () {
		    	// console.error('Countdown: Write me!');
		    },
			setLevelTimers = function () {
				f.levelTimer = Blox.game.time.create(false);
				f.levelTimer.add(f.LEVEL_DURATION, f.endLevel, this);
				f.levelRestartTimer = Blox.game.time.create(false);
				f.levelRestartTimer.add(f.levelBreakDuration, countdown, this);
				f.levelTimer.start();
			},
			hudZone = function (zoneNum) {
				// returns true if the current zone requires score panels at end of level
				// (the top and bottom of the table only has panels in centre zone)
				return zoneNum > 0 && zoneNum % 2 !== 0;				
			},
			makeCaptureDemo = function () {

				f.homeZones.forEach(function (hz) {
					var targetBlock,
						colOffset = 0,
						rowOffset = 0,
						instructionColOffset = 0,
						instructionRowOffset = 0;

					if(hz.hud) {
						if(hz.sideZone) {
							colOffset = hz.homeBlock.colNum > 0 ? f.BLOCKS_TO_CAPTURE * -1 : f.BLOCKS_TO_CAPTURE;
							instructionColOffset = hz.homeBlock.colNum > 0 ? f.INSTRUCTION_BLOCK * -1 : f.INSTRUCTION_BLOCK;							
						} else {
							rowOffset  = hz.homeBlock.rowNum > 0 ? f.BLOCKS_TO_CAPTURE * -1 : f.BLOCKS_TO_CAPTURE;
							instructionRowOffset  = hz.homeBlock.rowNum > 0 ? f.INSTRUCTION_BLOCK * -1 : f.INSTRUCTION_BLOCK;
						}
						targetBlock = f.blocks.getAt(hz.homeBlock.colNum + colOffset).getAt(hz.homeBlock.rowNum + rowOffset);						
						hz.targetBlock = targetBlock;												
						hz.tweenTarget = hz.toLocal(targetBlock.position, hz.block);
						hz.instructionBlock = f.blocks.getAt(hz.homeBlock.colNum + instructionColOffset).getAt(hz.homeBlock.rowNum + instructionRowOffset); 
					}									
				});
			},
			showInstruction = function (instr) {
				// instr is a String - the name of the instruction to show
				var i,
				len = f.homeZones.length,
				hz;
				for(i=0; i < len; i++){
					hz = f.homeZones.getAt(i);
					if(hz.hud)
					hz[instr].scaleTween.start();
					f.sound[1].play();
				}
			},
			goBlank = function () {
				f.homeZones.forEach(function (hz) {
					if(hz.hud) {
						hz.targetBlock.loadTexture('squares', 8);
					}
				});
			},	
			showSpecial = function (key) {
				f.homeZones.forEach(function (hz) {
					if(hz.hud) {
						hz.targetBlock[key].call(hz.targetBlock);
					}
				});
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
				f.dynamicGroups.push(f.blocks);
				len = f.blocksPerRow;
				jlen = f.blocksPerCol;

				for(i = 0; i < len; i++){	
					currGroup = Blox.game.add.group();
					currGroup.colNum = i;
					f.blocks.add(currGroup);

					for(j = 0; j < jlen; j++){	
						currX = f.squaresW * i + f.squaresW/2;						
						currBlock = new f.Block(Blox.game, currX, f.squaresH * j + f.squaresH/2, 'squares');
						currBlock.colNum = i;
						currBlock.rowNum = j;
						currBlock.frame = 8;
						currGroup.add(currBlock);						
					}
				}					
			},
			setCountdown = function () {
				// Select blocks for countdown
				var centreColNum = Math.floor(f.blocks.length/2),
				centreRowNum = Math.floor(f.blocks.getAt(0).length/2),
				currCol,
				currBlock,						
				len = 3,
				i;

				for(i = 0; i < len; i++) {
					currCol = f.blocks.getAt(centreColNum + (i - 1) * 2);
					currBlock = currCol.getAt(centreRowNum);
					f.countdownBlocks.unshift(currBlock);
				}
			},
			addHomeZones = (function (){
				var posInset = f.inset = Math.floor(f.gameWidth/20),
				sideInset = Math.floor(posInset * 1.7),
				innerSideL = sideInset,
				innerSideR = f.gameWidth - sideInset,
				rightPos = f.gameWidth - posInset,
				bottomPos = f.gameHeight - posInset,
				homeSettings = homeSettings = [ 
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
				homeZone,
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
				},
				addHomeZoneLogo = function () {
					var logo = Blox.game.add.sprite(0,0, 'logo');
					logo.anchor.setTo(0.5, 0.5);
					logo.x = f.HALF_WIDTH;
					logo.y = Math.floor(f.HALF_HEIGHT * 0.6);
					logo.scale.x = 0;
					logo.scale.y = 0;
					logo.startTween = Blox.game.add.tween(logo.scale).to({x: 0, y: 0}, 500, Phaser.Easing.Elastic.Out, true);
					logo.scaleTween = Blox.game.add.tween(logo.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					logo.scaleTween.onStart.add(function () { this.sound[0].play();}, f);
					logo.pauseTween = Blox.game.add.tween(logo.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Linear.InOut, false);										
					logo.scaleDownTween = Blox.game.add.tween(logo.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					logo.scaleDownTween.onComplete.add(function () { this.sound[0].play();}, f);
					logo.startTween.chain(logo.scaleTween, logo.pauseTween, logo.scaleDownTween);
					homeZoneGroup.logo = logo;
					homeZoneGroup.add(logo);
				},
				assignHomeBlock = function (homeZoneGroup) {
					var blockPosition = f.homeBlockPositions[i],
						zoneCol,
						homeBlock;

					zoneCol = f.blocks.getAt(blockPosition[0]);					

					if(zoneCol !== -1) {
						homeBlock = zoneCol.getAt(blockPosition[1]);
						homeZoneGroup.homeBlock = homeBlock;

						if(homeBlock !== -1) {
							homeBlock.homeZone = true;
							homeBlock.frame = f.freePlay ? i : f.players[i].team;

							homeBlock.captureSound = f.sound[0];
							homeBlock.captureSound.allowMultiple = true;

							homeBlock.bonusSound = Blox.game.add.audio('bonus');
							homeBlock.bonusSound.volume = 0.2;

							homeBlock.hazardSound = Blox.game.add.audio('hazard');
							homeBlock.hazardSound.volume = 0.15;
							
							homeBlock.hazardShortSound = Blox.game.add.audio('hazardShort');
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
				},
				chainTweens = function (elmt) {
					var i,
					len = elmt.tweens.length - 1;
					// add tweens
					for(i = 0; i < len; i++){
						elmt.tweens[i].chain(elmt.tweens[i+1]);
					}
				},
				addHomeZoneInstructions = function (zoneNum) {
					// make a new group and add text too
					var 
					instructionPosition = homeZoneGroup.toLocal({x: 0, y: 0}, homeZoneGroup.instructionBlock),
					// skipInstructionsBttn = Blox.game.add.bitmapText(instructionPosition.x, instructionPosition.y + 150, 'pixelCapsWhite', 'SKIP INSTRUCTIONS', f.INSTRUCTION_FONT_SIZE * 0.85),	
					skipBttnY = f.blocksPerRow = f.blockSetUps[Math.ceil(f.numPlayers/2) -1].skipBttnY,
					skipInstructionsBttn = Blox.game.add.sprite(instructionPosition.x, skipBttnY, 'skipBttn'),
					instruction1 = Blox.game.add.bitmapText(instructionPosition.x, instructionPosition.y, 'pixelCapsWhite', 'DRAG TO CAPTURE BLOCKS', f.INSTRUCTION_FONT_SIZE),
					instruction2 = Blox.game.add.bitmapText(instructionPosition.x, instructionPosition.y, 'pixelCapsWhite', 'HOLD ON TIGHT OR LOSE YOUR BLOCKS', f.INSTRUCTION_FONT_SIZE),
					instruction3 = Blox.game.add.bitmapText(instructionPosition.x, instructionPosition.y, 'pixelCapsWhite', 'COLLECT BONUSES', f.INSTRUCTION_FONT_SIZE),
					instruction4 = Blox.game.add.bitmapText(instructionPosition.x, instructionPosition.y, 'pixelCapsWhite', 'AVOID HAZARDS', f.INSTRUCTION_FONT_SIZE),
					pointerPos = homeZoneGroup.toLocal({x: 0, y: 0}, homeZoneGroup.homeBlock),
					pointer = Blox.game.add.sprite(pointerPos.x, pointerPos.y, 'pointer');
					
					console.log("Y: " + skipBttnY);
					console.log('insY: ' + instructionPosition.y);
					skipInstructionsBttn.inputEnabled = true;
					skipInstructionsBttn.onTap = function () {
						if(f.transitionLoop) {
							Blox.game.time.events.remove(f.transitionLoop);
						}		
						f.gameOver = true;				
						f.endLevel();
					};
					skipInstructionsBttn.events.onInputDown.add(skipInstructionsBttn.onTap, skipInstructionsBttn);
					skipInstructionsBttn.anchor.setTo(0.5, 0.5);
					skipInstructionsBttn.scale.setTo(0.7, 0.7);
					homeZoneGroup.skipInstructionsBttn = skipInstructionsBttn;
					homeZoneGroup.add(skipInstructionsBttn);

					pointer.anchor.setTo(0.5, 0.5);
					pointer.alpha = 0;
					pointer.isDown = true;
					pointer.scaleDownTween = Blox.game.add.tween(pointer.scale).to({x: 0, y: 0}, 1000, Phaser.Easing.Elastic.In, false);
					pointer.scaleDownTween.onComplete.add(function () {
						f.releaseBlocks = true;
					});
					homeZoneGroup.pointer = pointer;					
					homeZoneGroup.add(pointer);					
					pointer.demoTween = Blox.game.add.tween(pointer).to(homeZoneGroup.tweenTarget, 900, Phaser.Easing.Quadratic.InOut, false);
					f.pointers.push(pointer);
					
					instruction1.anchor.setTo(0.5, 0.5);
					instruction1.align = 'center';
					instruction1.scale.x = 0;
					instruction1.scale.y = 0;
					
					instruction1.scaleTween = Blox.game.add.tween(instruction1.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					instruction1.pauseTween = Blox.game.add.tween(instruction1.scale).to({x: 1, y: 1}, 300, Phaser.Easing.Linear.InOut, false);
					instruction1.scaleDownTween = Blox.game.add.tween(instruction1.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					instruction1.scaleTween.chain(instruction1.pauseTween, instruction1.scaleDownTween);
					homeZoneGroup.instruction1 = instruction1;
					homeZoneGroup.add(instruction1);
					
					instruction2.anchor.setTo(0.5, 0.5);
					instruction2.align = 'center';
					instruction2.scale.x = 0;
					instruction2.scale.y = 0;
					instruction2.scaleTween = Blox.game.add.tween(instruction2.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					instruction2.pauseTween = Blox.game.add.tween(instruction2.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Linear.InOut, false);
					instruction2.scaleDownTween = Blox.game.add.tween(instruction2.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					instruction2.scaleDownTween.onComplete.add(function () { 
						f.sound[1].play();
					}, this);
					instruction2.scaleTween.chain(instruction2.pauseTween, instruction2.scaleDownTween);
					homeZoneGroup.instruction2 = instruction2;
					homeZoneGroup.add(instruction2);	

					instruction3.anchor.setTo(0.5, 0.5);
					instruction3.align = 'center';
					instruction3.scale.x = 0;
					instruction3.scale.y = 0;
					instruction3.scaleTween = Blox.game.add.tween(instruction3.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					instruction3.scaleDownTween = Blox.game.add.tween(instruction3.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					instruction3.scaleDownTween.onComplete.add(function () { 
						f.sound[1].play(); 
					}, this);
					instruction3.scaleTween.chain(instruction3.scaleDownTween);
					homeZoneGroup.instruction3 = instruction3;
					homeZoneGroup.add(instruction3);

					instruction4.anchor.setTo(0.5, 0.5);
					instruction4.align = 'center';
					instruction4.scale.x = 0;
					instruction4.scale.y = 0;
					instruction4.scaleTween = Blox.game.add.tween(instruction4.scale).to({x: 1, y: 1}, 1000, Phaser.Easing.Elastic.Out, false);
					instruction4.scaleDownTween = Blox.game.add.tween(instruction4.scale).to({x: 0, y: 0}, 750, Phaser.Easing.Elastic.In, false);
					instruction4.scaleDownTween.onComplete.add(function () { 
						f.sound[1].play();						
						if( ! f.transitionStarting ) {
							f.transitionStarting = true; 
							f.transitionLevel();
						}						
					}, this);
					instruction4.scaleTween.chain(instruction4.scaleDownTween);
					homeZoneGroup.instruction4 = instruction4;
					homeZoneGroup.add(instruction4);	
				};
				f.freePlay = f.teams.length === 0;
				
				return function () {
					for(i = 0; i < numZones; i++) {

						if(f.players[i] !== null){

							homeZoneGroup = Blox.game.add.group();
							

							homeZoneGroup.elmtTargetNum = 0;
							rotateHomeZone();
							if(isSideZone(homeZoneGroup)) {
								homeZoneGroup.sideZone = true;
							} else {
								homeZoneGroup.sideZone = false;
							}							
							f.players[i].homeZone = homeZone;
							f.players[i].homeZoneNum = i;
							f.homeZones.add(homeZoneGroup);								
																						
						}
						if(hudZone(i)){
							homeZoneGroup.hud = true;
							assignHomeBlock(homeZoneGroup);
							makeCaptureDemo();
							addHomeZoneInstructions(f.players[i].homeZoneNum);					
							addHomeZoneLogo();						
						}											
					}					
					// Make sure we've got enough target elements for demo
					for(i = 0; i < numZones; i++){
						if(i !== 8){
							//prepareDemoElmts(i);
						}				
					}
				};				
			}()),
			len,
			i;
		
			
			f.dynamicGroups = [
				// All groups except homezones
				// use this array to start fade tweens etc				
			];
			f.sound = [
				Blox.game.add.audio('a3'),
				Blox.game.add.audio('g4'),
				Blox.game.add.audio('loop'),
				Blox.game.add.audio('endAlert'),
				Blox.game.add.audio('hazardShort')
			];	
			f.sound[0].volume = 0.8;
			f.sound[1].volume = 0.8;
			f.sound[2].loop = true;
			f.sound[2].play();
			f.sound[3].volume = 0.6;
			f.sound[4].volume = 1;		
			f.pulseBlockGroups = function () {
				// set pulse tweens
				f.blocksAlphaOutTween = Blox.game.add.tween(f.blocks).to({alpha: 0.2}, 300, Phaser.Easing.Quartic.Out, true);
				f.blocksAlphaInTween = Blox.game.add.tween(f.blocks).to({alpha: 1}, 100, Phaser.Easing.Linear.InOut, false);
				f.blocksAlphaOutTween.chain(f.blocksAlphaInTween);

				f.countdownBlocks[f.currPulse].frame = f.BLANK_FRAME;

				if(f.currPulse < 2) {
					f.sound[3].play();
					f.sound[3].volume += 0.2;
					f.currPulse++;					
				} else {
					// When f.endTransition is true, Game.update will check 
					// f.endAlertCompleted and f.blockFadeCompleted
					// to see if the game is over
					f.endTransition = true;
					f.sound[3].play();
					f.blocksAlphaOutTween.onComplete.add(function () {
						f.blockFadeCompleted = true;
					}, this);					
				}
			};
			f.transitionLevel = function () {
				// Alert players to fact that level is about to end		
				var i,
				len = f.countdownBlocks.length;

				for(i = 0; i < len; i++) {
					f.countdownBlocks[i].frame = 0;					
				}		
				f.currPulse = 0;
				f.sound[0].play();
				f.transitionLoop = Blox.game.time.events.loop(1500 , f.pulseBlockGroups, this);
			};
			f.endLevel = function () {
				var 
				i,
				len;
				f.levelOver = true;				
				
				Blox.game.sound.stopAll();

				len = f.homeZones.length;
				gameOver();
			};
			len = f.sound.length;
			for(i = 0; i < len; i++){
				f.sound[i].allowMultiple = false;
			}
			
			f.bg = this.game.add.sprite(0, 0, 'tone');
			f.bg.blendMode = PIXI.blendModes.MULTIPLY;f
			addBlocks();
			setCountdown();

			f.homeZones = Blox.game.add.group();
			f.homeZones.isHomeZones = true;
			addHomeZones();
			f.instructionTimers = [
			];

			f.instructionTimers.push(Blox.game.time.events.add(3500, showInstruction, this, 'instruction1'));

			f.instructionTimers.push(Blox.game.time.events.add(3900, function () {
				f.captureDemoStarted = true;
				}, this));

			f.instructionTimers.push(Blox.game.time.events.add(6000, function () {
				f.hidePointers = true;
				showInstruction('instruction2');				
			}, this));

			f.instructionTimers.push(Blox.game.time.events.add(9000, showInstruction, this, 'instruction3'));
			f.instructionTimers.push(Blox.game.time.events.add(9300, showSpecial, this, 'showBonus'));
			f.instructionTimers.push(Blox.game.time.events.add(11000, showInstruction, this, 'instruction4'));
			f.instructionTimers.push(Blox.game.time.events.add(11000, showSpecial, this, 'showHazard'));
			f.instructionTimers.push(Blox.game.time.events.add(13000, goBlank, this));			

			top.window.addEventListener('volume-change', volumeChangeHandler, false);
			volumeChangeHandler({detail: top.HarmonicsSoundManager.getVolume()});			
		},
		update: function (){
			var pointers = f.pointers,
	    		i,
	    		ilen,
	    		currPointer,
	    		currCol,
	    		localPos;

			if(pointers){

				ilen = pointers.length
		    	// Check for game over	    		
				if(f.endTransition && f.blockFadeCompleted) {
		    		// Only once
		    		f.endTransition = false;
		    		f.removeTween(f.blocksAlphaOutTween);
					f.removeTween(f.blocksAlphaInTween);
	
					// remove transitionLoop
					Blox.game.time.events.remove(f.transitionLoop);
					f.gameOver = true;				
					f.endLevel();
	
		    	} else if(f.captureDemoStarted) {
		    		for(i = 0; i < ilen; i++) {
	
			    		currPointer = pointers[i];
			    		currPointer.alpha = 1;
			    		localPos = f.blocks.toLocal({x: 0, y: 0}, currPointer);
	
			    		if( ! currPointer.demoStarted ) {
			    			currPointer.demoTween.start();
			    			currPointer.demoStarted = true;
			    		}
	
			    		if(f.hidePointers) {
			    			currPointer.scaleDownTween.start();	
			    		}
			    		if(f.releaseBlocks) {
				    		currPointer.isDown = false;
				    	}
	
			    		if(currPointer.isDown) {
			    			currCol =  f.blocks.getAt(Math.floor(localPos.x / f.squaresW));
			    			if( ! currPointer.tapped) {
			    				currPointer.tapped = true;
			    				currPointer.block = currCol.getAt( Math.floor(localPos.y / f.squaresH));
			    				currPointer.block.onTap(null, currPointer);
			    			} else {
			    				if(currCol !== -1) {
				    				currPointer.block = currCol.getAt( Math.floor(localPos.y / f.squaresH));
					    			if(currPointer.block !== -1 && currPointer.block !== currPointer.prevBlock) {
					    				currPointer.prevBlock = currPointer.block;
					    				currPointer.block.onEnter(currPointer);
					    			}	
				    			}
			    			}	    				    			
			    		} else {
			    			if(currPointer.block) {
			    				if(currPointer.blocks) {
			    					currPointer.blocks[0].onRelease(currPointer);	
			    				}
			    				currPointer.block = undefined;
			    			}
			    		}	    		
			    	}
		    	}
	    	}			
		}
	};
}());