//////////////////////////////////////////////////////////////
/*
TasksService: handles user tasks.
*/
/////////////////////////////////////////////////////////////
xplive.Services.Tasks = function(session){
   sOn.Interactors.Interactor.call(this, [
                'interactor', 'storage', 'totalsCalculator']);
   var self = this;

   this.handleLoadedTasks = function(allTasks){
       this._interactor.populateFromStorage(allTasks);
       updateStatus(this._interactor.allTasks());
   };

   var updateStatus = function(tasks){
       self._currentTask = tasks.currentTask;
       self.onTaskStatusChanged(tasks);
   };

   this.loadExistingData = function(){
       this._storage.loadTasks(session, this);
   };

   this.currentTask = function(){
        return self._currentTask;
   };

   this._subscribeEvents = function(){
       this._interactor.onTaskStatusChanged = function(allTasks){
           self._storage.saveTasks(allTasks, session);
           updateStatus(allTasks);
           sOn.Factory.EventBus().emit(xplive.Events.taskChanged, allTasks);
       };
   };

   this.onTaskStatusChanged = function(allTasks){}; // event
};

///////////////////////////////////////////////////
/*
ActivityFormatter: gets the member activity and build an object
containing human readable messages. When there are several messages to
display, it knows which ones are more important to show first.
*/
///////////////////////////////////////////////////
xplive.Services.ActivityFormatter = function(){};
xplive.Services.ActivityFormatter.generateCurrentTaskInfo = function(memberActivity, info){
  var currentTaskDetails = "";
  var shortDesc = "";
  info.summaryDisplayableInfo = "";
  if (memberActivity.currentTask.shortDescription){
    shortDesc = memberActivity.currentTask.shortDescription.trim();
    if (shortDesc.length > 0)
        currentTaskDetails += shortDesc;
    if (shortDesc.length > 20)
      info.summaryDisplayableInfo = shortDesc.substring(0, 30) + "...";
    else if (shortDesc.length > 1)
      info.summaryDisplayableInfo = shortDesc;
  }
  var ticket = "";
  if (memberActivity.currentTask.ticketId)
     ticket = memberActivity.currentTask.ticketId.trim();
  if (ticket.length > 0){
      if (currentTaskDetails.length > 0)
        currentTaskDetails += ", ";
      currentTaskDetails += "Ticket: " + ticket;
      if (info.summaryDisplayableInfo.length > 0)
          info.summaryDisplayableInfo += ", ";
      info.summaryDisplayableInfo += "#" + ticket;
  }
  info.displayableInfo += currentTaskDetails;
  if (info.summaryDisplayableInfo == "")
     info.summaryDisplayableInfo = "Working on some task";
  info.summaryDisplayableInfo = info.summaryDisplayableInfo.replace(/##/g, '#');
  info.summaryDisplayableInfo = "(" + info.summaryDisplayableInfo + ")";  
};

xplive.Services.ActivityFormatter.generateDisplayableInfo = function(memberActivity){
      var info = {summaryDisplayableInfo: "", displayableInfo: ""};
      var username = memberActivity.username || "   ";
      info.shortDisplayableInfo = username.charAt(0).toUpperCase() + 
                                  username.slice(1);
      info.displayableUsername = info.shortDisplayableInfo;
      if (memberActivity.itsMe){
        info.displayableInfo += "";
        info.shortDisplayableInfo = "> " + info.shortDisplayableInfo + " <";
      }
      if (memberActivity.isOnPomodoro){
        info.displayableInfo += " On pomodoro: " + memberActivity.pomodoro.remainingMinutes + ". ";
        info.shortDisplayableInfo += "  (" + memberActivity.pomodoro.remainingMinutes + ")";
      }
      if (memberActivity.isTakingBreak){
        info.displayableInfo += "Apparently taking a break";        
        info.summaryDisplayableInfo = "(" + info.displayableInfo + ")";
      }
      else if (memberActivity.isApparentlyOffline){
        info.shortDisplayableInfo = info.displayableUsername + " (offline)";
        info.displayableInfo = "Is offline";
        return info;
      }
      else if (memberActivity.currentTask){
          xplive.Services.ActivityFormatter.generateCurrentTaskInfo(memberActivity, info);
      }
      if (memberActivity.statusLocation == xplive.Common.Locations.IamNotHere){
          info.displayableInfo = "Is not here right now";
          info.summaryDisplayableInfo = info.displayableInfo;
      }
      else if (memberActivity.statusLocation && 
          memberActivity.statusLocation != xplive.Common.Locations.IamAtMyOfficeDesk){
          var location = " </br> Is " + memberActivity.statusLocation;
          info.displayableInfo += location;
          info.summaryDisplayableInfo += location;
      }
      return info;
};

////////////////////////////////////////////////////////
/*
MemberActivity: business object to keep and operate user activity.
*/
///////////////////////////////////////////////////////
xplive.Services.MemberActivity = function(fields){
  this.id = 0;
  this.currentTask = null;
  this.pomodoro = null;
  this.previousPomodoroChanged = false;
  this.sid = 0;
  sOn.Models.sOnDTO.call(this, fields);

  var self = this;

  var generateReadableTaskDetails = function(){
      self.info = xplive.Services.ActivityFormatter.generateDisplayableInfo(self);
   };

  var self = this;

  var interpretMyOwnActivity = function(username, session){
    self.itsMe = false;
    self.severalSessionsOpenWithSameAccount = false;
    if (username == session.username){
        self.itsMe = true;
        if (self.sid != session.sid)
          self.severalSessionsOpenWithSameAccount = true;
    }
  };

  var interpretPomodoroActivity = function(username, myUsername){
    self.isOnPomodoro = false;
    if (self.pomodoro && self.pomodoro.isOn)
        self.isOnPomodoro = true
  };

  var interpretBreak = function(username, myUsername){
    if (!self.isOnPomodoro && !self.currentTask)
        self.isTakingBreak = true;
  };

  var setVisibleUserName = function(username, myUsername){
    self.username = username;
  };

  this.interpret = function(username, session){
    setVisibleUserName(username, session.username);
    if (this.isApparentlyOffline){
        this.setAsApparentlyOffline();
        return;
    }
    interpretMyOwnActivity(username, session);
    interpretPomodoroActivity(username, session.username);
    interpretBreak(username, session.username);
    generateReadableTaskDetails();
  };

  this.generateId = function(currentTime){
      this.id = currentTime - xplive.Tasks.TheBeginning;
  };

  this.isOlderThanMaximunTeamActivity = function(currentTime){
       var millisecondsPassedNow = currentTime - xplive.Tasks.TheBeginning;
       var millisecondsPassedFromActivityToCurrent = millisecondsPassedNow - this.id;
       return millisecondsPassedFromActivityToCurrent > xplive.Common.MaximunTeamInactivity
  };

  this.currentTaskHasChanged = function(task){
    return (!this.currentTask && task) || 
              (this.currentTask && !this.currentTask.isEquivalent(task));
  };

  this.isThereAnyNewActivity = function(task){
      return (this.currentTaskHasChanged(task) || 
            this.previousPomodoroChanged ||
            this.statusLocationChanged ||
            this.isApparentlyOffline);
   };

  this.updateLocation = function(location){
      this.statusLocation = location;
      this.statusLocationChanged = true;
  };

  this.updatePomodoroActivity = function(change){
      if (JSON.stringify(this.pomodoro) != JSON.stringify(change)){
          this.previousPomodoroChanged = true;
          this.pomodoro = change;
      }
   };

   this.refresh = function(currentTime, currentTask){
      this.currentTask = currentTask;
      this.generateId(currentTime);
   };

   this.resetChanges = function(){
      this.previousPomodoroChanged = false;
      this.statusLocationChanged = false;
      this.isApparentlyOffline = false;
   };

   this.setAsApparentlyOffline = function(){
      this.id ++;
      this.isApparentlyOffline = true;
      generateReadableTaskDetails();
   };
};
xplive.Services.MemberActivity.prototype = new sOn.Models.sOnDTO();

//////////////////////////////////////////////////////
/*
InactivityDetector discards users from the team who haven't
been online for a long time.
*/
//////////////////////////////////////////////////////
xplive.Services.InactivityDetector = function(){
  this.discardInactiveUsers = function(teamActivity, currentTime){
      var usernamesToDiscard = [];
      for (var username in teamActivity)
          if (teamActivity[username].isOlderThanMaximunTeamActivity(currentTime))
             usernamesToDiscard.push(username);
      for (var i = 0, len = usernamesToDiscard.length; i < len; i++)
          delete teamActivity[usernamesToDiscard[i]];
   };
};

//////////////////////////////////////////////////////////////
/*
TeamInterpreter: parses activity info from every member in the team.
*/
/////////////////////////////////////////////////////////////
xplive.Services.TeamInterpreter = function(){
   sOn.Interactors.Interactor.call(this, ['inactivityDetector']);

  var teamActivityHistory = {};

   var detectOfflineMember = function(memberActivity, username){
        var memberHistory = teamActivityHistory[username];
        if (!memberHistory)
              memberHistory = { 
                timesThatSameActivityIsReceived : 1
              };
        else if (memberHistory.lastReceivedId == memberActivity.id)
              memberHistory.timesThatSameActivityIsReceived ++;
        else
            memberHistory.timesThatSameActivityIsReceived = 0;
        memberHistory.lastReceivedId = memberActivity.id;
        if (memberHistory.timesThatSameActivityIsReceived > xplive.Common.MaximunMissingMateUpdatesToConsiderOffline)
            memberActivity.setAsApparentlyOffline();
        teamActivityHistory[username] = memberHistory;
   };

   var manageOfflineMate = function(memberActivity, username){
        var hasBeenReportedAsOfflineBefore = memberActivity.isApparentlyOffline;
        memberActivity.markedAsOffline = false;
        detectOfflineMember(memberActivity, username);
        if (memberActivity.isApparentlyOffline && 
            !hasBeenReportedAsOfflineBefore){
              memberActivity.markedAsOffline = true;
        }
   };

   var interpretMembersActivity = function(teamActivity, session){
      for (var username in teamActivity){
          var memberActivity = teamActivity[username];
          memberActivity.interpret(username, session);
          manageOfflineMate(memberActivity, username);
          teamActivity[username] = memberActivity;
      }
   };

   var convertRawObjecsToValueObjects = function(teamActivity){
      for (var username in teamActivity)
          teamActivity[username] = new xplive.Services.MemberActivity(
                                              teamActivity[username]);
   };

   this.parseActivity = function(teamActivity, session){
      convertRawObjecsToValueObjects(teamActivity);
      this._inactivityDetector.discardInactiveUsers(teamActivity, this.currentTime);
      interpretMembersActivity(teamActivity, session);
    };
};


//////////////////////////////////////////////////////////////
/*
EventBus: Publisher/Subscriber implementation
*/
/////////////////////////////////////////////////////////////
sOn.EventBus = function(){
  var subscribersInfo = [];

  this.addSubscriber = function(callback){
      var eventNames = [].slice.call(arguments).slice(1);
      subscribersInfo.push({
        subscriber: callback, eventNames: eventNames});
  };

  this.emit = function(eventName, eventArgs){
      for(var i = 0, len = subscribersInfo.length; i < len; i++){
          var info = subscribersInfo[i];
          for (var j = 0, lenj = info.eventNames.length; j < lenj; j++){
              if (info.eventNames[j] == eventName)
                  info.subscriber(eventName, eventArgs);
          }
      };
  }
};

var singleton = new sOn.EventBus();

sOn.Factory.ResetEventBus = function(){
  singleton = new sOn.EventBus();
};
sOn.Factory.EventBus = function(){
  return singleton;
};


//////////////////////////////////////////////////////////////
/*
TeamProxy: responsible for communication among TeamServices 
*/
/////////////////////////////////////////////////////////////
xplive.Services.TeamProxy = function(session){
   sOn.Interactors.Interactor.call(this, [
                'storage', 'clock']);
   var self = this;
   var interactWithTeamEvery = xplive.Common.InteractWithTeamEvery;
   var tickCount = xplive.Common.ActivityIsSentAtLeast;
   
   this.reset = function(){
      tickCount = 0;
   };

   this._postInitialize = function(){
      this._clock.start(interactWithTeamEvery); 
   };

   var informTeamAboutMyActivityChange = function(evtName, activity){
        self._storage.updateUserActivity(session, activity); 
   };

   var informTeamAboutMyMatesActivity = function(evtName, info){
        self._storage.updateUserActivity(info.session, info.activity);
   };

   var letTheTeamKnowIamStillHere = function(evtName, activity){
        if (tickCount >= xplive.Common.ActivityIsSentAtLeast){
            tickCount = 0;
          self._storage.updateUserActivity(session, activity); 
        }
   };

   var isUserActive = true;
   var handleInactivity = function(evtName, args){
      isUserActive = false;
   };

   var handleAwakening = function(evtName, args){
      isUserActive = true;
   };

   var getTeamActivity = function(teamActivity){
      sOn.Factory.EventBus().emit(xplive.Events.thereIsNewTeamActivity, teamActivity);
   };

   this._subscribeEvents = function(){
      var eventBus = sOn.Factory.EventBus();
      eventBus.addSubscriber(informTeamAboutMyActivityChange, 
            xplive.Events.iHaveChangedMyActivity);
      eventBus.addSubscriber(letTheTeamKnowIamStillHere, 
            xplive.Events.iAmDoingTheSameThing);
      eventBus.addSubscriber(handleInactivity, 
            xplive.Events.userIsNotInteractingWithWindow);
      eventBus.addSubscriber(handleAwakening, 
            xplive.Events.userIsActiveAgain);
      eventBus.addSubscriber(informTeamAboutMyMatesActivity, 
            xplive.Events.iAmUpdatingMyMatesActivity);
      this._clock.onTick = function(date){
          sOn.Factory.EventBus().emit(xplive.Events.itIsTimeToReviewMyActivity, date);
          tickCount++;
          if (isUserActive){            
            self._storage.retrieveTeamActivity(
                session, getTeamActivity);
          }
      };
   };
};


//////////////////////////////////////////////////////////////
/*
TeamService: reads and writes team members activity and eventually
 reflects the team in the TeamMonitor.
*/
/////////////////////////////////////////////////////////////

xplive.Services.TeamService = function(session){
   sOn.Interactors.Interactor.call(this, [
                'pomodoroInteractor',
                'tasksService', 'teamViewer',
                'sleepingPanel', 'windowCloseDetector',
                'teamInterpreter', 'statusService']);
   var self = this;
   var activity = new xplive.Services.MemberActivity();
   activity.sid = session.sid;
   
   var updateMyOwnActivity = function(evtName, currentTime){
      self.currentTime = currentTime || self.currentTime;
      var task = self._tasksService.currentTask();
      var evt = xplive.Events.iAmDoingTheSameThing;
      if (activity.isThereAnyNewActivity(task)){
          evt = xplive.Events.iHaveChangedMyActivity;
          activity.resetChanges();
      }
      activity.refresh(self.currentTime, task);
      sOn.Factory.EventBus().emit(evt, activity);
   };

   var tellTheTeamThatIamLeaving = function(){
        activity.setAsApparentlyOffline();
        sOn.Factory.EventBus().emit(xplive.Events.iHaveChangedMyActivity, activity);
   };

   var informOthersAboutOfflineMates = function(teamActivity){
      for (var username in teamActivity){
        if (teamActivity[username].markedAsOffline)
          sOn.Factory.EventBus().emit(xplive.Events.iAmUpdatingMyMatesActivity, 
            { session: { 
              team: session.team, username: username,
              host: session.host}, 
              activity: teamActivity[username]
            });
      }
   };

   var handleTeamActivity = function(evtName, teamActivity){
      self._teamInterpreter.parseActivity(teamActivity, session);
      informOthersAboutOfflineMates(teamActivity);
      self._teamViewer.updateTeamActivity(teamActivity);
      for (var username in teamActivity)
        if (username != session.username)
            sOn.Factory.EventBus().emit(
                xplive.Events.thereIsNewMateActivity,
                {mate: username, activity: teamActivity[username]});
   };

   this.whatTheUserCanSeeInTheScreen = function(){
      return self._teamViewer.html();
   };

   var onPomodoroChanged = function(evtName, change){
          activity.updatePomodoroActivity(change);
   };
   var onPomodoroStarted = function(evtName, change){
          activity.updatePomodoroActivity(change);
   };
   var onPomodoroFinished = function(evtName, change){
          activity.updatePomodoroActivity(change);
   };

   var handleUserActive = function(){
      self._teamViewer.show();
      self._sleepingPanel.hide();
   };
   var handleUserInactive = function(){
      self._teamViewer.hide();
      self._sleepingPanel.show();
   };
   this.onClosing = function(){
      tellTheTeamThatIamLeaving();
   };
   var handleLocationChange = function(location){
      activity.updateLocation(location);
   };
   var handleTaskChange = function(evtName, evtArgs){
      updateMyOwnActivity();
   };

   this._subscribeEvents = function(){
      var eventBus = sOn.Factory.EventBus();
      eventBus.addSubscriber(onPomodoroStarted,
          xplive.Events.newPomodoroStarted);
      eventBus.addSubscriber(onPomodoroFinished,
          xplive.Events.pomodoroFinished);
      eventBus.addSubscriber(onPomodoroChanged,
          xplive.Events.pomodoroChanged);
      eventBus.addSubscriber(handleUserActive,
          xplive.Events.userIsActiveAgain);
      eventBus.addSubscriber(handleUserInactive,
          xplive.Events.userIsNotInteractingWithWindow);
      eventBus.addSubscriber(updateMyOwnActivity, 
          xplive.Events.itIsTimeToReviewMyActivity);
      eventBus.addSubscriber(handleTeamActivity, 
          xplive.Events.thereIsNewTeamActivity);
      eventBus.addSubscriber(handleTaskChange, 
          xplive.Events.taskChanged);
      this._windowCloseDetector.subscribe(this);
      this._teamViewer.onShowMateInfo = function(username){
          if (username != session.username)
            eventBus.emit(xplive.Events.onShowMateInfo, username);
      };
      this._statusService.onLocationChanged = function(location){
          handleLocationChange(location);
      };
   };
};

//////////////////////////////////////////////////////////////
/*
WindowCloseDetector: knows when the window is being closed and notifies
listeners. The TeamServices subscribes this to inform others that user
is leaving.
*/
/////////////////////////////////////////////////////////////
xplive.Services.WindowCloseDetector = function(){
  
  var self = this;

  var onClosing = function(){
      if (self.listener)
        self.listener.onClosing();
      if (xplive.Common.shouldAskOnWindowClosing)
        return "You are about to sign out.";
  }; 

  this.subscribe = function(listener){
    self.listener = listener;
  };

  this.initialize = function(){
    window.onbeforeunload = onClosing;
  };
};

//////////////////////////////////////////////////////////////
/*
UserActivityDetector: knows when the user is not interacting with the window
*/
/////////////////////////////////////////////////////////////
xplive.Services.UserActivityDetector = function(){
  
  var onUserInactive = function(){
      sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
  };

  var onUserActive = function(){
      sOn.Factory.EventBus().emit(xplive.Events.userIsActiveAgain);
  };

  var onWindowVisible = function(){
      sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
  };

  var onWindowNotVisible = function(){
      sOn.Factory.EventBus().emit(xplive.Events.windowIsNotVisible);
  };

  this.initialize = function(millisecondsToConsiderUserInactive){
    $.idleTimer(millisecondsToConsiderUserInactive || xplive.Common.TimeToConsiderInactivity);
    $(document).bind("idle.idleTimer", function(){
      onUserInactive();
    });
    $(document).bind("active.idleTimer", function(){
      onUserActive();
    });
    Visibility.change(function(evt, evtType){
        if (evtType == "hidden")
          onWindowNotVisible();
        if (evtType == "visible")
          onWindowVisible();
    });
  };
  
  this.reset = function(){
    $.idleTimer('destroy');    
  }
};

/////////////////////////////////////////////////////////////

xplive.Services.MessagesStack = function(){
  var storedMessages = [];

  this.storeMessage = function(msg){
      storedMessages.push(msg);
  };

  this.popAllMessages = function(){
      var clone = storedMessages.slice(0);
      storedMessages = [];
      return clone;
  };
};

//////////////////////////////////////////////////////////////
/*
TeamCommunicator: handles chats and synchronizes with pomodoros.
*/
/////////////////////////////////////////////////////////////
xplive.Services.TeamCommunicator = function(session){
    sOn.Interactors.Interactor.call(this, [
        'chatProxy', 'matesWidget', 'clock', 
        'windowManager', 'soundPlayer', 'incomingMessagesStack',
        'wholeTeamChatViewer', 'wholeTeamChatInput']);
    var self = this;
    var sentMessagesCount = 1;
    var isOnPomodoro = false;

    var handleNewMateActivity = function(evtName, evtArgs){
        self._matesWidget.updateMateActivity(evtArgs.mate, evtArgs.activity);
    };

    var isWindowVisible = true;
    var handleVisibleWindow = function(evtName, evtArgs){
        isWindowVisible = true;
        self._windowManager.stopTitleAnimation();
        self._windowManager.closeCurrentNotification();
    };

    var handleNotVisibleWindow = function(evtName, evtArgs){
        isWindowVisible = false;
    };

    var alertUserOfReceivedMessage = function(msg){
        if (!isWindowVisible){
          self._windowManager.animateTitle('chat: ' + msg.sender +' is talking');
          var notificationTxt = msg.body.substring(0, 20) +  "...";
          self._windowManager.popUpNotification(
              msg.sender +" is talking:", notificationTxt);
          self._soundPlayer.play();
        }
    };

    var setReceiptTime = function(msg){
        msg.receiptTime = self._clock.giveMeTheTime();
        //msg.visibleReceiptTime = msg.receiptTime.toLocaleTimeString().substring(0, 5);
        var visibleTimeParts = msg.receiptTime.toUTCString().split(' ');
        var usableParts = [visibleTimeParts[1], visibleTimeParts[2]];
        msg.visibleReceiptTime = usableParts.join(' ') + ' - ' + visibleTimeParts[4].substring(0, 5) + ' - ';
    };

    var lastConfirmationSent = null;
    var handleReceptionConfirmation = function(msg){
        if (lastConfirmationSent && lastConfirmationSent.id == msg.id)
          return;
        lastConfirmationSent = msg;
        self._matesWidget.moveMessageFromPendingToSent(msg.receiver, msg);
    };

    var handlePomodoroStart = function(){
        isOnPomodoro = true;
    };
    var handlePomodoroEnd = function(){
        isOnPomodoro = false;
        var storedMessages = self._incomingMessagesStack.popAllMessages();
        for (var i = 0, len = storedMessages.length; i < len; i++)
          self._matesWidget.showNewMessage(storedMessages[i].sender,
              storedMessages[i]);
        if (storedMessages.length > 0)
           alertUserOfReceivedMessage(storedMessages[0]);
    };

    var handleReceivedMessage = function(msg){
        self._chatProxy.confirmReception(msg);
        setReceiptTime(msg);
        if (isOnPomodoro){
          self._incomingMessagesStack.storeMessage(msg);
        }
        else {
          self._matesWidget.showNewMessage(msg.sender, msg);
          alertUserOfReceivedMessage(msg);
        }
    };

    var sendMsgThroughProxy = function(receiver, msg){
        msg.receiver = receiver;
        msg.sender = session.username;
        self._chatProxy.sendMessage(msg);
    };

    var prepareMessage = function(receiver, body){
        var msg = {body: body, receiver: receiver,
                    sender: session.username, team: session.team};
        msg.id = sentMessagesCount;
        sentMessagesCount++;
        setReceiptTime(msg);
        return msg;
    };

    var handleIntroducedMessage = function(receiver, body){
        var msg = prepareMessage(receiver, body);
        self._matesWidget.showPendingMessage(receiver, msg);
        sendMsgThroughProxy(receiver, msg);
    };

    var handleTeamChat = function(){
        self._wholeTeamChatInput.focus();
        self._wholeTeamChatInput.onMessageEntered = function(text){
            var msg = prepareMessage(xplive.Common.Team, text);
            self._chatProxy.sendMessageToTeam(msg);
        };
        self._chatProxy.onWholeTeamMessage = function(msg){
            setReceiptTime(msg);
            self._wholeTeamChatViewer.showMessage(msg);
        };
    };

    this._subscribeEvents = function(){
        sOn.Factory.EventBus().addSubscriber(handlePomodoroStart,
              xplive.Events.newPomodoroStarted);
        sOn.Factory.EventBus().addSubscriber(handlePomodoroEnd,
              xplive.Events.pomodoroFinished);
        sOn.Factory.EventBus().addSubscriber(handleVisibleWindow, 
              xplive.Events.windowIsVisible);
        sOn.Factory.EventBus().addSubscriber(handleVisibleWindow, 
              xplive.Events.userIsActiveAgain);
        sOn.Factory.EventBus().addSubscriber(handleNotVisibleWindow, 
              xplive.Events.windowIsNotVisible);
        sOn.Factory.EventBus().addSubscriber(handleNotVisibleWindow, 
              xplive.Events.userIsNotInteractingWithWindow);
        this._chatProxy.onReceivedMessage = handleReceivedMessage;
        this._chatProxy.onConfirmationReceived = handleReceptionConfirmation;
        this._matesWidget.onNewMessageIntroduced = handleIntroducedMessage;
        sOn.Factory.EventBus().addSubscriber(handleNewMateActivity,
                xplive.Events.thereIsNewMateActivity);
        sOn.Factory.EventBus().addSubscriber(function(evtName, evtArgs){
                self._matesWidget.showMateInfo(evtArgs);
                }, xplive.Events.onShowMateInfo);
        handleTeamChat();
    };

    this._postInitialize = function(){
        this._chatProxy.connect();
    };

    this.sendMessage = function(body){
        var msg = {body: body};
        return {
            to: function(receiver){
                sendMsgThroughProxy(receiver, msg);
                self._matesWidget.showNewMessage(receiver, msg);
            }
        };
    };
};

//////////////////////////////////////////////////////////////
/*
StatusService: user can tell his location, what is he working on, and
whow is he pairing up with.
*/
/////////////////////////////////////////////////////////////
xplive.Services.StatusService = function(){
    sOn.Interactors.Interactor.call(this, ['statusWidget']);

    var self = this;
    this.changeMyLocation = function(location){
      this.onLocationChanged(location);
    };

    this._subscribeEvents = function(){
        this._statusWidget.onLocationChanged = function(location){
            self.changeMyLocation(location);
        };
    };

    this.onLocationChanged = function(location){/* event */};
};
