function GetPluginSettings()
{
	return {
		"name":			"VTapi",
		"id":			"VTapi",
		"version":		"1.3",
		"description":	"<Interface for interacting with VT API>",
		"author":		"<Paul Ashby>",
		"help url":		"<https://www.scirra.com/manual/69/plugins>",
		"category":		"Platform specific",
		"type":			"object",
		"rotatable":	false,
		"flags":		pf_singleglobal,
		"dependency": "vt-api-1.4.js"
	};
};

////////////////////////////////////////
// Actions
AddAction(0, 0, "Trigger Exit Event For Testing", "Misc", "Trigger Exit Event", "Trigger an Exit Event to test that your game is detecting it", "TriggerExitEvent");
AddAction(1, 0, "Trigger Pause Event For Testing", "Misc", "Trigger Pause Event", "Trigger a Pause Event to test that your game is detecting it", "TriggerPauseEvent");
////////////////////////////////////////
// Expressions
AddExpression(0, ef_return_string, "Leet expression", "API", "GetPlayersInformation", "Get players information");

AddStringParam("Updated players information", "Player information updated with score from game - you can generate random scores with spoofScores.");
AddExpression(3, ef_return_string, "Leet expression", "API", "insertScores", "Return scores to API");

AddExpression(7, ef_return_string, "Leet expression", "API", "onGameOver", "Notify GameManager that game has freed all memory and is ready to shutdown");

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