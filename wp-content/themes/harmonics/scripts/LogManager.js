/*global AdManager, apiCall, array, clearTimeout, document, escape, Event, jQuery, HarmonicsSoundManager, localStorage, Promise, setTimeout, testConfig, VTAPI, window, XMLHttpRequest */
var LogManager = (function () {

	'use strict';
	
	var dburl,
		logView,
		logPrefix = 'date_',
		logTable,
		apiCall = function (url) {

			return new Promise(function(resolve, reject) {
				
				var req = new XMLHttpRequest();
				req.open('GET', url);

				req.onload = function() {
					// This is called even on 404 etc
					// so check the status
					if (req.status === 200) {
						// Resolve the promise with the response text
						resolve(req.response);					}
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
		onlyDigits = function(value) {
			return /^\d+$/.test(value);
		},
		validateEntry = function (entry) {
			// Use default record values when data unavailable
			var record = [ 'Unknown date', 'Unknown game','Unknown function', 'Unknown error'],
				i,
				len = entry.length;
			
			// Check date is a number
			if(onlyDigits(entry[0])) {
				record[0] = new Date(parseInt(entry[0], 10));
			}
			// If remaining elements are strings, they're valid, add to record, else default value remains
			for(i = 1; i < len; i++) {
				if('string' === typeof entry[i]) {
					record[i] = entry[i];
				}
			} 
			return { date: record[0], game: record[1], f: record[2], e: record[3]};
		},
		makeEntry = function (entryData, oddRow, oddDay) {

			// Set class to create alternate stripes between entries and days 
			var entry,
				className = '';

			if(oddRow) {
				className += ' odd';
			}
			if(oddDay) {
				className += ' oddDay';
			}

			// Make table row for given entryData
			entry = "<tr class='" + className + "'>";

			entry += '<td>'+ new Date(entryData.date).toLocaleString() + 
			'</td><td>' + entryData.game + 
			'</td><td>' + entryData.f + 
			'</td><td>' + entryData.e + '</td><tr>';

			return entry;
		},
		buildLog = function (logData, fromLocal) {
			
			var logData = JSON.parse(logData),
				entry,
				days = Object.keys(logData),				
				currDay,
				entryData,
				currDayDate,
				i,
				j,
				out = '<tbody>';

			// Log data is stored as key value pairs - keys are of the form 'date_00000...', values are arrays of error strings
			// each pair represents one day. Traverse days/entries backwards so we show newest first
			
			if(days) {
				for (i = days.length - 1; i >= 0; i--) {

					// Process the entries for each of the days
					currDay = logData[days[i]];

					// Process the error strings for this day
					for (j = currDay.length - 1; j >= 0; j--) {
						entry = currDay[j];

						// Add to log output
						out += makeEntry(validateEntry(entry.split(': ')), j % 2 !== 0, i % 2 !== 0);	
					}
				}	
			}
			// return the HTML for the body of the log table
			return out + '</tbody>';				 				
		},
		updateLogView = function (logData, fromLocal) {
			// render the log table for the given log data
			logTable.insertAdjacentHTML('beforeend', buildLog(logData, fromLocal));
		},
		getLogFromUser = function () {
			var errStr,
				tableContent;
			// hlog not in localStorage – getfrom user page instead 
			apiCall(dburl + '?t=' + Math.random() + '&reqType=initLogManager').then(function (response) {
				if(response.indexOf('Err') == -1){

					// log data retrieved from user profile page - display it and write to localStorage
					updateLogView(response);					
					localStorage.setItem('hlog', response);
				} else {

					// Problem getting log data - display this error instead of log data
					errStr = JSON.parse(response).Error;
					updateLogView('{"date_1":["' + Date.now() + ': LogManager: getLogFromUser: ' + errStr + '"]}');
				}		
			}, function (error) {

				// Log data unavailable
				updateLogView('{"date_1":["' + Date.now() + ': LogManager: getLogFromUser: No log data has been set"]}');
			});
		},
		init = function () {

			var logData,				
				tableContent;
			
			// get db url
			dburl = dburl || document.getElementById('logHead').dataset.db;	

			// get HTML table to we can populate with log data
			logTable = document.getElementById('logView'),

			// get log data from localStorage
			logData = localStorage.getItem('hlog');

			if(logData) {				
				updateLogView(logData, true);
			} else {
				// Nothing has been logged, or localStorage has been compromised - get from user profile page instead
				getLogFromUser();	
			}					
		};

	window.onload = function () {
		init();		
	};

	return {

	};
}());