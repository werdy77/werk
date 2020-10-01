<!--
/**
 * @fileoverview Core classes and functions.
 * Extend Array, String, RegExp objects with some usefull function.
 * Handle assync functioning via messages.
 * Include external css and js files dynamically.
 *
 * @author Zoltan Kovacs werdy@freemail.hu
 * @version 151020
 * 151020 - expand String class with getLines function
 * 150929 - expand Math class with degToRad, radToDeg functions and earthRadius parameter
 * 150709 - using source object constructor (and keep object type) in Misc.CopyObject
 * 140219 - add sql/js date conversion functions
 */

/** Storage for globals. @type object */
var globals = {};
globals.pathSeparator = '/';
globals.lineSeparator = "\n";
globals.version = '140219';
globals.charset = ((document.charset) ? document.charset : document.characterSet).toUpperCase();

/**
 *Browser detection from Prototype JavaScript framework, thx to Sam Stephenson @ignore
 */
globals.browser = {
	IE:		!!(window.attachEvent && !window.opera),
	IE7:	!!(window.attachEvent && !window.opera && navigator.appVersion.indexOf('MSIE 7.')),
	Opera:	!!window.opera,
	WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
	Gecko:	navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
	MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
	iPhone: navigator.userAgent.indexOf('iPhone') > -1
};

/**
 * @class Class for miscellaneous functions.
 */
