window.sOn = window.sOn || {};

(function (sOn, undefined) {

	sOn.Testing = sOn.Testing || { };
	sOn.testMode = true;
		
	sOn.Testing.arrayContainsItemWithSubstr = function(arr, str) {
			   for (var i = 0, len = arr.length; i < len; i++) {
			       if (arr[i].indexOf(str) >= 0)
			       	return true;
			   }
			   return false;
	};
	
	sOn.Testing.clearElements = function(fakeDocument) {
		if (fakeDocument.length != 0) {
			fakeDocument.empty();
			fakeDocument.remove();
		};
		$(".dataTables_wrapper").remove();
	};

	sOn.Testing.createFakeDocument = function() {
		var fakeDocument = $('#fake_document');
		sOn.Testing.clearElements(fakeDocument);

		fakeDocument = $("<div>").attr("id", "fake_document");
		fakeDocument.css("display", "none");
		$("body").append(fakeDocument);
		return fakeDocument;
	};
	
	sOn.Testing.spyOnAllMethodsOf = function(collaborator)
	{
		for(var propName in collaborator) {
			if (typeof(collaborator[propName]) == 'function')
				spyOn(collaborator, propName);
		};
	};

	sOn.Testing.getClickableColumn = function(tableId, colPosition) {
		var column = $(tableId).find("tbody tr td span.clickableCell")[colPosition];
		var col = $(column);
		if (col.length <= 0) {
			throw new Error("the table or the cell is not present in dom:" + tableId);
		};
		return col;
	};

	sOn.Testing.testClientCollaboration = function(fixture) {
		eval("var originalClientMethod = fixture.client." + fixture.clientMethodName);
		//----------- Test the request:
		spyOn(fixture.client, fixture.clientMethodName);

		fixture.requestMethod.call(fixture.interactor, fixture.interactor.inputParams);

		eval("var spy1 = fixture.client." + fixture.clientMethodName);
		if (fixture.clientParams) {
			expect(spy1).toHaveBeenCalledWith(fixture.clientParams);
		} else {
			expect(spy1).toHaveBeenCalled();
		}

		//---------- Test the response:
		sOn.Testing.stubServerResponse(fixture.client, fixture.stubResponse);
		spyOn(fixture.interactor, fixture.callbackName);

		try {
			originalClientMethod.call(fixture.client);
		}
		catch(e) {
			console.log(e);
			console.log("testClientColaboration doesnt work when the client method, receives arguments because it ignores them.");
		}

		eval("var spy2 = fixture.interactor." + fixture.callbackName);
		if (fixture.stubResponse) {
			expect(spy2).toHaveBeenCalledWith(fixture.stubResponse);
		} else {
			expect(spy2).toHaveBeenCalled();
		}
	};

	sOn.Testing.stubServerResponse = function(client, serverSentData) {
		client.requestData = function(url, data, onResponseSuccessCallback) {
			onResponseSuccessCallback(serverSentData);
		};
	};

	sOn.Testing.avoidServerCall = function(client) {
		for (var name in client) {
			var attr = client[name];
			if (typeof(attr) == 'function')
				if (attr.toString().indexOf("$.ajax") > 0)
					client[name] = function (){};
		}
		client.requestData = function(url, data, callback) { };
	};

	sOn.Testing.Matchers = { };
	
	sOn.Testing.Matchers.toExistNumerOfTimes = function(selectorOrElement, jQueryElement, times) {
		if (typeof selectorOrElement == 'string') {
			return jQueryElement.find(selectorOrElement)
				.length == times;
		}
		if (selectorOrElement instanceof jQuery) {
			return jQueryElement.find("#" + selectorOrElement.attr("id"))
				.length == times;
		}
		return false;
	};


	sOn.Testing.Matchers.jasmineCustom = {
		toExistOnceInsideElement: function(jQueryElement) {
			return sOn.Testing.Matchers.toExistNumerOfTimes(this.actual, jQueryElement, 1);
		},
		toExistInsideElementTimes: function(jQueryElement, times) {
			return sOn.Testing.Matchers.toExistNumerOfTimes(this.actual, jQueryElement, times);
		}
	};

	sOn.Testing.Integration = { };
	sOn.Testing.Integration.loadMaxTime = 3000;
	sOn.Testing.Integration.loadTargetWindow = function(url, postLoadCallback) {
		window.sOn.isTestMode = true;
		var appWindow = window.frames[0];
		if (!appWindow)
			throw new Error("No frames detected in jasmine launcher!");
		appWindow.location.href = url;
		waitsFor(
			function() {
				if (appWindow.readyForTestRunner) {
					appWindow.readyForTestRunner = false;
					return true;
				}
				return false;
			},
			"The page took too long to reload",
			sOn.Testing.Integration.loadMaxTime
		);
		runs(function() {
			postLoadCallback(appWindow);
		});
	};

	function Observer(target, evtMethodName) {
		this.target = target;
		this.toExecute = function(callback) {
			var eventFired = false;
			target[evtMethodName] = function() {
				eventFired = true;
			};
			waitsFor(function() {
				return eventFired;
			}, "Timeout waiting for event",
				sOn.Testing.Integration.loadMaxTime
			);
			runs(function() {
				callback();
			});
		};
		this.willExecute = this.toExecute;
		this.andThen = this.toExecute;
		this.afterTheCallWeMakeNowTo = function(sutMethod, argsArray){
			this.sutMethod = sutMethod;
			this.argsArray = argsArray;
			sutMethod.apply(this.target, argsArray);
			return this;
		};
	};

	sOn.Testing.Integration.WaitForEvent = function(target, evtMethodName) {
		return new Observer(target, evtMethodName);
	};

	sOn.Testing.Integration.AfterTheEvent = sOn.Testing.Integration.WaitForEvent;

	sOn.Testing.Acceptance = sOn.Testing.Acceptance || { };

	function AcceptanceAssert() {
		var self = this;
		this.AfterTheEvent = function(evtMethodName) {
			return sOn.Testing.Integration.AfterTheEvent(self.target, evtMethodName);
		};
		this.isGoingToFire = this.AfterTheEvent;
	};
	
	sOn.Testing.Acceptance.assertThat = function(target) {
		var assert = new AcceptanceAssert();
		assert.target = target;
		return assert;
	};

	sOn.Testing.Acceptance.andAssertThat = sOn.Testing.Acceptance.assertThat;
	

} (window.sOn));