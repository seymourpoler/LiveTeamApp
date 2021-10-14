xplive.Common.MaximunTeamInactivity = 43200000; // 12 hours in milliseconds
xplive.Common.MaximunMissingMateUpdatesToConsiderOffline = 20;
xplive.Common.ActivityIsSentAtLeast = 7;
xplive.Common.InteractWithTeamEvery = 2500; // milliseconds
xplive.Common.TimeToConsiderInactivity = 40000; // interaction with window
xplive.Common.ChatServerAddress = 'xplive-chat.herokuapp.com:80';
xplive.Common.Team = 'team'
xplive.Common.shouldAskOnWindowClosing = true;
xplive.Common.Locations = { 
    IamNotHere: "not here right now",
    IamAtMeeting1: "at the meeting room 1",
    IamAtMeeting2: "at the meeting room 2",
    IamAtMyOfficeDesk: "at my office desk",
    IamWorkingFromHome: "working from home" 
};

xplive.Events.iHaveChangedMyActivity = "I have changed my activity";
xplive.Events.iAmDoingTheSameThing = "My activity hasnt changed";
xplive.Events.iAmUpdatingMyMatesActivity = "I am updating my mate activity";
xplive.Events.thereIsNewTeamActivity = "There is new team activity";
xplive.Events.thereIsNewMateActivity = "There is new mate activity";
xplive.Events.userIsNotInteractingWithWindow = "User is not interacting with the window";
xplive.Events.userIsActiveAgain = "User is active again";
xplive.Events.itIsTimeToReviewMyActivity = "It is time to review my activity";
xplive.Events.onShowMateInfo = 'OnShowMateInfo';
xplive.Events.windowIsVisible = 'windowIsVisible';
xplive.Events.windowIsNotVisible = 'windowIsNotVisible';
xplive.Events.newPomodoroStarted = 'newPomodoroStarted';
xplive.Events.pomodoroChanged = 'onPomodoroChanged';
xplive.Events.pomodoroFinished = 'pomodoroFinished';
xplive.Events.taskChanged = 'taskChanged';

xplive.Common.Duration = function(delta) {
    var self = this;
    this.delta = delta || 0;

    this.seconds = function() {
        return new Date(this.delta).getUTCSeconds();
    };

    this.minutes = function() {
        return new Date(this.delta).getUTCMinutes();
    };

    this.hours = function() {
        return new Date(this.delta).getUTCHours();
    };

    this.toString = function() {
        var hours = this.hours();
        return (hours > 0) ? this.hours() + "h: " + displayableMinutesAndSeconds() : displayableMinutesAndSeconds();
    };

    var displayableMinutesAndSeconds = function() {
        return self.minutes() + "m: " + self.seconds() + "s ";
    };

    this.increase = function(lastDelta) {
        self.delta += lastDelta;
    };
};

xplive.Common.TimeDeltaCalculator = function() {
    this.timeDelta = function(countingFrom, lastDate) {
        var current = lastDate;
        if (!lastDate) current = new Date();
        return current - countingFrom;
    };
};

xplive.Common.ExecAsync = function(func, delay){
    setTimeout(function(){
        func();
    }, delay);
};



