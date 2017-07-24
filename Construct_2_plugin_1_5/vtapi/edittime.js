function GetPluginSettings()
{
	return {
		"name":			"VTapi",
		"id":			"VTapi",
		"version":		"1.5",
		"description":	"<Interface for interacting with VT API>",
		"author":		"<Paul Ashby>",
		"help url":		"<https://www.scirra.com/manual/69/plugins>",
		"category":		"Platform specific",
		"type":			"object",
		"rotatable":	false,
		"flags":		pf_singleglobal,
		"dependency": 	"vt-api-1.5.js"
	};
};

////////////////////////////////////////
// Actions
AddAction(0, 0, "Trigger Exit Event For Testing", "Misc", "Trigger Exit Event", "FOR TESTING ONLY, THIS EVENT WILL BE DISPATCHED BY VTAPI IN LIVE ENVIRONMENT: trigger an Exit Event to test that your game is detecting it", "triggerExitEvent");
AddAction(1, 0, "Trigger Pause Event For Testing", "Misc", "Trigger Pause Event", "FOR TESTING ONLY, THIS EVENT WILL BE DISPATCHED BY VTAPI IN LIVE ENVIRONMENT: trigger a Pause Event to test that your game is detecting it", "triggerPauseEvent");

////////////////////////////////////////
// Expressions
AddExpression(0, ef_return_string, "Leet expression", "API", "getPlayersInformation", "Use this data to configure your game - number of players etc");

AddNumberParam("Number of players", "Enter the number of players to use in your test.");
AddExpression(1, ef_return_string, "Leet expression", "API", "setNumPlayers", "FOR TESTING ONLY, HAS NO EFFECT ON LIVE GAME: set number of players - returns updated players information");

AddNumberParam("Number of teams", "Enter the number of teams to use in your test.");
AddExpression(2, ef_return_string, "Leet expression", "API", "setNumTeams", "FOR TESTING ONLY, HAS NO EFFECT ON LIVE GAME: set number of teams - returns updated players information");

AddStringParam("Updated players information", "Player information updated with score from game - you can generate random scores with spoofScores.");
AddExpression(3, ef_return_string, "Leet expression", "API", "insertScores", "Return scores to API");

AddExpression(4, ef_return_string, "Leet expression", "API", "resetPlayersInformation", "FOR TESTING ONLY, HAS NO EFFECT ON LIVE GAME: reset players information to default: 8 players, no teams");

AddExpression(5, ef_return_string, "Leet expression", "API", "spoofScores", "FOR TESTING ONLY, HAS NO EFFECT ON LIVE GAME: sets mock scores with random values");

AddExpression(6, ef_return_string, "Leet expression", "API", "getTeamsInformation", "FOR TESTING ONLY, HAS NO EFFECT ON LIVE GAME: returns number of teams");

AddExpression(7, ef_return_string, "Leet expression", "API", "onGameOver", "When game has completed, free game memory then call this function to notify GameManager that game is ready to shutdown");

AddExpression(8, ef_return_string, "Leet expression", "API", "onGameExit", "When exitGame has been called, free game memory then call this function to notify GameManager that game is ready to shutdown");

ACESDone();

var property_list = [
	new cr.Property(ept_integer, 	"My property",		77,		"An example property.")
	];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called when inserted via Insert Object Dialog for the first time
IDEInstance.prototype.OnInserted = function()
{
}

// Called when double clicked in layout
IDEInstance.prototype.OnDoubleClicked = function()
{
}

// Called after a property has been changed in the properties bar
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}

// For rendered objects to load fonts or textures
IDEInstance.prototype.OnRendererInit = function(renderer)
{
}

// Called to draw self in the editor if a layout object
IDEInstance.prototype.Draw = function(renderer)
{
}

// For rendered objects to release fonts or textures
IDEInstance.prototype.OnRendererReleased = function(renderer)
{
}