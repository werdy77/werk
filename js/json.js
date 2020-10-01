<!--
/**
 * @fileoverview Classes to handle communication with the server via JSON
 * (JavaScript Object Notation). {@link JSONManager} class handle and store {@link JSONRequest}s 
 * which do the real communication.
 *
 * @author Zoltan Kovacs werdy@freemail.hu
 * @version 150703
 * 150703 - rename 'errorcode' and 'errortext' to 'httpcode' and 'message'
 */

/**
 * @class This class creates an JSON request and stores its data.
 * Data will send as a GET request and received as an included javascript file.
 * JSON_ANSWER_RECEIVED message will sent with the method as owner when answer has received.
 * Server answer must call {@link GLOBALS#_JSONCallback} function with the answer.
 * @param {string} pUrl server url, what will receives the request
 * @param {string|integer} pMethod method identifier, will be included in the request as method=xxx
 * @param {object} pData data (key/value pairs) what will send to the server
 * @param {object} pCache data, what will included in the answer message as a parameter
 */
function JSONGetRequest(pUrl, pMethod, pData, pCache) {
	/** Unique ID to identify request. @type integer */
	this.id = Misc.GenerateUID(); // uniq ID of the request
//	this.id = 1;
	/** server url, what will receives the request @type string */
	this.url = pUrl;
	/** method identifier, will be included in the request as method=xxx @type string */
	this.method = pMethod;
	/** data (key/value pairs) what will send to the server @type object */
	this.data = pData;
	/** data, what will included in the answer message as a parameter @type object */
	this.cache = pCache;
	/** error code @type integer */
	this.httpcode = 0;
};
	/**
	 * Send request to the server.
	 */
	JSONGetRequest.prototype.Send = function() {
		if(!this.element) {
			var src = this.url+'?method='+this.method+'&rid='+this.id;
			for(var key in this.data) src += '&'+key+'='+encodeURIComponent(this.data[key]);
		
			// create new DOM element
			this.element = document.createElement('script');
			this.element.type = "text/javascript";
			this.element.src = src;
			this.element.charset = 'utf-8';

			// append it to the <head
			var head = document.getElementsByTagName('head').item(0);
			if(head) head.appendChild(this.element);
		}
	};

/**
 * @class This class creates an JSON request and stores its data.
 * Data will send in a form as POST request, received as javascript data in a HTML file.
 * JSON_ANSWER_RECEIVED message will sent with the method as owner when answer has received.
 * Server answer must call {@link GLOBALS#_JSONCallback} function with the answer.
 * @param {object} pForm form to send data 
 * @param {string|integer} pMethod method identifier, will be included in the request as method=xxx
 * @param {object} pData data (key/value pairs) what will send to the server
 * @param {object} pCache data, what will included in the answer message as a parameter
 */
function JSONPostRequest(pFormNode, pUrl, pMethod, pData, pCache) {
	/** Unique ID to identify request. @type integer */
	this.id = Misc.GenerateUID(); // uniq ID of the request
//	this.id = 1;
	/** form to send data @type object */
	this.form = pFormNode;
	/** server url, what will receives the request @type string */
	this.url = pUrl;
	/** method identifier, will be included in the request as method=xxx @type string */
	this.method = pMethod;
	/** data (key/value pairs) what will send to the server @type object */
	this.data = pData;
	/** data, what will included in the answer message as a parameter @type object */
	this.cache = pCache;
	/** error code @type integer */
	this.httpcode = 0;
};
	/**
	 * Send request to the server.
	 */
	JSONPostRequest.prototype.Send = function() {
		if(this.form != null) {
      this.form.action = this.url+'?method='+this.method+'&rid='+this.id+'&post=1';
      for(var key in this.data) this._AddInputToForm(key,this.data[key]);
			this.form.submit();
			
	    // remove old elements
	    this._RemoveInputsFromForm();
		}
	};
	
	/**
	 * Add a key/value as a hidden input element to the form.
	 * @param {string} pKey key
	 * @param {string} pValue value
	 */
	JSONPostRequest.prototype._AddInputToForm = function(pKey,pValue) {
	  if(this.form != null) {
	    // search for existing input
  	  var i = 0;
  	  for(i = 0; i < this.form.elements.length; i++) {
  	    if(this.form.elements[i].name == pKey) break;
  	  }
	  
  	  if(this.form.elements.length == i) {
  			var element = document.createElement('input');
  			element.type = 'hidden';
  			element.name = pKey;
  			element.value = pValue;
  			element.generated = true;
  			this.form.appendChild(element);
  		} else {
  		  this.form.elements[i].value = pValue;
  		}
  	}
	};

  /**
   * Remove generated (by _AddInputToForm) hidden input elements from the form.
   */
  JSONPostRequest.prototype._RemoveInputsFromForm = function() {
    if(this.form != null) {
  	  for(i = 0; i < this.form.elements.length; i++) {
        if(this.form.elements[i].generated) {
          this.form.removeChild(this.form.elements[i]);
        }
  	  }      
    }
  };

