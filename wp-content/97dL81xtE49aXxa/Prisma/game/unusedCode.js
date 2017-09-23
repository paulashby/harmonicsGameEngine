
headingUp = function (ang) {
	// returns true if sprite is moving towards top of screen
	return ang > -90 && ang <= 90;						
},

// Show the whole prism grid				
for(i = 0; i < f.TOTAL_PRISM_PLACES; i++){
	prismSettings = getPrismSettings(i);
	f.prismGroup.add(f.getPrism(prismSettings.position, prismSettings.angle));
}

addRay = function () {
	var rayPos = new Phaser.Point(f.HALF_WIDTH, f.HALF_HEIGHT + Math.floor(f.gameWidth/20) + f.rayWH),
	ray = f.getRay(rayPos);	
	ray.init();				
	homeZoneGroup.add(ray);
	ray.setMaxH();
},

this.shuttleSpeed = Phaser.Math.clamp(this.height/3, 50, 600);

/*
	Notes on SpriteManager
	
	The homeZones group has a spriteManager

	We intialise spriteManager with a container to hold the created sprites.
	The default container is the homeZones group 

	onTurn() will be called by:
	player input for players

	collision detection on testPlayers

	onTurn() will request a new sprite from the spriteManager (sm)

	sm will:

	respond to onTurn() requests by:

	* preparing a sprite either new or recycled

	* getting the coordinates for the new sprite

	* getting the angle for the new sprite

	* adding the new sprite to the sprite container
*/


// version used before centring rainbow anchor
this.isCorner = function (bl, br, corner) {
	
	/* 
		may have only one of bl/br
		
		If so, we need to compare this to the given corner
	*/
	var isC = false;
	if((bl && bl.distance(corner) < f.cornerTolerance) || (br && br.distance(corner) < f.cornerTolerance)){
		isC = true;
	}
	return isC;
};





// to get middle of rainbow whose anchor was set to centre
this.getBaseMidPt = function (wrldX, wrldY, wrldRot) {		
	return new Phaser.Point(wrldX + (Math.cos(wrldRot) * (this.width/2)), wrldY + (Math.sin(wrldRot) * (this.width/2)));			
};

getQuadrant = function (angDegrees) {
	// Quadrants are 
	// 0: -180 to -91
	// 1: -90 to -1
	// 2: 0 to 89
	// 3: 90 to 180
	/*
		1 | 2
		------
		0 | 3
	*/
	
	// map from 0 - 180 so we can determine which quadrant we're in
	var degAng = angDegrees + 180;
	
	// divide by 90 to find quadrant				
	return Math.floor(degAng/90);
},

// checking boundsLines
// DEBUG
for(i = 0; i < f.boundsLines.length; i++){
	var randomCol = '0x'+Math.floor(Math.random()*16777215).toString(16);
	
	gfx = Prisma.game.add.graphics(0, 0);
	gfx.lineStyle(20, randomCol, 1);
	gfx.moveTo(f.boundsLines[i].start.x, f.boundsLines[i].start.y);
	gfx.lineTo(f.boundsLines[i].end.x, f.boundsLines[i].end.y);
}