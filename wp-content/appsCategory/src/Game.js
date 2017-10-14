/*global Phaser, AppsCategory, f, PIXI, parent */

(function () {
	
	"use strict";
	
	AppsCategory.Game = function () {
	    return this;
	};

	AppsCategory.Game.prototype = {

	    create: function () {
			
			var 
			testBttn,			
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
					newSound.play();
				}
				return newSound;
			},
			// gears = AppsCategory.game.add.group(),
			gears = new f.GearGroup(AppsCategory.game);

			f.activeLoop = addSound('activeLoop', true, true);
			f.bump = addSound('bump');
			f.bump.volume = 0.6;
			AppsCategory.game.sound.mute = true;	
	    },
	    update: function () {
	    	if(f.gameOver) {
	    		this.state.start('GameOver');
	    	}
	    }
	};
}());