function Misc() {};
	/**
	 * If child isn't exist, create it.
	 * @param {object} pParent parent
	 * @param {string} pChildName child's name
	 */
	Misc.TouchObject = function(pParent, pChildName) {
		if(pParent[pChildName] == null) pParent[pChildName] = {};
	};
	
	/**
	 * Check that an object's child is exists or not.
	 * @param {object} pObject object
	 * @param {string} parameters child's name as: 'level1','level2','level3'...
	 * @return {boolean} true if child exists
	 */
	Misc.IsValidChild = function(pObject) {
		var o = pObject;
		for(var i=1; i<arguments.length; i++) {
			o = o[arguments[i]];
			if(o == null) return false;
		}
		return true;
	};

	/**
	 * Clone (recursive copy) an object.
	 * @param {object} pSource source
	 * @param {object} pTarget destination
	 * @param {boolean} pNotRecursive if true copy will perform only on the top level
	 * @return {object} result object (new or pTarget)
	 */
	Misc.CopyObject = function(pSource, pTarget, pNotRecursive, pNotOverwrite) {
		if(!pTarget) pTarget = pSource.constructor();
		for(var k in pSource) {
			if(!pNotRecursive && typeof pSource[k] == 'object') pTarget[k] = Misc.CopyObject(pSource[k], pTarget[k]);
			else if(!pNotOverwrite || pTarget[k] == null) pTarget[k] = pSource[k];
		}
		
		return pTarget;
	};
	
	/**
	 * Delete object if it is empty.
	 * @param {object} pParent parent
	 * @param {string} pChildName child's name
	 * @return {boolean} true if object has deleted
	 */
	Misc.DeleteObjectIfEmpty = function(pObject, pChildName) {
		for(var k in pObject[pChildName]) {
			return false;
		}

		delete pObject[pChildName];
		return true;
	};

	/**
	 * Get an HTML element size on the page.
	 * @param {Element} pElement html element
	 * @return {object} size {width:width,height:height}
	 */
	Misc.GetElementSize = function(pElement) {
		if(pElement) {
			return {height: pElement.offsetHeight, width: pElement.offsetWidth};	
		}

		return {height: 0, width: 0};
	};

	/** 
	 * Get document (frame) real size.
	 * Based on "http://www.quirksmode.org/" inner width script.
	 * @return {object} size {width:width,height:height}
	 */
	Misc.GetDocumentSize = function() {
		var size = null;
	
		// all except Explorer
		if (self.innerHeight) {
			size = {
				width: self.innerWidth,
				height: self.innerHeight
			};
		}

		// Explorer 6 Strict Mode	
		else if (document.documentElement && document.documentElement.clientHeight) {
			size = {
				width: document.documentElement.clientWidth,
				height: document.documentElement.clientHeight
			};
		}

		// other Explorers
		else if (document.body) {
			size = {
				width: document.body.clientWidth,
				height: document.body.clientHeight
			};
		}
		
		else {
			size = {width: 0, height: 0};
		}
	
		return size;
	};

	/**
	 * Get a HTML element real position on the page.
	 * Based on "http://www.quirksmode.org/" script.
	 * @param {Element} pElement html element
	 * @return {object} position {x : left, y : top}
	 */
	Misc.GetElementPosition = function(pElement) 
	{
		var pos = {x:0, y:0};
		var obj = pElement;

		if (obj && obj.offsetParent) {
			pos.x = obj.offsetLeft;
			pos.y = obj.offsetTop;
			while (obj = obj.offsetParent) {
				pos.x += obj.offsetLeft;
				pos.y += obj.offsetTop;
			}
		}

		return pos;
	};
	
	/**
	 * Generate unique ID.
	 * @return {integer} generated ID
	 */
	Misc.GenerateUID = function() {
/*		var uid;

		do {
			uid = new Date().getTime();
		} while(uid == Misc._last_generated_uid);
		
		Misc._last_generated_uid = uid; // save uid*/
		return ++Misc._last_generated_uid;
	};
	/** Store last generated unique ID. @private */
	Misc._last_generated_uid = 0;

	/*
	 * Give back number of days in the given year/month.
	 * @param (number) params.year year
	 * @param (number) params.month month
	 * @return (number) day's number
	 */
	Misc.GetDaysPerMonth = function(params)
	{
		var days_per_month = [31,28,31,30,31,30,31,31,30,31,30,31];
		var month = params.month.valueOf()-1;
		var year = params.year.valueOf();
		var days = days_per_month[month];
	
		// leap year count
		if(
			month == 1 &&
			(year || year.length)
		) {
			if(
				(year%400 == 0) || 
				((year%4 == 0) && (year%100 != 0))
			) days++;
		}

		return days;
	};

	/*
	 * Give back number of days in the given year/month.
	 * @param (number) params.year year
	 * @param (number) params.month month
	 * @param (number) params.day day
	 * @param (number) params.no_past_date past date not allowed - optional
	 */
	Misc.IsValidDate = function(params) {
		// if not all filled, no error
		if(
			params.year.length == 0 || 
			params.day.length == 0 || 
			params.month.length == 0
		) return false;

		var year = params.year.valueOf();
		var month = params.month.valueOf();
		var day = params.day.valueOf();

		// check 'no past date' option
		if(params.no_past_date) {
			var date = new Date(year, month-1, day);
			var now = new Date();
			now.setHours(0,0,0,0);
			if(date.getTime() < now.getTime()) return false;
		}

		// check valid month
		if(month > 12 || month < 1) return false;

		// check valid day
		if(day > Misc.GetDaysPerMonth(params) || day < 1) return false;
	
		return true;
	};

	/*
	 * Find a rule from a linked CSS file.
	 * @param (string) selector CSS selector (like a.hover)
	 * @return (object) rule object or null
	 */
	Misc.FindLinkedCSSRule = function(selector)
	{
		var rules = [];
	
		// search for the given selector
		for(var s=0; s<document.styleSheets.length; s++) {
			if(document.styleSheets[s].rules != null) rules = document.styleSheets[s].rules;
			else if(document.styleSheets[s].cssRules != null) rules = document.styleSheets[s].cssRules;

			for(var r=0; r<rules.length; r++) {
				if(rules[r].selectorText == selector) return rules[r];
			}
		}

		return null;
	};

/** 
 * @class Handle timed and/or repeated async calls.
 * @param {object} pObj called object
 * @param {function} pFunct called function's name (of given object if its exist)
 * @param {any} pArg1... parameters
 */