/**
 * @class Handle and manage JSON communication via {@link JSONRequest} entities.
 */
function JSONManager() {};
	/**
	 * Set/get default keys/values what will be included in every request.
	 * Set only if pKey and pValue both given.
	 * @param {string} pKey key
	 * @param {string|null} pValue value
	 * @return {string} value
	 */
	JSONManager.DefaultValue = function(pKey, pValue) {
		if(pKey != null && arguments.length > 1) {
			if(pValue == null) delete JSONManager._defaults[pKey];
			else JSONManager._defaults[pKey] = pValue;
		}
		return (JSONManager._defaults[pKey] != null) ? JSONManager._defaults[pKey] : '';
	};
	
	/**
	 * Send an JSON request to the server (GET).
	 * @param {string|integer} pMethod method identifier, will be included in the request as method=xxx
	 * @param {object} pData data (key/value pairs) what will send to the server
	 * @param {object} pCache data, what will included in the answer message as a parameter
	 * @return (integer) request ID
	 */
	JSONManager.Request = function(pMethod, pData, pCache) {
		if(pData == null) pData = {};
		
		// set default values
		Misc.CopyObject(JSONManager._defaults, pData, true, true);
			
		// send GET request
	  var req = new JSONGetRequest(JSONManager.url, pMethod, pData, pCache);
		JSONManager._requests[req.id] = req;
	  req.Send();
	  JSONManager._SetBusyStatus(true);

		// remove old requests
		JSONManager.Clean();
		
		return req.id;
	};
	
	/**
	 * Send an JSON request to the server in form (POST).
	 * @param {string|integer} pMethod method identifier, will be included in the request as method=xxx
	 * @param {object} pData data (key/value pairs) what will send to the server
	 * @param {object} pCache data, what will included in the answer message as a parameter
	 * @return (integer) request ID. -1 on error.
	 */
	JSONManager.PostRequest = function(pMethod, pData, pCache) {
	  var id = -1;
	  
		if(JSONManager.form != null) {
  		if(pData == null) pData = {};
		
  		// set default values
  		Misc.CopyObject(JSONManager._defaults, pData, true, true);
		
			// send POST request
  	  var req = new JSONPostRequest(JSONManager.form, JSONManager.url, pMethod, pData, pCache);
  		JSONManager._requests[req.id] = req;
      JSONManager._SendNextPostRequest();

  		// remove old requests
  		JSONManager.Clean();
		
  		id = req.id;
  	}
  	
  	return id;
	};

  /**
   * POST requests must be serialized.
   * This function send the next request only if the answer to the previous one has received.
   */
  JSONManager._SendNextPostRequest = function() {
	  if(JSONManager._form_busy == 0) {
	    var form_req = null;
	    
	    // search next not completed request
  		for(var id in JSONManager._requests) {
			  form_req = JSONManager._requests[id];
        if(!form_req.done && form_req.form != null) {
          JSONManager._form_busy = id;
          form_req.Send();
          JSONManager._SetBusyStatus(true);
          break;
        }
      }
	  }
  };

	/**
	 * Resend requests received with pHttpCode HTTP code.
	 * @param {integer} pHttpCode HTTP code
	 */
	JSONManager.ResendByHttpCode = function(pHttpCode) {
		for(var id in JSONManager._errors[pHttpCode]) {
			var req = JSONManager._errors[pHttpCode][id];
			
			if(req.element != null) { // remove JS element from HEAD
			  req.element.parentNode.removeChild(req.element);
			  delete req.element;
			}
			
			req.done = false;
			
			// set default values
			Misc.CopyObject(JSONManager._defaults, req.data, true, false);
			
			req.Send();
			JSONManager._SetBusyStatus(true);
		}
	};

	/**
	 *  Remove old (returned) requests.
	 */
	JSONManager.Clean = function() {
		var req = null;
		for(var id in JSONManager._requests) {
			req = JSONManager._requests[id];
			if(req.done && !req.httpcode) {
			  
			  if(req.element != null) { // remove JS element from HEAD
				  req.element.parentNode.removeChild(req.element);
				}
				delete JSONManager._requests[id];
			}
		}
	};

	/**
	 * Remove failed requests returned with pHttpCode HTTP code.
	 * @param {integer} pHttpCode HTTP code
	 */
	JSONManager.CleanByHttpCode = function(pHttpCode) {
		var req = null;
		for(var id in JSONManager._errors[pHttpCode]) {
			req = JSONManager._errors[pHttpCode][id];
			if(req.done) {
				req.httpcode = 0;

				// remove from errors
				delete JSONManager._errors[pHttpCode][id];
				Misc.DeleteObjectIfEmpty(JSONManager._errors, pHttpCode);
			}
		}
	};
    
	/**
	 * Set busy status.
	 */
	JSONManager._SetBusyStatus = function(pStatus) {
		if(pStatus) {
			JSONManager._busy++;
			// turn on anim
			if(JSONManager._busy == 1) Messages.Send({sender:'JSONManager', message:'JSON_ACTIVATED'});
		}
		else if(JSONManager._busy > 0) {
			JSONManager._busy--;
			// turn off anim
			if(JSONManager._busy == 0) Messages.Send({sender:'JSONManager', message:'JSON_INACTIVATED'});
		}
	};

	/** server url, what will receives the GET request @type string */
	JSONManager.url = '';
	/** send data in form / POST @type object */
	JSONManager.form = null;
	/** FORM status (0 if no POST transaction). @private @type integer */
	JSONManager._form_busy = 0;
	/** Storage default values. @private @type object */
	JSONManager._defaults = {};
	/** Storage requests. @private @type object */
	JSONManager._requests = {};
	/** Storage for requests returned with error. @private @type object */
	JSONManager._errors = {};
	/** JSON status (0 if no active transaction). @private @type integer */
	JSONManager._busy = 0;

