<!--
/**	
 * @fileoverview Handle contents, widgets, templates.
 *
 * @author Zoltan Kovacs werdy@freemail.hu
 * @version 150707
 * 150707 - add latitude and longitude validator, possible using Array object as data for template
 * 140623 - add sql_datetime filter and validator
 * 140219 - remove default filtering (not_empty)
 * 120710 - add ImageWidget class
 */

/**
 * @class Filter (modify) content (string).
 * Filter receive string (or character) and return filtered string
 * what contains only valid characters.
 */
function ContentFilter() {};
	/**
	 * pozitive integer (0-9)
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.pozinteger = function(pText) {
		return pText.replace(RegExp.Cache('[^0123456789]', 'g'),'');	
	};
	
	/**
	 * integer number (0-9 -)
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.integer = function(pText) {
		return pText.replace(RegExp.Cache('[^0123456789\\-]', 'g'),''); 
	};
	
	/**
	 * float number (0-9 -.)
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.float = function(pText) {
		return pText.replace(RegExp.Cache('[^0123456789\\-\\.]', 'g'),'');	
	};

	/**
	 * to upper case
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.uppercase = function(pText) {
		return pText.toUpperCase();
	};

	/**
	 * to lower case
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.lowercase = function(pText) {
		return pText.toLowerCase(); 
	};

	/**
	 * mysql date time, eg 2014-06-22 06:30:00 (0-9 -:)
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.sql_datetime = function(pText) {
		return pText.replace(RegExp.Cache('[^0123456789\\:\\- ]', 'g'),'');	
	};

	/**
	 * IP address (ipv4, ipv6)
	 * @param {string} pText text
	 * @return {string} filtered text
	 */
	ContentFilter.ipaddress = function(pText) {
		return pText.toUpperCase().replace(RegExp.Cache('[^0123456789ABCDEF\\:\\.]', 'g'),'');	
	};

/**
 * @class Validate content (string).
 * Validators receive string and return validity as a boolean.
 */
function ContentValidator() {};
	/**
	 * not empty
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.not_empty = function(pText) {
		return RegExp.Cache('\\S').test(pText);
	};

	/**
	 * pozitive integer AND not zero
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.pozinteger_not_zero = function(pText) {
		return (RegExp.Cache('^[0123456789]+$').test(pText) && pText > 0);
	};

	/** 
	 * pozitive integer (number)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.pozinteger = function(pText) {
		return RegExp.Cache('^[0123456789]+$').test(pText);
	};

	/**
	 * integer (-number)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.integer = function(pText) {
		return RegExp.Cache('^[\\-]?[0123456789]+$').test(pText);
	};

	/**
	 * float number (-number.number)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.float = function(pText) {
		return RegExp.Cache('^[\\-]?[0123456789]+[\\.]?[0123456789]*$').test(pText);
	};

	/**
	 * email
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.email = function(pText) {
		return RegExp.Cache('^\\S+@\\S+\\.\\S+\\s*$').test(pText);
	};

	/**
	 * password (min. 5 character)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.password = function(pText) {
		return (pText.length >= 5) ? true : false;
	};

	/**
	 * SQL date and time (yyyy-mm-dd hh:mm)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.sql_datetime = function(pText) {
		return (Date.parseSQLDate(pText) ? true : false);
	};
	
	/**
	 * latitude (-90 <= lat <= 90)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.latitude = function(pText) {
		return (pText.length > 0 && -90 <= pText && pText <= 90);
	};
	
	/**
	 * latitude (-180 <= lat <= 180)
	 * @param {string} pText text
	 * @return {boolean} true if pText is valid
	 */
	ContentValidator.longitude = function(pText) {
		return (pText.length > 0 && -180 <= pText && pText <= 180);
	};

/** 
 * @class Handle and wrap around page elements, inputs. Base class.
 */