function AsyncCall(pObj, pFunct, pArg1, pArg2, pArg3, pArg4, pArg5) {
	/** called object @type object */
	this.obj = pObj;
	/** called function @type function */
	this.funct = pFunct;
	
	/** parameter @type any */
	this.arg1 = pArg1;
	/** parameter @type any */
	this.arg2 = pArg2;
	/** parameter @type any */
	this.arg3 = pArg3;
	/** parameter @type any */
	this.arg4 = pArg4;
	/** parameter @type any */
	this.arg5 = pArg5;
	
	/** generated ID @private @type integer */
	this._id = Misc.GenerateUID();

	AsyncCall._calls[this._id] = this;	
};
	/**
	 * Execute async call.
	 * @param {integer} pDelay delay in ms
	 * @param {boolean} pRepeat if true target will called in every pDelay ms until {@link #Stop}
	 * @return {boolean} false if call has already executed
	 */
	AsyncCall.prototype.Execute = function(pDelay, pRepeat) {
		if(this.timerId) return false; // its already run
		if(!pDelay) pDelay = 0;
		
		if(pRepeat) {
			this.timerId = setInterval('AsyncCall._AsyncCallback('+this._id+');', pDelay);
		} else {
			setTimeout('AsyncCall._AsyncCallback('+this._id+');', pDelay);
		}
		
		return true;
	};

	/**
	 * Stop a runing repeated (loop) call.
	 */
	AsyncCall.prototype.Stop = function() {
		if(this.timerId) {
			clearInterval(this.timerId);
			this.timerId = null;
			this.Destroy();
		}
	};
	
	/**
	 * Dereference from {@link #_calls}.
	 */
	AsyncCall.prototype.Destroy = function() {
		delete AsyncCall._calls[this._id];
	};
	
	/**
	 * The real JS callback (must be global). @private
	 * @param {integer} pId ID of an AsyncCall object
	 */
	AsyncCall._AsyncCallback = function(pId) {
		var self = AsyncCall._calls[pId];
		self.funct.call(self.obj, self.arg1, self.arg2, self.arg3, self.arg4, self.arg5);
		if(!self.timerId) self.Destroy(); // remove reference 
	};
	
	
	/** Storage for AsyncCall objects. @private @type object */
	AsyncCall._calls = {}; // needed because IE
	

/**
 * Search item by value @addon
 * @param {any} pValue value
 * @param {integer} pStartIndex start search from
 * @return {integer} index of searched value or -1 if not found
 */
Array.prototype.searchItem = function(pValue, pStartIndex) {
	if(pStartIndex == null) pStartIndex = 0;
	
	for(var i=pStartIndex; i<this.length; i++) {
		if(this[i] == pValue) {
			return i;
			break;
		}
	}
	
	return -1;
};

/**
 * Delete an item from the array by value or index. Extension for Array class. @addon
 * @param {any|null} pValue deletable item or null if index has given
 * @param {integer} pIndex deletable item's index (faster)
 * @return {boolean} true if item found and deleted
 */
Array.prototype.deleteItem = function(pValue, pIndex) {
	var status = false;
	
	// search pIndex
	if(pIndex == null) pIndex = this.searchItem(pValue);
	
	if(-1 < pIndex && pIndex < this.length ) {
		// remove item
		var length = this.length-1;
		while(pIndex < length) this[pIndex] = this[++pIndex];
		this.pop(); // last entry is duplicated
		status = true;
	}
	
	return status;
};

/**
 * Return value of the last element of the array. @addon
 * @return {any} element of the array
 */
Array.prototype.lastItem = function() {
	return this[this.length-1];
};

/**
 * Find a pattern fast (faster than regexp search) on the end of this string. @addon
 * @param {string} pText searched pattern
 * @return {boolean} true if pattern found in the string
 */
String.prototype.findAtEnd = function(pText) {
	if(this.substr(this.length-pText.length) == pText) return true;
	return false;
};

/**
 * Extract filename from a path. @addon
 * @return {string} filename
 */
String.prototype.getFileNameFromPath = function() {
	var pathElements = this.split(globals.pathSeparator);
	return pathElements.lastItem();
};

/**
 * Get given number of lines from the beginning or the end. @addon
 * @param {number} pLineNumber number of lines
 * @param {bool} pFromEnd if true lines will comes from the end
 * @return {string} filename
 */
String.prototype.getLines = function(pLineNumber, pFromEnd) {
	var linesArray = this.split(globals.lineSeparator);
	if(linesArray.length > pLineNumber) {
		linesArray.splice((pFromEnd ? -1 : 0),linesArray.length-pLineNumber);
	}
	return linesArray.join(globals.lineSeparator);
};

