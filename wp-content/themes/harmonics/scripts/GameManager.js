/*global window, array, testConfig, VTAPI, clearTimeout */
var GameManager = (function () {

	'use strict';
	console.log('GameManager');
	var 
	dburl,
	NEXT_GAME_TIMEOUT = 15000,
	GAMES_PER_SESSION = 3,	
	// State is changed when we receive user input or insertScores is called 
	// this inital state is used for testing until we implement user input
	startPageUrl,
	gameList = [],
	//sessionQueue = [],
	prevGameUrl,
	teamRankings = [],
	currGame, // current game's index in gameList
	currGameUrl,
	nextGameTimeout,
	fallbackState = [
		{place: 1, player: 8, ranking: 0},  
		{place: 2, player: 7, ranking: 0},  
		{place: 3, player: 6, ranking: 0}, 
		{place: 4, player: 5, ranking: 0},  
		{place: 5, player: 4, ranking: 0},  
		{place: 6, player: 3, ranking: 0},  
		{place: 7, player: 2, ranking: 0},  
		{place: 8, player: 1, ranking: 0}
	],	
	teamState = [],
	sessionState,
	initialState,
	showResults = false,
	getRandomInt = function (min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	shuffle = function (arr) {
		var j, x, i;
		for (i = arr.length; i; i--) {
			j = Math.floor(Math.random() * i);
			x = arr[i - 1];
			arr[i - 1] = arr[j];
			arr[j] = x;
		}
		return arr;
	},
	startNextGameTimeout = function () {
		nextGameTimeout = setTimeout(_onGameOver, NEXT_GAME_TIMEOUT);
	},
	suspendGame = function (err) {
		// Disable game in processwire API and repopulate the gameList

		/*
			we also want to log the problem here, so let's pass in an errorString parameter which can be used by php fpr
			'&reqType=errMssg&messageText=GameManager.getState: player data unavailable - using fallback state'
		*/
		// apiCall(dburl + '?t=' + Math.random() + '&reqType=suspendGame&gameID=' + currGame.id).then(function (response) {
		apiCall(dburl + '?t=' + Math.random() + '&reqType=suspendGame&gameID=' + currGame.id + '&err=' + escape(err.detail.errors)).then(function (response) {
			if(response.indexOf('Error') == -1) {
				gameList = JSON.parse(response);
				// If response includes an error message, the game will remain in the list. 
				// An email notification has been dispatched so the game can be disabled by the administrator.				
			}		
		}, function (error) {
			console.error("Error: ", error);
		});	
		startNextGameTimeout();
	},
	checkPermission = function (permissionName) {		
		if (typeof testConfig !== 'undefined') {
			return testConfig[permissionName] || false;
		}
		return false;
	},  
	GameManagerException = function (funcName, message) {
	   this.name = funcName;
	   this.message = message;	   
	},
	cloneState = function (cloneSrc) {
		// zeroScores arg is provided when we're resetting players information
	    // so we want all scores set to zero
	    var cloned = [],
	    i,
	    len = cloneSrc.length;

	    for(i = 0; i < len; i++) {
	      cloned[i] = Object.assign({}, cloneSrc[i]);	      
	    }
	    return cloned;
	},
	findWithAttr = function (array, attr, value) {
	  var i,
	  len = array.length;
	  for(i = 0; i < len; i += 1) {
	    if(array[i][attr] === value) {
	      return i;
	    }
	  }
	},
	onInputError = function (err) {
		// Called when data passed to VTAPI.insertScores() fails VTAPI's tests
		// We need to act on this - if, for eg, we have too many players passed to us
		// an error will be thrown - need to catch it and SORT IT OUT!
		// startPage tries to access players that don't exist... so what do we want to happen here?
		// We've got two options - 
		// 1: ignore the scores for this game (probably best and least noticeable)
		// 2: treat it like a time out and clear state/players etc.
		// I think option 2 is a last ditch recovery - it will seem like a crash.

		// Scores malformed - suspend game...
		// we're going to need something to use in place of results

		// In this situation, we won't be getting scores. We may get an onGameOver event
		if(currGame) {
			suspendGame(err);
		}			
	},
	updateState = function (newState) {
		var currPlayer, updatedPlayer, 
		currTeam,
		teamRanking,
		firstResults = teamState.length === 0,
		i, len = newState.length;
		if(newState.length !== sessionState.length) {
			throw new GameManagerException('updateState', 'state array wrong length');	
		}
		for (i = 0; i < len; i++) {
			updatedPlayer = newState[i];
			currPlayer = sessionState[findWithAttr(sessionState, 'place', updatedPlayer.place)];
			if(!currPlayer) {
				throw new GameManagerException('updateState', 'no player at given place');
			} else {
				currPlayer.ranking += updatedPlayer.ranking;
				if(currPlayer.team) {		

					currTeam = teamState[currPlayer.team -1];
					teamRanking = teamRankings[findWithAttr(teamRankings, 'team', currPlayer.team)];

					if(firstResults) {
						if(!currTeam) {
							currTeam = teamState[currPlayer.team -1] = {members: 1, ranking: 0, average: currPlayer.ranking};	
						} else {
							currTeam.members++;	
						}
						if(!teamRanking){
							// Create a ranking record for this team
							teamRanking = {team: currPlayer.team};
							teamRankings.push(teamRanking); 	
						}
					}
					currTeam.ranking += updatedPlayer.ranking;
					currTeam.average = currTeam.ranking / currTeam.members;
					teamRanking.ranking = currTeam.ranking;
					teamRanking.average = currTeam.average;
				}
			}					
		}	
		teamRankings.sort(function (a, b) {
			return a.average - b.average;
		});		
		return {success: true};
	},
	_getGameList = function () {
		return gameList;
	},
	_insertScores = function (newState) {
		// Here - validatedInput isn't used - I believe this would be handled by 
		// vtapi's checks so no need for that here - OR suspendGame call below?
		var validatedInput;
		if(checkPermission('useTestState')) {
			sessionState = VTAPI.getPlayersInformation();
		}
		try {
			return updateState(newState); 
		} catch (e) {
			// Error is passed back to the game via VTAPI	
			if(currGame) {
				suspendGame(e.name + ': ' + e.message);
			}			
			return {success: false, error: e.name + ': ' + e.message};
		}
	},
	_changePlayers = function () {
		sessionState = [];
		initialState = [];
		teamState = [];
	},
	_onGameOverOld = function (e) {
		var currGameURL,
			urlSuffix;

		if(sessionQueue.length > 0){			
			currGame = sessionQueue.pop();
			urlSuffix = currGame.instructions === '1' ? '/instructions' : '/game';
			currGameURL = currGame.url + urlSuffix;
		} else {
			currGame = undefined;
			showResults = true;
			currGameURL = startPageUrl;
		}
		// TODO: Can we use onError to handle 404 in case an incorrect name is added in processwire
		document.getElementById('ifrm').src = currGameURL;
		clearTimeout(nextGameTimeout);
		return {success: true, data: 'Loading next game'};
	},
	_onGameOver = function (e) {
		// TODO: Can we use onError to handle 404 in case an incorrect name is added in processwire
		showResults = true;
		document.getElementById('ifrm').src = document.body.dataset.starturl;
		clearTimeout(nextGameTimeout);
		return {success: true, data: 'Loading next game'};
	},
	_onGameTimeout = function () {
		currGame = undefined;
		showResults = false;
		_changePlayers();
		document.getElementById('ifrm').src = startPageUrl;
		clearTimeout(nextGameTimeout);
		return {success: true, data: 'Loading start page'};
	},
	_getState = function () {
		var iframeElmt = document.getElementById('ifrm'),
		iframeEmpty = iframeElmt && iframeElmt.contentWindow === undefined,
		// startPageLoaded = iframeElmt ? document.getElementById('ifrm').contentWindow.StartPage !== undefined : false;
		startPageLoaded = iframeElmt ? iframeElmt.src.indexOf('startPage') !== -1 : false;
		if(!sessionState && !startPageLoaded && !iframeEmpty) {
			// Use fallback state and dispatch email to alert administrator to problem 
			dburl = dburl || document.body.dataset.db;
			apiCall(dburl + '?t=' + Math.random() + '&reqType=errMssg&messageText=GameManager.getState: player data unavailable - using fallback state');
			sessionState = cloneState(fallbackState);
		}
		return sessionState ? cloneState(sessionState) : [];
	},
	_startSessionOld = function (state) {
		var allGames = gameList.slice(),
		urlSuffix,
		numGames;	

		// TODO: Do we still want game sessions, or are we allowing players to choose games as they go?
		sessionQueue = shuffle(allGames).slice(0, GAMES_PER_SESSION);
		numGames = sessionQueue.length;	
		teamState = [];
		teamRankings = [];
					
		if(numGames < GAMES_PER_SESSION) {
			dburl = dburl || document.body.dataset.db;
			apiCall(dburl + '?t=' + Math.random() + '&reqType=errMssg&messageText=GameManager.startSession: unable to load full set of games');
		}
		currGame = sessionQueue.pop();
		if(state) {
			// Players have just regsitered, save this state in case they play again
			initialState = cloneState(state);
			sessionState = state;	
		} else {
			// Playing again with same players - revert to initial state
			sessionState = cloneState(initialState); 
		}		
		
		// TODO: Might be an idea to include some kind of 'loading' anim
		// http://stackoverflow.com/questions/12136788/show-a-loading-gif-while-iframe-page-content-loads

		urlSuffix = currGame.instructions === '1'  ? '/instructions' : '/game';
		document.getElementById('ifrm').src = currGame.url + urlSuffix;
	},
	_startSession = function (state, gameUrl, showInstructions) {
		if(state) {
			// Players have just regsitered, save this state in case they play again
			initialState = cloneState(state);
			sessionState = state;	
		} else {
			// Playing again with same players - revert to initial state
			sessionState = cloneState(initialState); 
		}	
		if(gameUrl){
			// Store URL in case we play again
			prevGameUrl = gameUrl;
		} else {
			// We're playing again - use prevURL
			gameUrl = prevGameUrl;
		}
		
		// TODO: Might be an idea to include some kind of 'loading' anim
		// http://stackoverflow.com/questions/12136788/show-a-loading-gif-while-iframe-page-content-loads
		currGameUrl = gameUrl;
		gameUrl = showInstructions ? gameUrl + '/instructions' : gameUrl + '/game';		
		document.getElementById('ifrm').src = gameUrl;

	},
	_startGame = function () {
		document.getElementById('ifrm').src = currGameUrl + '/game';
	},
	apiCall = function (url) {

		return new Promise(function(resolve, reject) {
			
			var req = new XMLHttpRequest();
			req.open('GET', url);

			req.onload = function() {
				// This is called even on 404 etc
				// so check the status
				if (req.status === 200) {
					// Resolve the promise with the response text
					resolve(req.response);
				}
				else {
					// Otherwise reject with the status text
					reject(new Error(req.statusText));
				}
			};
			// Handle network errors
			req.onerror = function() {
				reject(new Error("Network Error"));
			};
			// Make the request
			req.send();
		});
	},
	init = function () {
		var parsedData,
		iframe = document.getElementById('ifrm');

		// if(iframe) {
		// 	startPageUrl = iframe.src;
		// }
		dburl = dburl || document.body.dataset.db;
		apiCall(dburl + '?t=' + Math.random() + '&reqType=initGameManager').then(function (response) {
			if(response.indexOf('Err') == -1){
				parsedData = JSON.parse(response);
				gameList = parsedData.games;

				// The gameList is ready, safe to load the start page
				document.getElementById('ifrm').src = document.body.dataset.starturl;
						
				// If response includes an error message, an email notification will have been dispatched
				// so the problem can be investigated by the administrator.

				// TODO: when the first game is loaded make a timer set to about 6 mins(?) - if there's no user input, return to the start page
			}			
		}, function (error) {
			console.error("Error: ", error);
		});		
	};
	window.addEventListener('VTAPIinputError', onInputError, false);
	window.onload = function () {
		init();
	};

	return {
		getGameList: function () {
			return _getGameList();
		},
		getState: function () {
			return _getState();
		},
		getTeamRankings: function () {
			return teamRankings;
		},
		insertScores: function (newState) {
			return _insertScores(newState);
		},
		startSession: function (state, gameURL, showInstructions) {
			return _startSession(state, gameURL, showInstructions);
		},
		startGame: function () {
			return _startGame();
		},
		getResults: function () {			
			return showResults ? _getState() : showResults;
		},
		setResultsMode: function (mode) {
			return showResults = mode;
		},
		changePlayers: function () {
			return _changePlayers()
		},
		onGameOver: function () {
			return _onGameOver();
		},
		onGameTimeout: function () {
			return _onGameTimeout();
		}
	};
}());