function Widget() {
	/** name @private @type string */
	this._name = '';
	/** disabled @private @type boolean */
	this._disabled = false;
	/** must filled out @private @type boolean */
	this._required = false;
	/** widget has the focus @private @type boolean */
	this._focused = false;
	/** filled out correctly @private @type boolean */
	this._completed = null;
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'unknown';
	/** html element, base of this widget @private @type object */
	this._node = null;
	/** saved value, used to detect changing of content @private @type string */
	this._saved_value = '';
	/** initial (registering) parameters @type object */
	this.reg = null;

};
	/**
	 * Register a widget for an existing html element.
	 * @param {object} pReg register information {id, name, value, filter, valid, required, disabled}
	 * @return (Widget|null) created widget or null on error
	 */
	Widget.Register = function(pReg) {
		var widget = null;

		// create new input by type
		var node = document.getElementById(pReg.id);
		
		// create widget
		// choose type by type parameter OR node type
		if(pReg.type == null) pReg.type = Widget._GetWidgetTypeByNode(node);
		switch(pReg.type) {
			case 'text': widget = new TextWidget(); break;
			case 'textarea': widget = new TextAreaWidget(); break;
			case 'password': widget = new PasswordWidget(); break;
			case 'checkbox': widget = new CheckboxWidget(); break;
			case 'hidden': widget = new HiddenWidget(); break;
			case 'radio': widget = new RadioWidget(); break;
			case 'select': widget = new SelectWidget(); break;
			case 'button': widget = new ButtonWidget(); break;
			case 'html': widget = new HtmlWidget(); break;
			case 'image': widget = new ImageWidget(); break;
			case 'slider': widget = new SliderWidget(); break;
		}
		
		// if widget is valid set options
		if(widget) {
			widget.Init(node, pReg.name);
			if(pReg.filter && ContentFilter[pReg.filter]) widget.SetContentFilter(ContentFilter[pReg.filter]);
			if(pReg.valid && ContentValidator[pReg.valid]) widget.SetContentValidator(ContentValidator[pReg.valid]);
			if(pReg.value != null) widget.Value(pReg.value);
			if(pReg.required) widget.Required(true);
			widget.Disabled(pReg.disabled);
		}
		
		return widget;
	};
	
	/**
	 * Initialize the widget. Register widget events.
	 * @param {Element} pNode html element, widget's base
	 * @param {string} pName name
	 */
	Widget.prototype.Init = function(pNode, pName) {
		this._node = pNode;
		this._name = pName;
//		if(this._node) this._node._widget = this; // need to find ourself from Element
		this._RegisterCommonEvents();
		this._RegisterEvents();
		this._saved_value = this.Value();
	};

	// delete widget
	Widget.prototype.Destroy = function() {
		if(this._node) this._node = null;
		this._UnregisterCommonEvents();
		this._UnregisterEvents();
	};

	/**
	 * Read/write widget's name.
	 * @param {string|null} pName name
	 * @return {string} name
	 */
	Widget.prototype.Name = function(pName) {
		if(pName != null) this._name = pName;
		return this._name;
	};

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value, optional
	 * @return {string|number} value
	 */
	Widget.prototype.Value = function(pValue) {
		if(pValue != null) {
			this._value = this._ContentFilter(pValue);
			this._CheckValueChanged();
		}
		return this._value;
	};
	
	/**
	 * Enable / disable widget or get disabled status.
	 * @param {boolean|null} pStatus status, if true widget will be disabled
	 * @return {boolean} status, if true widget is disabled
	 */
	Widget.prototype.Disabled = function(pStatus) {
		if(pStatus != null) {
			var disabled = (pStatus) ? true : false;
			if(disabled != this._disabled) {
				this._disabled = disabled;
				this._UpdateCSS();
				if(this._node && this._node.disabled != null) this._node.disabled = disabled;
			}
		}
		
		return this._disabled;
	};

	/**
	 * Read/write required status.
	 * @param {boolean} pStatus status, if true widget must be filled out
	 * @return {boolean} status
	 */
	Widget.prototype.Required = function(pStatus) {
		if(pStatus != null) {
			var required = (pStatus) ? true : false;
			if(required !== this._required) {
				this._required = required;
				this._UpdateCSS();
			}
		}
		
		return this._required;
	};
	
	/**
	 * Check widget, it's filled out correctly or not.
	 * @return {boolean} true if widget's content filled out correctly
	 */
	Widget.prototype.IsCompleted = function() {
		return this._completed;
	};

	/**
	 * Sets a content filter to check/change widget's value.
	 * @param {function} pFilter content filter function, see {@link ContentFilter}
	 */
	Widget.prototype.SetContentFilter = function(pFilter) {
		if(pFilter != null && typeof pFilter == 'function') this._ContentFilter = pFilter;
	};

	/**
	 * Sets a content validator to check widget is completed or not.
	 * @param {function} pValidator, content validator function, see {@link ContentValidator}
	 */
	Widget.prototype.SetContentValidator = function(pValidator) {
		if(pValidator != null && typeof pValidator == 'function') this._ContentValidator = pValidator;
	};

	/**
	 * Check for the html element what is the base of the widget.
	 * @return {boolean} status, false if element is missing
	 */
	Widget.prototype.IsValid = function() {
		return (this._node) ? true : false;
	};

	/**
	 * Change CSS class of the element.
	 * @param (string) pOldClassName old class name
	 * @param (string) pNewClassName new class name
	 */
	Widget.prototype.ChangeCSSClass = function(pOldClassName, pNewClassName) {
		if(this._node != null) {
			this._node.className = this._node.className.replace(RegExp.Cache(pOldClassName), pNewClassName);
		}
	};

	/**
	 * Read/write CSS class of the element.
	 * @param (string) pClassName new class name
	 * @return (string) class name
	 */
	Widget.prototype.CSSClass = function(pClassName) {
		if(this._node != null) {
			if(pClassName != null) this._node.className = pClassName;
			return this._node.className;
		}
		
		return '';
	};

	/**
	 * Set focus to an input widget.
	 */
	Widget.prototype.SetFocus = function() {
		if(this._node != null && this._node.focus != null) this._node.focus();
	};

	/**
	 * Register events for inherited widget classes. 
	 * Placeholder, overwritten in inherited classes. @private
	 */
	Widget.prototype._RegisterEvents = function() {};
	
	/**
	 * Unregister events for inherited widget classes. 
	 * Placeholder, overwritten in inherited classes. @private
	 */
	Widget.prototype._UnregisterEvents = function() {};
	
	/**
	 * Register events for all kind of widgets. @private
	 */
	Widget.prototype._RegisterCommonEvents = function() {
		if(this._node) {
			Event.Register(this._node,'focus',this,this._GotFocus);
			Event.Register(this._node,'blur',this,this._LostFocus);
			Event.Register(this._node, 'mousedown', this, Event.StopPropagation);
		}
	};

	/**
	 * Unregister eventsnts for all kind of widgets. @private
	 */
	Widget.prototype._UnregisterCommonEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'focus',this,this._GotFocus);
			Event.Unregister(this._node,'blur',this,this._LostFocus);
			Event.Unregister(this._node, 'mousedown', this, Event.StopPropagation);
		}
	};

	/**
	 * Widget got focus, send WIDGET_GOT_FOCUS message. @private
	 */
	Widget.prototype._GotFocus = function() {
		if(this._focused == false && !this._disabled) {
			this._focused = true;
			this._UpdateCSS();
			if(this._node) Messages.Send({sender:this._name, message:'WIDGET_GOT_FOCUS'});
		}
	};

	/**
	 * Widget lost its focus, send WIDGET_LOST_FOCUS message. @private
	 */
	Widget.prototype._LostFocus = function() {
		if(this._focused == true) {
			this._focused = false;
			this._UpdateCSS();
			if(this._node) Messages.Send({sender:this._name, message:'WIDGET_LOST_FOCUS'});
		}
	};

	/**
	 * Check value has changed for real and send WIDGET_VALUE_CHANGED message. @private
	 */
	Widget.prototype._CheckValueChanged = function () {
		var value = this.Value();
		if(value != this._saved_value) {
			this._saved_value = value;
			Messages.Send({sender:this._name, message:'WIDGET_VALUE_CHANGED'});
			this._ValidateContent();
		}
	};

	/**
	 * Validate content and send WIDGET_CONTENT_VALIDATED message. @private
	 */
	Widget.prototype._ValidateContent = function () {
		var result = this._ContentValidator(this._saved_value);
		if(result != this._completed) {
			this._completed = result;
			this._UpdateCSS();
			Messages.Send({sender:this._name, message:'WIDGET_CONTENT_VALIDATED', userdata:{completed:this._completed}});
		}
	};

	/**
	 * Filter content. Placeholder, overwritten in inherited classes.
	 * See {@link ContentFilter}. @private
	 */
	Widget.prototype._ContentFilter = function(pValue) {
		return pValue;
	};
	
	/**
	 * Validate content. Placeholder, overwritten in inherited classes. 
	 * See {@link ContentValidator}. @private
	 */
	Widget.prototype._ContentValidator = function(pValue) {
		return false;
	};

	/**
	 * Update CSS classes for the base html element. @private
	 */
	Widget.prototype._UpdateCSS = function() {
		if(this._node) {
			var css = this._node.className.replace(RegExp.Cache('widget_\\S*','g'),'');
		
			if(this._disabled) css += ' widget_disabled';
			else {
				if(this._focused) css += ' widget_focused';
				if(this._completed) css += ' widget_completed';
				else if(this._required) css += ' widget_required';
			}

			this._node.className = css;
		}
	};
	
	/**
	 * Return element (widget) type by a html element node. @private
	 * @param {Element} pNode, html element
	 * @return {string} type, it can be: select, button, html, unknown,
	 * checkbox, radio, select, hidden, text, textarea, password
	 */
	Widget._GetWidgetTypeByNode = function(pNode) {
		var type;
		if(pNode) {
			if(pNode.nodeName == 'SELECT') type = 'select';
			else if(pNode.nodeName == 'A' || (pNode.type && pNode.type == 'button')) type = 'button';
			else if(pNode.nodeName == 'DIV' || pNode.nodeName == 'SPAN') type = 'html';
			else if(pNode.nodeName == 'IMG') type = 'image';
			else if(pNode.type) type = pNode.type;
			else type = 'unknown';
		}
		else type = 'unknown';

		return type;
	};

/**
 * @class Single line text input widget.
 * Based on INPUT/text html element.
 */
function TextWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'text';
};
	TextWidget.prototype = new Widget;
	
	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value
	 * @return {string|number} value
	 */
	TextWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				var pos = this.CursorPosition();	
				this._node.value = this._ContentFilter(pValue); // filter value
				this.CursorPosition(pos.start, pos.end);
				this._CheckValueChanged();				
			}
			
			return this._node.value;
		}
		return '';
	};

	/**
	 * Read/set cursor position.
	 * @param {integer|null} pStartPos selection start position
	 * @param {integer|null} pEndPos selection end position
	 * @param {object} cursor position {start, end}
	 */
	TextWidget.prototype.CursorPosition = function(pStartPos, pEndPos) {
		var pos = {start:0,end:0};
		
		if(this._node && this._focused) {
			// set
			if(pStartPos != null) {
				if(pEndPos == null) pEndPos = pStartPos;
				
				// standard way
				if(this._node.selectionStart != null) {
					this._node.setSelectionRange(pStartPos, pEndPos);
					
					if(globals.browser.Gecko) {
						// Trigger a "space" keypress.
						var evt = document.createEvent("KeyboardEvent");
						evt.initKeyEvent("keypress", true, true, null, false, false, false, false, 0, 32);
						this._node.dispatchEvent(evt);

						// Trigger a "backspace" keypress.
						evt = document.createEvent("KeyboardEvent");
						evt.initKeyEvent("keypress", true, true, null, false, false, false, false, 8, 0);
						this._node.dispatchEvent(evt);
					}
				}
		
				// ie way (the very bad way)
				else if(document.selection != null) {
					var range = this._node.createTextRange();
					range.collapse(true);
					range.moveEnd('character', pEndPos);
					range.moveStart('character', pStartPos);
					range.select();
				}
				
				pos.start = pStartPos;
				pos.end = pEndPos;
			}
			
			// get
			else {		
				// gecko way
				if(this._node.selectionStart != null) {
					pos.start = this._node.selectionStart;
					pos.end = this._node.selectionEnd;
				}
	
				// ie way (the very bad way)
				else if(document.selection != null) {
					var range = document.selection.createRange();
					var range2 = this._node.createTextRange();
					range2.setEndPoint('EndToStart', range);
					pos.start = range2.text.length;
					pos.end = pos.start+range.text.length;
				}
			}
		}
		
		return pos;
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	TextWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			Event.Register(this._node,'keypress',this,this._FilterChar);
			Event.Register(this._node,'paste',this,this._FilterContentTimed);
			Event.Register(this._node,'input',this,this._FilterContentTimed);
			if(globals.browser.IE) Event.Register(this._node,'keyup',this,this._FilterContentTimed); // for ie
			if(globals.browser.Gecko) Event.Register(this._node,'keypress',this,this._FilterContentTimed); // for ff
		}
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	TextWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'keypress',this,this._FilterChar);
			Event.Unregister(this._node,'paste',this,this._FilterContentTimed);
			Event.Unregister(this._node,'input',this,this._FilterContentTimed);
			if(globals.browser.IE) Event.Unregister(this._node,'keyup',this,this._FilterContentTimed); // for ie
			if(globals.browser.Gecko) Event.Unregister(this._node,'keypress',this,this._FilterContentTimed); // for ff
		}
	};

	/**
	 * Handle key pressed events and do character filtering. @private
	 * @param {Event} pEvent keypressed event
	 * @return {boolean} false, if character isn't allowed
	 */
	TextWidget.prototype._FilterChar = function(pEvent) {
		// send WIDGET_ENTER_PRESSED message
		if(pEvent.keyCode == 13) Messages.Send({sender:this._name, message:'WIDGET_ENTER_PRESSED'});
		
		/// allow some control keys
		if(
			pEvent.keyCode < 32 || // control char
			pEvent.keyCode == 63272 || // delete - safari
			(pEvent.keyCode >= 37 && pEvent.keyCode <= 40) || // arrows - opera
			(pEvent.keyCode >= 63232 && pEvent.keyCode <= 63235) || // arrows - safari
			(pEvent.ctrlKey && pEvent.keyCode == 99) || // ctrl+c
			(pEvent.metaKey && pEvent.keyCode == 99) || // apple+c on mac
			(pEvent.ctrlKey && pEvent.keyCode == 118) || // ctrl+v
			(pEvent.metaKey && pEvent.keyCode == 118) // apple+v on mac
		) {
			return true;
		}

		if(
			this._disabled ||
			!this._ContentFilter(String.fromCharCode(pEvent.keyCode))
		) {
			// for Gecko, Opera and Safari
			if(pEvent.stopPropagation) {
				pEvent.stopPropagation();
				pEvent.preventDefault();
			}
			return false;
		}
		
		return true;
	};

	/**
	 * Filter content (widget's value) after input made. Timed because copy/paste.
	 * {@link #_FilterContentTimedReal} does the real filtering. @private
	 */
	TextWidget.prototype._FilterContentTimed = function() {
		if(!this._checkvaluetimer) {
			this._checkvaluetimer = new AsyncCall(this, this._FilterContentTimedReal);
			this._checkvaluetimer.Execute(100); 
		}
	};

	/**
	 * Filter content (widget's value). Called by {@link #_FilterContentTimed}. @private
	 */
	TextWidget.prototype._FilterContentTimedReal = function() {
		if(this._disabled) this.Value(this._saved_value);
		else this.Value(this.Value());
		this._checkvaluetimer = null;
	};


