var sOn = sOn || {};
sOn.Config = sOn.Config || { };

sOn.Utils = sOn.Utils || {};

sOn.Utils.isNumber = function(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

sOn.Utils.trim = function (str) {
	return str.replace(/^\s+|\s+$/g, '');
};

sOn.Utils.isArray = function(obj) {
	return (obj && obj.constructor && obj.constructor.toString().indexOf("Array") != -1);
};

sOn.Utils.redirector = {
	popup: function (url, windowName, features, replace){
		window.open(url, windowName, features, replace);
	},
	redirect: function (url) {
		window.location.href = url;
	},
	refresh: function () {
		window.location.reload();
	}
};

sOn.Utils.isEmptyObject = function (obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop))
			return false;
	}
	return true;
};

sOn.Utils.roundToTwoDecimal = function(number) {
	return Math.round(number * 100) / 100;
};

sOn.Utils.currentBrowser = {
	name: window.navigator.userAgent,
	isFirefox: function () {return this.name.toLowerCase().indexOf("firefox") != -1;},
	isChrome: function () {return this.name.toLowerCase().indexOf("chrome") != -1;},
	isIE: function () {return this.name.toLowerCase().indexOf("explorer") != -1}
};
	
﻿//------ Business Objects ------
window.sOn = window.sOn || { };

(function (sOn, undefined) {
	
	// Base objects for models and collections  ---------------------------
	
	function sOnDTO(properties) {
		this.id = 0;
		this.name = "";
		for(var prop in properties) {
			this[prop] = properties[prop];
		}
	};
	sOnDTO.prototype.constructor = sOnDTO;
	
	sOnDTO.prototype.toJSON = function() { 
		return this;
	};
	sOnDTO.prototype.clone = function() {
		var instance = new sOnDTO(this);
		return instance;
	};
	
	// The collection
	
	function sOnCollection(initObj) {
		this.isSOnCollection = true;
		this.isSonCollection = true;
		if (sOn.Utils.isArray(initObj)){	
			throw Error('Collections can not be initialized with array, use { models: myArray }');
		}
		initObj = initObj || { };
		this.modelsById = {};
		this.models = [];
		this.length = 0;
		this.dtoType = sOnDTO;
		if (initObj.dtoType) {
			this.dtoType = initObj.dtoType;
		}
		this.init(initObj.models);
	}
	sOnCollection.prototype.constructor = sOnCollection;
	sOnCollection.prototype.init = function(models) {
		if (!models) return;
		if (!sOn.Utils.isArray(models)){	
			throw Error('Models have to be an array --> { models: myArray }');
		}
		var len = models.length;
		for (var i = 0; i < len; i++) {
			this.add(models[i]);
		}
	};
	sOnCollection.prototype.remove = function(id) {
		delete(this.modelsById[id]);
		var len = this.models.length;
		for(var i = 0; i < len; i++) {
			if(this.models[i].id == id) {
				this.models.splice(i, 1);
				break;
			}
		}
		this.length--;
	};
	sOnCollection.prototype.clone = function() {
		var cloned = new sOnCollection();
		cloned.dtoType = this.dtoType;
		var len = this.length;
		for(var i=0;i<len;i++) {
			cloned.add(this.models[i].clone());
		}
		return cloned;
	};
	sOnCollection.prototype.add = function(model) {
		if (!model)
			return;
		if (model.id === null || model.id === undefined)
			throw Error("Items Id cant be null or undefined");
		if (this.containsItem(model)) {
			throw Error("This collection already contains an item with this id:" + model.id);
		}
		if (!(model instanceof sOnDTO)) {
			model = new this.dtoType(model);
		}
		this.modelsById[model.id] = model;
		this.models.push(model);
		this.length = this.length + 1;
	};
	sOnCollection.prototype.addArray = function(modelArray) {
		var len = modelArray.length;
		for (var i = 0; i < len; i++) {
			if (modelArray[i])
			   this.add(modelArray[i]);
		}
	};
	sOnCollection.prototype.get = function(id) {
		return this.modelsById[id];
	};
	sOnCollection.prototype.containsItem = function(item) {
		if (!item)
			return false;
		return this.modelsById[item.id];
	};
	
	sOnCollection.buildFromDynamicList = function(data) {
		var collection = new sOnCollection({models: []});
		for (var i = 0, len = data.length; i < len; i++) {
			var item = data[i];
			var model = {id: i};
			for (var j = 0, lenj = item.length; j < lenj; j++) {
				model[item[j].Key] = item[j].Value;
				model.id = i;
				model.name = "-";
			}
			collection.add(model);
		}
		return collection;
	};	
				
	sOn.Models = sOn.Models || { };
	sOn.Models.sOnDTO = sOnDTO;
	sOn.Models.sOnCollection = sOnCollection;	
} (window.sOn));

﻿sOn = sOn || { };

sOn.Theme = sOn.Theme || {};


﻿window.sOn = window.sOn || {};

(function(sOn, undefined) {

	function Logger() {
		this.logException = function(ex) {
			if (window.console && typeof console.log != "undefined") {
				console.log(ex);
				var trace = ex.stack || ex.message;
				if (trace)
					console.log(trace);
			}
				
		};
		function getCaller() {
			try {
				return arguments.callee.caller.caller.toString();
			}	
			catch(e) {
				return "";
			}
		}
		
		this.logAlsoCaller = function(message) {
			if (window.console && typeof console.log != "undefined") {
				console.log(message + " - " + getCaller());
				console.trace();
			}
		};
		
		this.log = function(message) {
			if (window.console && typeof console.log != "undefined") {
				console.log(message);
			}
		};
		this.info = function(message) {
			if (window.console && typeof console.info != "undefined")
				console.info(message);
		};
		this.error = function(message) {
			if (window.console && typeof console.error != "undefined")
				console.error(message);
		};
	};

	sOn.Logger = new Logger();
	
}(window.sOn));
﻿window.sOn = window.sOn || {};

