<!--
/**                                                                              
 * @fileoverview Debug functions.
 *
 * @author Zoltan Kovacs werdy@freemail.hu
 * @version 140217
 * 140217 - add logging generic messages
 */

/**
 * @class Show messages in a popup window.
 * @param {string} pTargetId target HTML element's ID
 */
function DebugMessages(pTargetId) {
	Template.Save(DebugMessages._template);

	DebugMessages._window = new PopupWindow(pTargetId);
	DebugMessages._page = new Page();
	DebugMessages._page.ShowTemplate(Template.Generate('debugmessages'),pTargetId);
	DebugMessages._window.RegisterForMove('debugmessages_header');
	
	DebugMessages._log_node = document.getElementById('debugmessages_log');
	
	Messages.debug = true;
	
	Messages.Register({sender:'sent_messages',message:'WIDGET_VALUE_CHANGED',funct:DebugMessages._SetLoggingSentMessages});
	Messages.Register({sender:'received_messages',message:'WIDGET_VALUE_CHANGED',funct:DebugMessages._SetLoggingReceivedMessages});
	Messages.Register({sender:'log_messages',message:'WIDGET_VALUE_CHANGED',funct:DebugMessages._SetLoggingLogMessages});
	Messages.Register({sender:'clear_log',message:'WIDGET_BUTTON_CLICKED',funct:DebugMessages.ClearLog});
};
	/**
	 * Start/stop logging sent messages. @private
	 */
	DebugMessages._SetLoggingSentMessages = function() {
		if(DebugMessages._page) {
			if(DebugMessages._page.WidgetValue('sent_messages')) {
				DebugMessages._ShowLog();
				DebugMessages.sent_messages_reg = Messages.Register(
					{sender:'Messages',message:'DEBUG_SEND_MESSAGE',funct:DebugMessages._Logging});
			}
			else {
				Messages.Unregister(DebugMessages.sent_messages_reg);
				DebugMessages._HideLogIfAllDisabled();
			}
		}
	};

	/**
	 * Start/stop logging received messages. @private
	 */
	DebugMessages._SetLoggingReceivedMessages = function() {
		if(DebugMessages._page) {
			if(DebugMessages._page.WidgetValue('received_messages')) {
				DebugMessages._ShowLog();
				DebugMessages.received_messages_reg = Messages.Register(
					{sender:'Messages',message:'DEBUG_MESSAGE_RECEIVED',funct:DebugMessages._Logging});
			}
			else {
				Messages.Unregister(DebugMessages.received_messages_reg);
				DebugMessages._HideLogIfAllDisabled();
			}
		}
	};

	/**
	 * Start/stop logging log messages. @private
	 */
	DebugMessages._SetLoggingLogMessages = function() {
		if(DebugMessages._page) {
			if(DebugMessages._page.WidgetValue('log_messages')) {
				DebugMessages._ShowLog();
			}
			else {
				DebugMessages._HideLogIfAllDisabled();
			}
		}
	};

	/**
	 * Set logging for sent/received messages.
	 * @param {boolean} pForSentMesssages for sent messages
	 * @param {boolean} pForReceivedMesssages for received messages
	 */
	DebugMessages.SetLogging = function(pForSentMessages, pForReceivedMessages, pForLogMessages) {
		if(DebugMessages._page) {
			DebugMessages._page.WidgetValue('sent_messages', pForSentMessages);
			DebugMessages._page.WidgetValue('received_messages', pForReceivedMessages);
			DebugMessages._page.WidgetValue('log_messages', pForLogMessages);
		}
	};

	/**
	 * Show log section. @private
	 */
	DebugMessages._ShowLog = function() {
		if(DebugMessages._log_node) DebugMessages._log_node.style.height = '200px';
	};

	/**
	 * Hide log section, show only the header. @private
	 */
	DebugMessages._HideLog = function() {
		if(DebugMessages._log_node) DebugMessages._log_node.style.height = '0px';
	};
	
	/**
	 * Hide log section, show only the header. @private
	 */
	DebugMessages._HideLogIfAllDisabled = function() {
		if(!DebugMessages._page.WidgetValue('sent_messages') && !DebugMessages._page.WidgetValue('received_messages') && !DebugMessages._page.WidgetValue('log_messages')) DebugMessages._HideLog();
	};

	/**
	 * Clear log.
	 */
	DebugMessages.ClearLog = function() {
		DebugMessages._log = '';
		DebugMessages._DisplayLog('');
	};

	/**
	 * Show user interface (window).
	 */
	DebugMessages.ShowUI = function() {
		if(DebugMessages._window) DebugMessages._window.Show();
	};

	/**
	 * Hide user interface (window).
	 */
	DebugMessages.HideUI = function() {
		if(DebugMessages._window) DebugMessages._window.Hide();		
	};
	
	/**
	 * Show message in log field. @private
	 * @param {string} pMessage message to display in log
	 */
	DebugMessages.Log = function(pMessage) {
		if(DebugMessages._page && DebugMessages._page.WidgetValue('log_messages')) {
			var now = new Date();
			
			DebugMessages._log = '<b>L '+now.getHours()+':'+now.getMinutes()
				+':'+now.getSeconds()+'.'+now.getMilliseconds()+'</b> '
				+pMessage+'<br/>'
				+DebugMessages._log;
			DebugMessages._DisplayLog(DebugMessages._log);
		}
	};
	
	/**
	 * Show message in log field. @private
	 * @param {string} params.sender message's owner
	 * @param {string} params.message (eg. JS_LOADED)
	 * @param {function} params.funct target function
	 */
	DebugMessages._Logging = function(params) {
		if(DebugMessages._page) {
			var now = new Date();
			var method = (params.message == 'DEBUG_SEND_MESSAGE') ? 'S' : 'R';
			
			DebugMessages._log = '<b>'+method+' '+now.getHours()+':'+now.getMinutes()
				+':'+now.getSeconds()+'.'+now.getMilliseconds()+'</b> '
				+params.userdata.sender+' &rArr; '+params.userdata.message+'<br/>'
				+DebugMessages._log;
			DebugMessages._DisplayLog(DebugMessages._log);
		}
	};

	/**
	 * Display log (string) in the window. @private
	 * @param {string} pContent content
	 */
	DebugMessages._DisplayLog = function(pContent) {
		if(DebugMessages._log_node) DebugMessages._log_node.innerHTML = pContent;
	};

	/** storage for the logs @type string */
	DebugMessages._log = '';
	/** element which display log */
	DebugMessages._log_node = null;
	/** storage for the page @private @type Page */
	DebugMessages._page = null;
	/** storage for the popup window @private @type PopupWindow */
	DebugMessages._window = null;
	/** sent messages receiver ID @private @type object */
	DebugMessages._sent_message_reg = null;
	/** received messages receiver ID @private @type object */
	DebugMessages._received_message_reg = null;
	/** template @private @type object */
	DebugMessages._template = {
		name: 'debugmessages',
		html: '\
<div id="debugmessages" style="text-align: left;color:#000;border:2px solid #999;">\
 <div id="debugmessages_header" style="background:#bbb;padding:2px;">\
  <input type="checkbox" id="debugmessages_sent_messages" value="1"/>sent messages&nbsp;\
  <input type="checkbox" id="debugmessages_received_messages" value="1"/>received messages&nbsp;\
	<input type="checkbox" id="debugmessages_log_messages" value="1"/>logs&nbsp;\
  <input type="button" id="debugmessages_clear_log" value="clear log"/>\
 </div>\
 <div id="debugmessages_log" style="background:#eee;overflow:auto;padding:0px;width:400px;height:0px;font-size:11px;">&nbsp;</div>\
</div>',
		register: {
			'debugmessages_sent_messages': {name:'sent_messages'},
			'debugmessages_received_messages': {name:'received_messages'},
			'debugmessages_log_messages': {name:'log_messages'},
			'debugmessages_clear_log': {name:'clear_log'}
		}
	};