/**
 * @class Single line text input like {@link TextWidget}, but input is masked.
 * Based on INPUT/password html element.
 */
function PasswordWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'password';
};
	PasswordWidget.prototype = new TextWidget;


/**
 * @class Multiline text input area.
 * Based on TEXTAREA html element.
 */
function TextAreaWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'textarea';
};
	TextAreaWidget.prototype = new TextWidget;

	/**
	 * Read/set cursor position.
	 * @param {integer|null} pStartPos selection start position
	 * @param {integer|null} pEndPos selection end position
	 * @param {object} cursor position {start, end}
	 */
	TextAreaWidget.prototype.CursorPosition = function(pStartPos, pEndPos) {
		var pos = {start:0,end:0};
		
		if(this._node && this._focused) {
			// set
			if(pStartPos != null) {
				// gecko way
				if(this._node.selectionStart != null) {
					this._node.selectionStart = pStartPos;
					this._node.selectionEnd = pEndPos;
				}
		
				// ie way (the very bad way)
				else if(document.selection != null) {
					var range = document.selection.createRange();
					range.moveToElementText(this._node);
					range.collapse(true);
					range.moveEnd('character', pEndPos);
					range.moveStart('character', pStartPos);
					range.select();
				}
				
				pos.start = pStartPos;
				pos.end = pEndPos;
			}

			// get
			else {	
				// gecko way
				if(this._node.selectionStart != null) {
					pos.start = this._node.selectionStart;
					pos.end = this._node.selectionEnd;
				}
	
				// ie way (the very bad way)
				else if(document.selection != null) {
					var range = document.selection.createRange();
					var range2 = range.duplicate();

					range2.moveToElementText(this._node);
					range2.setEndPoint('StartToEnd', range);
					pos.end = this._node.value.replace(RegExp.Cache('\\r','g'),'').length -
						range2.text.replace(RegExp.Cache('\\r','g'),'').length;
					pos.start = pos.end-range.text.replace(RegExp.Cache('\\r','g'),'').length;
				}
			}
		}
				
		return pos;
	};

/**
 * @class Widget to store key/value pair in the html page.
 * Based on INPUT/hidden html element.
 */
function HiddenWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'hidden';
};
	HiddenWidget.prototype = new Widget;
	
	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value
	 * @return {string|number} value
	 */
	HiddenWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				this._node.value = this._ContentFilter(pValue); // filter value
				this._CheckValueChanged();
			}
			return this._node.value;
		}
		return '';
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	HiddenWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			Event.Register(this._node,'change',this,this._CheckValueChanged);
		}
	};

	/**
	 * Unregister widget's type dependent events. @private
	 */
	HiddenWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'change',this,this._CheckValueChanged);
		}
	};

/**
 * @class Single choice from multiple predefined options. All options are visible.
 * Based on INPUT/radio html element.
 */
function RadioWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'radio';
};
	RadioWidget.prototype = new Widget;

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value, empty string will be converted to 0, otherwise 1
	 * @return {integer} value, can be 0 or 1
	 */
	RadioWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				this._node.checked = (pValue != 0) ? true : false;
				this._CheckValueChanged();				
			}
			
			return (this._node.checked) ? 1 : 0;
		}
		return 0;
	};

	/**
	 * Give back value (checked status independent).
	 * @return (string) value
	 */
	RadioWidget.prototype.RealValue = function() {
		return (this._node != null) ? this._node.value : '';
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	RadioWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			Event.Register(this._node,'click',this,this._SendClickMessage);
		}
	};

	/**
	 * Unregister widget's type dependent events. @private
	 */
	RadioWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'click',this,this._SendClickMessage);
		}
	};
	
	/**
	 * Send WIDGET_BUTTON_CLICKED message if user clicked the button. @private
	 */
	RadioWidget.prototype._SendClickMessage = function() {
		if(!this._disabled) {
			Messages.Send({sender:this._name, message:'WIDGET_RADIO_CLICKED'});
		}
		return false;
	};

/**
 * @class Pseudo class to join RadioWidgets into one widget.
 */
function RadioGroupWidget(params) {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'radiogroup';
	/** name @private @type string */
	this._name = params.name;
	/** Container for radio widgets. @private @type object */
	this._options = {};
	
	this._RegisterMessages();
};
	/**
	 * Release radio widgets from the group.
	 */
	RadioGroupWidget.prototype.Destroy = function() {
		for(var i in this._options) this.RemoveRadioWidget(this._options[i]);
	};

	/**
	 * Register to radio widget messages. @private
	 */
	RadioGroupWidget.prototype._RegisterMessages = function() {
		this._radio_message = Messages.Register({sender:this._name+'\\d+', message:'WIDGET_RADIO_CLICKED', obj:this, funct:this._CheckValueChanged});
	};

	/**
	 * Unregister from radio widget messasges. @private
	 */
	RadioGroupWidget.prototype._UnregisterEvents = function() {
		Messages.Unregister(this._radio_message);
	};

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue new value
	 * @return {integer} value
	 */
	RadioGroupWidget.prototype.Value = function(pValue) {
		// set value
		if(pValue != null) {
			for(var i in this._options) {
				if(this._options[i].RealValue() == pValue) {
					this._options[i].Value(pValue);
					break;
				}
			}
			this._CheckValueChanged();
		}

		// return value
		for(var i in this._options) {
			if(this._options[i].Value() == 1) return this._options[i].RealValue();
		}
		return '';
	};

	/**
	 * Check value has changed for real and send WIDGET_VALUE_CHANGED message. @private
	 */
	RadioGroupWidget.prototype._CheckValueChanged = function () {
		var value = this.Value();
		if(value != this._saved_value) {
			this._saved_value = value;
			Messages.Send({sender:this._name, message:'WIDGET_VALUE_CHANGED'});
		}
	};

	/**
	 * Enable / disable widget or get disabled status.
	 * @param {boolean|null} pStatus status, if true widget will be disabled
	 * @return {boolean} status, if true widget is disabled
	 */
	RadioGroupWidget.prototype.Disabled = function(pStatus) {
		if(pStatus != null) {
			for(var i in this._options) this._options[i].Disabled(pStatus);
		}
		
		for(var i in this._options) return this._options[i].Disabled();
		return false;
	};

	/**
	 * Read/write required status.
	 * @param {boolean} pStatus status, if true widget must be filled out
	 * @return {boolean} status
	 */
	RadioGroupWidget.prototype.Required = function(pStatus) {
		if(pStatus != null) {
			for(var i in this._options) this._options[i].Required(pStatus);
		}
		
		for(var i in this._options) return this._options[i].Required();
		return false;
	};
	
	/**
	 * Check widget, it's filled out correctly or not.
	 * @return {boolean} true if widget's content filled out correctly
	 */
	RadioGroupWidget.prototype.IsCompleted = function() {
		return (this._selected.length != 0) ? true : false;
	};

	/**
	 * Add a radio widget to the group.
	 * @param {RadioWidget} pWidget widget
	 */
	RadioGroupWidget.prototype.AddRadioWidget = function(pWidget) {
		if(pWidget != null && pWidget._node != null && this._options[pWidget._name] == null) {
			pWidget._node.name = this._name;
			this._options[pWidget._name] = pWidget;
		}
	};

	/**
	 * Remove a radio widget from the group.
	 * @param {RadioWidget} pWidget widget
	 */
	RadioGroupWidget.prototype.RemoveRadioWidget = function(pWidget) {
		if(pWidget != null && this._options[pWidget._name] != null) {
			if(pWidget._node != null) pWidget._node.name = "";
			delete this._options[pWidget._name];
		}
	};

