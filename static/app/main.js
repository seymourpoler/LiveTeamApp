var xplive = {};
xplive.AppName = "LiveTeamApp";
xplive.Tasks || (xplive.Tasks = {});
xplive.Interactors || (xplive.Interactors = {});
xplive.Common || (xplive.Common = {});
xplive.Events || (xplive.Events = {});
xplive.DataBinders || (xplive.DataBinders = {});
xplive.Storage || (xplive.Storage = {});
xplive.Widgets || (xplive.Widgets = {});
xplive.Services || (xplive.Services = {});
xplive.UItext || (xplive.UItext = {});
xplive.Chat || (xplive.Chat = {});

xplive.Status = {
    RUNNING: "Running",
    STOPPED: "Stopped",
    FINISHED: "Finished"
};

xplive.Actions = {
    STOP: "Stop",
    RESUME: "Resume"
};

xplive.Kinds = {
    PLANIFIED: "Planned",
    UNEXPECTED: "Unexpected"
};


xplive.Styles = {
    taskStarter : { cssClass: 'taskStarter'},
    disabled: 'disabled',
    runningStatus : 'runningStatusCls',
    unexpectedRunningStatus : 'unexpectedRunningStatusCls',
    stoppedStatus : 'stoppedStatusCls',
    stopActionCss : 'stop',
    taskOnCss : 'taskOn',
    taskOffCss : 'taskOff',
    memberOnPomodoro: 'btn btn-danger',
    memberAvailable: 'btn btn-info',
    memberOffline: 'btn offline',
    memberIsTakingBreak: 'btn btn-warning',
    memberDetails: 'modal hide fade in',
    memberIsMyself: 'myself',
    severalSessionsOpenWithSameAccount: 'btn btn-inverse',
};

// style for sOn.js
sOn.Widgets.Table.clickableClass = "btn clickableCell";
sOn.Widgets.Table.removeIconClass = "actionCell removeRowIcon"


xplive.SessionManager = function(){
    this.locationGetter = { 
                path: function(){ return window.location.pathname},
                host: function(){ return window.location.protocol+"//"+window.location.host}
    },
    this.browserSession = function(){
         var path = this.locationGetter.path();
         path = decodeURI(path);
         path = path.replace(/ /g, "").toLowerCase();
         var parts = path.split("/");
         var sid = Math.random().toString().substring(2,5);
         return { team: parts[1], username: parts[2], 
                  host: this.locationGetter.host(),
                  sid: sid};
    };
};
