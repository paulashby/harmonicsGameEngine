/*global array, clearTimeout, CustomEvent, document, Event, f, parent, setTimeout, testConfig, top, window */


var VTAPI = (function (GameManager) {

	'use strict';

  var MAX_PLAYERS = 8,
  MIN_TEAMS = 2,
  MAX_TEAMS = 4,
  pauseEvent = new Event('pause'),
  exitEvent = new Event('exit'),
  testing = window.frameElement === null,
  INACTIVITY_PERIOD = testing ? 90000 : GameManager.getInactivityTimeout(),
  inactivityTimeout,
  onTimeout = function () {
    top.location.href = testing ? '.' : GameManager.getHomeURL();
  },
  resetTimer = function (e) {
    if(e) {
      e.preventDefault();
    }
    clearTimeout(inactivityTimeout);    
    inactivityTimeout = setTimeout(onTimeout, INACTIVITY_PERIOD);
  },
  dispatchInputError = function (errDetails) {
    // TODO: Need event listener to handle error events - either in GameManager or StartPage
    var inputErrorEvent = new CustomEvent("VTAPIinputError", {
      detail: errDetails
    });
    // var inputErrorEvent = new CustomEvent("VTAPIinputError", {
    //   detail: {
    //     errors: errDetails
    //   }
    // });
    window.top.dispatchEvent(inputErrorEvent);
  },
  checkPermission = function (permissionName) {
    if (typeof testConfig !== 'undefined') {
      return testConfig[permissionName] || false;
    }
    return testing;
  },
  _cloneState = function (cloneSrc, zeroScores) {
    // zeroScores arg is provided when we're resetting players information
    // so we want all scores set to zero
    var cloned = [],
    i,
    len = cloneSrc.length;

    for(i = 0; i < len; i++) {
      cloned[i] = Object.assign({}, cloneSrc[i]);
      if(zeroScores){
        cloned[i].score = 0;
      }      
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
  _getNumTeams = function (state) { // USED INTERNALLY
    var i,
    len,
    numTeams = 0;

    len = state.length;
    for(i = 0; i < len; i++) {
      if(state[i].team === false || state[i].team === undefined) {
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
  _getPlayersInformation = function () { // USED BY C2
    // return state with scores zeroed (2nd arg of _cloneState)
    if(useTestState()) { 
      return _cloneState(testState, true); }
    // return _cloneState(sessionState, true);
    sessionState = GameManager.getState();
    return sessionState;
  },
  _spoofScores = function () {
    // Generates a set of scores for testing. These 
    // are not saved to a state here, but get passed
    // straight to the testing environment to be 
    // returned via insertScores
    var i,  
    setSpoofState = function () {
      if(checkPermission('useTestState')){
        return _cloneState(testState);
      }
      return sessionState.length > 0 ? _cloneState(sessionState) : _cloneState(testState);
    }, 
    spoofState = setSpoofState(),
    len = spoofState.length,
    randScore;
    for(i = 0; i < len; i++) {
      randScore = 5 * (Math.floor(Math.random() * 10) + 1);      
      spoofState[i].score = randScore;
    }
    return spoofState;
  },
  _insertScores = function (rankingArray) {
    // Returns object with success and data properties for testing.
    // Also dispatches a scoreSubmission or inputError event to GameManager
    // for use in live games
    var currNumTeams,
    i, len,
    unexpectedInput,
    checkInput = function () {      
      // return array of errors or false
      var hasPropertyValue = function (element) {
          return element === this;
        },
        hasPlace = function (element) {
          // element is null for empty places
          if(element) {
            return element.place === this;
          }
          return false;
        },
        getPropertyErrors = function () {
        var requiredProps = [['place', 'number'], ['ranking', 'number']],
        i,
        j,
        len = rankingArray.length, 
        jlen = requiredProps.length,        
        messages = [],
        places = [],
        propTaken,
        validPlace,
        currEl,
        currElData, 
        currJel,
        elType;

        for (i = 0; i < len; i++) {
          currEl = rankingArray[i];
          for(j = 0; j < jlen; j++) {
            currJel = requiredProps[j];            
            if (currEl.hasOwnProperty(currJel[0])) {
              currElData = currEl[currJel[0]];
              elType = typeof currElData;
              if(elType !== currJel[1]){
                console.error('VTAPI.getPropertyErrors: ' + currJel[0] + ' – expected ' + currJel[1] + ', saw ' + elType);
                messages.push('insertScores: ' + currJel[0] + ' property should be of type ' + currJel[1]);
              }
              // Check currElData is in range - 
              if(currJel[0] === 'place') {
                // check place
                propTaken = places.findIndex(hasPropertyValue, currElData); 
                if( propTaken < 0) {
                  // Place not taken - check it's a valid place
                  validPlace = f.players.findIndex(hasPlace, currElData);
                  if(validPlace !== -1) {
                    // All good - add to places array so subsequent player's places can be checked
                    places.push(currElData); 
                  } else {
                    console.error('VTAPI.insertScores: invalid place, no player at given position');
                    messages.push('insertScores: invalid place, no player at given position');  
                  }                                    
                } else {
                   console.error('VTAPI.insertScores: place taken by more than one player');
                   messages.push('insertScores: place taken by more than one player');
                }
              } else {
                // check ranking
                if(currElData < 1 || currElData > f.numPlayers) {
                  console.error('VTAPI.insertScores: player \'' + currJel[0] + '\' must be between 1 and ' + f.numPlayers);
                  messages.push('insertScores:  player \'' + currJel[0] + '\' must be between 1 and ' + f.numPlayers);
                }
              }
              
            } else {
              console.error('VTAPI.insertScores: each object must include a \'' + currJel[0] + '\' property of type ' + currJel[1]);
              messages.push('insertScores: each object must include a \'' + currJel[0] + '\' property of type ' + currJel[1]);
            }
          }
          if(messages.length > 0) {
            break;
          }
        }          
        // return messages.length > 0 ? messages.join(', ') : false;
        return messages.length > 0 ? messages : false;
      };      
      // Check data type       
      if(!Array.isArray(rankingArray)) {
        console.error('VTAPI.insertScores:  expected array, saw ' + typeof rankingArray);
        return ['insertScores: expected array, saw ' + typeof rankingArray];
      }
      // Check number of players
      if(rankingArray.length !== currState.length) {
        console.error('VTAPI expected ' + currState.length + ' players. Game returned ' + rankingArray.length + ' players');
        return ['insertScores: wrong number of players'];        
      }
      // Check properties
      return getPropertyErrors();
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
      dispatchInputError('VTAPI.insertScores: expected array, saw undefined');
    } else {      
      unexpectedInput = checkInput();
      if(unexpectedInput) {
        // Pass errors to GameManager for logging - scores won't be aggregated
        dispatchInputError(unexpectedInput);

        // Return errors to testing environment
        return {success: false, error: unexpectedInput.join(', ')};      
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
  _setNumTeams = function (n) {

    var numPlayers = testState.length,
    teamNumbersArray = [],
    i,
    len,       
    removingTeams = (function () {
      if(n < MIN_TEAMS || n > MAX_TEAMS) {
        return n === 0 ? true : 'VTAPI.setNumTeams: number of teams must be between ' + MIN_TEAMS + ' and ' + MAX_TEAMS + '.';
      }
      if (n > numPlayers) {
        return 'VTAPI.setNumTeams: number of teams must at least equal number of players.';
      }
      return false;
    }()),
    getBestMatch = function () {
      // Get closest team configuration to the last one requested
      // for the current number of players

      // get array of possible team set ups for current number of players
      var possibleSetUps = teamSetUps.slice()[numPlayers],        
      diff,
      closestPoss,
      selectedIndex;

      len = possibleSetUps.length;
      for (i = 0; i < len; i++) {
        // Compare num teams in this set up to required num teams
        diff = Math.abs(possibleSetUps[i].length - n);
        if(diff === 0) { 
          // Required num teams matched - we're done
          selectedIndex = i;
          break; 
        }
        if(!closestPoss || diff < closestPoss) {
          // Close, but keep trying
          closestPoss = diff;
          selectedIndex = i;
        }          
      }
      return possibleSetUps[selectedIndex].slice();
    };
    if(checkPermission('allowTeamChange')) {
      if(typeof n !== 'number') {
        console.error('VTAPI.setNumPlayers: expected number, saw ' + typeof n);
      } else {
        if(removingTeams) {
          if(typeof removingTeams === 'string') {
            return _cloneState(testState);
          } 
          teamNumbersArray = teamSetUps[0].slice();                    
        } else {
          // Prepare an array of randomised team numbers
         teamNumbersArray = _mapTeamNumbers(getBestMatch());
        } 
       // assign randomised team numbers to players in the current state
        testState = _assignTeams(testState, teamNumbersArray);
        // Reset teams array - this is used only to track team scores. 
        // Team membership is available from current state
        teams = [];
        // Set the scores in the current state back to zero - 
        // changing num teams means we're setting up a new test
        testState = _cloneState(testState, true);
        currState = testState;
      }      
      return _cloneState(testState);
    }
    console.error('VTAPI.setNumTeams: unable to change number of teams in live environment');      
  },
  _setNumPlayers = function (n) {

    var updateTestState = function () {

      // Start with a full complement
      testState = _cloneState(defaultState);

      // Remove what we don't need
      if(testState.length !== n) {              
        testState = removeElmts(_cloneState(defaultState), MAX_PLAYERS, n);
      }
      currState = testState;
    },

    // We'll be matching number of teams as closely as possible
    numTeams = _getNumTeams(testState);    

    if(checkPermission('allowPlayerChange')){
      if(typeof n !== 'number') {
        console.error('VTAPI.setNumPlayers: expected number, saw ' + typeof n);
      }
      if(n > 1 && n <= MAX_PLAYERS) {
        updateTestState(); 
      } else {
        console.error('VTAPI.setNumPlayers: number of players must be between 2 and ' + MAX_PLAYERS + '. Returning player info unchanged');
      } 
      // Match number of teams to previous configuration as closely as possible and return new state         
      return numTeams > 0 ? _setNumTeams(numTeams) : testState;
    }

    console.error('VTAPI.setNumPlayers: unable to change number of players in live environment');              
  },
  _resetPlayersInformation = function () {

    // Revert to default test configuration
    if(useTestState){
      testState = _cloneState(defaultState);
      currState = _cloneState(defaultState);
      teams = [];
      return _cloneState(testState);
    }
    console.error('VTAPI.resetPlayersInformation: unable to reset players information in live environment');
  },
  _startGame = function () {
    // Instructions have just been shown
    parent.GameManager.startGame();
  },
  _mapTeamNumbers = function (setUp) { // REQUIRED INTERNALLY
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
  resetTimer();
  document.addEventListener("click", resetTimer, false);
  document.addEventListener("touchend", resetTimer, false);

	
	return { 

    // Start Page functions
    mapTeamNumbers: function (setUp) {
      return _mapTeamNumbers(setUp);
    }, 
    cloneState: function (state) {
      return _cloneState(state);
    }, 
    getTeamSetUps: function () {
      return teamSetUps;
    },
    assignTeams: function (state, teamNumsArr) {
      return _assignTeams(state, teamNumsArr);
    },  

    // Game functions
    startGame: function () {
      _startGame();
    },
    getPlayersInformation: function () {
      return _getPlayersInformation();
    },    
    insertScores: function (rankingArray) {
      return _insertScores(rankingArray);
    },
    onGameOver: function (exit) {
      if(exit){
        return testing ? {success: true, data: 'Game will now exit. Please note: game memory should be freed before calling this function.'} : GameManager.onGameOver(true);
      }
      return testing ? {success: true, data: 'Results page will now load. Please note: game memory should be freed before calling this function.'} : GameManager.onGameOver();      
    },

    // Construct 2 functions
    spoofScores: function () {
      return _spoofScores();
    },
    setNumPlayers: function (n) {
      return _setNumPlayers(n);
    },
    resetPlayersInformation: function () {
      return _resetPlayersInformation();
    },
    setNumTeams: function (n) {
      return _setNumTeams(n);
    },
    getTeamsInformation: function () {      
      var n = _getNumTeams(testState);
      return 'There are currently ' + n + ' teams';   
    },
    dispatchPauseEvent: function () {
      window.dispatchEvent(pauseEvent);
    },
    dispatchExitEvent: function () {
      window.dispatchEvent(exitEvent);
    }
	};
}(parent.GameManager || window.GameManager || {})); // parent.GameManager for live games, window.GameManager for unit tests, {} for game tests