/**
 * @class Debug functions.
 */
function Debug() {};
	/**
	 * Dump an object into a string.
	 * @param {string} pObjName object name
	 * @param {object} pObj object
	 * @param {boolean} pHtmlOutput if true formatted html output will be generated
	 * @return {string} dump
	 */
	Debug.DumpObject = function(pObjName, pObj, pHtmlOutput, pLevel) {
		if(pLevel == 0) return ''; // only 5 level deep dumped
		if(!pLevel) pLevel = 5;
		
		var dump = '';
		var obj_sep = '.';
		var key_value_sep = ' -> ';
		var new_line = '';

		if(pHtmlOutput) {
			obj_sep = ' &bull; ';
			key_value_sep = ' &rArr; ';
			new_line = '<br/>';
		}

		for(var key in pObj) {
			if(typeof(pObj[key]) == 'object') {
				dump += pObjName+obj_sep+key+key_value_sep+"--- OBJECT ---"+new_line+"\n";
				dump += this.DumpObject(pObjName+obj_sep+key, pObj[key], pHtmlOutput, pLevel-1);
			}
			else dump += pObjName+obj_sep+key+key_value_sep+pObj[key]+new_line+"\n";
		}
		
		return dump;
	};


	/**
	 * Store actual date in millisec. Working in pair with {@link #StopBenchmark}.
	 */
	Debug.StartBenchmark = function() {
		Debug._benchmark_started_at = (new Date()).getTime();
	};
	
	/**
	 * Return time in millisec ellapsed since {@link #StartBenchmark} call.
	 * @return {integer} ellapsed time in millisec
	 */
	Debug.StopBenchmark = function() {
		return (new Date()).getTime() - Debug._benchmark_started_at;
	};
	
	/** Stored time for benchmark functions. @private */
	Debug._benchmark_started_at = 0;


Messages.Send({sender:'debug.js',message:'JS_LOADED'});
//-->