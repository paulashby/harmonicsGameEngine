/*global AdManager, apiCall, array, clearTimeout, document, escape, Event, jQuery, HarmonicsSoundManager, localStorage, Promise, setTimeout, testConfig, VTAPI, window, XMLHttpRequest */
var GameManager = (function () {

	'use strict';
	
	var
	
	NEXT_GAME_TIMEOUT = 15000,
	pauseEvent = new Event('pause'),	
	exitEvent = new Event('exit'),			
	reteam = false,
	dburl,
	gamesURL,
	homeURL,
	loginTimeoutURL,
	iframeHTML,
	inactivityTimeout,
	gameList = [],
	prevGameUrl,
	teamRankings = [],
	currGame, // current game's id
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
	instructionsShown = [], // Array of game id numbers - these are cleared when players change
	sessionState,	
	// State is changed when we receive user input or insertScores is called 
	// this inital state is used for testing until we implement user input
	initialState,
	showResults = false,
	showDraw = false,
	startNextGameTimeout = function () {
		nextGameTimeout = setTimeout(_onGameOver, NEXT_GAME_TIMEOUT);
	},
	suspendGame = function (err) {
		var problemGameIndex;
		// Disable game and repopulate the gameList

		// we also want to log the problem here, so let's pass in err parameter which can be logged by php
		apiCall(dburl + '?t=' + Math.random() + '&reqType=suspendGame&gameID=' + currGame + '&err=' + escape(err.detail.errors)).then(function (response) {
			if(response.indexOf('Error') == -1) {
				gameList = JSON.parse(response).games;				
			} else {
				// Error – response may not include a useable game list. Stick with current list, but remove the suspended game
				problemGameIndex = gameList.findIndex(function(obj) { return obj['id'] === currGame; });
				gameList.splice(problemGameIndex, 1);
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
		var currPlayer, 
			updatedPlayer, 
			currTeam,
			teamRanking,
			firstResults,
			i,
			len = newState.length;

		// Kill previous team state as we're no longer aggregating
		teamState = [];
		// firstResults = teamState.length === 0;
		firstResults = true;

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
	clearTeams = function () {
		var i, len = initialState.length;
		for(i = 0; i < len; i++) {
			delete initialState[i]['team'];
		}
		sessionState = initialState;
		teamState = [];
	},
	_getGameList = function () {
		return gameList;
	},
	_insertScores = function (newState) {
		if(checkPermission('useTestState')) {
			sessionState = VTAPI.getPlayersInformation();
		}
		try {
			updateState(newState);
			return  {success: true};
		} catch (e) {
			// Error is passed back to the game via VTAPI	
			if(currGame) {
				suspendGame(e.name + ': ' + e.message);
			}			
			return {success: false, error: e.name + ': ' + e.message};
		}
	},
	_changePlayers = function () {
		instructionsShown = [];
		sessionState = [];
		initialState = [];
		teamState = [];
		teamRankings = [];
	},
	_onGameOver = function (exit) {
		// TODO: Can we use onError to handle 404 in case an incorrect name is added on backend?
		var menu = document.getElementById('menuContainer'),
		container;
		if(reteam) {
			clearTeams();
		} else {
			showResults = true;	
		}
		showDraw = !exit;
		container = document.getElementById('iframeContainer');
		container.innerHTML = iframeHTML;
		document.getElementById('ifrm').src = gamesURL;
		clearTimeout(nextGameTimeout);

		// Toggle game-related menu item visibility
		menu.classList.toggle('showGameButtons'); 

		return {success: true, data: 'Loading main menu on assumption that game memory has been freed'};
	},
	_getState = function () {
		var iframeElmt = document.getElementById('ifrm'),
		iframeEmpty = iframeElmt && iframeElmt.contentWindow === undefined,
		startPageLoaded = iframeElmt ? iframeElmt.src.indexOf('startPage') !== -1 : false;
		if(!sessionState && !startPageLoaded && !iframeEmpty) {
			// Use fallback state and dispatch email to alert administrator to problem 
			dburl = dburl || document.body.dataset.db;
			apiCall(dburl + '?t=' + Math.random() + '&reqType=errMssg&messageText=GameManager.getState: player data unavailable - using fallback state');
			sessionState = cloneState(fallbackState);
		}
		return sessionState ? cloneState(sessionState) : [];
	},
	_startSession = function (state, gameUrl, gameID, showInstructions) {

		var replaying = instructionsShown.indexOf(gameID) >= 0,
			container;	 

		if((! sessionState || sessionState.length === 0) && state) {
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
		showDraw = false;
		currGameUrl = gameUrl;
		currGame = gameID;

		if(showInstructions && ! replaying) {
			gameUrl = showInstructions;
			instructionsShown.push(gameID);
		}
		
		// Toggle game-related menu item visibility
		document.getElementById('menuContainer').classList.toggle('showGameButtons');

		container = document.getElementById('iframeContainer');
		container.innerHTML = iframeHTML;
		
		document.getElementById('ifrm').src = gameUrl;
	},
	_startGame = function () {
		var menu = document.getElementById('menuContainer'),
			container;

		// Instructions have just been shown
		container = document.getElementById('iframeContainer');
		container.innerHTML = iframeHTML;
		document.getElementById('ifrm').src = currGameUrl;

		if( ! menu.classList.contains('showGameButtons')) {
			menu.classList.toggle('showGameButtons');	
		}
	},
	_onMenuClick = function (e) {
		var ifrm = document.getElementById('ifrm'),
		menu = document.getElementById('menuContainer'),
		adDiv = document.getElementById('ads'),
		hideMenu = function () {
			if(ifrm.classList.contains('showMenu')) {
				// We're hiding the menu, so focus iframe
				ifrm.focus();				 
				HarmonicsSoundManager.updateVolume();
				// update the ads
				AdManager.cycleAds();
			} else {
				HarmonicsSoundManager.pauseAudio();
			}
			ifrm.classList.toggle('hideMenu');
			ifrm.classList.toggle('showMenu');
			menu.classList.toggle('hideMenu');
			if(adDiv){
				adDiv.classList.toggle('showAds');
				adDiv.classList.toggle('hideAds');
			}
		};
		document.getElementById('bodyElmt').focus();
		if(e.target.dataset.category === 'exit') {
			e.preventDefault();
			if(document.getElementById('menuContainer').classList.contains('showGameButtons')){				
				window.dispatchEvent(exitEvent);
				hideMenu();
			}			
		} else if(e.target.dataset.category === 'teamchange') {
			e.preventDefault();			
			if(document.getElementById('menuContainer').classList.contains('showGameButtons')){
				reteam = true;
				window.dispatchEvent(exitEvent);
				hideMenu();
			}			
		} else if(e.target.dataset.category === 'toggleMenu') {
			hideMenu();
			window.dispatchEvent(pauseEvent);
		}
	},
	_getHomeURL = function () {
		return homeURL;
	},
	_getInactvityTimeout = function () {
		return inactivityTimeout;
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
		logoutLinks = document.getElementsByClassName('logout'),
		templateDirURL = document.body.dataset.templateurl,
		container,
		volume,
		i,
		len;

		HarmonicsSoundManager.init(document.getElementById('volfeedback'));
		volume = HarmonicsSoundManager.getVolume();
		HarmonicsSoundManager.setVolumeSliders(volume);
		 
		iframeHTML = document.getElementById('ifrm').outerHTML;
		gamesURL = document.body.dataset.starturl;		
		homeURL = document.getElementById('ifrm').dataset.servicesurl;		
		loginTimeoutURL = document.getElementById('ifrm').dataset.logintimeouturl;
		inactivityTimeout = document.body.dataset.timeoutduration * 1000;

		// Store homeURL and inactivityTimeout in local storage so we can query it for login page timeout (when user won't be logged in)
		// This will be available from first time machine loads games page until the browser cache is cleared
		localStorage.setItem('homeURL', homeURL);
		localStorage.setItem('loginTimeoutURL', loginTimeoutURL);		
		localStorage.setItem('inactivityTimeout', inactivityTimeout);			

		len = logoutLinks.length;
		for(i = 0; i < len; i++) {
			logoutLinks[i].innerHTML = "<img src='" + templateDirURL + "/css/img/menu_logout.png' alt='logout' data-category='logout'>";
		}

		dburl = dburl || document.body.dataset.db;
		apiCall(dburl + '?t=' + Math.random() + '&reqType=initGameManager').then(function (response) {
			if(response.indexOf('Err') == -1){
				parsedData = JSON.parse(response);
				gameList = parsedData.games;				

				// The gameList is ready, safe to load the start page
				container = document.getElementById('iframeContainer');
				container.innerHTML = iframeHTML;
				document.getElementById('ifrm').src = gamesURL;

				// Add menu event listeners
				document.getElementById('topBttn').addEventListener('click', GameManager.onMenuClick);
				document.getElementById('bottomBttn').addEventListener('click', GameManager.onMenuClick);
				document.getElementById('menuContainer').addEventListener('click', GameManager.onMenuClick);

				// If response includes an error message, an email notification will have been dispatched
				// so the problem can be investigated by the administrator.
			}			
		}, function (error) {
			console.error("Error: ", error);
		});	
	};
	window.addEventListener('VTAPIinputError', onInputError, false);
	window.onload = function () {
		init();
		if(window.AdManager){
			AdManager.init();			
		}		
	};

	return {

		// Start Page functions
		onMenuClick: function (e) {
			return _onMenuClick(e);
		},
		getGameList: function () {
			return _getGameList();
		},		
		getTeamRankings: function () {
			return teamRankings;
		},		
		startSession: function (state, gameURL, gameID, showInstructions) {
			return _startSession(state, gameURL, gameID, showInstructions);
		},		
		getResults: function () {		
			return showResults ? _getState() : showResults;
		},
		getDrawVisibility: function () {
			return showDraw;
		},
		getReteamSettings: function () {
			var stateVal = _getState(),
			reteamVal = reteam;

			reteam = false;
			sessionState = [];
			initialState = [];

			return {
				reteam: reteamVal,
				state: stateVal
			};
		},
		setResultsMode: function (mode) {
			return showResults = mode;
		},
		changePlayers: function () {
			return _changePlayers();
		},

		// VTAPI functions
		getState: function () {
			return _getState();
		},
		insertScores: function (newState) {
			return _insertScores(newState);
		},
		startGame: function () {
			return _startGame();
		},
		onGameOver: function (exit) {
			return _onGameOver(exit);
		},		
		getHomeURL: function () {
			return _getHomeURL();
		},
		getInactivityTimeout: function () {
			return _getInactvityTimeout();
		}
	};
}());