/**
 * @class Single or multiple choice from multiple predefined options. 
 * Only one option visible after the selection.
 * Based on SELECT html element.
 */
function SelectWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'select';
};
	SelectWidget.prototype = new Widget;

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value (or "value1,value2,value3" for multiple selection)
	 * @return {string|number} value (or "value1,value2,value3 on multiple selection)
	 */
	SelectWidget.prototype.Value = function(pValue) {		
		// set value
		if(pValue != null) return this.ValueAsArray(pValue.split(','));
		else return this.ValueAsArray().join(',');
	};

	/**
	 * Read/write multiple values with array.
	 * @param {array} pValues new values
	 * @return {array} value
	 */
	SelectWidget.prototype.ValueAsArray = function(pValues) {
		if(this._node) {
			// set value
			if(pValues != null && pValues.length > 0) {
				// select multiple options
				if(this._node.multiple) {
					for(var i=0; i<this._node.options.length; i++) {
						this._node.options[i].selected = (pValues.searchItem(this._node.options[i].value) > -1) ? true : false;
					}
				}
			
				else this._node.value = pValues[0];
				this._CheckValueChanged();	
			}
		
			// create array with the selected options value
			var values = [];
			if(this._node.multiple) {
				for(var i=0; i<this._node.options.length; i++) {
					if(this._node.options[i].selected) values.push(this._node.options[i].value);
				}
			}
			
			else values.push(this._node.value);
			return values;
		}
		return '';
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	SelectWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			Event.Register(this._node,'click',this,this._CheckValueChanged);
		}
	};

	/**
	 * Unregister widget's type dependent events. @private
	 */
	SelectWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'click',this,this._CheckValueChanged);
		}
	};

	/**
	 * Add an option to widget.
	 * @param {string|number} pValue value
	 * @param {string} pText displayed text
	 * @param {integer|null} pIndex index of the item
	 */
	SelectWidget.prototype.AddOption = function(pValue, pText, pIndex) {
		if(this._node) {
			if(pIndex == null) this._node.options.add(new Option(pText, pValue));
			else this._node.options.add(new Option(pText, pValue), pIndex);
		}
	};

	/**
	 * Add options to the widget from an key/value object.
	 * @param {object} pOptions data, {value: description, ...}
	 * @param {boolean|null} pReverse if its true, object contains data {description: value, ...}
	 */
	SelectWidget.prototype.AddOptions = function(pOptions, pReverse) {
		if(this._node) {
			for(var k in pOptions) {
				if(!pReverse) this._node.options.add(new Option(pOptions[k], k));
				else this._node.options.add(new Option(k, pOptions[k]));
			}
		}
	};

	/**
	 * Remove an option from the widget.
	 * @param {string|number} pValue value
	 * @param {integer|null} option's index, faster
	 */
	SelectWidget.prototype.RemoveOption = function(pValue, pIndex) {
		if(this._node) {
			// search for index
			if(pIndex == null) {
				pIndex = this.GetOptionIndexByValue(pValue);
			}
			
			if(pIndex != null) {
				delete this._node.options[pIndex];
				this._node.options[pIndex] = null;
				this._CheckValueChanged();
			}
		}
	};

	/**
	 * Remove all options from the widget.
	 * @param (number) pFrom start clearing from this index (eg. 1 will keep first option)
	 */
	SelectWidget.prototype.ClearOptions = function(pFrom) {
		if(this._node) {
			if(pFrom == null) pFrom = 0;
			this._node.options.length = pFrom;
			this._CheckValueChanged();
		}
	};

	/**
	 * Give back js options array.
	 * @return (Options) JS option's array
	 */
	SelectWidget.prototype.GetOptions = function() {
		if(this._node) {
			return this._node.options;
		}
	};

	/**
	 * Search an option's index by its value.
	 * @param (number) pValue option's value
	 * @return (number|null) option's index or null
	 */
	SelectWidget.prototype.GetOptionIndexByValue = function(pValue) {
		var index = null;
		
		if(this._node) {
			// search for index
			for(var i=0; i<this._node.options.length; i++) {
				if(this._node.options[i].value == pValue) {
					index = i;
					break;
				}
			}
		}
		
		return index;
	};

	/**
	 * Search an option's index by its label.
	 * @param (number) pValue option's label
	 * @return (number|null) option's index or null
	 */
	SelectWidget.prototype.GetOptionIndexByLabel = function(pLabel) {
		var index = null;
		
		if(this._node) {
			// search for index
			for(var i=0; i<this._node.options.length; i++) {
				if(this._node.options[i].text == pLabel) {
					index = i;
					break;
				}
			}
		}
		
		return index;
	};

	/**
	 * Get / set label (selected option).
	 * @param {string} pLabel label of an option what will be selected
	 * @return (string) label of selected option
	 */
	SelectWidget.prototype.Label = function(pLabel) {
		if(this._node) {
			if(pLabel != null) {
				var i = this.GetOptionIndexByLabel(pLabel);
				if(i != null) this.Value(this._node.options[i].value);
			}
			
			return this._node.options[this._node.selectedIndex].text;
		}
	};

	/**
	 * Set class name for an option.
	 * @param {string|number} pValue value
	 * @param {string} pClass CSS class selector
	 */
	SelectWidget.prototype.SetOptionClass = function(pValue, pClass) {
		if(this._node) {
			var index = this.GetOptionIndexByValue(pValue);
			if(index != null) this._node.options[index].className = pClass;
		}
	};

	/**
	 * Give back number of options.
	 * @return (number|null) option's number
	 */
	SelectWidget.prototype.Length = function() {
		return this._node.options.length;
	};

/**
 * @class Single boolean (true/false) choice.
 * Based on INPUT/checkbox html element.
 */
function CheckboxWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'checkbox';
};
	CheckboxWidget.prototype = new HiddenWidget;

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value, empty string will be converted to 0, otherwise 1
	 * @return {integer} value, can be 0 or 1
	 */
	CheckboxWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				this._node.checked = (pValue != 0) ? true : false;
				this._CheckValueChanged();				
			}
			
			return (this._node.checked) ? 1 : 0;
		}
		return 0;
	};

	/**
	 * Give back value (checked status independent).
	 * @return (string) value
	 */
	CheckboxWidget.prototype.RealValue = function() {
		return (this._node != null) ? this._node.value : '';
	};

/**
 * @class Pseudo class to join CheckboxWidgets into one widget.
 */
