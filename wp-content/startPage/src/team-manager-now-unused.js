/*global window, array, CustomEvent, testConfig, parent */
var f = f || {};

f.teamManager = (function (VTAPI) {

	'use strict';

	var state, 
	preferredSetUps = [false, false, 0, 0, 0, 1, 1, 2, 2], 
	// getNumTeams = function () {
	// 	// How many teams can we have for curr num players?
	// 	var possTeamSetUps = teamsSetUps[state.length];
	// },
	arrangeTeams = function (_state) {
		var numPlayers = _state.length,
		possTeamSetUps = VTAPI.getTeamSetUps()[numPlayers],
		teamNumbersArray = VTAPI.mapTeamNumbers(possTeamSetUps[preferredSetUps[numPlayers]]);
		return VTAPI.assignTeams(_state, teamNumbersArray);
	},
	_init = function (_state) {
		// TODO: do we want to set up our team model here and return to Game so it can render the view?
		state = arrangeTeams(_state);
	};

	return {
		init: function (state) {
			// TODO: Would it be better if this returned the state with the teams updated?
			// At this point we're just switching into team mode, so we want to assemble a representation of our initial team setup
			_init(state);
		}
	}

}(parent.VTAPI || window.VTAPI || {})); // parent.GameManager for live games, window.GameManager for unit tests, {} for game tests