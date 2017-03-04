/*global Phaser, AppsCategory, f */

(function () {
	
	"use strict";

	var removeTween = function(tween) {
			if (tween) {
				tween.onComplete.removeAll();
				tween.stop();
				tween = null;
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
	    cleanUp = function () {
	    	// remove signals and handlers
			f.pulseSignal.dispose();
			f.assignedTweens.forEach(removeTween);
			destroyOb(f);
	};
	
	AppsCategory.GameOver = function () {

	};

	AppsCategory.GameOver.prototype = {
		
		create: function () {
			var url = f.url;
			cleanUp();
			window.location.href = url;
		}
	};
}());