function CheckboxGroupWidget(params) {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'checkboxgroup';
	/** name @private @type string */
	this._name = params.name;
	/** Container for radio widgets. @private @type object */
	this._options = {};
	/** Container to store WIDGET_VALUE_CHANGED message registration. @private @type integer */
	this._valuechanged_message = 0;
	
	this._RegisterMessages();
};
	/**
	 * Release radio widgets from the group.
	 */
	CheckboxGroupWidget.prototype.Destroy = function() {
		for(var i in this._options) this.RemoveCheckboxWidget(this._options[i]);
	};

	/**
	 * Register to radio widget messages. @private
	 */
	CheckboxGroupWidget.prototype._RegisterMessages = function() {
		this._valuechanged_message = Messages.Register({sender:this._name+'\\d+', message:'WIDGET_VALUE_CHANGED', obj:this, funct:this._CheckValueChanged});
	};

	/**
	 * Unregister from radio widget messasges. @private
	 */
	CheckboxGroupWidget.prototype._UnregisterEvents = function() {
		Messages.Unregister(this._valuechanged_message);
	};

	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue new value
	 * @return {string|number} value
	 */
	CheckboxGroupWidget.prototype.Value = function(pValue) {
		if(pValue != null) return this.ValueAsArray(pValue.split(','));
		else return this.ValueAsArray().join(',');
	};

	/**
	 * Read/write multiple values with array.
	 * @param {array} pValues new values
	 * @return {array} value
	 */
	CheckboxGroupWidget.prototype.ValueAsArray = function(pValues) {
		// set value
		if(pValues != null) {
			// set multiple checkboxes
			for(var i in this._options) {
				this._options[i].Value((pValues.searchItem(this._options[i].RealValue()) > -1) ? 1 : 0);
			}
			this._CheckValueChanged();
		}
		
		// create array with the selected options value
		var values = [];
		for(var i in this._options) {
			if(this._options[i].Value() == 1) values.push(this._options[i].RealValue());
		}
		return values;
	};

	/**
	 * Check value has changed for real and send WIDGET_VALUE_CHANGED message. @private
	 */
	CheckboxGroupWidget.prototype._CheckValueChanged = function () {
		var value = this.Value();
		if(value != this._saved_value) {
			this._saved_value = value;
			Messages.Send({sender:this._name, message:'WIDGET_VALUE_CHANGED'});
		}
	};

	/**
	 * Enable / disable widget or get disabled status.
	 * @param {boolean|null} pStatus status, if true widget will be disabled
	 * @return {boolean} status, if true widget is disabled
	 */
	CheckboxGroupWidget.prototype.Disabled = function(pStatus) {
		if(pStatus != null) {
			for(var i in this._options) this._options[i].Disabled(pStatus);
		}
		
		for(var i in this._options) return this._options[i].Disabled();
		return false;
	};

	/**
	 * Read/write required status.
	 * @param {boolean} pStatus status, if true widget must be filled out
	 * @return {boolean} status
	 */
	CheckboxGroupWidget.prototype.Required = function(pStatus) {
		if(pStatus != null) {
			for(var i in this._options) this._options[i].Required(pStatus);
		}
		
		for(var i in this._options) return this._options[i].Required();
		return false;
	};
	
	/**
	 * Check widget, it's filled out correctly or not.
	 * @return {boolean} true if widget's content filled out correctly
	 */
	CheckboxGroupWidget.prototype.IsCompleted = function() {
		return true;
	};

	/**
	 * Add a checkbox widget to the group.
	 * @param {CheckboxWidget} pWidget widget
	 */
	CheckboxGroupWidget.prototype.AddCheckboxWidget = function(pWidget) {
		if(pWidget != null && pWidget._node != null && this._options[pWidget._name] == null) {
//			pWidget._node.name = this._name;
			this._options[pWidget._name] = pWidget;
		}
	};

	/**
	 * Remove a checkbox widget from the group.
	 * @param {CheckboxWidget} pWidget widget
	 */
	CheckboxGroupWidget.prototype.RemoveCheckboxWidget = function(pWidget) {
		if(pWidget != null && this._options[pWidget._name] != null) {
//			if(pWidget._node != null) pWidget._node.name = "";
			delete this._options[pWidget._name];
		}
	};

/**
 * @class Show read only content to the user.
 * Based on DIV/SPAN html elements.
 */
function HtmlWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'html';
};
	HtmlWidget.prototype = new Widget;
	
	/**
	 * Read/write widget's value.
	 * @param {string|number|null} pValue value (content)
	 * @return {string|number} actual value (content)
	 */
	HtmlWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				this._node.innerHTML = this._ContentFilter(pValue);
				this._CheckValueChanged();
			}
			
			return this._node.innerHTML;
		}
		return '';
	};


/**
 * @class Image class.
 * Based on IMG html elements.
 */
function ImageWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'image';
};
	ImageWidget.prototype = new Widget;

	/**
	 * Read/write widget's value. Widget value is the url of the image.
	 * @param {string|number|null} pValue value (content)
	 * @return {string|number} actual value (content)
	 */
	ImageWidget.prototype.Value = function(pValue) {
		if(this._node) {
			// set value
			if(pValue != null) {
				this._node.src = this._ContentFilter(pValue);
				this._CheckValueChanged();
			}

			return this._node.src;
		}
		return '';
	};


/**
 * @class Button. Used to initiate actions by the user.
 * Based on INPUT/button or A (link) html element.
 */
function ButtonWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'button';
};
	ButtonWidget.prototype = new Widget;

	/**
	 * Change button label.
	 * @param (string|number|null) pLabel new label
	 * @return {string|number} actual label
	 */
	ButtonWidget.prototype.Label = function(pLabel) {
		if(this._node) {
			if(this._node.type && this._node.type == 'button') {
				if(pLabel != null) this._node.value = pLabel;
				return this._node.value;
			}
			
			else {
				if(pLabel != null) this._node.innerHTML = pLabel;
				return this._node.innerHTML;
			}
		}
		
		return '';
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	ButtonWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			Event.Register(this._node,'click',this,this._SendClickMessage);
			this._node.onclick = function(){return false;}
		}
	};

	/**
	 * Unregister widget's type dependent events. @private
	 */
	ButtonWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			Event.Unregister(this._node,'click',this,this._SendClickMessage);
		}
	};
	
	/**
	 * Send WIDGET_BUTTON_CLICKED message if user clicked the button. @private
	 */
	ButtonWidget.prototype._SendClickMessage = function() {
		if(!this._disabled) {
			Messages.Send({sender:this._name, message:'WIDGET_BUTTON_CLICKED'});
		}
		return false;
	};

/**
 * @class Draggable element. Can be used as slider.
 * Based on DIV/SPAN html elements.
 */
function SliderWidget() {
	/** type (eg. 'text' or 'select') @private @type string */
	this._type = 'slider';
	
	/** value's precision - number of digits after the decimal point @private @type number */
	this._precision = 4;
	
	/** value @private @type object */
	this._value = {x:0,y:0};
	
	/** mouse position when dragging starts @private @type object */
	this._startMousePos = {};
	
	/** store html element new position @private @type object */
	this._newPos = {};
	
	/** store dragged status @private @type boolean */
	this._dragged = false;
	
	/** store boundaries of tracking area (parent element) @private @type object */
	this._boundaries = {};
};
	SliderWidget.prototype = new Widget;

	/**
	 * Read/write widget's value.
	 * Values are in float (0-1).
	 * @param {object} value {x:x axis's value, y:y axis's value}
	 * @return {object} value {x:x axis's value, y:y axis's value}
	 */
	SliderWidget.prototype.Value = function(pValue) {
		if(pValue != null) {
			var saved_value = Misc.CopyObject(this._value); // backup actual
		
			if(ContentValidator.float(pValue.x)) {
				this._value.x = pValue.x.toPrecision(this._precision);
				if(this._value.x < 0) this._value.x = 0;
				if(this._value.x > 1) this._value.x = 1;
			}
			if(ContentValidator.float(pValue.y)) {
				this._value.y = pValue.y.toPrecision(this._precision);
				if(this._value.y < 0) this._value.y = 0;
				if(this._value.y > 1) this._value.y = 1;
			}
	
			// if value really changed send WIDGET_VALUE_CHANGED and set slider
			if(saved_value.x != this._value.x || saved_value.y != this._value.y) {
				Messages.Send({sender:this._name, message:'WIDGET_VALUE_CHANGED'});
				this.RefreshPosition();
			}
		}
		
		return this._value;
	};

	/**
	 * Refresh slider (knob) position by value.
	 */
	SliderWidget.prototype.RefreshPosition = function() {
		// set slider element position
		if(this._node != null) {
			this._DetectBoundaries();
			this._node.style.left = (this._boundaries.left+(this._boundaries.right-this._boundaries.left)*this._value.x)+'px';
			this._node.style.top = (this._boundaries.top+(this._boundaries.bottom-this._boundaries.top)*this._value.y)+'px';
		}	
	};

	/**
	 * Give back dragged status (true if user drag the control).
	 * @return (boolean) dragged status
	 */
	SliderWidget.prototype.IsDragged = function() {
		return this._dragged;
	};

	/**
	 * Register widget's type dependent events. @private
	 */
	SliderWidget.prototype._RegisterEvents = function() {
		if(this._node) {
			if(globals.browser.iPhone) {
				Event.Register(this._node,'touchstart',this,this._Drag);
			} else {
				this._node.onmousedown = function() {return false;}; // prevent selection below the window
				Event.Unregister(this._node, 'mousedown', this, Event.StopPropagation);
				Event.Register(this._node,'mousedown',this,this._Drag);
			}
		}
	};

	/**
	 * Unregister widget's type dependent events. @private
	 */
	SliderWidget.prototype._UnregisterEvents = function() {
		if(this._node) {
			if(globals.browser.iPhone) {
				Event.Unregister(this._node,'touchstart',this,this._Drag);
			} else {
				Event.Unregister(this._node,'mousedown',this,this._Drag);
				Event.Register(this._node, 'mousedown', this, Event.StopPropagation);
				this._node.onmousedown = null; // prevent selection below the window
			}
		}
	};
	
	/**
	 * Detect tracking area boundaries (parent node). @private
	 */
	SliderWidget.prototype._DetectBoundaries = function() {
		if(this._node) {	
			this._boundaries.left = 0;
			this._boundaries.top =	0;
			
			var size = Misc.GetElementSize(this._node.parentNode);
			this._boundaries.right = this._boundaries.left+size.width;
			this._boundaries.bottom = this._boundaries.top+size.height;
			
			size = Misc.GetElementSize(this._node);
			this._boundaries.right -= size.width;
			this._boundaries.bottom -= size.height;
		}
	};
	
	/**
	 * Send WIDGET_SLIDER_DRAGGED message if user has dragged the element. @private
	 */
	SliderWidget.prototype._Drag = function(pEvent) {
		if(!this._disabled) {
			if(globals.browser.iPhone) pEvent = pEvent.touches[0]; // use only the first touch
			
			this._dragged = true;
			Messages.Send({sender:this._name, message:'WIDGET_SLIDER_DRAGGED'});
			this._DetectBoundaries();
			
			if(this._node.style.left.length == 0) this._node.style.left = '0px';
			if(this._node.style.right.length == 0) this._node.style.right = '0px';
			this._startMousePos.x = pEvent.screenX-this._node.style.left.replace(RegExp.Cache('px', 'g'),'');
			this._startMousePos.y = pEvent.screenY-this._node.style.top.replace(RegExp.Cache('px', 'g'),'');

			if(globals.browser.iPhone) {
				Event.Register(document, 'touchmove', this, this._Move);
				Event.Register(document,'touchend',this,this._Release);				
			} else {
				Event.Register(document, 'mousemove', this, this._Move);
				Event.Register(document,'mouseup',this,this._Release);
			}
			return false;
		}
		return true;
	};

	/**
	 * Drag (move) slider. @private
	 * @param {Event} pEvent event object
	 */
	SliderWidget.prototype._Move = function(pEvent) {
		if(this._node) {
			if(globals.browser.iPhone) {
				pEvent.preventDefault();
				pEvent = pEvent.touches[0]; // use only the first touch
			}
			
			// find out new position
			this._newPos.x = pEvent.screenX-this._startMousePos.x;
			this._newPos.y = pEvent.screenY-this._startMousePos.y;
			
			// check boundaries
			if(this._newPos.x < this._boundaries.left) this._newPos.x = this._boundaries.left;
			if(this._newPos.x > this._boundaries.right) this._newPos.x = this._boundaries.right;
			if(this._newPos.y < this._boundaries.top) this._newPos.y = this._boundaries.top;
			if(this._newPos.y > this._boundaries.bottom) this._newPos.y = this._boundaries.bottom;
						
			// set position
			this._node.style.left = this._newPos.x+'px';
			this._node.style.top = this._newPos.y+'px';
		}
		return false;
	};

	/**
	 * Send WIDGET_SLIDER_RELEASED message if user has released the element. @private
	 */
	SliderWidget.prototype._Release = function() {
		if(!this._disabled) {
			if(globals.browser.iPhone) {
				Event.Unregister(document, 'touchmove', this, this._Move);
				Event.Unregister(document, 'touchend', this, this._Release);			
			} else {
				Event.Unregister(document, 'mousemove', this, this._Move);
				Event.Unregister(document, 'mouseup', this, this._Release);
			}

			// set widget's value
			this.Value({
				x: (this._node.style.left.replace(RegExp.Cache('px', 'g'),'')-this._boundaries.left)/(this._boundaries.right-this._boundaries.left),
				y: (this._node.style.top.replace(RegExp.Cache('px', 'g'),'')-this._boundaries.top)/(this._boundaries.bottom-this._boundaries.top)
			});
			
			this._dragged = false;
			Messages.Send({sender:this._name, message:'WIDGET_SLIDER_RELEASED'});
		}
		return false;
	};


