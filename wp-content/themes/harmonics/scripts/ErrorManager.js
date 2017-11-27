/*global AdManager, apiCall, array, clearTimeout, document, escape, Event, jQuery, HarmonicsSoundManager, localStorage, Promise, setTimeout, testConfig, VTAPI, window, XMLHttpRequest */
var ErrorManager = (function () {

	'use strict';
	
	var dburl,
		currTime,
		today,
		prevErrors,
		additionalErrors,
		logUpdate,		
		logPrefix = 'date_',
		harmonicsLog,
		lastDbErrorUpdate,
		currGame,
		// ref to object that called init
		Controller,

		getLogKeys = function (log) {
			return Object.keys(log).map(function(entryKey){return parseInt(entryKey.replace(logPrefix, ''), 10);}).sort(function(a, b){return a - b;});
		},
		saveLog = function (logData) {
		
			var logKeys = getLogKeys(logData),
				logKey = logPrefix + logKeys[0],
				len,
				i,
				shortLog;

			if(logKeys.length === 1 && logData[logKey].length > 0) {
				// Attempting to save shortened version of log - only one day remaining. Try removing entries
				// This is an array of strings (check that…), oldest first

				// TODO: Test this

				try {
					localStorage.setItem('hlog', JSON.stringify(logData));	
				} catch (e) {					
					saveLog(logData[logKey].splice(0));	
				}				
			} else if(logKeys.length === 0) {
				// We've stripped everything possible and still couldn't update				
				console.error('ErrorManager.saveLog: unable to save log to localStorage');
			} else {
				try {
				    // Replace localStorage log property with our new version
				  	localStorage.setItem('hlog', JSON.stringify(logData));
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
		onNewError = function (newErr) {
			// Handle new error thrown
			additionalErrors.push(newErr);
			console.error(newErr);
		},		
		addRecord = function (_logKey, err, series) {
			 
			var logKey = _logKey || logPrefix + today,	
				errDetail,
				gameName,
				srcStr,
				stack = '',		
				i,
				len;

			if (err) {
				if(err.detail) {							
					// CustomEvent.detail is read only so store in errDetail var
					errDetail = err.detail;

					if(Array.isArray(errDetail)) {
						// This is an array of errors - process each one
						len = errDetail.length;
						for(i = 0; i < len; i++) {
							// recursive call to add all errors
							addRecord(null,{detail: errDetail[i]}, i < len - 1);
						}
						return;
					}
					if(typeof errDetail === 'string') {
						
						// This is a single error string - format for use in log
						if(err.src) {
							srcStr = err.src;
						} else {
							// game errors don't include src property
							srcStr = currGame || 'N/A';
						}
						if(err.stack) {
							stack =  ': ' + err.stack;
						}						
						errDetail = [currTime + ': ' + srcStr + ': ' + errDetail + stack];
					} else {						
						onNewError('ErrorManager.onIputError: expected error detail to be String or Array, saw ' + typeof errDetail);
					}
					if(harmonicsLog && harmonicsLog[logKey]){						
						if(series) { 
							// More errors follow - store these in prevErrors array to be included when all have been processed
							prevErrors.push(errDetail[0]);
						} else {
							// concat with prevErrors if populated								
							logUpdate[logKey] = prevErrors ? harmonicsLog[logKey].concat(prevErrors, errDetail) : harmonicsLog[logKey].concat(errDetail);
						}								
			    	} else {
			    		// If our logKey doesn't exist, this is today's first error - so start a new record
			    		if(series) {
			    			prevErrors.push(errDetail[0]);
			    		} else {
			    			logUpdate[logKey] = prevErrors ? prevErrors.concat(errDetail) : errDetail;
			    		}			    		
			    	}
				} else {
					// error object did not have a 'detail' property
					onNewError('ErrorManager.addRecord: unknown error');						
				}
			} else if(harmonicsLog && harmonicsLog[logKey]){
				logUpdate[logKey] = harmonicsLog[logKey];
			}			
		},
		writeLogToUser = function (writeArgs) {

			// Build request
			var reqStr = dburl + '?t=' + Math.random() + '&reqType=writeLog';

			// Add any new errors to request
			if(writeArgs.additionalErrors.length > 0) {
				reqStr += '&err=' + escape(writeArgs.additionalErrors);
			}
			// Add log if due to write to user - this should be here as that's the only point of this function
			if(writeArgs.logUpdate){
				reqStr += '&logupdate=' + JSON.stringify(writeArgs.logUpdate);
			}
			Controller.apiCall(reqStr).then(function (response) {
				if(response.indexOf('Error') == -1) {
					// All good 
				} else {
					onInputError({detail: 'ErrorManager.writeLogToUser: api call returned an error'});
				}		
			}, function (error) {
				// console.error("Error: ", error);
				_onInputError({detail: error});
			});	
		},
		_onInputError = function (err, game) {

			// err is object with 'detail' property containing string/array of strings
			var daysLogged = 7,
				oneDay = 24*60*60*1000,					
				writeToUser,	
				i,
				len,
				logKeys,
				logKey;

				// Create a new log - we'll populate this then use it replace the old one
				logUpdate = {};
				currTime = Date.now();
				today = Math.floor(currTime/oneDay);
				prevErrors = [];
				additionalErrors = [];
				harmonicsLog = JSON.parse(localStorage.getItem('hlog'));
				logKeys = harmonicsLog ? getLogKeys(harmonicsLog) : [];
				currGame = game;
			
			// We want a max of daysLogged entries 
		    if(logKeys.length >= daysLogged) {
		    	logKeys.splice(0, 1);
		    }

		    len = logKeys.length;
		    // Add exisiting days to logUpdate object 
		    for(i = 0; i < len; i++) {
		    	logKey = logPrefix + logKeys[i];
		    	addRecord(logKey);	    	
		    }
		    // logUpdate is now a spring-cleaned version of the original log. Add the new error
		    addRecord(null, err);

			saveLog(logUpdate);
			
			// Error logged in localStorage. If currGame available, suspend it!
			if(Controller && currGame) {
				// Suspend game and provide error log if due to be written to user profile (this acts as a daily backup in case localStorage is compromised)
				writeToUser = lastDbErrorUpdate ? currTime - parseInt(lastDbErrorUpdate, 10) > oneDay : true;
				Controller.suspendGame({additionalErrors: additionalErrors, logUpdate: writeToUser ? logUpdate : null});		
			} else {
				writeToUser = lastDbErrorUpdate ? currTime - parseInt(lastDbErrorUpdate, 10) > oneDay : true;
				if(writeToUser) {
					writeLogToUser({additionalErrors: additionalErrors, logUpdate: logUpdate});
				}				
			}			
		},
		_init = function (controller) {
			// localStorage.removeItem('hlog');
			Controller = controller;
			lastDbErrorUpdate = document.body.dataset.logupdated;
			dburl = dburl || document.body.dataset.db;
		};
		window.addEventListener('error', function (e) {			
		  var error = e.error,
		  	mssg = error.toString() + ' | ' + error.stack.replace(/\r?\n|\r/g,"~n~");
		  	console.log('mssg: ' + mssg);
		  _onInputError({detail : mssg, src: 'N/A'});
		});

	return {

		// Start Page functions
		init: function (controller) {
			_init(controller);
		},
		onInputError: function (e, game) {
			_onInputError(e, game);
		}
	};
}());