/**
 * Create new string complement to fix length with trailing zeros.
 * @param {string|number} pString source string or number (usually)
 * @param {number} pLength result string length
 * @return {string} result
 */
String.withTrailingZeros = function(pString, pLength) {
	var text = new String(pString);
	while(text.length < pLength) text = '0'+text;
	return text;
};

/**
 * Convert date to string what SQL understand.
 * @param {boolean} pToUTC true if convert to UTC date string
 * @param {boolean} pWithSeconds true to include seconds too
 * @return {string} result SQL date string (like "2014-02-20 06:14:47")
 */
Date.prototype.toSQLDate = function(pToUTC, pWithSeconds) {
	var date = this;
	
	if(pWithSeconds == null) pWithSeconds = true;
	
	// convert local time to UTC
	if(pToUTC) {
		date = new Date();
		date.setTime(this.getTime()+(date.getTimezoneOffset()*60000));
	}
	
	return date.getFullYear()+'-'+String.withTrailingZeros((date.getMonth()+1),2)+'-'+String.withTrailingZeros(date.getDate(),2)
		+' '+String.withTrailingZeros(date.getHours(),2)+':'+String.withTrailingZeros(date.getMinutes(),2)
		+(pWithSeconds ? ':'+String.withTrailingZeros(date.getSeconds(),2) : '');
};

/**
 * Convert SQL date string to JS date object.
 * @param {string} pSqlDate date in SQL date string (like "2014-02-20 06:14:47")
 * @param {boolean} pIsUTC true if SQL date is in UTC
 * @return {object} JS date
 */
Date.parseSQLDate = function(pSqlDate, pIsUTC) {
	if(pSqlDate) {
		var dateParts = pSqlDate.split(RegExp.Cache('[- :]'));
		if(dateParts.length >= 5) {
			var date = new Date(dateParts[0], dateParts[1]-1, dateParts[2], dateParts[3], dateParts[4], (dateParts.length > 5 ? dateParts[5] : null));
			
			// convert UTC time to local
			if(pIsUTC) date.setTime(date.getTime()-(date.getTimezoneOffset()*60000));
			
			return date;
		}
	}
	return null;
};

/**
 * Calculate middle of values. @addon
 * @param {number} arguments values
 * @return {number} middle value
 */
Math.mid = function() {
	var val = 0;
	for(var i=0; i<arguments.length; i++) {
		val += arguments[i];
	}
	return val/arguments.length;
};

/**
 * Convert angle from degrees to radians. @addon
 * @param {number} pDegrees angle in degrees
 * @return {number} angle in radians
 */
Math.degToRad = function(pDegrees) {
	return pDegrees*(Math.PI/180.0);
};

/**
 * Convert angle from radians to degrees. @addon
 * @param {number} pDegrees angle in radians
 * @param {boolean} pNoLimit not limit result between 0 and 360 degrees
 * @return {number} angle in degrees
 */
Math.radToDeg = function(pRadians,pNoLimit) {
	var degrees = pRadians*(180.0/Math.PI);
	if(!pNoLimit) {
		degrees = degrees%360;
		if(degrees < 0) degrees += 360;
	}
	return degrees;
};

/** Earth radius in meter. @addon @type number */
Math.earthRadius = 6371000.0;

/** Quarter circle, 90 degrees. @addon @type number */
Math.qCircle = Math.PI/2;

/** Half circle, 180 degrees. @addon @type number */
Math.hCircle = Math.PI;

/** Full circle, 360 degrees. @addon @type number */
Math.fCircle = Math.PI*2;

/**
 * Create and cache a regexp object. @addon
 * @param {string} pExp regular expression
 * @param {string} pFlags regexp flags like 'g' or 'i'
 * @return {RegExp} regexp object
 */
RegExp.Cache = function(pExp, pFlags) {
	if(!RegExp._cache[pExp]) RegExp._cache[pExp] = new RegExp(pExp, pFlags);
	return RegExp._cache[pExp];
};

/** Storage for cached regexp objects. @private @addon @type object */
RegExp._cache = {};
//globals._cache = RegExp._cache;