/**
 * Called when an JSON answer comes from the server. 
 * Send JSON_ANSWER_RECEIVED message.
 * @param {integer} params.rid unique ID to identify this answer's request pair
 * @param {integer} params.httpcode 200 if everything is ok
 * @param {string} params.message
 * @param {object} params.data server's answer
 */
function _JSONCallback(params) {
	var req = JSONManager._requests[params.rid]; // search request
	JSONManager._SetBusyStatus(false);
	
	if(req) {
		if(req.cache) params.cache = req.cache;
		req.done = true;		
		req.httpcode = params.httpcode;

		Messages.Send({sender:req.method, message:'JSON_ANSWER_RECEIVED', userdata:params});

		// save failed request
		if(params.httpcode) {
			Misc.TouchObject(JSONManager._errors, params.httpcode);
			JSONManager._errors[params.httpcode][params.rid] = req;
		}
		
		// delete corrected request from _errors
		else if(req.httpcode && JSONManager._errors[req.httpcode][params.rid]) {
			delete JSONManager._errors[req.httpcode][params.rid];
			
			// send message if all requests with pHttpCode corrected
			if(Misc.DeleteObjectIfEmpty(JSONManager._errors, req.httpcode)) {
				Messages.Send({sender:req.httpcode, message:'JSON_ERRORS_CORRECTED', userdata:{httpcode:req.httpcode}});
			}
		}

	  // send next form (POST) request
	  if(req.form != null) {
	    JSONManager._form_busy = 0;
	    JSONManager._SendNextPostRequest();
	  }
	} 
	
	// request not found, send an universal JSON_ANSWER_RECEIVED message
	else {
		Messages.Send({sender:'JSONManager', message:'JSON_ANSWER_RECEIVED', userdata:params});
	}
};

Messages.Send({sender:'json.js', message:'JS_LOADED'});
//-->