/**
 * @class Cache and generate html templates (predefined skeletons). 
 * Template objects must contains 'name','html' and optionally 'data' and 'register' fields. 
 * 'name field contains a uniq string to identify the template. 
 * 'html' field contains the html code in a string. 
 * 'register' object contains information to register {@link Widget} elements in the framework. 
 * 'data' field contains data in object to generate multiple instances from 'html' (like lists). 
 * #varname# can be used in 'html' and 'register' fields what will replaced by 'data'. 
 * See included sampe_template.js for further information.
 */
function Template() {};
	/**
	 * Save template into the cache.
	 * @param {object} pTemplate template{name, html, register, data}
	 */
	Template.Save = function(pTemplate) {
		if(pTemplate && pTemplate.name && pTemplate.html) {
			Template._cache[pTemplate.name] = pTemplate;
		}
	};

	/**
	 * Set data field of a template.
	 * @param {string} pName template's name
	 * @param {object} pData data
	 */
	Template.SetData = function(pName, pData) {
		if(Template._cache[pName]) {
			Template._cache[pName].data = pData;
		}
	};

	/**
	 * Set dictionary field of a template.
	 * @param {string} pName template's name
	 * @param {object} pData data
	 */
	Template.SetDictionary = function(pName, pData) {
		if(Template._cache[pName]) {
			Template._cache[pName].dict = pData;
		}
	};

	/**
	 * Generate template from cached template: process subtemplates and data.
	 * @param {string} pName name
	 * @return {object} processed template
	 */
	Template.Generate = function(pName) {
		return Template.GenerateFromTemplate(Template._cache[pName]);
	};
	
	/**
	 * Generate template: process subtemplates and data.
	 * @param {string} pTemplate template object
	 * @return {object} processed template
	 */
	Template.GenerateFromTemplate = function(pTemplate) {
		var template = {name:'unknown', html:'', register:'', _cached_register:''};

		if(pTemplate != null) {
			// preserve original template, working with a copy
			template = Misc.CopyObject(pTemplate);
			
			// insert required templates
			var res = null;
			while((res = RegExp.Cache('#(\\S+)_template#').exec(template.html))) {
				var subtemplate = Template.Generate(res[1]);
				
				// process html
				template.html = template.html.replace(RegExp.Cache('#'+res[1]+'_template#','g'), subtemplate.html);
				
				// process registration
				Misc.CopyObject(subtemplate.register, template.register);
			} 
			
			// replace words from dictionary
			if(template.dict) {
				var res = null;
				while((res = RegExp.Cache('#dict_(\\S+)#').exec(template.html))) {
					// process html
					template.html = template.html.replace(RegExp.Cache('#dict_'+res[1]+'#','g'), (template.dict[res[1]] != null) ? template.dict[res[1]] : res[1]);
				}
			}
			
			// we have to generate template by data
			if(template.data) {
				var html = '';
				var register = {};
				
				if((template.data).constructor == Array) {
					// data is an array
					for(var i=0; i<template.data.length; i++) {
						if(!template.data[i].nr) template.data[i].nr = i; // 
						html += Template._ReplaceInTemplate(template.html, template.data[i]);

						for(var id in template.register) {
							var new_id = Template._ReplaceInTemplate(id, template.data[i]);
							register[new_id] = {};

							for(var k in template.register[id]) {
								if(k == 'name' || k == 'value') register[new_id][k] = 
									Template._ReplaceInTemplate(template.register[id][k], template.data[i]);

								else register[new_id][k] = template.register[id][k];
							}
						}
					}
				}
				
				else {
					var nr = 0;
					
					// data is hash array
					for(var i in template.data) {
						if(!template.data[i].nr) template.data[i].nr = nr; // 
						html += Template._ReplaceInTemplate(template.html, template.data[i]);

						for(var id in template.register) {
							var new_id = Template._ReplaceInTemplate(id, template.data[i]);
							register[new_id] = {};

							for(var k in template.register[id]) {
								if(k == 'name' || k == 'value') register[new_id][k] = 
									Template._ReplaceInTemplate(template.register[id][k], template.data[i]);

								else register[new_id][k] = template.register[id][k];
							}
						}
						nr++;
					}
				}

				delete template.data;
				template.register = register;
				template.html = html;
			}
		}

		return template;
	};

	/**
	 * Check templates saved/cached or not.
	 * @param {string} arguments template names
	 * @return {boolean} true if all cached
	 */
	Template.IsCached = function() {
		var cached = true;
		for(var i=0; i<arguments.length; i++) {
			if(!Template._cache[arguments[i]]) {
				cached = false;
				break;
			}
		}
		return cached;
	};

	/**
	 * Search for #ID# in pString and replace it with pReplace.ID. @private
	 * @param {string} pString source
	 * @param {object} pReplace replacement
	 * @return {string} processed string
	 */
	Template._ReplaceInTemplate = function(pString, pReplace) {
		var res = null;
		while(res = RegExp.Cache('#(\\w+)#').exec(pString)) {
			pString = pString.replace(RegExp.Cache('#'+res[1]+'#','g'),
				((pReplace[res[1]] != null) ? pReplace[res[1]] : ''));
		}
		return pString;
	};

	/** Storage for templates. @private @type object */
	Template._cache = {};