/**
 * Call function but arguments comes from an array (or from Function.arguments[]). @addon
 * @param {object} pObj called object (pFunct parent)
 * @param {array} pArgs arguments in an array (eg. function.arguments)
 */
Function.prototype.callWithArguments = function(pObj, pArgs) {
	var js = 'this.call(pObj';
	for(var i=0; i<pArgs.length; i++) js += ', pArgs['+i+']';
	js += ');';
	eval(js);
};

/**
 * @class Lock function if necessary and call it later. In other words: serialize calls.
 * @param {string} pName Lock's name (ID), eg. 'my_function'
 * @param {object} pObj called object (pFunct parent)
 * @param {array} pArgs arguments in an array (eg. function.arguments)
 * @param {function} pFunct called function
 */
function Lock(pName, pObj, pArgs, pFunct) {
	if(Lock._locks[pName] == null) {
		Lock._locks[pName] = [];
	
		// call function
		pFunct.callWithArguments(pObj, pArgs);
		
		// call saved functions
		while(Lock._locks[pName].length) {
			// create call
			var o = Lock._locks[pName][0];
			o.funct.callWithArguments(o.obj, o.args);
		
			Lock._locks[pName].shift();
		}

		delete Lock._locks[pName];
	}
	
	// save function for later exec
	else {
		Lock._locks[pName].push({
			obj: pObj,
			funct: pFunct,
			args: pArgs
		});
	}
	
//	document.getElementById('isfw').innerHTML = Debug.DumpObject('d', Lock._locks, true);
};
	/** Storage for permanent messages. @private @type object */
	Lock._locks = {};

/**
 * @class Handle async functioning via messages. 
 * Messages are simple strings like 'JS_LOADED' or 'WIDGET_BUTTON_CLICKED'.
 */
function Messages() {};
	/**
	 * Register a function to receive a message.
	 * RegExp pattern can be used in the sender/message string.
	 * @param {string} params.sender message's owner
	 * @param {string} params.message (eg. JS_LOADED)
	 * @param {function} params.funct receiver function
	 * @param {object} params.obj receiver object, optional
	 * @param {boolean} params.once receive only one message (and unregister automatically), optional
	 * @return {integer} result.uid unique ID of the receiver
	 */
	Messages.Register = function(params) {
		var result = {};
		
		if(params.funct != null && params.sender != null && params.message != null) {
			// store receiver
			result.uid = Misc.GenerateUID();
			Messages._receivers[result.uid] = params;
		
			// search permanent messages
			for(var id in Messages._messages) {
				if(
					RegExp.Cache('^'+params.sender+'$').test(Messages._messages[id].sender) &&
					RegExp.Cache('^'+params.message+'$').test(Messages._messages[id].message)
				) {
					// send message
					Messages._messages[id].receiver_uid = result.uid;
					var call = new AsyncCall(null, Messages._SendReal, Messages._messages[id]);
					call.Execute();
				}
			}
		}
		
		return result;
	};

	/**
	 * Unregister a function from receiving further message.
	 * @param {integer} params.uid unique ID of receiver (given back at register)
	 */
	Messages.Unregister = function(params) {
		if(params.uid && Messages._receivers[params.uid]) delete Messages._receivers[params.uid];
	};

	/**
	 * Send a message to the registered receivers.
	 * Permanent (stored) messages are sended at once when a receiver registers to them.
	 * @param {string} params.sender message's owner
	 * @param {string} params.message (eg. JS_LOADED)
	 * @param {boolean} params.permanent send message permanently, optional
	 * @param {object} params.userdata further data will be passed to the receiver, optional
	 * @return {integer} result.uid unique ID of stored message, optional
	 */
	Messages.Send = function(params) {
		var result = {};
		
		if(params.sender != null && params.message != null) {
			// store message
			if(params.permanent) {
				result.uid = Misc.GenerateUID();
				Messages._messages[result.uid] = params;
			}

			// debug
			if(Messages.debug && params.sender != 'Messages') {
				Messages.Send({sender:'Messages', message:'DEBUG_SEND_MESSAGE', userdata:params});
			}
		
			// send message on another thread
			var call = new AsyncCall(null, Messages._SearchReceivers, params);
			call.Execute();
		}
		
		return result;
	};
	
	/**
	 * Remove permanent message.
	 * @param {integer} params.uid unique ID of receiver (given back at register)
	 */ 
	Messages.RemovePermanent = function(params) {
		if(params.uid && Messages._messages[params.uid]) delete Messages._messages[params.uid];
	};
	
	/**
	 * Call functions what are registered to this message. @private
	 * @param {string} params.sender message's owner
	 * @param {string} params.message (eg. JS_LOADED)
	 * @param {object} params.userdata further parameters will be passed to the receiver, optional
	 */
	Messages._SearchReceivers = function(params) {
		// search receivers
		for(params.receiver_uid in Messages._receivers) {
			if(
				RegExp.Cache('^'+Messages._receivers[params.receiver_uid].sender+'$').test(params.sender) &&
				RegExp.Cache('^'+Messages._receivers[params.receiver_uid].message+'$').test(params.message)
			) Messages._SendReal(params);
		}
	};

	/**
	 * Call functions what are registered to this message. @private
	 * @param {string} params.sender message's owner
	 * @param {string} params.message (eg. JS_LOADED)
	 * @param {integer} params.receiver_uid unique ID of receiver (given back at register)
	 * @param {object} params.userdata further parameters will be passed to the receiver, optional
	 */ 
	Messages._SendReal = function(params) {
		var receiver = Messages._receivers[params.receiver_uid];
		
		// callback
		receiver.funct.call(receiver.obj, params);
	
		// debug
		if(Messages.debug && params.sender != 'Messages') {
			Messages.Send({sender:'Messages', message:'DEBUG_MESSAGE_RECEIVED', userdata:receiver});
		}

		// delete if only one time receiver
		if(receiver.once && Messages._receivers[params.receiver_uid]) delete Messages._receivers[params.receiver_uid];		
	};
	
	/** Storage for functions what are registered to receive a message. @private @type object */
	Messages._receivers = {};

	/** Storage for permanent messages. @private @type object */
	Messages._messages = {};
	
	/** debug mode (eg. send DEBUG messages) @type boolean */
	Messages.debug = false;

