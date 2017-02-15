/*global window, array, CustomEvent, testConfig, parent, top */
var VTAPI = (function (GameManager) {

	'use strict';

  var
  pauseEvent = new Event('pause'),
  exitEvent = new Event('exit'),
  testing = window.frameElement === null,
  dispatchInputError = function (errDetails) {
    var inputErrorEvent = new CustomEvent("VTAPIinputError", {
      detail: {
        errors: errDetails
      }
    });
    window.top.dispatchEvent(inputErrorEvent);
  },
  _cloneState = function (cloneSrc) {
    var cloned = [],
    i,
    len = cloneSrc.length;

    for(i = 0; i < len; i++) {
      cloned[i] = Object.assign({}, cloneSrc[i]);      
    }
    return cloned;
  }, 
  teams = [],
  defaultState = [
		{place: 1, player: 8, ranking: 0},  
		{place: 2, player: 7, ranking: 0},  
		{place: 3, player: 6, ranking: 0}, 
		{place: 4, player: 5, ranking: 0},  
		{place: 5, player: 4, ranking: 0},  
		{place: 6, player: 3, ranking: 0},  
		{place: 7, player: 2, ranking: 0},  
		{place: 8, player: 1, ranking: 0}
	],
  testState = _cloneState(defaultState), // integration testing
  sessionState = testing ? [] : GameManager.getState(), // live games
  // currState = sessionState, 
  currState = testing ? testState : sessionState,
  findWithAttr = function (array, attr, value) {
    var i,
    len = array.length;
    for(i = 0; i < len; i += 1) {
      if(array[i][attr] === value) {
        return i;
      }
    }
  },
  _getNumTeams = function (state) {
    var i,
    len,
    numTeams = 0;

    len = state.length;
    for(i = 0; i < len; i++) {
      if(state[i].team === false) {
        // No teams - we're done
        return 0;
      }
      numTeams = Math.max(numTeams, state[i].team);
    }
    return numTeams;     
  },
  teamSetUps = [    
    // Arranged by number of players
    // Is there really any point in having teams of 1?
    [false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false],
    [[1, 1]],
    [[2, 1], [1, 1, 1]],
    [[2, 2], [2, 1, 1], [1, 1, 1, 1]],
    [[3, 2], [2, 2, 1], [2, 1, 1, 1]],
    [[3, 3], [2, 2, 2], [2, 2, 1, 1]],
    [[4, 3], [3, 2, 2], [2, 2, 2, 1]],
    [[4, 4], [3, 3, 2], [2, 2, 2, 2]]
  ],  
  shuffle = function (array) {
    var i,
    j,
    temp;
    for (i = array.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  },
  removeElmts = function (elmtArr, maxElmts, numElmts) {
    elmtArr.splice(Math.floor(Math.random() * maxElmts), 1);
    return elmtArr.length > numElmts ? removeElmts(elmtArr, maxElmts, numElmts) : elmtArr;
  },
  useTestState = function () {
    var useTS;
    if(typeof testConfig !== 'undefined' && testConfig.useTestState !== undefined){
      useTS = testConfig.useTestState;
    } else {
      useTS = testing;
    }
    return useTS;
  },
  _getPlayersInformation = function () {
    // return state with scores zeroed (2nd arg of _cloneState)
    if(useTestState()) { 
      return _cloneState(testState, true); }
    // return _cloneState(sessionState, true);
    sessionState = GameManager.getState();
    return sessionState;
  },
  _insertScores = function (rankingArray) {
    // Returns object with success and data properties for testing.
    // Also dispatches a scoreSubmission or inputError event to GameManager
    // for use in live games
    var currNumTeams,
    i, len,
    unexpectedInput,
    inputErrors = [],
    checkInput = function () {
      // return array of errors or false
      var propertyErrors = (function () {
        var requiredProps = [['place', 'number'], ['ranking', 'number']],
        i,
        j,
        len = rankingArray.length, 
        jlen = requiredProps.length,
        messages = [],
        currEl,
        currJel;

        for (i = 0; i < len; i++) {
          currEl = rankingArray[i];
          for(j = 0; j < jlen; j++) {
            currJel = requiredProps[j];
            if (currEl.hasOwnProperty(currJel[0])) {
              if(typeof currEl[currJel[0]] !== currJel[1]){
                messages.push('insertScores: ' + currJel[0] + ' property should be of type ' + currJel[1]);
              }
            } else {
              messages.push('insertScores: each object must include a \'' + currJel[0] + '\' property of type ' + currJel[1]);
            }
          }
          if(messages.length > 0) {
            break;
          }
        }          
        return messages.length > 0 ? messages.join(', ') : false;
      }());      
      
      if(!Array.isArray(rankingArray)) {
        inputErrors.push('insertScores: expected array, saw ' + typeof rankingArray);
      }
      if(rankingArray.length !== currState.length) {
        inputErrors.push('insertScores: wrong number of players');
        alert('GameManager expected ' + currState.length + ' players. Game returned ' + rankingArray.length + ' players');
      } 
      if(propertyErrors){
        inputErrors.push(propertyErrors);
      }

      return inputErrors.length > 0 ? inputErrors : false;
    },
    resetTeams = function () {
      var i, len = currNumTeams;
      teams = [null];
      for (i = 1; i < len; i++){
        teams.push({ranking: 0});
      }
    },
    currPlayer,
    currRanking, 
    prevRanking,
    insertedPlayer;

    if(rankingArray === undefined) {
      dispatchInputError('insertScores: expected array, saw undefined');
    } else {      
      unexpectedInput = checkInput();
      if(unexpectedInput) {
        // Pass errors to GameManager for logging - scores won't be aggregated
        dispatchInputError(inputErrors);

        // Return errors to testing environment
        return {success: false, error: inputErrors.join(', ')};      
      } 
      // teams.length - 1 as index 0 is null - this is so we can use actual team numbers
      if(testing && (teams.length - 1 !== currNumTeams)){
        resetTeams();
      }
      len = rankingArray.length;

      for(i = 0; i < len; i++) {      
        insertedPlayer = rankingArray[i];
        currPlayer = currState[findWithAttr(currState, 'place', insertedPlayer.place)];
        prevRanking = currPlayer.ranking || 0;
        currRanking = insertedPlayer.ranking;                 
        currPlayer.ranking = currRanking + prevRanking;                                
      }
      if(testing) {        
        return {success: true};
      }
      return GameManager.insertScores(rankingArray);
    }
  },
  _startGame = function () {
    // Instructions have just been shown
    parent.GameManager.startGame();
  },
  _registerGame = function (game) {
    parent.GameManager.registerGame(game);
  },
  _mapTeamNumbers = function (setUp) {
    var teamNum = 1,
    teamNumbersArray = [],
    i, len = setUp.length;
    for(i = 0; i < len; i++) {
      // populate array with team number for each player
      while (setUp[i] > 0) {
        teamNumbersArray.push(teamNum);              
        setUp[i]--;
      }
      teamNum++;
    }
    // randomise so teams aren't consecutive blocks of players
    return shuffle(teamNumbersArray);
  },
  _assignTeams = function (state, teamNumsArr) {
    // Assign each player a team number
    var i, len = state.length;
    for(i = 0; i < len; i++) {
      state[i].team = teamNumsArr[i];
    }
    return state;
  }; 
	
	return {
    registerGame: function (game) {
      return _registerGame();
    },
    getTeamSetUps: function () {
      return teamSetUps;
    },
    mapTeamNumbers: function (setUp) {
      return _mapTeamNumbers(setUp);
    },
    assignTeams: function (state, teamNumsArr) {
      return _assignTeams(state, teamNumsArr);
    },
    getPlayersInformation: function () { 
      return _getPlayersInformation();
		},
    getNumTeams: function (state) {
      return _getNumTeams(state);
    },
    insertScores: function (rankingArray) {

      return _insertScores(rankingArray);
    },
    startGame: function () {
      _startGame();
    },
    dispatchPauseEvent: function () {
      window.dispatchEvent(pauseEvent);
    },
    dispatchExitEvent: function () {
      window.dispatchEvent(exitEvent);
    },
    onGameOver: function (exit) { 
      if(exit){
        return GameManager.onGameOver(true);
      } 
      return testing ? {success: true, data: 'Loading next game'} : GameManager.onGameOver();      
    },
    onGameTimeout: function () {
      return testing ? {success: true, data: 'loading start page'} : GameManager.onGameTimeout();
    },
    cloneState: function (state) {
      return _cloneState(state);
    }
	};
}(parent.GameManager || window.GameManager || {})); // parent.GameManager for live games, window.GameManager for unit tests, {} for game tests