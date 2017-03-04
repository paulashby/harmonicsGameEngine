/*global Phaser, AppsCategory, f, top, parent, VTAPI */

var AppsCategory = {}, // game elements in here
f = f || {}; // our members and functions in here


(function () {
	
	"use strict";
	
	f.assignedTweens = [];
	// f.buttons = [];
	f.gameWidth = 1920;
	f.gameHeight = 1080;
	f.HALF_WIDTH = f.gameWidth/2;
	f.HALF_HEIGHT = f.gameHeight/2;
	// f.CENTRE_POINT = new Phaser.Point(f.HALF_WIDTH, f.HALF_HEIGHT);
	// f.UI_TWEEN_DUR = 500;

	f.PULSE_DUR = 600;
	f.PULSE_INTERVAL = 200;
	f.GEAR_SPEED = 0.1;
	f.servicesURL = false;
	f.numSecondaryCategories = 0;

	f.pulseSignal = new Phaser.Signal();
	
		
	f.mapToRange = function (currVal, minIn, maxIn, minOut, maxOut) { 
		// map currVal in range minIn - maxIn to range minOut - maxOut
		var clamped = currVal === 0 ? maxOut : currVal / maxIn / maxOut;
		return clamped + ((1 - clamped) * minOut); 
	};
	f.normaliseAngle = function (ang) {
		return ang + 360;
	};
	f.addUItweens = function (elmt, signalOnComplete) {
		f.assignedTweens.push(elmt.scaleDownTween = AppsCategory.game.add.tween(elmt.scale).to( {x: 0, y: 0}, f.UI_TWEEN_DUR/2, Phaser.Easing.Back.In, false));
		f.assignedTweens.push(elmt.scaleUpTween = AppsCategory.game.add.tween(elmt.scale).to( {x: 1, y: 1}, f.UI_TWEEN_DUR, Phaser.Easing.Elastic.Out, false));

		if(signalOnComplete) {
			elmt.events.hideButton = new Phaser.Signal();
			f.buttons.push(elmt);
			elmt.scaleDownTween.onComplete.add(function () { 
				elmt.events.hideButton.dispatch();
			}, elmt);
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
		f.startSound.play();
	};
	f.getSecondaryCategories = function (categories) {
		var secondaryCategories = [];
		for (var prop in categories) {
		    if (categories.hasOwnProperty(prop)) {
		    	if(prop !== 'services' && prop !== 'games') {
		    		// push category name and url to secondaryCategories Array
		    		secondaryCategories.push([prop, categories[prop]]);	
		    		if(categories[prop] !== false) {
		    			f.numSecondaryCategories++;	
		    		}    		
		    	}
		    }
		}
		return secondaryCategories;
	}
	f.getLayout = function (categories) {
		var 
		// Array of arrays containing [categoryString, urlStrings]
		// these will be added to the gears as properties
		secondaryCategories = f.getSecondaryCategories(categories),
		layouts = {

			/*
			 * Primary = main categories (Games, Services)
			 * Secondary = extra categoroes (Whiteboard, Card Games)
			 * tertiary = no category - just visual filler (no label or link)
			 *
			 * Index of layout arrays matches number of secondary categories
			 * So layout with Services enabled and a single secondary category
			 * would be layouts.servicesEnabled[1]
			 */

			servicesEnabled: [		

				// Assuming games category will not be disabled for purposes of assigning labelNames and urls - so single primary category will always be games
				// If in future we need to allow for games being disabled, this will need to be refactored
				
				// 0: No secondary category
				[
					// primary
					[{x: 608, y: 465, dir: 1, labelName: 'games', url: categories.games}, {x: 1248, y: 543, dir: 1, labelName: 'services', url: categories.services}],
					// secondary
					[],
					// tertiary
					[{x: 412, y: 725, dir: -1}, {x: 925, y: 503, dir: -1}, {x: 1515, y: 369, dir: -1}]
				],

				// 1: Single secondary category
				[
					// primary
					[{x: 496, y: 481, dir: 1, labelName: 'games', url: categories.games}, {x: 1212, y: 415, dir: -1, labelName: 'services', url: categories.services}], 
					// secondary
					[{x: 761, y: 728, dir: -1, labelName: secondaryCategories[0][0], url: secondaryCategories[0][1]}],
					// tertiary
					[{x: 1021, y: 675, dir: 1}, {x: 1525, y: 344, dir: 1}] 
				],

				// 2: Two secondary categories
				[
					// primary
					[{x: 551, y: 417, dir: 1, labelName: 'games', url: categories.games}, {x: 1081, y: 380, dir: -1, labelName: 'services', url: categories.services}], 
					// secondary
					[{x: 1352, y: 633, dir: 1, labelName: secondaryCategories[0][0], url: secondaryCategories[0][1]}, {x: 726, y: 738, dir: -1, labelName: secondaryCategories[1][0], url: secondaryCategories[1][1]}],
					// tertiary
					[{x: 1474, y: 397, dir: -1}, {x: 992, y: 690, dir: 1}] 
				], 
			], 
			servicesDisabled: [

				// 0: No secondary category
				false,

				// 1: Single secondary category
				[
					// primary
					[{x: 589, y: 427, dir: 1, labelName: 'games', url: categories.games}],
					// secondary
					[{x: 1116, y: 638, dir: 1, labelName: secondaryCategories[0][0], url: secondaryCategories[0][1]}],
					// tertiary
					[{x: 906, y: 465, dir: -1}, {x: 1374, y: 702, dir: -1}]
				],

				// 2: Two secondary categories
				[
					// primary
					[{x: 523, y: 469, dir: -1, labelName: 'games', url: categories.games}],
					// secondary
					[{x: 1045, y: 570, dir: -1, labelName: secondaryCategories[0][0], url: secondaryCategories[0][1]}, {x: 1312, y: 410, dir: 1, labelName: secondaryCategories[1][0], url: secondaryCategories[1][1]}],
					// tertiary
					[{x: 749, y: 708, dir: 1}, {x: 840, y: 396, dir: 1}, {x: 1517, y: 580, dir: -1}]
				]
			]
		},		
		layout;

		f.servicesURL = categories.services;

		
		layout = f.servicesURL ? layouts.servicesEnabled[f.numSecondaryCategories] : layouts.servicesDisabled[f.numSecondaryCategories];
		if(layout) {			
			return layout;
		}
		// This should have been picked up by apps-category.php
		console.error('AppsCategory Error: all categories disabled in Game Engine settings');
	};

	f.GearButton = function (game, x, y, labelName) {

	    Phaser.Sprite.call(this, game, x, y, 'buttonBG');

	    this.anchor.setTo(0.5, 0.5);
	    this.label = this.addChild(new Phaser.Sprite(game, 0, 0, labelName));
	    this.label.anchor.setTo(0.5, 0.5);
	    f.assignedTweens.push(this.pulseTween = AppsCategory.game.add.tween(this.scale).to( {x: 0.85, y: 0.85}, f.PULSE_DUR, Phaser.Easing.Elastic.In, false));
	    f.assignedTweens.push(this.unPulseTween = AppsCategory.game.add.tween(this.scale).to( {x: 1, y: 1}, f.PULSE_DUR, Phaser.Easing.Elastic.Out, false));
	    this.pulseTween.chain(this.unPulseTween);
	    f.pulseSignal.add(function () { this.pulseTween.start();}, this);
	}
	f.GearButton.prototype = Object.create(Phaser.Sprite.prototype);
	f.GearButton.prototype.constructor = f.GearButton;

	f.Gear = function (game, gearSettings) {
		
		Phaser.Sprite.call(this, game, gearSettings.x, gearSettings.y, 'gears');

		this.frame = gearSettings.frame;
		this.dir = gearSettings.dir;
		this.anchor.setTo(0.5, 0.5);
		this.inputEnabled = true;		
		this.input.pixelPerfectClick = true;
		this.events.onInputDown.add(this.onInputDown, this, gearSettings.url);
		if(gearSettings.labelName) {
			this.url = gearSettings.url;
			this.button = new f.GearButton(AppsCategory.game, 0, 0, gearSettings.labelName);
			this.addChild(this.button);
			this.button.x = 0;
			this.button.y = 0;
		}		

		switch (this.frame) {
			case 0:
			this.speed = 1;
			this.angOffset = 10;
			break;

			case 1:
			this.speed = 1.5;
			this.angOffset = 25;
			break;

			default:
			this.speed = 2;
			this.angOffset = 0;
		}
	};
	f.Gear.prototype = Object.create(Phaser.Sprite.prototype);
	f.Gear.prototype.constructor = f.Gear;
	f.Gear.prototype.update = function () {		
		if(this.parent) {
			this.angle = this.parent.gearRotation * this.speed * this.dir + this.angOffset;
		}
	};
	f.Gear.prototype.onInputDown = function (url) {
		// AppsCategory.game.state.states['GameOver'].url = url;
		// this.state.start('GameOver');
		f.url = this.url;
		f.gameOver = true;
	};


	f.GearGroup = function (game) {

		var categories = JSON.parse(document.getElementById('body').dataset.categories),
		layout = f.getLayout(categories),
		i,
		currGearSet,
		currGear,
		gearSettings = {};		

		// Extend Phaser.Group
        Phaser.Group.call(this, game);

        this.gearRotation = 0;        
	    this.pulseClock = 0;

        // traverse the layout array creating the three levels of gears (primary, secondary, tertiary)
        for (i = 0; i < 3; i++) {
        	currGearSet = layout[i];
        	currGearSet.group = this;
        	currGearSet.forEach(function (gear) {
        		gearSettings.x = gear.x;
        		gearSettings.y = gear.y;
        		gearSettings.dir = gear.dir;
        		gearSettings.labelName = gear.labelName;
        		gearSettings.url = gear.url;        		
        		gearSettings.frame = i;

        		currGear = new f.Gear(AppsCategory.game, gearSettings);
        		currGearSet.group.add(currGear);
        		
        	});
        }
    };
	f.GearGroup.prototype = Object.create(Phaser.Group.prototype);
    f.GearGroup.prototype.constructor = f.GearGroup;
    f.GearGroup.prototype.updatePulseClock = function () {
    	if(this.pulseClock === f.PULSE_INTERVAL) {
    		this.pulseClock = 0;
    		f.pulseSignal.dispatch();
    	} else {
    		this.pulseClock++;	
    	}	    
    }
    f.GearGroup.prototype.update = function () {
    	Phaser.Group.prototype.update.call(this);
    	this.gearRotation += f.GEAR_SPEED;
    	this.updatePulseClock();
    };

	AppsCategory.Boot = function () {
		
	};

	AppsCategory.Boot.prototype = {

	    init: function () {
		
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
	    },

	    create: function () {

	        this.state.start('Preloader');
	    }

	};
}());