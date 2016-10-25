var journeyDB = (function() {
	var jDB = {};
	var datastore = null;

	/**
	 * Open a connection to the datastore.
	 */
	jDB.open = function(callback) {
		// Database version.
		var version = 1;

		// Open a connection to the datastore.
		var request = indexedDB.open('journeys', version);

		// Handle datastore upgrades.
		request.onupgradeneeded = function(e) {
			var db = e.target.result;

			e.target.transaction.onerror = jDB.onerror;

			// Delete the old datastore.
			if (db.objectStoreNames.contains('journeys')) {
				db.deleteObjectStore('journeys');
			}

			// Create a new datastore.
			var store = db.createObjectStore('journeys', {
				keyPath: 'timestamp'
			});
		};

		// Handle successful datastore access.
		request.onsuccess = function(e) {
			// Get a reference to the DB.
			datastore = e.target.result;

			// Execute the callback.
			callback();
		}

		// Handle errors when opening the datastore.
		request.onerror = function(e){
			console.log('error');
			console.log(e);
		};
	};

	/**
	 * Fetch recent journeys
	 */
	jDB.fetchRecentJourneys = function(callback) {
		var db = datastore;
		var transaction = db.transaction(['journeys'], 'readwrite');
		var objStore = transaction.objectStore('journeys');
		var count = 1;

		// Delete Cursors after 5.
		var request = objStore.openCursor(null, 'prev');

		request.onsuccess = function(e) {
			var cursor = e.target.result;

			if (!!cursor == false) return;
			if (count > 5) cursor.delete();

			cursor.continue();
			count++;
 		}
 		request.onerror = jDB.onerror;

 		// Get journeys.
		var keyRange = IDBKeyRange.lowerBound(0);
		var cursorRequest = objStore.openCursor(keyRange);

		var journeys = [];

		transaction.oncomplete = function(e) {
			// Execute the callback function.
			callback(journeys);
		};

		cursorRequest.onsuccess = function(e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			journeys.push(result.value);

			result.continue();
		}

		cursorRequest.onerror = jDB.onerror;
	};

	/**
	 * Add a recent journey.
	 */
	jDB.addJourney = function(journeyObject, from, to, callback) {
		// Get a reference to the db;
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['journeys'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('journeys');

		// Create a timestamp for the todo item.
		var timestamp = new Date().getTime();

		// Create an object for the journey
		var journey = {
			'title': from + ' to ' + to,
			'from': from,
			'to': to,
			'timestamp': timestamp,
			'journey': journeyObject
		};

		// Create a datastore request.
		var request = objStore.put(journey);

		// Handle a successful datastore put.
		request.onsuccess = function(e) {
			// Execute the callback function.
			callback(journey);
		}

		// Handle errors.
		request.onerror = jDB.onerror;
	};

	/**
	 * Get a journey.
	 */
	jDB.getJourney = function(id) {
		var db = datastore;
		var transaction = db.transaction(['journeys'], 'readwrite');
		var objStore = transaction.objectStore('journeys');

		return objStore.get(id);
	};

	// Export the jDB object.
	return jDB;
}());