/**
 * @class Handle standard js events in a better way.
 */
function Event() {};
	/**
	 * Register a function to receive callback on an event.
	 * @param {Element} pElement source of event
	 * @param {string} pEventName event name without 'on', eg. 'keyup'
	 * @param {object|null} pReceiver receiver object
	 * @param {function} pFunct receiver function
	 */
	Event.Register = function(pElement, pEventName, pObj, pFunctName) {
		Misc.TouchObject(pElement, '_receivers');
		if(!pElement._receivers[pEventName]) {
			Misc.TouchObject(pElement._receivers, pEventName);

			// register to event
			// IE, Opera
			if(window.attachEvent) {
				pElement.attachEvent('on'+pEventName, Event._OnEvent);
			}
			// Mozilla (gecko) and Safari
			else if(pElement.addEventListener) {
				pElement.addEventListener(pEventName, Event._OnEvent, false);
//				pElement['on'+pEventName] = Event._OnEvent; // prevent selection on window dragging
			}
		}

		// save receiver
		var uid = Misc.GenerateUID();
		pElement._receivers[pEventName][uid] = {
			obj: pObj,
			funct: pFunctName,
			srcObj: pElement
		}
	};
	
	/**
	 * Handle events and search registered functions to receive callbacks. @private
	 * @param {Event} pEvent event (except IE)
	 */
	Event._OnEvent = function(pEvent) {
		if(window.event) pEvent = window.event;
		var obj = this;
		if(pEvent.srcElement != null) obj = pEvent.srcElement; // IE fix

		while(obj) {
			if(obj._receivers != null) {
				var rcv = null;
				for(var uid in obj._receivers[pEvent.type]) {
					rcv = obj._receivers[pEvent.type][uid];
					
					// if function return false, stop search receivers (break events chain)
					if(rcv.srcObj == obj && rcv.funct && rcv.funct.call(rcv.obj, pEvent) == false) return false;
				}
			}
			obj = obj.parentNode;
		}
		return true;
	};

	/**
	 * Unregister a function to receive callback on an event.
	 * @param {Element} pElement source of event
	 * @param {string} pEventName event name without 'on', eg. 'keyup'
	 * @param {object|null} pReceiver receiver object
	 * @param {function} pFunct receiver function
	 */ 
	Event.Unregister = function(pElement, pEventName, pObj, pFunct) {
		if(pElement._receivers && pElement._receivers[pEventName]) {
			var rcv = null;
			for(var uid in pElement._receivers[pEventName]) {
				rcv = pElement._receivers[pEventName][uid];
				if(rcv.obj == pObj && rcv.funct == pFunct) delete pElement._receivers[pEventName][uid];
			}
			Misc.DeleteObjectIfEmpty(pElement._receivers, pEventName);
			
			// unregister from event if no receivers
			if(!pElement._receivers[pEventName]) {
				if(window.detachEvent) {
					pElement.detachEvent('on'+pEventName, Event._OnEvent);
				}
				// Mozilla (gecko) and Safari
				else if(pElement.removeEventListener) {
					pElement.removeEventListener(pEventName, Event._OnEvent, false);
				}				
			}
		}
	};

	/**
	 * Prevent event forwarding with this function. You should use this function as an event callback.
	 * @param (Event) pEvent event
	 */
	Event.StopPropagation = function(pEvent) {
		if(pEvent.stopPropagation) pEvent.stopPropagation();
		return false;		
	};

