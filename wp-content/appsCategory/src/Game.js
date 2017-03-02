/*global Phaser, AppsCategory, f, PIXI, parent */

(function () {
	
	"use strict";
	
	AppsCategory.Game = function () {
	    return this;
	};

	AppsCategory.Game.prototype = {

	    create: function () {
			
			var 			
			addSound = function (soundName, loopSound, playNow) {
				// store sounds in array for easy destruction			
				var newSound = AppsCategory.game.add.audio(soundName);
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
			// gears = AppsCategory.game.add.group(),
			gears = new f.GearGroup(AppsCategory.game);
			// testGear = AppsCategory.game.add.sprite(f.HALF_WIDTH, f.HALF_HEIGHT, 'gears', 0);

			// testGear = new f.Gear(AppsCategory.game, f.HALF_WIDTH, f.HALF_HEIGHT, 0),
			// testGear1 = new f.Gear(AppsCategory.game, 860, 795, 1);
			// gears.add(testGear);
			// gears.add(testGear1);

			// f.activeLoop = addSound('activeLoop', true, true);			
			// f.ringTurn = addSound('ringTurn', true);
			// f.loser.volume = 0.4;	
	    },
	    update: function () {
	    }
	};
}());