/** 
 * @class Handle page content. Show templates, set/get input's content, etc.
 */
function Page() {
	/** Storage for registered widgets. @type object */
	this.widgets = {};
	
	/** Storage for displayed templates. @type object */
	this._displayed_templates = {};
};
	/**
	 * Show template and register input fields.
	 * @param {template} pTemplate template
	 * @param {string} pTargetId target html element ID
	 */
	Page.prototype.ShowTemplate = function(pTemplate, pTargetId) {
		var targetElement = document.getElementById(pTargetId);
		if(targetElement) {
			if(this._displayed_templates[pTargetId] != null) this.ClearTemplate(pTargetId);
			
			// put template into the page
			targetElement.innerHTML = pTemplate.html;
			this._displayed_templates[pTargetId] = pTemplate;
			
			this.RegisterWidgets(pTemplate);
		}
	};

	/**
	 * Register widgets (html elements) for use them with the framework.
	 * @param {template} pTemplate template
	 */
	Page.prototype.RegisterWidgets = function(pTemplate) {
		// register inputs
		var widget = null;
		for(var k in pTemplate.register) {
			pTemplate.register[k].id = k;
			widget = Widget.Register(pTemplate.register[k]);
			if(widget != null) {
				this.widgets[widget.Name()] = widget;
			
				// handle radiogroup
				if(widget._type == 'radio') {
					var match = widget._name.match(RegExp.Cache('(.+)(\\d+)'));
					if(match != null) {
						// create radio group if necessary
						if(this.widgets[match[1]] == null) {
							this.widgets[match[1]] = new RadioGroupWidget({name:match[1]});
							pTemplate.register[match[1]] = {name:match[1]}; // register widget, required for clear
						}
						this.widgets[match[1]].AddRadioWidget(widget);
					}
				}
			
				// handle multiple checkbox
				if(widget._type == 'checkbox') {
					var match = widget._name.match(RegExp.Cache('(.+)(\\d+)'));
					if(match != null) {
						// create checkbox group if necessary
						if(this.widgets[match[1]] == null) {
							this.widgets[match[1]] = new CheckboxGroupWidget({name:match[1]});
							pTemplate.register[match[1]] = {name:match[1]}; // register widget, required for clear
						}
						this.widgets[match[1]].AddCheckboxWidget(widget);
					}
				}
			}
		}			
	};

	/**
	 * Clear and hide a template from the page (and unregister widgets).
	 * @param {string} pTargetId target html element ID
	 */
	Page.prototype.ClearTemplate = function(pTargetId) {
		var targetElement = document.getElementById(pTargetId);
		if(targetElement) {
			// delete widgets
			if(this._displayed_templates[pTargetId]) {
				var name = '';
				var template = this._displayed_templates[pTargetId];
				for(var k in template.register) {
					name = template.register[k].name;
					if(this.widgets[name] != null) {
						this.widgets[name].Destroy();
						delete this.widgets[name];
					}
				}
				
				// free template
				delete this._displayed_templates[pTargetId];
			}
			
			// put template into the page
			targetElement.innerHTML = '';
		}		
	};

	/**
	 * Give back template's name what is displayed in pTargetId html element.
	 * @param {string} pTargetId target html element ID	 
	 * @return {string} template's name
	 */
	Page.GetDisplayedTemplateName = function(pTargetId) {
		var templateName = '';
		var targetElement = document.getElementById(pTargetId);
		if(targetElement && targetElement.templateName) {
			templateName = targetElement.templateName;
		}

		return templateName;
	};

	/**
	 * Validate widgets. Widgets based on html elements and you should run this
	 * if something happend with that html elements (eg. they are not longer on the page). 
	 * If a widget not valid it will be removed from the page widget registration.
	 */
	Page.prototype.ValidateWidgets = function() {
		for(var name in this.widgets) {
			if(!this.widgets[name].IsValid()) {
				delete this.widgets[name];
			}
		}
	};

	/**
	 * Read/write widget's content.
	 * @param {string} pName widget's name
	 * @param {string|number|null} pValue content
	 * @return {string|number} content
	 */
	Page.prototype.WidgetValue = function(pName, pValue) {
		if(this.widgets[pName]) return this.widgets[pName].Value(pValue);
		return '';
	};

	/**
	 * Read/write widget's disabled status.
	 * @param {string} pName widget's name
	 * @param {boolean} pValue disabled status
	 * @return {boolean} disabled status
	 */
	Page.prototype.WidgetDisabled = function(pName, pValue) {
		if(this.widgets[pName]) return this.widgets[pName].Disabled(pValue);
		return true;
	};

	/**
	 * Scroll view to make widget visible.
	 * @param {string} pName widget's name
	 */	 
	Page.prototype.ScrollToWidget = function(pName) {
		if(this.widgets[pName] != null && this.widgets[pName]._node != null && this.widgets[pName]._node.scrollIntoViewIfNeeded) {
			this.widgets[pName]._node.scrollIntoViewIfNeeded();
		}
	};

	/**
	 * Check widget is empty or not.
	 * @return {boolean} true if empty
	 */
	Page.prototype.IsWidgetEmpty = function(pName) {
		if(this.widgets[pName]) return (this.widgets[pName].Value().length) ? false : true;
		return true;
	};

	/**
	 * Check widgets is correctly filled out or not.
	 * @param {string} parameters: widget's names
	 * @return {boolean} true if all widget's filled out
	 */
	Page.prototype.IsWidgetsFilledOut = function() {
		for(var i=0; i<arguments.length; i++) {
			if(!this.widgets[arguments[i]] || !this.widgets[arguments[i]].IsCompleted()) return false;
		}
		
		return true;
	};

	/**
	 * Check required widgets is correctly filled out or not.
	 * @return {boolean} true if all widget's filled out
	 */
	Page.prototype.IsRequiredWidgetsFilledOut = function() {
		for(var k in this.widgets) {
			if(this.widgets[k].Required() && !this.widgets[k].IsCompleted()) return false;
		}
		
		return true;
	};

	/**
	 * Show/hide an input field section (like <div class="input">).
	 * @param {string} pName widget's name
	 * @param {integer} pDepth distant (1 = first parent) of the target section container (DIV)
	 * @param {boolean} pShow false to hide input section
	 * @return {boolean} true if section is visible
	 */
	Page.prototype.InputSectionVisible = function(pName, pDepth, pShow) {
		if(this.widgets[pName] != null && this.widgets[pName]._node != null) {
			// find target HTML element
			var targetNode = this.widgets[pName]._node;
			while(pDepth-- > 0 && targetNode.parentNode != null) targetNode = targetNode.parentNode;
			
			if(pShow != null) {
				targetNode.style.display = (pShow) ? '' : 'none';
			}
			return (targetNode.style.display != 'none');
		}
		return false;
	};

/** 
 * @class Create a dragabble popup window from an HTML <DIV element.
 * @param {string} pTargetId target HTML element's ID
 */