(function(sOn, undefined) {

	var jsErrorEncoder = function() {
		this.encode = function(msg, srcUrl, line) {
			var data  = "ErrorData: " + msg + " SourcePage: " + srcUrl + " Line: " + line;
			data = data.replace(/'/g, "");
			data = data.replace(/"/g, "");
			data = data.replace(/=/g, "EQUALS");
			data = data.replace(/;/g, "_");
			data = data.replace(/\//g, "_");
			data = data.replace("http", " ");
			data = data.replace("https", " ");
			return data;
		};
	}
	//------ CLASS -----------------
	function Client() {
		var self = this;
		this.HOME_ALIAS_CHAR = "~";
		this.provider = new sOn.Models.sOnDTO;
		this.urlPrefix = "..";
		this.urlPrefixForErrorLog = null;
		this.urlForErrorLog = "~/Controllers/clientErrors.ashx?cmd=add";
		
		this.initialize = function(){
			if (!window.onerror){
				this.catchUnhandledErrors();
			};	
		};		
			
		this.catchUnhandledErrors = function () {
			window.onerror = function(msg, srcUrl, line){
					window._registeredErrors = arguments;
					var parser = new jsErrorEncoder();
					var data = parser.encode(msg, srcUrl, line);
					var url = self._addPrefixToUrl(self.urlForErrorLog);
					$.post(url , {errorData: data}, function (){});
				};
		};
	};

	Client.prototype = {
		constructor: Client,
		markThisClientAsTheOnlyOneCapturingUnhandledErrors: function () {
			this.catchUnhandledErrors();
		},	
		formatUrlDependingOnComponent : function() {
			if(sOn.Config.CurrentApp.targetPrefix)
				return this.urlPrefix + sOn.Config.CurrentApp.targetPrefix;
			
			return this.urlPrefix;
		},
		requestData: function(url, data, callback) {
			var self = this;
			var json = this.provider;
			if (this.provider.toJSON)
				json = this.provider.toJSON();
			data.provider = JSON.stringify(json);
			this.onCallStart();
			$.ajax(
				{
					type: 'POST',
					url: self._addPrefixToUrl(url),
					data: data,
					dataType: 'json',
					error: function(xhr) {
						self._handleError(xhr);
					},
					success: function(data) {
						self._handleResponse(data, callback);
					}
				}
		);
		},
		_addPrefixToUrl: function(url) {
			if(url.charAt(0) == this.HOME_ALIAS_CHAR) {
				var replaced = url.replace(this.HOME_ALIAS_CHAR,
					sOn.Config.CurrentApp.targetPrefix);
				replaced = replaced.replace("//","/");
				return replaced;
			}
			return url;
		},
		_handleResponse: function(data, callback) {
			var self = this;
			this.onCallEnd();
			if (data) {
				if (data.error) {
					self.onError(data.error.message, data.error.code);
					return false;
				}
				callback(data);
			}
			else {
				self.onError("null data");
			}
		},
		_formatErrorMessage: function(xhr){
			var message = "Error contactando con el servidor ({1}:{0})";
			message = message.replace("{0}", xhr.statusText);
			message = message.replace("{1}", xhr.status);
			return message;
		},
		_handleError: function(xhr) {
			this.onCallEnd();
			this.customErrorHandling(xhr);
			this.onError(this._formatErrorMessage(xhr), xhr.status);
		},
		onError: function(msg, status) { }, //to be handled
		onCallStart: function() { }, //to be handled
		onCallEnd: function() {}, // to be handled
		customErrorHandling: function(xhr){} // to be overrided
	};
	
	
	function HealthConnectClient(controller){
		Client.call(this);
		this.controller = controller;
	};
	
	HealthConnectClient.prototype = new Client();
	HealthConnectClient.prototype.customErrorHandling = function(xhr) {
			if (xhr.status == 403)
				window.parent.sOn.redirectToLogin();
	};
	
	
	sOn.Network = sOn.Network || { };
	sOn.Network.Client = Client;
	sOn.Network.jsErrorEncoder = jsErrorEncoder;
	sOn.Network.HealthConnectClient = HealthConnectClient;
	
}(window.sOn));
window.sOn = window.sOn || {};

(function(sOn, undefined) {
	function QueryString(){
		this.values = {};
	};
	
	QueryString.prototype.parse = function(url){
		url = this._removeHashPart(url);
		var query = url.split("?")[1];
		if(query){
			var queryValuePairs = query.split("&");
			this._addAllKeyValuePairs(queryValuePairs);		
		}
		this.firstPathElement = "/" + url.split("/")[3] + "/";
	};
	
	QueryString.prototype._removeHashPart = function(url) {
		var indexOfHash = url.indexOf("#");
		if(indexOfHash > 0){
			url = url.substring(0, indexOfHash);
		}
		return url;
	};

	QueryString.prototype._addAllKeyValuePairs = function(queryValuePairs) {
		for (i in queryValuePairs) {
			var pair = queryValuePairs[i].split("=");
			var key = pair[0];
			var value = pair[1];
			this.values[key] = value;
		}
	};
	
	sOn.QueryString = QueryString;
	
}(window.sOn));
﻿window.sOn = window.sOn || {};

(function (sOn, undefined) {

	sOn.Culture = sOn.Culture || {};
	//todo: choose one name and change the references.
	sOn.Culture.SPAIN = "es-ES";
	sOn.Culture.es_ES = "es-ES";
	sOn.Culture.BRAZIL = "pt-BR";
	sOn.Culture.pt_BR = "pt-BR";
	
	var defaultCulture = sOn.Culture.SPAIN;	
	sOn.Culture.Translations  = sOn.Culture.Translations || { date: {}, number: {}, strings: {}};

	sOn.Culture.setCurrent = function (culture) {
		sOn.Culture.current = culture;
		sOn.Culture.date = sOn.Culture.Translations.date;
		sOn.Culture.number = sOn.Culture.Translations.number;
		sOn.Culture.strings = sOn.Culture.Translations.strings;
	};

} (window.sOn));
﻿window.sOn = window.sOn || {};

(function(sOn, undefined) {
	
	var CookieManager = function() {
		var expirationHours = 20;
		
		/*  
			todo: tenemos que utilizar sOn.Config.CurrentApp.targetPrefix en 
			lugar de calcular el path así, pero hay que coordinarlo con 
			devops por que los nodos de jenkins acceden dependiendo de su
			ubicación física a uat...com/ o localhost:1234/
		*/
		
		function calculateCookiePath() {
			var url = window.location.href;
			if (url.indexOf('//localhost') > 0  || url.indexOf('//127.0.0.1') > 0)
				return '/' + url.split('/')[3];
			if (url.indexOf('//uat.') > 0)
				return '/' + url.split('/')[3] + '/' + url.split('/')[4];
			if (url.indexOf('//brasil.') > 0 || url.indexOf('//brazil.') > 0)
				return '/' + url.split('/')[3];
			return '/';
		};
		
		function calculateCookieParams() {
			var cookiePath = calculateCookiePath();		
			var expirationTime = new Date();
			var hours = 60 * 60 * 1000;
			expirationTime.setTime(expirationTime.getTime() + (expirationHours * hours)); 
			return {
				path : cookiePath,
				expires: expirationTime
			};
		}
		this.setCookie = function (name, value) {
			var cParams = calculateCookieParams();
			$.cookie(name, value, {
				path: cParams.path,
				expires: cParams.expires
			});
		};
		this.getCookie = function (name) {
			return $.cookie(name);
		};
		this.deleteCookie = function(name) {
			$.cookie(name, null);
		};
	};
	
	////////////////////////////////////////////////////

	var SessionManager = function() {
		var sessionCookieName = "session";
		this.createSession = function(token, user) {
			this.cookieManager.setCookie(sessionCookieName, token);
			this.store("user", user);
		};
		this.destroySession = function() {
			this.cookieManager.deleteCookie(sessionCookieName);
			this.store("user", null);
		};
		this.isLoggedIn = function() {
			return this.loggedUser() && this.cookieManager.getCookie(sessionCookieName);
		};
		this.loggedUser = function() {
			return this.retrieve("user");
		};
		this.retrieve = function(key) {
			var data = this.cookieManager.getCookie(key);
			if (typeof(data) != 'undefined' && data != 'undefined') {
				return this.parser.parse(data);
			}
			return null;
		};
		this.store = function(key, value) {
			this.cookieManager.setCookie(key, this.parser.stringify(value));
		};
	};

	sOn.Session = sOn.Session || {};
	sOn.Session.CookieManager = CookieManager;
	sOn.Session.SessionManager = SessionManager;
	
	var sessionManagerSingleton;
	sOn.Session.getInstance = function() {
		if(!sessionManagerSingleton)
			sessionManagerSingleton = CreateSessionManager();
		return sessionManagerSingleton;
	};
	sOn.Session.clearInstance = function() {
		sessionManagerSingleton = null;
	};
	sOn.Session.temporarySessionCheckForLegacyControllers = function(msg, code) {
		if(code == 403 || code == -32750) {
			alert("Tu sesíón ha caducado, por favor vuelve a iniciar sesión.");
			sOn.Session.getInstance().destroySession();
			window.location.reload();
		}	
	};
	
	/************* Factory ******************/
	
	function CreateSessionManager() {
		var sm = new SessionManager();
		sm.cookieManager = new CookieManager();
		sm.parser = JSON;
		return sm;
	}
	
	sOn.Factory = sOn.Factory || {};
	sOn.Factory.SessionManager = CreateSessionManager;
	
})(window.sOn);
﻿window.sOn = window.sOn || {};

(function (sOn, undefined) {
	//------ CLASS -----------------

	var i18n = sOn.Culture || sOn.i18n || {};
	i18n.strings = i18n.strings || {};
	i18n.strings.widgets = i18n.strings.widgets || { 
			table: { }, 
			confirmation: { no: 'No', yes: 'Yes'} 
	};	
	i18n.strings.status = i18n.strings.status || {};

	sOn.shouldAutoCreateWidgets = true;
	
	function getRandomId() {
		return Math.random().toString().replace(/\./g, "");	
	};
	
	///////////////////////////////////////////////////////////
	
	function AlertDialog() {
		
	};
	AlertDialog.prototype.constructor = AlertDialog;
	AlertDialog.prototype.alert = function (msg){ alert(msg);};	
	
	///////////////////////////////////////////////////////////////
	
	function isNotExecutingUnitTests() {
		return window.document.title.indexOf("Jasmine") < 0;
	}

	function Widget(elementId, placeholder) {
		this.elementId = elementId;
		this.givenPlaceholder = placeholder;
		this.placeholder = null;
		this._nativeWidget = null;
		this.nativeWidget = "'--- NativeWidget ya no es un campo, ahora es el metodo getNativeWidget() ---'";
	}

	var givenPlaceholderLooksId = function(placeholder){
		return placeholder && typeof(placeholder) == 'string';
	};

	var givenPlaceholderLooksElement = function(placeholder){
		return placeholder && typeof(placeholder) == 'object';
	};	

	Widget.prototype = {
		constructor: Widget,
		_createPlaceholderIfNecessary: function(placeholder){
			if (!this.placeholder || this.placeholder.length === 0){
				this.placeholder = $('<div>', {id: placeholder});
			    $('body').append(this.placeholder);
			}
		},
		_determinePlaceholder : function(){
			if (this.placeholder)
				return;
			var existingElement = $('body').find('#' + this.elementId);
			if (existingElement.length > 0){
				this.placeholder = existingElement.parent();
				return;
			}
			var placeholder = this.givenPlaceholder;
			if (givenPlaceholderLooksId(placeholder))
				this.placeholder = $('#' + placeholder);
			else if (givenPlaceholderLooksElement(placeholder))
				this.placeholder = placeholder;
			else
				placeholder = getRandomId();
			this._createPlaceholderIfNecessary(placeholder);
		},
		getNativeWidget: function () {
			if (this._nativeWidget)
				return this._nativeWidget;
			throw new Error("Widget is not ready. Did you forget to call initialize()?:");
			
		},
		registerNativeWidget: function (widget) {
			this._nativeWidget = widget;
		},
		isReady: function () {
			if (this._nativeWidget)
				return true;
			return false;
		},
		domElementDoesntExist: function () {
			return !this.domElementExist();
		},
		domElementExist: function () {
			if(!this._nativeWidget) {
				return false;
			}
			return this._nativeWidget.length > 0;
		},
		addClass: function(name){
			this.getNativeWidget().addClass(name);
		},
		removeClass: function(name){
			this.getNativeWidget().removeClass(name);
		},
		disable : function() {
			this.getNativeWidget().attr("disabled", "disabled"); 
		},
		enable : function() {
			this.getNativeWidget().removeAttr("disabled"); 
		},
		getCssClasses : function(){
			return this.getNativeWidget().attr('class') || "";
		},		
		clearDOM: function () {
			this.getNativeWidget().remove();
		},
		remove: function () {
			this.getNativeWidget().remove();
		},
		_createDomElement: function () {
			sOn.Logger.error("This should be overriden!");
		},
		_initializeDomElement : function () { }, //to be overrided
		bindToDom: function () {
		    this._attachNativeWidget();  
		},
		_attachNativeWidget: function() {
			this.idHandler = "#" + this.elementId;
			this.registerNativeWidget(this.placeholder.find(this.idHandler));	
		},
		_attachNativeWidgetForTesting: function () {
			var widget = $(this.idHandler);
			widget.appendTo(this.placeholder);
			this.registerNativeWidget(widget);
			sOn.sOnDOMwarning = "Warning! widget does not exists. Creating a new one in DOM:" + this.elementId;
			if (isNotExecutingUnitTests())
				sOn.Logger.log(sOn.sOnDOMwarning);
		},
		draw: function () {
			if(this.elementId){
				this._attachNativeWidget();
				if(this.domElementDoesntExist()) {
					this._attachNativeWidgetForTesting();			
				}
			}
			if (this.domElementDoesntExist() && sOn.shouldAutoCreateWidgets) {
				this._createDomElement();
			};
			this._visible = this.getNativeWidget().css("display") != "none";
		},
		initialize: function () {
			this._determinePlaceholder();
			this.draw();
			this._initializeDomElement();
		},
		_initializeForcingAutoCreation: function () {
			this._determinePlaceholder();
			if (this.domElementDoesntExist())
				this._createDomElement();
			this.initialize();
		},
		_initializeForcingIfNeccessary: function (domElementId) {
			this._determinePlaceholder();
			this.bindToDom();
		    if (!domElementId || this.domElementDoesntExist()) {
				this._initializeForcingAutoCreation();
				return;
			}
			this.initialize();
		},
		show: function() {
			this.getNativeWidget().show();
			this._postShow.apply(this, arguments);
			this._visible = true;
		},
		_postShow: function() {}, //to be overrided
		hide: function(){
			this.getNativeWidget().hide();
			this._visible = false;
		},
		focus: function() {
			this.getNativeWidget().focus();
		},
		html: function() {
			return this.getNativeWidget().html();
		},
		setHtml: function (html) {
			this.getNativeWidget().html(html);
		},
		visible: function(){
			return this._visible;
		},
		placeHolderForChildElements: function() {
			return this.getNativeWidget();
		},
		addClassByWidgetType: function (Wtype) {
			if (Wtype && Wtype.cssClass)
			this.getNativeWidget().addClass(Wtype.cssClass);			
		}
	};

	Widget.disabledClass = "disabled";
	//------ CLASS -----------------

	function TextBoxWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
		this._lastValue = null;
		this.isTextBox = true;
	}

	TextBoxWidget.prototype = new Widget();
	TextBoxWidget.prototype.constructor = TextBoxWidget;

	TextBoxWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<input>', { type: "text", id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	TextBoxWidget.prototype._initializeDomElement = function () {
		var self = this;
		this.getNativeWidget().change(function(e) {
			self._lastValue = self._valueFromChangeEvent(e);
			self.onChange(self._lastValue);
		});
		this.getNativeWidget().keyup(function (e) {
			var keyCode = e.keyCode || e.wich;
			var enterKeyCode = 13;
			if (keyCode == enterKeyCode)
				self.onEnter();
		});
		this.getNativeWidget().attr('name', this.elementId);
		this.clear();
		this._customDomInit();
	};

	TextBoxWidget.prototype._customDomInit = function() {}; // abstract method
	
	TextBoxWidget.prototype.text = function() {
		return this.getNativeWidget().val();
	};
	
	TextBoxWidget.prototype.lastValue = function() {
		return this._lastValue || this.getNativeWidget().val();
	};

	TextBoxWidget.prototype.setText = function(value) {
		if (this.getNativeWidget().val() != value) {
			this.getNativeWidget().val(value);
			this._lastValue = value;
			this.onChange(value);
		}
	};

	TextBoxWidget.prototype.setMask = function(mask) {
		if ($.mask) {
			this.getNativeWidget().mask(mask);
		}
	};
	
	TextBoxWidget.prototype._valueFromChangeEvent = function (e) {
		return $(e.target).val();
	};
	
	TextBoxWidget.prototype.onChange = function (selectedValue) { }; // to be handled
	
	TextBoxWidget.prototype.onEnter = function () { }; // to be handled

	TextBoxWidget.prototype.clear = function () {
		this.getNativeWidget().val("");
		if (this.getNativeWidget().placeholderEnhanced) {
			this.getNativeWidget().placeholderEnhanced().blur();
		}
	};

	//------ CLASS -----------------

	function AutocompleteTextBoxWidget(elementId, placeholder) {
		TextBoxWidget.call(this, elementId, placeholder);
		this._lastValue = null;
	}

	AutocompleteTextBoxWidget.prototype = new TextBoxWidget();
	AutocompleteTextBoxWidget.prototype.constructor = AutocompleteTextBoxWidget;

	AutocompleteTextBoxWidget.prototype.onSearch = function() {}; // to be handled
	AutocompleteTextBoxWidget.prototype.onSelect = function(text) {}; // to be handled
	AutocompleteTextBoxWidget.prototype.onChange = function(text) {}; // to be handled
	
	AutocompleteTextBoxWidget.prototype._customDomInit = function(data) {
		var self = this;
		data = data || [];
		this.getNativeWidget().autocomplete({
				source: data,
				search: function (event, ui) {
					self.onSearch(self.text());
				},
				select: function (event, ui) {
					self.onSelect(ui.item.label);
				},
				change: function (event, ui) {
					self.onChange(self.text());
				}
			});
	};
	
	AutocompleteTextBoxWidget.prototype.populate = function(data) {
		// data should be an array of strings -> ['abcd', 'xxx']
		// http://ajpiano.com/widgetfactory/#slide10
		this.getNativeWidget().data('autocomplete').response(data);
	}; 

	// ---------- CLASS --------------------------------
	
	function FileUploaderWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);	
		// https://developer.mozilla.org/en/DOM/FileReader
		this.fileReader = new FileReader(); // FileReader is in the DOM specification for modern browsers
		var self = this;

		this.fileListParser = {
			get: function () {
				return document.getElementById(self.elementId).files;
			}
		};
	}
	
	FileUploaderWidget.prototype = new Widget();
	FileUploaderWidget.prototype.constructor = FileUploaderWidget;
	
	FileUploaderWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<input>', { type: "file", id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	FileUploaderWidget.prototype.onFileReadSuccess = function (content){}; // event
	
	FileUploaderWidget.prototype._initializeDomElement = function () {
		var self = this;
		
		this.fileReader.onload = function (evt) {
			self.fileContents = evt.target.result;
			self.onFileReadSuccess(self.fileContents);
		};
		this.getNativeWidget().change(function(e) {
			var fileList = self.fileListParser.get();
			if (fileList.length === 0) 
			   return; 
			var fileName = fileList[0];
			self.fileReader.readAsText(fileName);
		});
		this._customDomInit();
	};

	FileUploaderWidget.prototype._customDomInit = function() {}; // abstract method


	//------ CLASS -----------------

	function TextAreaWidget(elementId, placeholder) {
		TextBoxWidget.call(this, elementId, placeholder);
	}
	TextAreaWidget.prototype = new TextBoxWidget();
	TextAreaWidget.prototype.constructor = TextAreaWidget;

	TextAreaWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<textarea>', { id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	TextAreaWidget.prototype.setRows = function(number) {
		this.getNativeWidget().attr('rows', number.toString());
	};

	//------ CLASS -----------------
	
	function MonthPickerWidget(elementId, placeholder) {
		TextBoxWidget.call(this, elementId, placeholder);	
	}
	var spanishCulture = {
		monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
			'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
	};
	MonthPickerWidget.prototype = new TextBoxWidget();
	MonthPickerWidget.prototype.constructor = MonthPickerWidget;
	
	MonthPickerWidget.prototype._initializeDomElement = function () {
		this._timePicker = this.getNativeWidget().monthpicker(spanishCulture);
	};
	
	//------ CLASS -----------------
	
	function DatePickerWidget(elementId, placeholder) {
		TextBoxWidget.call(this, elementId, placeholder);
	}
	DatePickerWidget.prototype = new TextBoxWidget();
	DatePickerWidget.prototype.constructor = DatePickerWidget;
	
	DatePickerWidget.prototype._initializeDomElement = function () {
		this._timePicker = this.getNativeWidget().datepicker();
	};

	DatePickerWidget.prototype.configureCulture = function(culture) {
		var spanish = {
			closeText: 'Cerrar',
			prevText: '&#x3c;Ant',
			nextText: 'Sig&#x3e;',
			currentText: 'Hoy',
			monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
				'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
			monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
				'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
			dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
			dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié;', 'Juv', 'Vie', 'Sáb'],
			dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
			weekHeader: 'Sm',
			dateFormat: 'd/m/yy',
			firstDay: 1,
			isRTL: false,
			showMonthAfterYear: false,
			showOtherMonths: true,
			selectOtherMonths: true,
			yearSuffix: ''
		};
		var clt = culture || spanish;
		$.datepicker.setDefaults(clt);
	};
	
	//------ CLASS -----------------
	
	function TimePickerWidget(elementId, placeholder) {
		TextBoxWidget.call(this, elementId, placeholder);
	}
	TimePickerWidget.prototype = new TextBoxWidget();
	TimePickerWidget.prototype.constructor = TimePickerWidget;
	
	TimePickerWidget.prototype._initializeDomElement = function () {
		this._timePicker = this.getNativeWidget().timepicker();
	};
	
	//------ CLASS -----------------

	function DropDownWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
	}

	DropDownWidget.prototype = new Widget();
	DropDownWidget.prototype.constructor = DropDownWidget;

	DropDownWidget.prototype.clear = function(insertDefaultOption, defaultText) {
		$(this.getNativeWidget()).empty();
		if(insertDefaultOption) {
			var cultureDefaultText = defaultText;
			try {
				// TODO: quitar culture de aqui
				cultureDefaultText = i18n.strings.widgets.dropDown.defaultOption;
			}
			catch(e) {
				sOn.Logger.log("warning: culture not properly configured");
			}
			this._insertDefaultValue(defaultText || cultureDefaultText);
		}
	};
	
	DropDownWidget.prototype.leaveOnlyADefaultOption = function(defaultText) {
		this.clear(true, defaultText);
	};
	
	DropDownWidget.prototype.leaveOnlyAdefaultOption = function(defaultText) {
		this.leaveOnlyADefaultOption(defaultText);
	};
	
	DropDownWidget.prototype._initializeDomElement = function () {
		var self = this;
		this.getNativeWidget().change(function (e) {
			self._lastValue = self._valueFromChangeEvent(e);
			self.onChange(self._lastValue);
		});
		this.getNativeWidget().attr('name', this.elementId);
		this._customDomInit();
	};

	DropDownWidget.prototype._customDomInit = function() {}; // abstract method
	
	DropDownWidget.prototype.selectedValue = function(){
		return this._lastValue;
	};
	
	DropDownWidget.prototype.selectedText = function(){
		return this.getNativeWidget().find("option:selected").text();
	};

	DropDownWidget.prototype._valueFromChangeEvent = function (e) {
		 return $(e.target).find("option:selected").val();
	};
	
	DropDownWidget.prototype._createDomElement = function () {
		var nativeWidget = $("<select>", { 'id': this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};

	DropDownWidget.prototype.addOption = function (text, value) {
		var option = $("<option>");
		option.val(value).text(text);
		option.appendTo($(this.getNativeWidget()));
	};

	DropDownWidget.prototype.onChange = function (selectedValue) { };

	DropDownWidget.prototype._insertDefaultValue = function (text) {
		var defaultText = this.defaultOptionText || text;
		var option = $("<option>", {
			disabled: this.defaultOptionEnabled? false: true, 
			value: "", 
			text: defaultText,
			selected: true
		});
		$(this.getNativeWidget()).prepend(option);
	};

	var dropdownWaitingText = "Cargando...";

	DropDownWidget.prototype.refresh = function() {

	};

	DropDownWidget.prototype.unselectAll = function() {
		$(this.getNativeWidget()).find('option').removeAttr("selected");
	};
	
	DropDownWidget.prototype.setWaitingModeOn = function () {
		this.unselectAll();
		var option = $("<option>", {
			disabled: true, 
			value: dropdownWaitingText, 
			text: dropdownWaitingText,
			selected: true
		});
		$(this.getNativeWidget()).prepend(option);
		this.refresh();
	};
	DropDownWidget.prototype.setWaitingModeOff = function () {
		var item = $(this.getNativeWidget()).find("option[value='" + dropdownWaitingText + "']");
		item.remove();
		this.refresh();
	};
	

	DropDownWidget.prototype.selectedDisabledOption = function() {
		this.selectByValue("");
	};

	DropDownWidget.prototype.selectByValue = function(value) {
		this.getNativeWidget().val(value);
		this._lastValue = value;
		this.onChange(value);
	};
	
	///////////////////////////////////////////////////////////////
	
	
	function AutocompletionDropDown(elementId, placeholder) {
		DropDownWidget.call(this, elementId, placeholder);
	}
	AutocompletionDropDown.prototype = new DropDownWidget();
	AutocompletionDropDown.prototype.constructor = AutocompletionDropDown;
	
	AutocompletionDropDown.prototype._customDomInit = function () {
		try{
			if ($.browser.msie && parseInt($.browser.version, 10) < 8) {
				DropDownWidget.prototype.clear.call(this, true);
				return false;
			}
			this.getNativeWidget().chosen({ no_results_text: "No hay resultados para" });
		}
		catch(e) {
			sOn.Logger.error('jQuery.chosen has thrown an exception -> ' + e.stack);
		}
	};

	AutocompletionDropDown.prototype.selectedDisabledOption = function() {
		DropDownWidget.prototype.selectedDisabledOption.call(this);
		this.getNativeWidget().trigger("liszt:updated");
	};

	AutocompletionDropDown.prototype.clear = function() {
		DropDownWidget.prototype.clear.call(this, true);
		this.getNativeWidget().trigger("liszt:updated");
	};

	AutocompletionDropDown.prototype.selectByValue = function(value) {
		DropDownWidget.prototype.selectByValue.call(this, value);
		this.getNativeWidget().trigger("liszt:updated");
	};

	AutocompletionDropDown.prototype.refresh = function() {
			this.getNativeWidget().trigger("liszt:updated");
	};
	
	//------ CLASS -----------------

	function TableWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
		this.models = [];
	}

	TableWidget.prototype = new Widget();
	TableWidget.prototype.constructor = TableWidget;

	function autoGenerateColumnsBasedOnModelFields(model) {
		var cols = [];
		for(var fieldName in model) {
			if (typeof(model[fieldName]) != 'function'){
				var col = {"mDataProp": fieldName, "sTitle": fieldName};
				if (fieldName == 'id')
					col.bVisible = false;
				cols.push(col);
			}
		}
		return cols;
	};
	
	TableWidget.prototype.refresh = function (models) {
		if (models){
			this.models = models;
			if (!this.columns || this.columns.length == 0) {
				if (this.models.length > 0)
					this.setColumns(autoGenerateColumnsBasedOnModelFields(models[0], false, false));
					this._initializeDomElement();
			}
		}
		if(!this._dataTable) {
			return ;
		}
		this._clearCellWidgets();
		this._dataTable.fnClearTable();
		try{
			this._dataTable.fnAddData(this.models);
		}
		catch(e) {
			if (typeof(e) == "string"){
				if (e.indexOf("DataTables") != -1) {
					throw Error("Table not correctly initialized. Possible reasons are: "+
						"\n" + " 1 - You forgot to call setColumns.   " +
						"\n" + " 2 - You are trying to insert an object which is missing an expected field.   " +
						"\n" + " 3 - You forgot sDefaultContent in the column definition.   " +
						"\n" + " 4 - You forget mDataProp field in the column definition.   " +
						"\n" + " 5 - You left an ending comma in the columns definition array and IE considers it a new undefined item in the array.   " +
						"\n" + " - Either, sDefaultContent or mDataProp should be always defined. " +
						"\n" + " ==> Original error is: \n" + e);
				}
				throw e;
			}	
			throw e;
		}
	};

	TableWidget.modifyIconClass = "actionCell modifyRowIcon";
	TableWidget.removeIconClass = "actionCell removeRowIcon";
	TableWidget.editableClass = "editableCell";
	TableWidget.clickableClass = "clickableCell";
	TableWidget.disabledClass = "disabledCell";
	TableWidget.nonEditableClass = "nonEditable";
	TableWidget.columnNameAttr = "columnname";
	TableWidget.rowAttr = "data-rowid";
	TableWidget.widgetActionAttr = "widgetAction";
	
	TableWidget.prototype._findColumnByName = function(columnName) {
		return this.getNativeWidget().find(
			"span[" + TableWidget.columnNameAttr + " =" + columnName + "]");
	};
	
	TableWidget.prototype.disableClickableColumn = function(columnName) {
		var selectedColumn = this._findColumnByName(columnName);
		selectedColumn.removeClass(TableWidget.clickableClass);
		selectedColumn.addClass(TableWidget.disabledClass);
	};

	TableWidget.prototype.enableClickableColumn = function(columnName) {
		var selectedColumn = this._findColumnByName(columnName);
		selectedColumn.removeClass(TableWidget.disabledClass);
		selectedColumn.addClass(TableWidget.clickableClass);
	};
	TableWidget.prototype.setSorting = function (sorting) {
		this.sorting = sorting;
	};
	
	function parseRowId(idOrHtml) {
		// if columns is bVisible, we get html. Otherwise we get the id
		var rowId = parseInt(idOrHtml);
		if (!rowId){
			var html = idOrHtml;
			rowId = html.substr(html.indexOf(">") + 1, 
						html.lastIndexOf("<") - html.indexOf(">") -1);
			rowId = parseInt(rowId);
		}
		return rowId;
	};
	
	TableWidget.prototype._clearCellWidgets = function (){
		if (!this.cellWidgets)
			return ;
		for (var i = 0, len = this.cellWidgets.length; i < len; i++)
			this.cellWidgets[i].clearDOM();
		this.cellWidgets = [];
	};

	TableWidget.prototype.setColumns = function (columns, canModifyRow, canDeleteRow) {
		this.columns = columns;
		var self = this;
		if (!columns)
			return ;
		if (canModifyRow) {
			this.columns.push({
					"sClass": TableWidget.modifyIconClass,
					"sTitle": self.modifyColumnTitle || i18n.strings.widgets.table.modify,
					"sDefaultContent": '<a data-{0}="modify" href="#">X</a>'.replace('{0}', TableWidget.widgetActionAttr)
				});
		}
		if (canDeleteRow) {
			this.columns.push({
					"sClass": TableWidget.removeIconClass,
					"sTitle": self.removeColumnTitle || i18n.strings.widgets.table.remove,
					"sDefaultContent": '<a data-{0}="remove" href="#">X</a>'.replace('{0}', TableWidget.widgetActionAttr)
				});
		}
		
		

		function dropdownCellHtml(cellContents, cell, columnInfo) {
			var tmpContainer = $("<div>");
			var dropdown = new DropDownWidget(getRandomId(), tmpContainer);
			dropdown._initializeForcingAutoCreation();
			self.cellWidgets = self.cellWidgets || [];
			var choices;
			if (typeof(columnInfo.choices) == "function")
				choices = columnInfo.choices(cellContents, cell, columnInfo);
			else
				choices = columnInfo.choices || [];
			for (var i = 0, len = choices.length; i < len; i++){
				dropdown.addOption(choices[i].name, choices[i].id);
				if (cellContents && cellContents.id == choices[i].id)
					dropdown.selectByValue(choices[i].id);
			}
			dropdown.modelId = cell.aData.id;
			dropdown.columnInfo = columnInfo;
			dropdown.cellInfo = cell;
			self.cellWidgets.push(dropdown);
			return tmpContainer.html();
		};
		
		function defaultCellHtml(cellContents, cell, columnName, cssClass) {
			var cellContentStr = "";
			if(cellContents != null && cellContents != undefined &&
				typeof (cellContents) != 'function'){
				cellContentStr = cellContents.toString();
				cellContentStr = cellContentStr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			}
			var defaultCell;
			if (cssClass == TableWidget.editableClass){
				var charsSize = 10;
				for (var i = 0, len = self.columns.length; i < len; i++){
					if (self.columns[i].mDataProp == columnName){
						charsSize = self.columns[i].charsSize;
						break;
					}
				}
				defaultCell = $("<input>", 
					{ "type": "text", 
					"class": TableWidget.editableClass,
					"value": cellContentStr,
					"size":  charsSize || 10});
				defaultCell.val(cellContentStr);
			}
			else
			{
				defaultCell = $("<span>");
				defaultCell.addClass(cssClass);
				defaultCell.text(cellContentStr);
			}
			var tmpContainer = $("<div>");
			defaultCell.attr(TableWidget.columnNameAttr, columnName);
			defaultCell.attr(TableWidget.rowAttr, cell.aData.id);
			tmpContainer.append(defaultCell);
			return tmpContainer.html();
		}
		
		// tricky! inside all this functions, "this" is the dataTablesPlugin,
		// so we use self to access the widget:
		
		this.dropDownColumn = function(cellData) {
			for (var i = 0, len = self.columns.length; i < len; i++) {
				var col = self.columns[i];
				if (col.isDropDown || col.isDropdown)
					if ((cellData.mDataProp && cellData.mDataProp == col.mDataProp) ||
						(cellData.sDefaultContent && cellData.sDefaultContent == col.sDefaultContent))
							return col;
			}
			return false;
		};
		
		this.drawCell = function(cell, cssClass) {
			var columnName = this.mDataProp; 
			var cellContents = this.sDefaultContent;
			var isClickableColumn = false;
			if (TableWidget.prototype.isNotModelFieldColumn(columnName)) {
				if (TableWidget.prototype.isModifyORremoveColumn(this)) {
					return; // will draw default sDefaultContent
				}
				isClickableColumn = true;
				columnName = this.sTitle;
			}
			if(!isClickableColumn){
				if (columnName.indexOf(".") > 0) {
					eval("cellContents = cell.aData." + columnName + " ;");
				} else {
					cellContents = cell.aData[columnName];
				}
			}
			var dropdownCol = self.dropDownColumn(this);
			if (dropdownCol) {
				return dropdownCellHtml(cellContents, cell, dropdownCol);
			}
			else {
				return defaultCellHtml(cellContents, cell, columnName, cssClass);	
			}		
		};	
	
		this.drawEditableCell = function (cell) {
			return self.drawCell.call(
				this, cell, TableWidget.editableClass);
		};
	
		this.drawClickableCell = function (cell) {
			return self.drawCell.call(
					this, cell, TableWidget.clickableClass);
		};
		
		this.drawInvisibleIdAsAnAttribute = function (cell) {
			return self.drawCell.call(
					this, cell, TableWidget.nonEditableClass);
		};

		for (var i = 0, len = columns.length; i < len; i++) {
			var column = columns[i];
			if (column.bEditable) {
				column.fnRender = self.drawEditableCell;
			}
			else if (column.bClickable){
				column.fnRender = self.drawClickableCell;
			}
			else if (column.bVisible !== false) {
				column.fnRender = self.drawInvisibleIdAsAnAttribute;
			}
		}
	};

	TableWidget.prototype.defineRowRenderDetails = function(renderDetails) {
		this.renderDetailsCalculator = renderDetails;
	};

	TableWidget.prototype.clearTable = function () {
		if (this.isReady())
		   this.getNativeWidget().empty();
	};
	
	TableWidget.prototype.clearDOM = function () {
		Widget.prototype.clearDOM.call(this);
		$('.dataTables_wrapper').remove();
	};

	TableWidget.prototype._createDomElement = function () {
		var nativeWidget = $("<table>", { id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};

	TableWidget.prototype.setNoResultsMessage = function(msg) {
		if (!this._dataTable) {
			throw new Error("Widget must be initialized first");
		};
		var settings = this._dataTable.fnSettings();
		settings.oLanguage.sZeroRecords = msg;
		settings.oLanguage.sEmptyTable = msg;
		this._dataTable.fnDraw(true);
	};
	
	TableWidget.prototype.goToFirstPage = function () {
		if (this._dataTable)
			this._dataTable.fnPageChange( 'first' );	
	};
	
	TableWidget.prototype.enablePagination = function() {
		this.paginationEnabled = true;
	};
	
	TableWidget.prototype.disablePagination = function() {
		this.paginationEnabled = false;
	};
	
	TableWidget.prototype._enableFiltering = function() {
		var settings = this._dataTable.fnSettings();

		this.filterEnabled = true;
		settings.oFeatures.bFilter = true;
	};

	TableWidget.prototype.disableFiltering = function() {
		var settings = this._dataTable.fnSettings();

		this.filterEnabled = false;
		settings.oFeatures.bFilter = false;
		this.refresh();
	};
	
	TableWidget.prototype.filter = function(value, row) {
		if (!this.filterEnabled)
			this._enableFiltering();
		
		this._dataTable.fnFilter(value, row, true, false);
	};


	TableWidget.prototype._initializeDomElement = function () {
		if (!this.columns)
			return ;
		var self = this;
		this.getNativeWidget().addClass("results");
		this._dataTable = this.getNativeWidget().dataTable({
			"aaData": self.models,
			"bDestroy": true,
			"bSort": self.areColumnsSortable || false,
			"aaSorting": self.sorting,
			"aoColumns": self.columns,
			"bAutoWidth": false,
			"bLengthChange": false,
			"iDisplayLength": 10,
			"bPaginate": self.paginationEnabled || false,
			//"sPaginationType": "full_numbers",
			"fnDrawCallback": function () {
				self.bindGridEvents();
			},
			"fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
				if (self.renderDetailsCalculator) {
					var firstCol = $('td:eq(0)', nRow);
					var id = self._getModelIdFromColumn(firstCol);
					var columnsDetails = self.renderDetailsCalculator.calculateBy(id);
					var len = columnsDetails.length;
					for(var i = 0; i < len; i++){
						var index = self.findVisibleColumnIndexByTitle(columnsDetails[i].columnTitle);
						var column = "td:eq(" + index + ")";
						$(column, nRow).addClass(columnsDetails[i].cssClass);
					}
				}
				return nRow;
			},
			"oLanguage": {
				"sLengthMenu": "Mostrar _MENU_ filas por página",
				"sZeroRecords": "No hay datos para mostrar.",
				"sInfo": i18n.strings.widgets.table.paged,
				"sInfoEmpty": "",
				"sInfoFiltered": "(filtrado de _MAX_ resultados en total)",
				"sSearch": "Filtrar",
				"sProcessing" : "<span class='spinner'>Procesando...</span>"
			},
			"bFilter": self.filterEnabled || false
		});

		

	};


	TableWidget.prototype.bindGridEvents = function () {
		var self = this;
	
		function handleDropdownChangeEvent(dropdown) {
			dropdown.onChange = function(newValue) {
				var itemId = parseRowId(dropdown.modelId);
				if (dropdown.columnInfo.mDataProp)
					self.onItemChanged(itemId, dropdown.columnInfo.mDataProp, newValue);
				if (dropdown.columnInfo.sDefaultContent)
					self.onSelectableOptionClicked(itemId, newValue);
			};
		};
			
		var widgetIsInsideVisibleRow = function (widget) {
			var settings = self._dataTable.fnSettings();
			return $.inArray(widget.cellInfo.iDataRow, settings.aiDisplay) > -1;
		};
		
		function handleCellWidgetsEvents() {
			if (!self.cellWidgets)
				return ;
			for (var i = 0, len = self.cellWidgets.length; i < len; i++) {
				var dropdown = self.cellWidgets[i]; // we only have dropdowns for now
				dropdown.placeholder = self.placeholder;
				if (widgetIsInsideVisibleRow(dropdown)) {
					dropdown.initialize();
					handleDropdownChangeEvent(dropdown);
				}
			}
		};
		
		handleCellWidgetsEvents();
		
		var tdHandler = "#" + self.elementId + " td";
		$(tdHandler).delegate(
			"span." + TableWidget.editableClass.replace(/ /g, "."), "click", function (e) {
			self.onCellEditing(jQuery(e.target));
			e.preventDefault();
			e.stopPropagation();
		});
		$(tdHandler).delegate(
			"span." + TableWidget.clickableClass.replace(/ /g, "."), "click", function (e) {
			self.onClicked(jQuery(e.target));
			e.preventDefault();
			e.stopPropagation();
		});
		var elemHandler = "#" + self.elementId;
		$(elemHandler).delegate(
			"td." + TableWidget.removeIconClass.replace(/ /g, ".") + " a", "click", function (e) {
			self.onDeleteRow(jQuery(e.target));
			e.preventDefault();
			e.stopPropagation();
		});
		$(elemHandler).delegate(
			"td." + TableWidget.modifyIconClass.replace(/ /g, ".") + " a", "click", function (e) {
			self.onModifyRow(jQuery(e.target));
			e.preventDefault();
			e.stopPropagation();
		});
		$(tdHandler).delegate(
			"input." + TableWidget.editableClass.replace(/ /g, "."), "change", function (e) {
			self.onCellChanged(jQuery(e.target));
			e.preventDefault();
			e.stopPropagation();
		});
	};

	TableWidget.prototype.onDeleteRow = function (cell) {
		var id = this._getModelId(cell);
		if (id != null) {
			this.onItemRemoved(id);
		}
	};

	TableWidget.prototype.onClicked = function (cell) {
		var id = this._getModelId(cell);
		if (id != null) {
			this.onColumnClicked(id, cell.attr(TableWidget.columnNameAttr));
		}
	};
	
	TableWidget.prototype._getModelIdFromColumn = function (td) {
			 return td.find('span').attr(TableWidget.rowAttr);

		};
	TableWidget.prototype._getModelIdFromRow = function (row) {
			 return row.find('td span').attr(TableWidget.rowAttr);
		 };

	TableWidget.prototype._getModelId = function (cell) {
		var selectedRow = cell.parents("tr");
		var index = $('tr').index(selectedRow);
		if (index >= 0) {
			return this._getModelIdFromRow(selectedRow);
		}
		return null;
	};
	
	TableWidget.prototype.onModifyRow = function (cell) {
		var id = this._getModelId(cell);
		if (id != null) {
			this.onItemModification(id);
		}
	};

	TableWidget.prototype.onCellEditing = function(editSpan) {
		var placeholder = editSpan.parent();
		if (placeholder.children().length > 1)
			return;
		var editBox = $("<input>", 
				{ "type": "text", "class": TableWidget.editableClass });

		editSpan.hide();
		editBox.attr(TableWidget.columnNameAttr, editSpan.attr(TableWidget.columnNameAttr));
		editBox.attr(TableWidget.rowAttr, editSpan.attr(TableWidget.rowAttr));
		editBox.val(editSpan.text());
		editBox.appendTo(placeholder);
		editBox.select().focus();
	};
	
	TableWidget.prototype.onCellChanged = function (editBox) {
		var columnName = editBox.attr(TableWidget.columnNameAttr);
		var rowId = parseRowId(editBox.attr(TableWidget.rowAttr));
		this.onItemChanged(rowId, columnName, editBox.val());
	};

	TableWidget.prototype.isNotModelFieldColumn = function(columnName) {
			return typeof(columnName) == "number";
	};
		
	TableWidget.prototype.isModifyORremoveColumn = function(colObj) {
			if (!colObj.sDefaultContent) {
				throw new Error('Column definition must contain sDefaultContent');
			}
			return colObj.sDefaultContent.indexOf(TableWidget.widgetActionAttr) > 0;
	};
	
	// begin functions for testing --------------
		TableWidget.prototype._rowLinkByPosition = function(position) {
			var tableResults = this.getNativeWidget();
			if (tableResults.length < 1)
				throw new Error("table does not contain anything");
			return $(tableResults.eq(0).find("tbody tr td a")[position]);
		};

		TableWidget.prototype._getDeletionLink = function() {
			return this._rowLinkByPosition(1);
		};

		TableWidget.prototype._getModificationLink = function() {
			return this._rowLinkByPosition(0);
		};
	
		TableWidget.prototype._getEditableCell = function() {
			var tableCellSpan = this.getNativeWidget().find("span.editableCell");
			tableCellSpan.click();
			var tableCellInput = this.getNativeWidget().find("input.editableCell");
			return tableCellInput;
		};

		TableWidget.prototype._changeCellValue = function(newValue) {
			var tableCellInput = this._getEditableCell();
			tableCellInput.val(newValue);
			tableCellInput.change();
		};
	// end ---------------
		
	TableWidget.prototype.hideColumn = function(index){
		this._dataTable.fnSetColumnVis( index, false);
	};

	TableWidget.prototype.findVisibleColumnIndexByTitle = function(title) {
		var len = this.columns.length;
		var index = -1;
		for (var i = 0; i < len; i++)
		{
			var col = this.columns[i];
			if (col.bVisible === false) 
				continue;
			index += 1;
			if (col.sTitle &&
				col.sTitle.toUpperCase() == title.toString().toUpperCase()) 
					return index;
		}
		return -1;
	};
	
	TableWidget.prototype.findColumnIndexByFieldName = function (fieldname) {
		var len = this.columns.length;
		for (var i = 0; i < len; i++)
		{
			var colName = this.columns[i].mDataProp;
			if (colName)
				if (colName.toUpperCase() == fieldname.toString().toUpperCase()) {
					return i;
				}
		}
		return -1;
	};
	
	TableWidget.prototype.findColumnIndexByTitle = function(title) {
		var len = this.columns.length;
		for (var i = 0; i < len; i++)
		{
			var colTitle = this.columns[i].sTitle;
			if (colTitle)
				if (colTitle.toUpperCase() == title.toString().toUpperCase()) {
					return i;
				}
		}
		return -1;
	};
	
	TableWidget.prototype.hideColumnByTitle = function(title){
		var index = this.findColumnIndexByTitle(title);
		if (index != -1) {
			this._dataTable.fnSetColumnVis(index, false);
			this.columns[index].bVisible = false;
		}
	};
	
	TableWidget.prototype.showColumnByTitle = function(title){
		var index = this.findColumnIndexByTitle(title);		
		if (index != -1){
			this._dataTable.fnSetColumnVis(index, true);
			this.columns[index].bVisible = true;
		}
	};
	
	TableWidget.prototype.onItemChanged = function () { }; // to be handled

	TableWidget.prototype.onItemRemoved = function () { }; // to be handled
	
	TableWidget.prototype.onColumnClicked = function () { }; // to be handled
	
	TableWidget.prototype.onSelectableOptionClicked = function () { }; // to be handled
	
	TableWidget.prototype.onItemModification = function () { }; // to be handled

	// ------------- CLASS ---------------

	function ButtonWidget(elementId, placeholder, caption, type) {
		Widget.call(this, elementId, placeholder);
		this.caption = caption || "";
		this.type = type;
		this.redirector = sOn.Utils.redirector;
	}
	
	ButtonWidget.types = {
		add:    { cssClass: "add" },
		save:    { cssClass: "guardar" },
		accept: { cssClass: "aceptar" },
		validate: { cssClass: "aceptar" },
		print: { cssClass: "imprimir" },
		close: { cssClass: "close"},
		none: { cssClass: "" },
		cancel: { cssClass: "cancelar"}
	};

	ButtonWidget.prototype = new Widget();
	ButtonWidget.prototype.constructor = ButtonWidget;
	
	ButtonWidget.prototype.setWaitingModeOn = function() {
		if (this.isReady()) {
			this.disable();
			this.getNativeWidget().addClass("waiting");
		}
	};
	
	ButtonWidget.prototype.setWaitingModeOff = function() {
		if (this.isReady()){
			this.enable();
			this.getNativeWidget().removeClass("waiting");
		}
	};
	
	ButtonWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<a>', { id: this.elementId, href: "#" });
		nativeWidget.appendTo(this.placeholder);
		this.registerNativeWidget(nativeWidget);
	};

	ButtonWidget.prototype._hasAnAnchorWithName = function (href) {
		return (href 
			&& (href.length > 1) 
			&& (href.charAt(href.length-1) != "#"));
	};
	
	ButtonWidget.prototype._initializeDomElement = function () {
		var self = this;
		var href = this.getNativeWidget().attr("href");
		this.getNativeWidget().click(function (e) {
			if (self._hasAnAnchorWithName(href)){
				self.redirector.redirect(href);
			}
			else {
				self.getNativeWidget().attr("href", "#");
				if (self.getNativeWidget().hasClass('disabled')) {
					e.preventDefault();
					return false;
				}
				self.onClick();
				e.preventDefault();
			}
		});
		if(this.caption){
			this.getNativeWidget().text(this.caption);
		}
		this.addClassByWidgetType(this.type);
	};

	ButtonWidget.prototype.doClick = function () {
		this.getNativeWidget().click();
	};
	
	ButtonWidget.prototype.disable = function () {
		this.getNativeWidget().addClass('disabled');
	};
	
	ButtonWidget.prototype.enable = function () {
		this.getNativeWidget().removeClass('disabled');
	};

	ButtonWidget.prototype.onClick = function (e) { }; // to be handled

	ButtonWidget.prototype.setCaption = function(newCaption) {
		this.caption = newCaption;
		this.getNativeWidget().text(this.caption);
	};
	
	ButtonWidget.prototype.getCaption = function() {
		return this.getNativeWidget().text();
	};
	
	// ------------- CLASS ---------------

	function MessageWidget(elementId, type, placeholder, buttonId, msgAreaId) {
		Widget.call(this, elementId, placeholder);
		this.type = type;
		// Optional parameters:
		this.buttonId = buttonId;
		this.msgAreaId = msgAreaId;
	    this.msgAreaIdWasSpecified = function() {
          return this.msgAreaId != undefined;
        };
	    this.msgAreaIsNotInTheMarkupOrItsIdIsUnknown = function() {
	        return !this.msgAreaIdWasSpecified() || this.msgArea.domElementDoesntExist();
	    };
	}

	MessageWidget.prototype = new Widget();
	MessageWidget.prototype.constructor = MessageWidget;

    MessageWidget.prototype._useInnerPanelAsMsgArea = function() {
        var id = this.msgAreaId || getRandomId();
		this.msgArea = new PanelWidget(id, this.getNativeWidget());
	    this.msgArea._initializeForcingIfNeccessary(this.msgAreaId);
    };
    
	MessageWidget.prototype._initMsgArea = function() {
		if (!this.buttonId && !this.msgAreaId) 
			this.msgArea = this;
		else 
		    this._useInnerPanelAsMsgArea();
	};
	
	MessageWidget.prototype._initInnerButton = function() {
		if (this.buttonId) {
			var closeButton = new ButtonWidget(this.buttonId, 
				this.getNativeWidget(), "X", ButtonWidget.types.close);
			closeButton.initialize();
			var self = this;
			closeButton.onClick = function () {
				self.hide();
				self.onClose();
			};
			this.closeButton = closeButton;
		}
	};

	MessageWidget.prototype.innerButton = function() {
		return this.closeButton;
	};
	
	MessageWidget.prototype.onShow = function() { }; //to be handled
	MessageWidget.prototype.onClose = function() { }; //to be handled
	
	MessageWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<div>', { id: this.elementId });
		nativeWidget.appendTo(this.placeholder);
		this.registerNativeWidget(nativeWidget);
	};

	MessageWidget.types = {
		error: { cssClass: "message error" },
		success: { cssClass: "message success" }
	};

	MessageWidget.prototype._postShow = function (message) {
		if (message){
			this.msgArea.getNativeWidget().text(message);
		}
		this.onShow();
	};
	
	MessageWidget.prototype.alert = function (message) {
		this.show(message);
	};
	
	MessageWidget.prototype._initializeDomElement = function () {
		this.addClassByWidgetType(this.type);
		this.getNativeWidget().hide();
		this._initInnerButton();
		this._initMsgArea();
	};
	
	// ------------- CLASS ---------------
	
	function CheckboxWidget(elementId, caption, placeholder) {
		Widget.call(this, elementId, placeholder);
		this.caption = caption;
	}
	
	CheckboxWidget.prototype = new Widget();
	CheckboxWidget.prototype.constructor = CheckboxWidget;
	
	CheckboxWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<input>', { type: "checkbox", id: this.elementId });
		nativeWidget.appendTo(this.placeholder);
		this.registerNativeWidget(nativeWidget);
	};

	CheckboxWidget.prototype.onChange = function() {};

	CheckboxWidget.prototype._initializeDomElement = function () {
		var self = this;
		this.getNativeWidget().attr("checked", this.checked);
		this.setChecked(this.checked);
		this.getNativeWidget().change(function (e) {
			if (self.getNativeWidget().hasClass('disabled')) {
				e.preventDefault();
				return false;
			}
			self.onChange();
		});
	};

	CheckboxWidget.prototype.isChecked = function() {
		var checked = this.getNativeWidget().attr("checked");
				if (this.getNativeWidget().prop)
		   checked = this.getNativeWidget().prop("checked") ||
			   this.getNativeWidget().attr("checked");
		return checked === true;
	};
	
	CheckboxWidget.prototype.setChecked = function(checked) {
		var previousState = this.isChecked();
		var nativeWidget = this.getNativeWidget();
		if (checked) {
			if (nativeWidget.prop)
				nativeWidget.prop("checked", true);
			nativeWidget.attr("checked", true);
		}
		else {
			nativeWidget.removeAttr("checked");
			if (nativeWidget.prop)
					nativeWidget.prop("checked", null);
		}
		if (previousState != checked) {
			this.onChange();
		}
	};
	
	// ------------- CLASS ---------------
	
	function PanelWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
	}
	
	PanelWidget.prototype = new Widget();
	PanelWidget.prototype.constructor = PanelWidget;
	
	PanelWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<div>', { id: this.elementId });
		nativeWidget.appendTo(this.placeholder);
		this.registerNativeWidget(nativeWidget);
	};
	
	PanelWidget.prototype.setText = function (text) {
		this.getNativeWidget().text(text);
	};
	
	PanelWidget.prototype.disable = function() {
		var nativeWidget = this.getNativeWidget();
		nativeWidget.find('*').addClass(Widget.disabledClass);
		nativeWidget.find('input').attr('disabled', true);
		nativeWidget.find('select').attr('disabled', true);
		nativeWidget.find('textarea').attr('disabled', true);
	};
	
	PanelWidget.prototype.enable = function() {
		var nativeWidget = this.getNativeWidget();
		nativeWidget.find('*').removeClass(Widget.disabledClass);
		nativeWidget.find('*').removeAttr('disabled');
	};
	
	//----------------------------------------
	
	function AwaitsDisplay(elementId, placeholder) {
		PanelWidget.call(this, elementId, placeholder);
	}
	
	AwaitsDisplay.prototype = new PanelWidget();
	AwaitsDisplay.prototype.constructor = AwaitsDisplay;
	
	AwaitsDisplay.prototype._createDomElement = function () {
		this.registerNativeWidget($('<div class="dummy">'));
	};

	AwaitsDisplay.prototype.html = function(contents) {
		if (!this.isReady())
			this.initialize();
		return this.getNativeWidget().html(contents);
	};
	
	AwaitsDisplay.prototype.populateInCaseOfEmpty = function() {
		var nativeWidget = this.getNativeWidget();
		var currentContent = nativeWidget.html();
		if (currentContent.length == 0) {
			nativeWidget.text("");
			var txt = "<h2>" + i18n.strings.status.loading + "...</h2>";
			nativeWidget.html(txt);
		}
	};

	AwaitsDisplay.prototype.attachWorker = function(worker) {
		var self = this;
		worker.onCallStart = function() {
			self.show();
		};
		worker.onCallEnd = function() {
			self.hide();
		};
	};
	
	AwaitsDisplay.prototype.show = function () {
		if (!this.isReady())
			this.initialize();
		this.getNativeWidget().show();
		this.populateInCaseOfEmpty();
	};
	
	// ------------- CLASS ---------------
	
	function LabelWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
	}
	
	LabelWidget.prototype = new Widget();
	LabelWidget.prototype.constructor = LabelWidget;
	
	LabelWidget.prototype._createDomElement = function () {
		var nativeWidget = $('<span>', { id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	LabelWidget.prototype.setCaption = function(caption) {
		this.getNativeWidget().text(caption);
	};
	
	LabelWidget.prototype.setText = function(caption) {
		this.setCaption(caption);
	};
	
	LabelWidget.prototype.caption = function() {
		return this.getNativeWidget().text();
	};

	LabelWidget.prototype._postShow = function(message) {
		if (message) {
			this.setText(message);
		}
		this.onShow();
	};

	LabelWidget.prototype.onShow = function() {};
	
	function MultiLineLabelWidget(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
	}
	
	MultiLineLabelWidget.prototype = new PanelWidget();
	MultiLineLabelWidget.prototype.constructor = MultiLineLabelWidget;
	
	function buildMultilineMessage(lines) {
		var txt = "";
		for(var i = 0, len = lines.length; i < len; i++)
		{
			txt += lines[i] + "<br/>";
		}
		return txt;
	};
	
	MultiLineLabelWidget.prototype.setMultilineMessage = function(lines) {
		var txt = buildMultilineMessage(lines);
		this.getNativeWidget().html(txt);
	};
	
	MultiLineLabelWidget.prototype.appendLines = function(lines) {
		var txt = buildMultilineMessage(lines);
		this.getNativeWidget().append(txt);
	};
	
	// ------------- CLASS ---------------
	
	function ListView(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
	}
	
	ListView.prototype = new Widget();
	ListView.prototype.constructor = ListView;
	
	ListView.prototype._createDomElement = function () {
		var nativeWidget = $('<ul>', { type: "text", id: this.elementId });
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};
	
	ListView.prototype.refresh = function(items){
		var len = items.length;
		var html = "";
		for(var i = 0; i < len; i++){
			html += "<li>" + items[i] + "</li>";
		}
		this.getNativeWidget().html(html);
	};
	
	
	function Toolbar(elementId, placeholder){
		PanelWidget.call(this, elementId, placeholder);
		this._buttonCount = 0;
		this._buttons = {};
	}
	
	Toolbar.prototype = new PanelWidget();
	Toolbar.prototype.constructor = Toolbar;
	
	Toolbar.prototype.onClick = function(){}; //to be handled
	
	Toolbar.prototype.buttonCount = function(){
		return this._buttonCount;
	};
	
	Toolbar.prototype.showButtons = function(buttonNames){
		if(buttonNames){
			this._hideAllButtons();
			for(var i = 0; i < buttonNames.length; i++) {
				this._buttons[buttonNames[i]].show();
			}
			return false;
		}
		this._showAllButtons();
	};
	
	Toolbar.prototype._hideAllButtons = function() {
		for (var name in this._buttons) {
			this._buttons[name].hide();
		}
	};

	Toolbar.prototype._showAllButtons = function() {
		for (var name in this._buttons) {
			this._buttons[name].show();
		}
	};
	
	Toolbar.prototype.add = function(name, domId, caption){
		if (!this._buttons[name]) {
			this._buttonCount++;
			domId = domId || "";
			this._buttons[name] = this._createButton(name, caption, domId);
		}
	};
	
	Toolbar.prototype._createButton = function (name, caption, domId){
		var self = this;
		var button = new ButtonWidget(domId, this.getNativeWidget(), caption, 
			ButtonWidget.types.none);
		button.initialize();
		button.hide();
		button.onClick = function(){
			self.onClick(name);
		};
		return button;
	};
	
	Toolbar.prototype.get = function(){
		return {
			buttons: this._buttons
		};
	};

	Toolbar.prototype.select = function(buttonName) {
		this._unSelectAll();
		this._buttons[buttonName].getNativeWidget().parent("li").addClass("selected");
	};

	Toolbar.prototype._unSelectAll = function() {
		for (var button in this._buttons) {
			this._unSelect(button);
		}
	};

	Toolbar.prototype._unSelect = function(buttonName) {
		this._buttons[buttonName].getNativeWidget().parent("li").removeClass("selected");
	};
	
	Toolbar.prototype.getVisibleButtons = function() {
		var visibleButtons = [];
		for (var button in this._buttons) {
				if (this._buttons[button].visible()) { visibleButtons.push(button); }
		}
		return visibleButtons;
	};	
	//////////////////////////////////////////////////////////////
	
	function ConfirmationDialog(elementId, placeholder, positiveButtonId, negativeButtonId, extraInfoId) {
		PanelWidget.call(this, elementId, placeholder);
		this.positiveButtonId = positiveButtonId;
		this.negativeButtonId = negativeButtonId;
		this.extraInfoId = extraInfoId;
		this.shouldOverwriteButtonLabels = true;
	};

	ConfirmationDialog.prototype = new PanelWidget();
	ConfirmationDialog.constructor = ConfirmationDialog;

	ConfirmationDialog.prototype.onConfirmationDone = function(answer) {}; // to be handled

	ConfirmationDialog.prototype.doNotOverwriteButtonLabels = function() {
		this.shouldOverwriteButtonLabels = false;
	};
	
	ConfirmationDialog.prototype._postShow = function (extraInfo) {
		if (this.extraInfoWidget)
			this.extraInfoWidget.setHtml(extraInfo);
	};
	
	ConfirmationDialog.prototype._createPositiveButton = function () {
		var caption = i18n.strings.widgets.confirmation.yes || "Si";
		if (!this.shouldOverwriteButtonLabels)
			caption = "";
		var btn = new ButtonWidget(this.positiveButtonId, 
			this.getNativeWidget(), caption, ButtonWidget.types.accept);
		btn._initializeForcingIfNeccessary(this.positiveButtonId);
		return btn;
	};
	
	ConfirmationDialog.prototype._createNegativeButton = function () {
		var caption = i18n.strings.widgets.confirmation.no || "No";
		if (!this.shouldOverwriteButtonLabels)
			caption = "";
		var btn = new ButtonWidget(this.negativeButtonId, this.getNativeWidget(),
			caption, ButtonWidget.types.cancel, this.getNativeWidget());
		btn._initializeForcingIfNeccessary(this.negativeButtonId);
		return btn;
	};
	
	ConfirmationDialog.prototype._initializeDomElement = function() {
		var self = this;
		function processAnswer(answer) {
			self.wasPositiveAnswer = answer;
			self.onConfirmationDone(answer);
			self.hide();
		};
		this.positiveButton = this._createPositiveButton();
		this.positiveButton.onClick = function() {
			processAnswer(true);
		};
		this.negativeButton = this._createNegativeButton();
		this.negativeButton.onClick = function() {
			processAnswer(false);
		};
		if (this.extraInfoId){
			this.extraInfoWidget = new LabelWidget(this.extraInfoId, this.getNativeWidget());
			this.extraInfoWidget.initialize();
		}
	};
 	//////////////////////////////////////////////////////////////
    
    function DummyMap(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
		this._markers = [];
	};
    
	DummyMap.prototype = new Widget();
    
    DummyMap.prototype.addMarker = function (marker) { };

	DummyMap.prototype.zoomToMarkerExtents = function() { };
 	
	DummyMap.prototype.clear = function() { };

	//////////////////////////////////////////////////////////////
	
	
	function Map(elementId, placeholder) {
		Widget.call(this, elementId, placeholder);
		this._markers = [];
	};
	Map.prototype = new Widget();

	Map.prototype._createDomElement = function () {
		var nativeWidget = $('<div>', { id: this.elementId });
		nativeWidget.css("width", "100%");
		nativeWidget.css("height", "100%");
		this.registerNativeWidget(nativeWidget);
		this.placeholder.append(nativeWidget);
	};

	Map.prototype._initializeDomElement = function () {
		var jsDomElement = this._nativeWidget.get(0);
		var madridCoords = new google.maps.LatLng(40.486, -3.760);
		var mapOptions = {
			zoom: 6,
			maxZoom: 14,
			center: madridCoords,
			zoomControl: false,
			scaleControl: false,
			panControl: false,
			scrollwheel: false,
			streetViewControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this._gmap = new google.maps.Map(jsDomElement, mapOptions);
	};

	Map.prototype.addMarker = function (marker) {
		var coords = new google.maps.LatLng(marker.latitude, marker.longitude);
		var marker = new google.maps.Marker({
				map: this._gmap,
				icon: this._markerImage(marker.letter),
				shadow: this._markerShadow(),
				position: coords,
				title: marker.name
			});
		this._markers.push(marker);
	};

	Map.prototype._markerImage = function (letter, color) {
		color = color || "009EE0";
		letter = letter || "%E2%80%A2";
		return new google.maps.MarkerImage(
			"https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld="
				+ letter + "|" + color,
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34)
		);
	};

	Map.prototype._markerShadow = function () {
		return new google.maps.MarkerImage(
			"https://chart.googleapis.com/chart?chst=d_map_pin_shadow",
			new google.maps.Size(40, 37),
			new google.maps.Point(0, 0),
			new google.maps.Point(12, 35)
		);
	};

	Map.prototype._postShow = function() {
		google.maps.event.trigger(this._gmap, "resize");
		this.zoomToMarkerExtents();
	};
	
	Map.prototype.zoomToMarkerExtents = function() {
		var bounds = new google.maps.LatLngBounds();
		var len = this._markers.length;
		for ( var i = 0; i < len; i++ ) {
			bounds.extend(this._markers[i].position);
		}
		this._gmap.fitBounds(bounds);
	};
	
	Map.prototype.clear = function() {
		var len = this._markers.length;
		for ( var i = 0; i < len; i++ ) {
			this._markers[i].setMap(null);
		}
		this._markers = [];
	};

	sOn.Widgets = sOn.Widgets || {};
	sOn.Widgets.getRandomId = getRandomId;
	sOn.Widgets.Widget = Widget;
	sOn.Widgets.Message = MessageWidget;
	sOn.Widgets.Button = ButtonWidget;
	sOn.Widgets.Table = TableWidget;
	sOn.Widgets.DropDown = DropDownWidget;
	sOn.Widgets.AutocompletionDropDown = AutocompletionDropDown;
	sOn.Widgets.TextBox = TextBoxWidget;
	sOn.Widgets.FileUploader = FileUploaderWidget;
	sOn.Widgets.AutocompleteTextBox = AutocompleteTextBoxWidget;
	sOn.Widgets.Checkbox = CheckboxWidget;
	sOn.Widgets.Panel = PanelWidget;
	sOn.Widgets.Label = LabelWidget;
	sOn.Widgets.MultiLineLabel = MultiLineLabelWidget;
	sOn.Widgets.TimePicker = TimePickerWidget;
	sOn.Widgets.DatePicker = DatePickerWidget;
	sOn.Widgets.TextArea = TextAreaWidget;
	sOn.Widgets.AlertDialog = AlertDialog;
	sOn.Widgets.ListView = ListView;
	sOn.Widgets.Toolbar = Toolbar;
	sOn.Widgets.AwaitsDisplay = AwaitsDisplay;
	sOn.Widgets.ConfirmationDialog = ConfirmationDialog;
	sOn.Widgets.Map = Map;
    sOn.Widgets.DummyMap = DummyMap;
	sOn.Widgets.MonthPicker = MonthPickerWidget;
	
} (window.sOn));

﻿window.sOn = window.sOn || {};

(function (sOn, undefined) {

	function DataBinder() {
		this.widget = null;
	};
	DataBinder.prototype.bindUI = function(id, placeholder) {
		throw Error('This abstract method should be implemented in child class');
	};
	DataBinder.prototype.attachWidget = function(widget) {
		throw Error('This abstract method should be implemented in child class');
	};
	DataBinder.prototype.innerWidget = function() {
		return this.widget;
	};
	DataBinder.prototype.initialize = function() {
		this.widget.initialize();
	};
	DataBinder.prototype.rawUI = function() {
		return this.widget.html();
	};
	DataBinder.prototype.html = function() {
		return this.widget.html();
	};
	DataBinder.prototype.hide = function() {
		return this.widget.hide();
	};
	DataBinder.prototype.show = function() {
		return this.widget.show();
	};
	
	DataBinder.override = function(baseDataBinder, methods) {
		function CustomBinder() {
			baseDataBinder.apply(this, arguments);
			if (this._constructor_)
			   this._constructor_.apply(this, arguments);
		}
		CustomBinder.prototype = new baseDataBinder();
		CustomBinder.prototype.constructor = CustomBinder;
		for(var methodName in methods) {
			CustomBinder.prototype[methodName] = methods[methodName];
		}
		return CustomBinder;
	};
	
	//------ CLASS -----------------
	function SingleChoiceSelectable() {
		DataBinder.call(this);
		this.collection = new sOn.Models.sOnCollection();
	};
	SingleChoiceSelectable.prototype = new DataBinder();
	SingleChoiceSelectable.prototype.constructor = SingleChoiceSelectable;
	
	SingleChoiceSelectable.prototype.getBusinessCollection = function () {
		return this.collection;
	};
	
	SingleChoiceSelectable.prototype.attachWidget = function(widget) {
		var self = this;
		this.widget = widget;
		this.widget.onChange = function(id) {
			self.selectionChanged.call(self, id);
		};
	};
	SingleChoiceSelectable.prototype.bindUI = function(id, placeholder) {
		this.attachWidget(new sOn.Widgets.AutocompletionDropDown(id, placeholder));
		this.initialize();
	};
	
	SingleChoiceSelectable.prototype.disableWhileWaitToReload = function() {
		this.widget.clear();
		this.disableWhileWait();
	};
	
	SingleChoiceSelectable.prototype.disableWhileWait = function() {
		this.widget.disable();
		this.widget.setWaitingModeOn();
	};
	SingleChoiceSelectable.prototype.setWaitingModeOn = function() {
		this.disableWhileWait();
	};
	SingleChoiceSelectable.prototype.setWaitingModeOff = function() {
		this.enable();
	};
	SingleChoiceSelectable.prototype.enable = function() {
		this.widget.setWaitingModeOff();
		this.widget.enable();
	};
	SingleChoiceSelectable.prototype.selectionChanged = function(selectedValue) {
		var selectedItem = this.collection.get(selectedValue);
		this.selectedItem = selectedItem;
		this.onObjectChanged(selectedItem);
		this.onChange(selectedItem);
	};
	
	SingleChoiceSelectable.prototype.onObjectChanged = function() { }; // deprecated
	SingleChoiceSelectable.prototype.onChange = function() { }; // event
	
	SingleChoiceSelectable.prototype.addCollection = function(collection) {
		if (!collection.models) {
			throw TypeError("Only collections are allowed");
		}
		var self = this;
		self.clear(true);
		this.collection = collection;
		for (var i = 0; i < collection.length; i++) {
			if (collection.models[i].name && collection.models[i].id) {
				self.widget.addOption(collection.models[i].name, collection.models[i].id);
			}
		};
		self.widget.refresh();
	};
	SingleChoiceSelectable.prototype.addItem = function(item) {
		this.collection.add(item);
		this.widget.addOption(item.name, item.id);
		this.widget.refresh();
	};
	SingleChoiceSelectable.prototype.add = function (item) {
		this.addItem(item);
	};
	SingleChoiceSelectable.prototype.count = function() {
		 return this.collection.length;
	};
	SingleChoiceSelectable.prototype.clear = function(insertDefaultValue) {
		this.collection = new sOn.Models.sOnCollection();
		this.widget.clear(insertDefaultValue);
	};
	SingleChoiceSelectable.prototype.empty = function() {
		this.widget.clear(false);
	};
	SingleChoiceSelectable.prototype.redraw = function() {
		this.widget.refresh();
	};
	SingleChoiceSelectable.prototype.deselectAnyOption = function() {
		this.widget.selectedDisabledOption();
	};
	SingleChoiceSelectable.prototype.selectItem = function(item) {
		this.widget.selectByValue(item.id);
	};
	
/// -----------------------------------------------------
	
	function TableDataBinder() {
		DataBinder.call(this);
		this.clearCollection();
		this.dtoType = sOn.Models.sOnDTO;
	}

	TableDataBinder.prototype = new DataBinder();
	TableDataBinder.prototype.constructor = TableDataBinder;
	
	TableDataBinder.prototype.clearCollection = function () {
		this.dtoCollection = new sOn.Models.sOnCollection({dtoType: this.dtoType});
	};
	
	TableDataBinder.prototype.clear = function () {
		this.clearCollection();
		this.refresh();
		this.widget.goToFirstPage();
	};

	TableDataBinder.prototype.getBusinessCollection = function () {
		return this.dtoCollection;
	};

	TableDataBinder.prototype.filter = function (value, fieldName) {
		this.widget.filter(value, this.widget.findColumnIndexByFieldName(fieldName));
	};
	
	TableDataBinder.prototype.add = function (item) {
		if (!item){
			return;
		}
		var alreadyInCollection = false;
		$.each(this.dtoCollection.models, function () {
			if (item.id == this.id) {
				alreadyInCollection = true;
				sOn.Logger.log("Warning! two items with same id cant be added");
				return;
			}
		});
		if (!alreadyInCollection) {
		   this._add(item);
		}
	};
	
	TableDataBinder.prototype._add = function (item) {
		this.dtoCollection.add(item);
		this.widget.refresh(this.dtoCollection.models);
	};
		
	TableDataBinder.prototype.addCollection = function (collection) {
		this.dtoCollection = collection;
		this.widget.refresh(this.dtoCollection.models);
	};

	TableDataBinder.prototype.bindUI = function(id, placeholder) {
		this.attachWidget(new sOn.Widgets.Table(id, placeholder));
		this.initialize();
	};
	
	TableDataBinder.prototype.attachWidget = function (widget) {
		this.widget = widget;
		this._defineColumns();
		var self = this;
		this.widget.onItemRemoved = function () {
			self.itemRemovedFromCollection.apply(self, arguments);
		};
		this.widget.onItemChanged = function () {
			self.collectionItemChanged.apply(self, arguments);
		};
		this.widget.onItemModification = function() {
			self.itemModification.apply(self, arguments);
		};
		this.widget.onColumnClicked = function() {
			self.columnClicked.apply(self, arguments);
		};
		this.widget.onSelectableOptionClicked = function() {
			self._selectionChangedForItemField.apply(self, arguments);
		};
	};

	TableDataBinder.prototype._defineColumns = function () {
		this.widget.setColumns(null, false, false);
	};

	TableDataBinder.prototype.refresh = function () {
		this.widget.refresh(this.dtoCollection.models);
	};

	TableDataBinder.prototype.collectionItemChanged = function (id, attrName, attrValue) {
		var item = this.dtoCollection.get(id);
		var oldValue = "";
		if (item) {
			var fieldName = "item." + attrName; 
			oldValue = eval(fieldName); // we dont use item[attrName] because attrName could contain dots.
			eval(fieldName + " = attrValue");
		}
		this.onItemChanged(item, attrName, oldValue, attrValue);
	};

	TableDataBinder.prototype.itemModification = function (id) {
		this.onItemModification(this.dtoCollection.get(id));
	};
	
	TableDataBinder.prototype.columnClicked = function (id, columnName) {
		this.onColumnClicked(this.dtoCollection.get(id), columnName);
	};

	TableDataBinder.prototype._selectionChangedForItemField = function (id, value) {
		this.onSelectionChangedForItemField(this.dtoCollection.get(id), value);
	};
	
	TableDataBinder.prototype.onItemModification = function () {}; // to be handled	
	
	TableDataBinder.prototype.onItemRemoval = function () {}; // to be handled	
	
	TableDataBinder.prototype.onItemChanged = function() {}; // to be handled

	TableDataBinder.prototype.onSelectionChangedForItemField = function() {}; // to be handled
	
	TableDataBinder.prototype.itemRemovedFromCollection = function (id) {
                var item = this.dtoCollection.get(id);
		this.dtoCollection.remove(id);
		this.widget.refresh(this.dtoCollection.models);
                this.onItemRemoval(item);
	};
	
	TableDataBinder.prototype.disableClickableColumn = function (colName) {
		this.widget.disableClickableColumn(colName);
	};

	TableDataBinder.prototype.enableClickableColumn = function (colName) {
		this.widget.enableClickableColumn(colName);
	};

	TableDataBinder.override = function(methods) {
		return DataBinder.override(TableDataBinder, methods);
	};
	
	var PairsTableBinder = TableDataBinder.override({
			_constructor_: function (config) {
				if (config)
					this.option = config.option;
			},
			_defineColumns: function() {
					this.widget.setColumns(
					[
						{ "mDataProp": "id",
							"sTitle": "Id"
						},
						{ "mDataProp": "name",
							"sTitle": "Name",
							"bEditable": true
						}
					], true, true);
			}
	});


	var ClickablePairsTableBinder = TableDataBinder.override({
			_defineColumns: function() {
				this.widget.setColumns(
					[
						{ "mDataProp": "id",
							"sTitle": "Id",
							"bClickable": true
						},
						{ "mDataProp": "name",
							"sTitle": "Name",
							"bEditable": true
						}
					], true, true);
			}
	});

	var BinderWithDates = TableDataBinder.override({
			_defineColumns: function() {
				this.widget.setColumns(
					[
						{ "mDataProp": "id",
							"sTitle": "Id"
						},
						{ "mDataProp": "thedate",
							"sTitle": "Date"
						}
					], true, true);
			}
	});
	
	sOn.DataBinders = sOn.DataBinders || {};
	
	sOn.DataBinders.SingleChoiceSelectable = SingleChoiceSelectable;
	sOn.DataBinders.TableDataBinder = TableDataBinder;
	sOn.DataBinders.PairsTable = PairsTableBinder;
	sOn.DataBinders.ClickablePairsTable = ClickablePairsTableBinder;
		sOn.DataBinders.BinderWithDates = BinderWithDates;

} (window.sOn));

﻿window.sOn = window.sOn || {};

(function(sOn, undefined) {

	function ComponentClient() {
		sOn.Network.Client.call(this);
	}

	ComponentClient.prototype = new sOn.Network.Client();
	ComponentClient.prototype.constructor = ComponentClient;
	ComponentClient.prototype.retrieveItems = function(criteria, callbackHandler) {
		this.requestData(this.urlPrefix + this.urlPath,
			{ criteria: JSON.stringify(criteria) },
			function responseCallback(data) {
				callbackHandler.handleRetrievedItems(data);
			});
	};
	
	////////////////////
	
	function ComponentDummyClient(items) {
		this.data = items;
	}

	ComponentDummyClient.prototype.constructor = ComponentDummyClient;
	ComponentDummyClient.prototype.retrieveItems = function(criteria, callbackHandler) {
		callbackHandler.handleRetrievedItems(this.data);
	};

	////////////////////

	function AutocompletionComponent() {
		sOn.Interactors.Interactor.call(this, ['widget']);
		this.retrievedObjects = { };
		this.client = null;
		
		var self = this;
		
		this._subscribeEvents = function () {
			this._widget.onSearch = function(key) {
				if (key && key.length > 2) {
					self.onSearchStart();
					var criteria = self.buildSearchCriteria(key);
					self.client.retrieveItems(criteria, self);
				}
			};
			this._widget.onSelect = function(text) {
				handleItemSelection(text);
			};
			this._widget.onChange = function(text) {
				self.onInputChange(text);
			};
		};

		this.objectEncoder = {
			encode: function(obj) {
				return obj.id + ", " + obj.name;
			}
		};
		
		function simpleDtoWithId(fieldContent) {
			var id;
			try {
				id = parseInt(fieldContent);
			}
			catch(e) {
				id = 0;
			}
			if (isNaN(id)) {
				id = 0;
			}
			return new sOn.Models.sOnDTO({ id: id });
		};
				
		function selectedAutocompletedObject(text) {
			var txt = text;
			if (!text)
			   txt = self._widget.text();
			var obj = self.retrievedObjects[txt];
			if (!obj)
				return self.buildDtoWhenUserInputDoesntMatchAnyOfTheSuggestedItems(txt);
			if (!obj.id)
				obj.id = 0;
			return obj;
		};

		function handleItemSelection(text) {
			var obj = selectedAutocompletedObject(text);
			self.onSelectionChanged(obj);
			self.onChanged(obj);
		};

		this.selectedObject = function() {
			return selectedAutocompletedObject();
		};
		
		function storeCandidatesBasedOnDisplayableText(candidates) {
			self.keys = [];
			self.retrievedObjects = { };
			var names = [];
			var len = candidates.length;
			for(var i = 0; i < len; i++) {
				var key = self.objectEncoder.encode(candidates[i]);
				self.retrievedObjects[key] = candidates[i];
				self.keys.push(key);
				names.push(key);
			}
			return names;
		}

		this.populate = function(candidates) {
			return this.handleRetrievedItems(candidates);
		};
		
		this.handleRetrievedItems = function(candidates) {
			var names = storeCandidatesBasedOnDisplayableText(candidates);
			this._widget.populate(names);
			if (this.currentProgrammaticSearch)
				this.doSelectItemContaining(this.currentProgrammaticSearch);
			this.onWidgetPopulated();
		};

		this.onSearchStart = function() {}; // to be handled
		this.onWidgetPopulated = function() {}; // to be handled
		
		this.setSelection = function(candidates) {
			if (!candidates.length)
				throw new Error("Selection must be an array");
			storeCandidatesBasedOnDisplayableText(candidates);
			this._widget.setText(this.keys[0]);
		};

		this.setText = function(text) {
			this._widget.setText(text);
		};

		this.load = function() {
			// does nothing. left here for API compatibilty with other components
		};

		this.redraw = function() {
			// does nothing. left here for API compatibilty with other components
		};
		
		this.text = function() {
			return this._widget.text();
		};

		this.clear = function() {
			this._widget.clear();
		};
		
		this.disable = function() {
			this._widget.disable();
		};

		this.enable = function() {
			this._widget.enable();
		};

		this.doSelectText = function(text) {
			this._widget.onSelect(text);
		};

		this.doSelectFirstSuggestion = function() {
			this.doSelectItemContaining(this.keys[0]);
		};

		this.doSelectItemContaining = function(text) {
			var len = this.keys.length;
			var key = null;
			for (var i = 0; i < len; i++) {
				if (this.keys[i].indexOf(text) >= 0) {
					key = this.keys[i];
					break;
				}
			}
			if (key) {
				this._widget.setText(key);
				this._widget.onSelect(key);
			}
		};
		this.doSearchTextSelectingFirstMatchingItem = function(text) {
			this.currentProgrammaticSearch = text;
			this._widget.onSearch(text);
		};
		
		this.doSearchText = function(text) {
			this._widget.onSearch(text);
		};
		
		// to be overrided:
		this.buildSearchCriteria = function(key) { 
			return new sOn.Models.sOnDTO({ name: key });
		};
		
		// to be overrided:
		this.buildDtoWhenUserInputDoesntMatchAnyOfTheSuggestedItems = function(input) {
			return simpleDtoWithId(input);
		};
		
		this.onSelectionChanged = function(obj) {}; // to be handled. Deprecated, use onChanged
		this.onChanged = function(obj) {}; // to be handled
		this.onInputChange = function(text) {}; // to be handled
	};
	
	AutocompletionComponent.prototype.avoidServerCalls = function() {
		var dummyClient = { 
			requestData: function() {},
			retrieveItems: function () {}
		};
		this.client = dummyClient;
	};

	AutocompletionComponent.prototype.constructor = AutocompletionComponent;

	AutocompletionComponent.create = function(configObj) {
		var component = new AutocompletionComponent();
		var widget = new sOn.Widgets.AutocompleteTextBox(
							configObj.domId, configObj.placeholder);
		component.attachWidget(widget);
		component.attachClient(new ComponentClient());
		component.client.urlPath = configObj.urlPath;
		if (configObj.errorMessageWidget)
			component.attachErrorMessageWidget(configObj.errorMessageWidget);
		if (configObj.objectEncoder)
			component.objectEncoder = configObj.objectEncoder;
		return component;
	};
	

///////////////////////////////////////////////////////////////
	
	function DropdownComponent() {
		sOn.Interactors.Interactor.call(this, ['dataBinder']);
		var self = this;	
		this._handleServerError = function(err) {
			this._dataBinder.enable();
		};		
		
		this._subscribeEvents = function () {
			this._dataBinder.onObjectChanged = function(obj) {
				self.selectionChanged.call(self, obj);
				self.onSelectionChanged.call(self, obj);
			};

		};
	}

	DropdownComponent._create = function(configObj) {
		var component = new DropdownComponent();
		component.dtoType = configObj.dtoType;
		component.attachClient(new ComponentClient());
		component.client.urlPath = configObj.urlPath;
		if (configObj.errorMessageWidget)
			component.attachErrorMessageWidget(configObj.errorMessageWidget);
		return component;
	};

	DropdownComponent.create = function(configObj) {
		var component = this._create(configObj);
		component.attachDataBinder(sOn.Factory.DropDownDataBinder(
			configObj.placeholder, configObj.selectableDomId));
		return component;
	};
	
	DropdownComponent.createSimple = function(configObj) {
		var component = this._create(configObj);
		var dataBinder = new sOn.DataBinders.SingleChoiceSelectable();
		var dropDown = new sOn.Widgets.DropDown(configObj.selectableDomId, configObj.placeholder);
		dataBinder.attachWidget(dropDown);
		if (configObj.defaultOptionText) {
			dropDown.defaultOptionText = configObj.defaultOptionText;
		}
		component.attachDataBinder(dataBinder);
		return component;
	};

	DropdownComponent.prototype = {
		constructor: DropdownComponent,
		load: function(criteria) {
			this.criteria = criteria;
			this._dataBinder.disableWhileWait();
			this.client.retrieveItems(criteria, this);
		},
		dataBinder: function () {
			return this._dataBinder;
		}, 
		setLoggedUser: function(user) {
			this.client.provider = user;
		},
		selectionChanged: function(item) {
			this.selectedItem = item;
		},
		changeSelection: function (item) {
			this._dataBinder.selectItem(item);
		},
		handleRetrievedItems: function(items) {
			var self = this;
			var models = new sOn.Models.sOnCollection({ models: items, dtoType: self.dtoType });
			this._dataBinder.enable();
			this._dataBinder.addCollection(models);
			this.onLoaded();
		},
		clear: function() {
			this._dataBinder.clear(true);
		},
		redraw: function() {
			this._dataBinder.redraw();
		},
		deselectAnyOption: function() {
			this._dataBinder.deselectAnyOption();
		},
		onSelectionChanged: function() { }, // to be handled
		onLoaded: function () { }, //to be handled
		avoidServerCalls: function() {
			this.client.retrieveItems = function() {};
		}
	};
	
	///////////////////////////////////////////////////////////////
    // Requires this: https://github.com/valums/file-uploader
	function FileUploader() {
		var self = this;
		this.initialize = function () {
		};

		this.setParams = function (theParams) {
			this.ajaxFileUploader.setParams(theParams);
			this.params = theParams;
		};
		
		this.extendParams = function (theParams) {
			var extendedParams = this.params || {};
			for (var param in theParams) {
				extendedParams[param] = theParams[param];
			}
			this.setParams(extendedParams);
		};
		
		this._onSubmit = function(id, fileName) {
			self.extendParams({file: fileName});
			self.onSubmit(id, fileName);
		};
		
		this._onComplete = function (id, fileName, response) {
			if (window.sOn.Utils.isEmptyObject(response))
				self.onCancel(id, fileName);
			else
				self.onComplete(id, fileName, response);
		};
		
		this._onCancel = function (id, fileName) {
			self.onCancel(id, fileName);
		};
		
		this.onSubmit = function (id, fileName) { }; //to be handled
		this.onComplete = function (id, fileName, response) { }; // to be handled
		this.onCancel = function (id, fileName) { }; // to be handled
		
		this.configure = function (configObj, nativeUploader) {
			configObj.onComplete = this._onComplete;
			configObj.onSubmit = this._onSubmit;
			configObj.onCancel = this._onCancel;
			if (!nativeUploader) {
				this.ajaxFileUploader = new qq.FileUploader(configObj);
			} else {
				this.ajaxFileUploader = new nativeUploader(configObj);	
			}
		};
	}
	
	FileUploader.create = function (configObj, nativeUploader) {
		var component = new FileUploader();
		component.configure({
			element: document.getElementById(configObj.domId),
			action: configObj.url
		}, nativeUploader);	
		return component;
	};
	
	sOn.Components = sOn.Components || { };
	sOn.Components.FileUploader = FileUploader;
	sOn.Components.Dropdown = DropdownComponent;
	sOn.Components.Autocompletion = AutocompletionComponent;
	sOn.Components.ComponentDummyClient = ComponentDummyClient;
	
}(window.sOn));
﻿//------ Factory -----------------

window.sOn = window.sOn || { };

(function (sOn, undefined) {

	var dtb = sOn.DataBinders;
	var wgt = sOn.Widgets;

	function ErrorMessageWidget(placeholder) {
		var messageWidget;
		messageWidget = new wgt.Message("errorMessage", wgt.Message.types.error, placeholder);
		return messageWidget;
	}

	function TextBoxWidget(elementId, placeholder) {
		var id = elementId || "policyHolderId";
		return new wgt.TextBox(id, placeholder);
	}
	
	function AutocompleteTextBoxWidget(elementId, placeholder) {
		var id = elementId || "policyHolderId";
		return new wgt.AutocompleteTextBox(id, placeholder);
	}
	
	function CheckboxWidget(elementId, caption, placeholder) {
		return new wgt.Checkbox(elementId, caption, placeholder);
	}
	
	function SuccessMessageWidget(placeholder) {
		var messageWidget;
		messageWidget = new wgt.Message("successMessage", wgt.Message.types.success, placeholder);
		return messageWidget;
	}

	function EqualmedMessageWidget(id, placeholder) {
		var messageWidget;
		messageWidget = new wgt.Message(id, wgt.Message.types.success, placeholder);
		return messageWidget;
	}
	
	function AcceptButtonWidget(placeholder, buttonId) {
		var caption = "Aceptar";
		try {
			// TODO: quitar la dependencia de culture de widgets, factory, etc
			caption = sOn.Culture.strings.widgets.button.accept;
		}
		catch(e) {}
		var domId = buttonId || "submitButton";
		return new wgt.Button(domId, placeholder, caption, wgt.Button.types.accept);
	}
	
	function DropDownDataBinder(placeholder, domId) {
		var dataBinder = new dtb.SingleChoiceSelectable();
		dataBinder.attachWidget(new wgt.AutocompletionDropDown(domId, placeholder));
		return dataBinder;
	}
	
	function SpecialtiesDataBinder(placeholder) {
		return DropDownDataBinder(placeholder, "specialties");
	}

	function InsurersDataBinder(placeholder) {
		var dataBinder = new dtb.SingleChoiceSelectable();
		dataBinder.attachWidget(new wgt.AutocompletionDropDown("insurers", placeholder));
		return dataBinder;
	   }

	function ColaboratorsDataBinder(placeholder) {
		var dataBinder = new dtb.SingleChoiceSelectable();
		dataBinder.attachWidget(new wgt.AutocompletionDropDown("colaborators", placeholder));
		return dataBinder;
	   }
	
	function ActosDataBinder(placeholder) {
		var dataBinder = new dtb.SingleChoiceSelectable();
		dataBinder.attachWidget(new wgt.AutocompletionDropDown("actos", placeholder));
		return dataBinder;
	}

	function PairsBinder(id, placeholder) {
		var binder = new sOn.DataBinders.PairsTable();
		binder.attachWidget(new sOn.Widgets.Table(id, placeholder));
		return binder;
	}

	function ClickablePairsBinder(id, placeholder) {
		var binder = new sOn.DataBinders.ClickablePairsTable();
		binder.attachWidget(new sOn.Widgets.Table(id, placeholder));
		return binder;
	}
	
	function PrintingFormatter(formatter, placeholder, renderers, template) {
		formatter.driver = new sOn.Printing.Driver();
		if (template)
			formatter.template = template;
		if (renderers)
			formatter.attachAllRenderers(renderers);
		return formatter;
	}
	
	sOn.Factory = sOn.Factory || { };

	sOn.Factory.DropDownDataBinder = DropDownDataBinder;
	sOn.Factory.SpecialtiesDataBinder = SpecialtiesDataBinder;
	sOn.Factory.InsurersDataBinder = InsurersDataBinder;
	sOn.Factory.ActosDataBinder = ActosDataBinder;
	sOn.Factory.ErrorMessageWidget = ErrorMessageWidget;
	sOn.Factory.EqualmedMessageWidget = EqualmedMessageWidget;
	sOn.Factory.TextBoxWidget = TextBoxWidget;
	sOn.Factory.AutocompleteTextBoxWidget = AutocompleteTextBoxWidget;
	sOn.Factory.SuccessMessageWidget = SuccessMessageWidget;
	sOn.Factory.AcceptButtonWidget = AcceptButtonWidget;
	sOn.Factory.CheckboxWidget = CheckboxWidget;
	sOn.Factory.PreparePrintingFormatter = PrintingFormatter;
	sOn.Factory.ColaboratorsDataBinder = ColaboratorsDataBinder;
	sOn.Factory.PairsDataBinder = PairsBinder;
	sOn.Factory.ClickablePairsBinder = ClickablePairsBinder;

} (window.sOn));

﻿window.sOn = window.sOn || { };

(function(sOn, undefined) {
	
function sOnContainer() {
	var self = this;
	var initializables = [];
	this.initialize = function () {
		var len = initializables.length;
		for (var i = 0; i < len; i++) {
				initializeWidget(initializables[i]);
		}
	};

	function initializeWidget(initializable) {
		try{
				if (initializable.initialize)
				   initializable.initialize();
			}
			catch(e){
				if (!initializable)
					sOn.Logger.log("Initialization error: dependency number " + initializable + " has not been injected or is falsy");
				else {
					sOn.Logger.log("could not initialize widget:" + initializable.toString());
					try {
						console.log(initializable.constructor.toString().split("()")[0].split("function")[1] +
							" - problem:" + e.stack);
					}
					catch(x) {}
			}
		}
	};

	this.registerInitializable = function (initializable) {
		initializables.push(initializable);
	};
	this.publishWidgetsPorts = function (interactor, widgetNames) {
		var len = widgetNames.length;
		interactor.get = {};
		for (var i = 0; i < len; i++)
			generatePortForWidget(interactor, widgetNames[i]);
	};
	function toCamel(name) {
		return name.charAt(0).toUpperCase() + name.slice(1);
	};
	function generatePortForWidget(interactor, name) {
		var methodName = 'attach' + toCamel(name);
		var fieldName = '_' + name;
		interactor[methodName] = function (widget) {
			self.registerInitializable(widget);
			interactor[fieldName] = widget;
			interactor.get[name] = widget;
		};
	};

	this.attachWidget = function(interactor, widget) {
		var widgetName = widget.elementId;
		var methodName = 'attach' + toCamel(widgetName);
		generatePortForWidget(interactor, widgetName);
		interactor[methodName](widget);
		initializeWidget(widget);

	};
};

	function isArray(obj) {
		return (obj && obj.constructor && obj.constructor.toString().indexOf("Array") != -1) ;
	}
	
	/*
	 * This is the base interactor you can extend. 
	 * However you can use sOn.js without this.
	 */
	function sOnInteractor(widgetNames, container) {
		if (!container)
			container = new sOn.Interactors.Container();
		if (!isArray(widgetNames))
			throw new Error("Widgets should be an array of strings, not this:" + widgetNames);
		container.publishWidgetsPorts(this, widgetNames);
		var isInitialized = false;
		
		function executeAllMethodsStartingWithPrefix(target, prefix) {
				for (var propName in target) {
					if (typeof(target[propName]) == "function" 
						&& propName.indexOf(prefix) == 0)
					{
						target[propName]();
					}
				}
		}

		this.executeAllMethods_startingWith_subscribeEvents = function() {
			executeAllMethodsStartingWithPrefix(this, "_subscribeEvents");
		};
		
		this.executeAllMethods_startingWith_preInitialize = function() {
			executeAllMethodsStartingWithPrefix(this, "_preInitialize");
		};
		
		this.executeAllMethods_startingWith_postInitialize = function() {
			executeAllMethodsStartingWithPrefix(this, "_postInitialize");
		};
		
		this.initialize = function() {
			if (!isInitialized) {
				this.executeAllMethods_startingWith_preInitialize();
				container.initialize();
				this.executeAllMethods_startingWith_postInitialize();
				this.executeAllMethods_startingWith_subscribeEvents();
				isInitialized = true;
			}
		};
		function serverSessionHasFinished(code) {
			return code == 403 || code == -32750;	
		};
		this.attachClient = function(client) {
			var self = this;
			this.client = client;
			this.client.onError = function(message, code) {
				if (serverSessionHasFinished(code))
					self._handleSessionExpiration();
				else 
					self._handleServerError(message, code);
			};
		},
		this._handleServerError = function() {}; // can be overrided
		this._handleSessionExpiration = function() { // can be overrided
			sOn.Culture = sOn.Culture || { };
			sOn.Culture.strings = sOn.Culture.strings || { errors: {}};
			var msg = sOn.Culture.strings.errors.sessionExpired || "La sesión ha caducado o no tiene permisos para ejecutar esta acción. Pruebe a iniciar sesión de nuevo.";
			try {
				if (this._errorMessage)
					this._errorMessage.show(msg);
				else if (this._errorMessageWidget)
					this._errorMessageWidget.show(msg);
				else
					alert(msg);
			}
			catch(e) {
				alert(msg);
			}
		};
		
		this.addWidget = function (widget) {
			container.attachWidget(this, widget);
		};
		 
		if (!this.attachErrorMessageWidget)
			this.attachErrorMessageWidget = function (widget) {
				this._errorMessageWidget = widget;
			};
		this._preInitialize = function() {}; // can be overrided
		this._postInitialize = function() {}; // can be overrided
		this._subscribeEvents = function() {}; // can be overrided
	}

	/*
	 * You dont need to extend sOninteractor, this is a custom made
	 * interactor which leverages the container and nothing more 
	*/
	function SampleInteractor() {
		var self = this;
		var container = new sOnContainer();
		container.publishWidgetsPorts(this, ['buttonWidget']);

		this.clicked = false;
		
		this.initialize = function() {
			container.initialize();
			this._subscribeEvents();
		};
		this._subscribeEvents = function() {
			this._buttonWidget.onClick = function() {
				self.clicked = true;
			};
		};
	}
	
	/*
	 * This is a sample interactor that extends the base one.
	 * The idea is to implement subscribeEvents. 
	 * Defining postInitialize is not mandatory, is a template method.
	 */
	function ExtendedSampleInteractor(container) {
		// extends using constructor stealing:
		sOnInteractor.call(this, ['buttonWidget'], container); 
		// sample implementation:
		this.initialized = false;
		this.clicked = false;
		
		var self = this;
		this._subscribeEvents = function() {
			this._buttonWidget.onClick = function() {
				self.clicked = true;
			};
		};
		this._postInitialize = function() {
			this.initialized = true;
		};
	}
	
	function WrapperInheritanceSample(baseInteractor) {
		// No hemos conseguido que esto funcione
		sOnInteractor.call(this, []);
		if (!baseInteractor) {
			this.baseInteractor = new ExtendedSampleInteractor();
			for (var propName in this.baseInteractor) {
				this[propName] = this.baseInteractor[propName];
			}
		}

		this._postInitialize = function() {
			this.baseInteractor._postInitialize();
			this.someNewProperty = true;
		};
	}
	
	function ConstructorStealingInheritanceSample() {
		ExtendedSampleInteractor.call(this);
		
		this._postInitializeExtended = function() {
			this.someNewProperty = true;
		};
	}
	
	sOn.Interactors = sOn.Interactors || { };
	sOn.Controllers = sOn.Controllers || { };
	sOn.Interactors.Interactor = sOnInteractor;
	sOn.Interactors.Container = sOnContainer;
	sOn.Interactors.SampleInteractor = SampleInteractor;
	sOn.Interactors.ExtendedSample = ExtendedSampleInteractor;
	sOn.Interactors.WrapperInheritanceSample = WrapperInheritanceSample;
	sOn.Interactors.ConstructorStealingInheritanceSample = ConstructorStealingInheritanceSample;
	
}(window.sOn));

//sOn.js Framework