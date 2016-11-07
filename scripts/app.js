
(function() {
  'use strict';

  var app = {
  	travellingFrom: {
  		isSelected: false,
  		stationName: "",
  		stationId: "",
  	},
  	travellingTo: {
  		isSelected: false,
  		stationName: "",
  		stationId: "",
  	},
  };

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /** 
   * Form event listener
   */ 
  document.getElementById('form').addEventListener('submit', function(event) {
  	event.preventDefault();

  	if (app.checkIfStationsSelected() == false) {
  		return;
  	} 

  	app.getJourneyDetails();	
  });

  /** 
   * Event listeners for input fields
   */ 
  var inputFields = document.querySelectorAll('.input-field');

  var getSuggestionsOnInput = function() {
  	var formGroup = this.parentNode;
  	var suggestionsBox = formGroup.querySelectorAll('.suggestions')[0];
  	var textInput = this;
  	var textInputValue = this.value;
  	var direction = this.getAttribute('id');

  	if (app[direction].isSelected) view.resetInputDefault(formGroup);
  	app.clearSelectedStation(direction);

  	// If input is empty, clear suggestions box and return
  	if (!textInputValue || textInputValue == "") {
  		view.clearSuggestionBox(suggestionsBox);
  		
  		return;
  	}

    var url = 'https://api.tfl.gov.uk/Stoppoint/search/' + textInputValue + '?modes=tube&maxResults=15';

    

    // Get suggestions
    $.get(url, function(response) {
        var li = document.createElement('li');
	    	li.innerHTML = "Loading";
	    suggestionsBox.appendChild(li);
    }).done(function(response) {
      	// Clear old suggestions from suggestions box
      	while (suggestionsBox.firstChild) {
		  suggestionsBox.removeChild(suggestionsBox.firstChild);
		}

		// Populate suggestions box with the stations
      	response.matches.forEach(function(station) {
        	var li = document.createElement('li');
	    	li.innerHTML = station.name;

	    	// Add event listener to <li> suggestions
	    	li.addEventListener('click touchstart', function() {
    			app._onSuggestionClick(station.name, station.icsId, textInput, suggestionsBox, formGroup);
    		});

    		suggestionsBox.appendChild(li);
    	});
    }); 
  }

  // Add event listeners to both inputs.
  for (var i=0; i<inputFields.length; i++) {
  	inputFields[i].addEventListener('input', getSuggestionsOnInput, false);
  }
  
  /*****************************************************************************
   *
   * Methods for getting and displaying journeys
   *
   ****************************************************************************/

  app.clearSelectedStation = function(direction) {
  	app[direction].isSelected = false;
    app[direction].stationName = "";
    app[direction].stationId = "";
  }

  /**
   * On suggestion click
   */
	app._onSuggestionClick = function(stationName, stationId, textField, suggestionsBox, formGroup) {
	  
	  var direction = textField.getAttribute('id');
	  
	  // Set text field value to station name
	  textField.value = stationName;

	  // Empty Suggestions box
	  while (suggestionsBox.firstChild) {
		  suggestionsBox.removeChild(suggestionsBox.firstChild);
		}

		app[direction].isSelected = true;
	    app[direction].stationName = stationName;
	    app[direction].stationId = stationId;
	    view.stationSelected(formGroup, stationName);
	};

	/**
	 * Check to see if stations are selected 
	 */
	app.checkIfStationsSelected = function() {
		
		var isStationsSelected = true;

		if (!app.travellingFrom.isSelected) {
			view.noStationSelected(document.getElementById('fromFormGroup'));
			isStationsSelected = false;
	  	}

	  	if (!app.travellingTo.isSelected) {
	  		view.noStationSelected(document.getElementById('toFormGroup'));
	  		isStationsSelected = false;
	  	}

	  	return isStationsSelected;

		};

	/**
	 * Get the journey details from the TFL api
	 * @return {null}
	 */
	app.getJourneyDetails = function() {
  	
  	var url = 'https://api.tfl.gov.uk/Journey/JourneyResults/' + app.travellingFrom.stationId + '/to/' + app.travellingTo.stationId + '?nationalSearch=False&timeIs=Departing&journeyPreference=LeastTime&mode=tube&walkingSpeed=Average&cyclePreference=None&alternativeCycle=False&alternativeWalking=True&applyHtmlMarkup=False&useMultiModalCall=False&walkingOptimization=False&app_id=&app_key=';

	$.get(url, function(response) {

    }).done(function(response) {
    	console.log(response);
    	app.generateJourneysHtml(app.travellingFrom.stationName, app.travellingTo.stationName, response.journeys);
    	journeyDB.addJourney(response, app.travellingFrom.stationName, app.travellingTo.stationName, app.refreshRecentJourneys);
    }).fail(function() {
    	notie.alert(2, 'Could not complete request. Please Retry', 3.5);
    });
  };

  /**
   * Generate HTML for the journeys
   */
  app.generateJourneysHtml = function(from, to, journeysData) {

  	var journeys = document.getElementById('journeys');
		journeys.innerHTML = '';
		var journeyCount = 1;
		
		journeysData.forEach(function(journeyData) {
			// Journey Div
			var journey = document.createElement('div');
			journey.className = 'journey';

			// Journey Title
			var journeyTitle = document.createElement('div');
			journeyTitle.className = 'journeyTitle';

			var h3Title = document.createElement('h3');
			h3Title.innerHTML = from + ' to ' + to;

			var h3OptionNumber = document.createElement('h3');
			h3OptionNumber.className = 'subheading muted';
			h3OptionNumber.innerHTML = 'Option ['+ journeyCount +'/'+ journeysData.length +']';

			journeyTitle.appendChild(h3Title);
			journeyTitle.appendChild(h3OptionNumber);

			journey.appendChild(journeyTitle);

			/** 
			 * Journey Overview 
			*/
			var journeyOverview = document.createElement('div')
			journeyOverview.className = 'row journeyDetails';


			// Start Time
			var startTime = document.createElement('div');
			startTime.className = 'col-xs-4 journeyDetail';
			var startTimeParts = journeyData.startDateTime.split('T', 2);
			startTime.innerHTML = '<b>Start Time</b> <br> ' + startTimeParts[1];

			// Arrival Time
			var arrivalTime = document.createElement('div');
			arrivalTime.className = 'col-xs-4 journeyDetail'
			var arrivalTimeParts = journeyData.arrivalDateTime.split('T', 2);
			arrivalTime.innerHTML = '<b>Arrival Time</b> <br>' + arrivalTimeParts[1];

			// Duration
			var duration = document.createElement('div');
			duration.className = 'col-xs-4 journeyDetail';
			duration.innerHTML = '<b>Duration</b> <br>' + journeyData.duration + ' minutes';

			journeyOverview.appendChild(startTime);
			journeyOverview.appendChild(duration);
			journeyOverview.appendChild(arrivalTime);

			journey.appendChild(journeyOverview);

			// Journey Legs
			
			var journeyLegs = document.createElement('div');
			journeyLegs.className = 'journeyLegs';

			journeyData.legs.forEach(function(leg) {
				var journeyLeg = document.createElement('div');
				journeyLeg.className = 'journeyLeg';

				var journeyLegStart = document.createElement('div');
				var legDepartureTimeParts = leg.departureTime.split('T', 2);
				journeyLegStart.innerHTML = '<b>'+ leg.departurePoint.commonName +'</b> <br> Depart - ' + legDepartureTimeParts[1];

				var journeyLegArrow = document.createElement('div');
				journeyLegArrow.className = "journeyLegArrow";
				journeyLegArrow.innerHTML = '<img src="images/Forward_Arrow.png">';

				var journeyLegEnd = document.createElement('div');
				var legArrivalTimeParts = leg.arrivalTime.split('T', 2);
				journeyLegEnd.innerHTML = '<b>'+ leg.arrivalPoint.commonName +'</b> <br> Arrive - ' + legArrivalTimeParts[1];

				var journeyLegDetails = document.createElement('div');
				journeyLegDetails.className = 'journeyLegDetails';
				var linesOptions = document.createElement('div');
				linesOptions.className = 'lineOptions';
				linesOptions.innerHTML = '<b>Line options:</b>';
				journeyLegDetails.appendChild(linesOptions);
				leg.routeOptions.forEach(function(routeOption) {
					var line = document.createElement('div');
					line.className = routeOption.lineIdentifier.id;
					line.innerHTML = routeOption.lineIdentifier.name;
					journeyLegDetails.appendChild(line);	
				});

				journeyLeg.appendChild(journeyLegStart);
				journeyLeg.appendChild(journeyLegArrow);
				journeyLeg.appendChild(journeyLegEnd);
				journeyLeg.appendChild(journeyLegDetails);

				journeyLegs.appendChild(journeyLeg);
			});

			journeyCount++;

			journey.appendChild(journeyLegs);
			journeys.appendChild(journey);
		});

  };

  /**
   * Update recent journeys from DataBase
   */
  app.refreshRecentJourneys = function() {
  	journeyDB.fetchRecentJourneys(function(journeys) {
      var recentJourneysList = document.getElementById('recentJourneys_ul');
      recentJourneysList.innerHTML = '';

      for(var i = 0; i < journeys.length; i++) {
        // Read the journey items backwards (most recent first).
        var journey = journeys[(journeys.length - 1 - i)];

        var li = document.createElement('li');
     	  li.setAttribute('data-id', journey.timestamp);

     	  var span = document.createElement('span');
     	  
     	  var a = document.createElement('a');
				a.innerHTML = journey.title;
      	a.setAttribute('data-id', journey.timestamp);

      	span.appendChild(a);
      	li.appendChild(span);
      	recentJourneysList.appendChild(li);

	      // Setup an event listener for the journey link.
	      li.addEventListener('click', function(e) {
	        var id = parseInt(e.target.getAttribute('data-id'));
	        var journey = journeyDB.getJourney(id);

	        journey.onsuccess = function(e) {
	          var result = e.target.result;
	          app.generateJourneysHtml(result.from, result.to, result.journey.journeys);
	        }
	        journey.onerror = function(e) {
	          console.log(e);
	        }
	        
	      })
    	}
  	});
	};

	var view = {
		/**
		 * Clear the supplied suggestions box.
		 * @param  {HTML Element} suggestionsBox The suggestions box to clear.
		 * @return {null}                
		 */
		clearSuggestionBox: function(suggestionsBox) {
		  suggestionsBox.innerHTML = '';
		},

		/**
		 * Reset input element to default state
		 * @param  {Form Group HTML element} formGroup The form group you wish to reset
		 * @return {null}           
		 */
		resetInputDefault: function(formGroup) {
			var helpBlock = formGroup.querySelectorAll('.help-block')[0];

			if (formGroup.classList.contains('has-success')) formGroup.classList.remove('has-success');
			if (formGroup.classList.contains('has-error')) formGroup.classList.remove('has-error');

			helpBlock.innerHTML = helpBlock.getAttribute('data-defaultText');
		},

		/**
		 * Style the form group if NO station is selected
		 * @param  {Form Group HTML Element} formGroup The form group you wish to style
		 * @return {null}           
		 */
		noStationSelected: function(formGroup) {
			var helpBlock = formGroup.querySelectorAll('.help-block')[0];

			if (formGroup.classList.contains('has-success')) formGroup.classList.remove('has-success');

			formGroup.classList.add('has-error');
			helpBlock.innerHTML = "Please select a station from the dropdown list.";
		},

		/**
		 * Style the form group if a station IS selected
		 * @param  {Form Group HTML Element} formGroup The form group you wish to style
		 * @param  {String} station   The station name
		 * @return {null}           
		 */
		stationSelected: function(formGroup, station) {
			var helpBlock = formGroup.querySelectorAll('.help-block')[0];

			if (formGroup.classList.contains('has-error')) formGroup.classList.remove('has-error');

			formGroup.classList.add('has-success');
			helpBlock.innerHTML = "Excellent. You selected: <b>" + station + "</b>";
		}
	};

	/*****************************************************************************
	*
	* Code required to start the app
	*
	****************************************************************************/
	if ('serviceWorker' in navigator) {
	  navigator.serviceWorker
	           .register('/service-worker.js')
	           .then(function() { console.log('Service Worker Registered'); });
	}
	journeyDB.open(app.refreshRecentJourneys);	
	
})();