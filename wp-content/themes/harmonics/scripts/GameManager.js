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
	logPrefix = 'date_',
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
				onInputError({detail: 'suspendGame: api call returned an error'});
			}		
		}, function (error) {
			console.error("Error: ", error);
			onInputError({detail: error});
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
	saveLog = function (logData) {
		// This is wrong - logData is an object!
		var logKeys = getLogKeys(logData),
			len,
			i,
			shortLog;
		if(logKeys.length === 0) {
			// We've stripped everything possible and still couldn't update
			// TODO: We could look at shortening the only entry when length is 1
			console.error('unable to save log to localStorage');
		} else {
			try {
			    // Replace localStorage log property with our new version
			  	localStorage.setItem('hlog', JSON.stringify(logData));
			  	console.log(JSON.parse(localStorage.getItem('hlog')));
			} catch (e) {
				// not enough space - remove oldest record 				
				len = logKeys.length;	
				if(len > 1) {
					shortLog = {};    
				    for(i = 1; i < len; i++) {
				    	logKey = logPrefix + logKeys[i];
				    	shortLog[logKey] = logData[logKey];   	
				    }
				} 
				saveLog(shortLog);   
			}
		}		
	},
	getLogKeys = function (log) {
		return Object.keys(log).map(function(entryKey){return parseInt(entryKey.replace(logPrefix, ''), 10)}).sort(function(a, b){return a - b;});
	},
	onInputError = function (err) {

		// TODO: We're checking for today's entries not by day, but by millisecond, so when we test to see if there's an entry for today, we're actually checking if there's an entry for this millisecond. Need to refactor all the date refs

		// err is string or array of strings
		var harmonicsLog = JSON.parse(localStorage.getItem('hlog')),
			logKeys = getLogKeys(harmonicsLog),
			oneWeek = 7*24*60*60*1000, // Days*hours*minutes*seconds*milliseconds
			oneDay = 24*60*60*1000,
			daysLogged = 7,
			// newDay = false,
			isToday = function (date) {
				return Math.round(date/oneDay) === Math.round(Date.now());
			},
			expired = function (entryKey) {
				var entryAge = Date.now() - entryKey;				
				return entryAge > oneWeek;
			},
			addRecord = function (logKey, err) {

				if (err && typeof err.detail === 'string') {
					// Convert to array
					err.detail = [err.detail];
				}				

				if(harmonicsLog[logKey]){
					// If err arg is provided, we're adding a new error
		    		logUpdate[logKey] = err ? harmonicsLog[logKey].concat(err.detail) : harmonicsLog[logKey];	
		    	} else {
		    		// If our logKey doesn't exist, this is today's first error - so start a new record
		    		logUpdate[logKey] = err.detail;
		    	}
			},
			i,
			len,
			logKey,
			// Create a new log - we'll populate this then use it replace the old one
			logUpdate = {};
		
		// If earliest log is over a week old, remove it - we only want seven day's worth	    
	    if(logKeys.length >= daysLogged && expired(logKeys[0])) {
	    	logKeys.splice(0, 1);
	    }

	    len = logKeys.length;
	    // Go through exisiting keys 
	    for(i = 0; i < len; i++) {
	    	logKey = logPrefix + logKeys[i];

	    	// Today's date is a special case
	    	// if(i === len - 1 && isToday(logKeys[i])) {
	    	// 	newDay = true;
	    	// 	addRecord(logKey);	
	    	// }
	    	// else {
	    		addRecord(logKey);
	    	// }	    	
	    }
	    // Add the new error
	    addRecord(logPrefix + Date.now(), err);

		saveLog(logUpdate);
		
		// Error logged in localStorage. Suspend problem game!
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
		firstResults = true;

		if(newState.length !== sessionState.length) {
			// throw new GameManagerException('updateState', 'state array wrong length');
			onInputError({detail: 'updateState: state array wrong length'});	
		}
		for (i = 0; i < len; i++) {
			updatedPlayer = newState[i];
			currPlayer = sessionState[findWithAttr(sessionState, 'place', updatedPlayer.place)];
			if(!currPlayer) {
				// throw new GameManagerException('updateState', 'no player at given place');
				onInputError({detail: 'updateState: no player at given place'});
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
				onInputError({detail: e.name + ': ' + e.message});
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
			onInputError({detail: error});
		});	
	};
	window.addEventListener('VTAPIinputError', onInputError, false);
	window.onload = function () {
		// Need to reset the logo to check - also, add only 7 entries, with the first over a week old
		// var myLog = {
		// 	'date_1510612315385': ['error 1'],
		// 	'date_1510785311685': ['error 2', 'error 3'],
		// 	'date_1510785311684': ['error 4', 'error 5'],
		// 	'date_1510785311683': ['error 6', 'error 7'],
		// 	'date_1510785311682': ['error 8', 'error 9'],
		// 	'date_1510785311681': ['error 10', 'error 11'],
		// 	'date_1510785311680': ['error 12', 'error 13','error 14', 'error 15']
		// };
		// localStorage.setItem('hlog', JSON.stringify(myLog));
		// console.log(JSON.parse(localStorage.getItem('hlog')));
		onInputError({detail: 'My error'});
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