function PopupWindow(pTargetId) {
	/** Store initial (when drag is starting) mouse position. @private @type object */
	this._mouse = {x:0,y:0};
	/** Store default position of window. @private @type object */
	this._defpos = {x:0,y:0};
	/** Store the container DIV element. @private @type object */
	this._node = null;
	/** Draggable div (usually a header) to move, if not null the window can be dragged/moved. @private @type object */
	this._dragging_node = null;
	/** Draggable div (usually a footer) to resize, if not null the window can be resized. @private @type object */
	this._resizing_node = null;
	/** Resized div. @private @type object */
	this._resized_node = null;
	/** Cache to store this._resized_node size. @private @type object */
	this._resized_size = {width:0,height:0};

	if(pTargetId != null) this.SetTargetElement(pTargetId);
};
	/**
	 * Unregister events.
	 */
	PopupWindow.prototype.Release = function() {
		this.Hide();
		if(this._node) this._node.onmousedown = null;
		if(this._dragging_node != null) Event.Unregister(this._dragging_node, 'mousedown', this, this._DragToMove);
		if(this._resizing_node != null) Event.Unregister(this._resizing_node, 'mousedown', this, this._DragToResize);
	};


	/**
	 * 
	 * @param {string} pTargetId target HTML element's ID
	 */
	PopupWindow.prototype.SetTargetElement = function(pTargetId) {
		this._node = document.getElementById(pTargetId);
		
		// set css parameters and hide window
		if(this._node) {
			this._node.style.position = 'absolute';
			this._node.onmousedown = function() {return false;}; // prevent selection below the window
			this.Hide();
		}	
	};

	/**
	 * Show window. Set position to center by default.
	 * @param {integer|null} pTop position from top
	 * @param {integer|null} pLeft position from left
	 */
	PopupWindow.prototype.Show = function(pTop, pLeft) {
		if(this._node && !this.IsDisplayed()) { 
			this._node.style.display = 'block';

			// set position (center to default)
			this.Move(pTop, pLeft);
			
			if(pTop == null || pLeft == null) {
				Event.Register(window, 'resize', this, this._SetPosition);
			}

			// store aspect ratio
			if(this._aspect_ratio != 0 & this._resized_node != null) {
				size = Misc.GetElementSize(this._resized_node);
				this._aspect_ratio = size.width / size.height;
			}

			PopupWindow._top_zIndex++;
			this._node.style.zIndex = PopupWindow._top_zIndex;
		}
	};

	/**
	 * Hide window.
	 */
	PopupWindow.prototype.Hide = function() {
		if(this._node && this.IsDisplayed()) {
			this._node.style.display = 'none';
			this._node.style.zIndex = '-1000';
		}		
	};

	/**
	 * Query window status, is it displayed or not.
	 * @return {boolean} true if displayed
	 */
	PopupWindow.prototype.IsDisplayed = function() {
		if(this._node) return (this._node.style.zIndex >= 0);
		return false;
	};

	/**
	 * Make window the top one (above others).
	 */
	PopupWindow.prototype.MoveToTop = function() {
		// move window to the top
		if(this._node != null) {
			if(this._node.style.zIndex < PopupWindow._top_zIndex) {
				PopupWindow._top_zIndex++;
				this._node.style.zIndex = PopupWindow._top_zIndex;
			}
		}
	};

	/**
	 * Set window position automatically.
	 */
	PopupWindow.prototype._SetPosition = function() {
		var docsize = Misc.GetDocumentSize();
		var size = Misc.GetElementSize(this._node);
		var top = this._defpos.y;
		var left = this._defpos.x;
		
		// centerize if position not given
		if(top == null) top = (docsize.height-size.height)/2;
		if(left == null) left = (docsize.width-size.width)/2;			
		
		// move only if user not dragged the window
		if(this._mouse.y == 0) this._node.style.top = top+'px';
		if(this._mouse.x == 0) this._node.style.left = left+'px';
	};

	/**
	 * Register a html node (usually a div as a window header) to drag window.
	 * @param {string} pTargetId HTML element's ID, where user can drag the window
	 */ 
	PopupWindow.prototype.RegisterForMove = function(pTargetId) {
		this._dragging_node = document.getElementById(pTargetId);
		if(this._dragging_node != null) {
			Event.Register(this._dragging_node, 'mousedown', this, this._DragToMove);
		}
	};

	/**
	 * Start window's dragging. @private
	 * @param {Event} pEvent event object
	 */
	PopupWindow.prototype._DragToMove = function(pEvent) {
		if(this._dragging_node != null) {
			var pos = Misc.GetElementPosition(this._node);
			this._mouse.y = pEvent.screenY-pos.y;
			this._mouse.x = pEvent.screenX-pos.x;
			
			Event.Register(document, 'mousemove', this, this._Move);
			Event.Register(document, 'mouseup', this, this._ReleaseMove);
			this.MoveToTop();
			return false;
		}
		
		return true;
	};

	/**
	 * Move window to given coordinates.
	 * If left or top is not given, the window will be moved to center.
	 * @param {integer} pLeft position from left in pixel
	 * @param {integer} pTop position from top in pixel
	 */
	PopupWindow.prototype.Move = function(pLeft,pTop) {
		this._defpos.x = pLeft;
		this._defpos.y = pTop;
		this._SetPosition();
	};

	/**
	 * Drag (move) window. @private
	 * @param {Event} pEvent event object
	 */
	PopupWindow.prototype._Move = function(pEvent) {
		if(this._node) {
			this._node.style.top = (pEvent.screenY-this._mouse.y)+'px';
			this._node.style.left = (pEvent.screenX-this._mouse.x)+'px';
		}
		return false;
	};

	/**
	 * Stop window's dragging. @private
	 */
	PopupWindow.prototype._ReleaseMove = function() {
		Event.Unregister(document, 'mousemove', this, this._Move);
		Event.Unregister(document, 'mouseup', this, this._ReleaseMove);
		return false;
	};

	/**
	 * Register a html node (usually a div as a window header) to resize window.
	 * @param {string} pTargetId HTML element's ID, where user can resize the window
	 * @param {string} pTargetId resized HTML element's ID
	 */ 
	PopupWindow.prototype.RegisterForResize = function(pTargetId, pResizedId) {
		this._resizing_node = document.getElementById(pTargetId);
		this._resized_node = document.getElementById(pResizedId);
		if(this._resizing_node != null && this._resized_node != null) {
			Event.Register(this._resizing_node, 'mousedown', this, this._DragToResize);
		}
	};

	/**
	 * Set fixed aspect property for resizable window.
	 * @param (boolean) pFixAspect if true aspect of window doesn't changing while resizing
	 * @return {boolean} true if fixed property set
	 */
	PopupWindow.prototype.FixAspectRatio = function(pFixAspect) {
		// set aspect ratio
		if(pFixAspect != null) this._aspect_ratio = (pFixAspect) ? 1 : 0;
		
		return (this._aspect_ratio != 0) ? true : false;
	};

	/**
	 * Start window's resizing. @private
	 * @param {Event} pEvent event object
	 */
	PopupWindow.prototype._DragToResize = function(pEvent) {
		if(this._resized_node != null) {
			this._mouse.y = pEvent.screenY;
			this._mouse.x = pEvent.screenX;

			Event.Register(document, 'mousemove', this, this._Resize);
			Event.Register(document, 'mouseup', this, this._ReleaseResize);
			this.MoveToTop();

			// cache size
			this._resized_size = Misc.GetElementSize(this._resized_node);
			
			return false;
		}
		return true;
	};

	/**
	 * Resize window by drag. @private
	 * @param {Event} pEvent event object
	 */
	PopupWindow.prototype._Resize = function(pEvent) {
		if(this._resized_node != null) {
			// calculate new size
			this._resized_size.width += (pEvent.screenX-this._mouse.x);
			this._resized_size.height += (pEvent.screenY-this._mouse.y);
			
			this.Resize();
			
			// store actual mouse pos
			this._mouse.x = pEvent.screenX;
			this._mouse.y = pEvent.screenY;
		}
		return false;
	};

	/**
	 * Resize window directly.
	 * @param (integer) pWidth target width
	 * @param (integer) pHeight target height
	 */
	PopupWindow.prototype.Resize = function(pWidth, pHeight) {
		if(arguments.length > 0) {
			this._resized_size.width = (pWidth != null) ? pWidth : 0;
			this._resized_size.height = (pHeight != null) ? pHeight : 0;
		}

		// check aspect ratio
		if(this._aspect_ratio != 0) {
			if(this._resized_size.height == 0 || this._resized_size.width / this._resized_size.height <= this._aspect_ratio) {
				this._resized_size.height = this._resized_size.width / this._aspect_ratio;
			}
			else {
				this._resized_size.width = this._resized_size.height * this._aspect_ratio;				
			}
		}
		
		// set html element size
		this._resized_node.style.width = (this._resized_size.width > 0 ? this._resized_size.width : 0)+'px';
		this._resized_node.style.height = (this._resized_size.height > 0 ? this._resized_size.height : 0)+'px';
	};

	/**
	 * Stop window's resizing. @private
	 */
	PopupWindow.prototype._ReleaseResize = function() {
		Event.Unregister(document, 'mousemove', this, this._Resize);
		Event.Unregister(document, 'mouseup', this, this._ReleaseResize);

		if(this._resized_node != null) {
			Messages.Send({sender:this._resized_node.id, message:'POPUP_WINDOW_RESIZED', userdata:{
				width:this._resized_size.width, height:this._resized_size.height} });
		}

		return false;
	};

	PopupWindow._top_zIndex = 1000;


/** 
 * @class Create a dragabble popup window from an HTML <DIV element with decorated border.
 * @param {string} params.targetId target HTML element's ID
 * @param {string params.templateId template's name of frame - optional
 * @param {Page} params.page register inputs into this page - optional
 */
function DecoratedPopupWindow(params) {
	if(params.targetId != null) this.SetTargetElement(params.targetId);
	this.CreateDecoratedFrame(params);
};
	DecoratedPopupWindow.prototype = new PopupWindow;
	
	/**
	 * Create decorated frame. @private
	 * @param {string params.templateId template's name of frame
	 * @param {Page} params.page register inputs into this page
	 */
	DecoratedPopupWindow.prototype.CreateDecoratedFrame = function(params) {
		if(this._node != null && params.page != null && Template.IsCached(params.templateId)) {
			Template.SetData(params.templateId, {1:{windowid:this._node.id}});

			this._node.id += "_win";
			this._node.className += " decwin";
			params.page.ShowTemplate(Template.Generate(params.templateId), this._node.id);
		}
	};


Messages.Send({sender:'page.js', message:'JS_LOADED'});
//-->