/**
 * @class Include (load) an external javascript or CSS file.
 */
function Include() {};
	/**
	 * Include (load) an external JS file.
	 * Attention! Identical js filenames with different paths could cause problems!
	 * @param {string} src url to javascript
	 */
	Include.LoadJs = function(src, loaded) {	
		if(!Include._files[src]) {
			var element = null;
			element = document.createElement('script');
			element.type = 'text/javascript';
			element.charset = globals.charset;
			element.src = src+'?version='+globals.version;
			element.loaded = loaded;

			// append it to the <head node
			var head = document.getElementsByTagName('head').item(0);
			if(head && element) {
				head.appendChild(element);				
				Include._files[src] = element;
			}
		}
	};

	/**
	 * Include (load) an external CSS file.
	 * @param {string} src url to the CSS file
	 */
	Include.LoadCSS = function(src) {	
		if(!Include._files[src]) {
			var element = null;
			element = document.createElement('link');
			element.type = 'text/css';
			element.media = 'all';
			element.rel = 'stylesheet';
			element.href = src+'?version='+globals.version;
			element.src = element.href;
			element.loaded = true;

			// append it to the <head node
			var head = document.getElementsByTagName('head').item(0);
			if(head && element) {
				head.appendChild(element);				
				Include._files[src] = element;
			}
		}
	};
	
	/**
	 * Query included file status.
	 * @param {string} pFilename filename with path
	 * @return {boolean} true if file is loaded
	 */
	Include.IsLoaded = function(pSrc) {
		return (Include._files[pSrc] && Include._files[pSrc].loaded);
	};

	/**
	 * Query included files status.
	 * @param {string} arguments: filenames with path
	 * @return {boolean} true if file is loaded
	 */
	Include.IsAllLoaded = function() {
		for(var i=0; i<arguments.length; i++) {
			if(!Include.IsLoaded(arguments[i])) return false;
		}
		return true;
	};

	/**
	 * Set file as loaded.
	 * Called when a javascript loaded and sent JS_LOADED message. @private
	 */
	Include._JsLoaded = function(params) {
		// check which js file has loaded now
		for(var k in Include._files) {
			if(Include._files[k].src.findAtEnd(params.sender+'?version='+globals.version)) Include._files[k].loaded = true;
		}
	};
	
	/** Registry for requested/loaded files. @private @type array */
	Include._files = {};

/**
 * Translate text or error code to the selected language.
 * This is only a placeholder, overwrite with the real one later.
 * @param {string|number} pText translatable text
 * @return {string} translated text
 */
TR = function(pText) {
	return pText;
};

// init		
Messages.Register({sender:'.*', message:'JS_LOADED', funct:Include._JsLoaded});

//-->
