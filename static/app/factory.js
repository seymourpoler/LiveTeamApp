xplive.Factory = {
    TasksInteractor: function(domConfig) {
        var interactor = new xplive.Interactors.Tasks(domConfig.placeholder);
        var taskButton = new sOn.Widgets.Button(
            "taskButton", domConfig.placeholder, "Start new planned task", 
            xplive.Styles.taskStarter);
        var unexpectedTaskButton = new sOn.Widgets.Button(
            "unexpectedTaskButton", domConfig.placeholder, 
            "Start new unexpected task", xplive.Styles.taskStarter);

        interactor.attachTaskButton(taskButton);
        interactor.attachUnexpectedTaskButton(unexpectedTaskButton);
        interactor.attachTasksBinder(xplive.Factory.TasksBinder(
                domConfig.placeholder, domConfig.binderDomId));
        interactor.attachFinishedBinder(xplive.Factory.FinishedTasksBinder(
                domConfig.placeholder, domConfig.finishedBinderDomId));
        interactor.attachExportLauncher(new sOn.Widgets.Button(
            "exportButton", domConfig.placeholder, 
            "Export data (csv)", sOn.Widgets.Button.types.accept));
        interactor.attachExportWidget(new sOn.Widgets.Message(
            "exportWidget", sOn.Widgets.Message.types.success, 
            domConfig.placeholder, "closeExportWidget", "exportWidgetContent"));
        return interactor;
    },
    TasksBinder: function(placeholder, binderDomId) {
        var binder = new xplive.DataBinders.Tasks();
        binder.domId = binderDomId;
        binder.attachWidget(new sOn.Widgets.Table(binderDomId, placeholder));
        return binder;
    },
    FinishedTasksBinder: function(placeholder, finishedBinderDomId) {
        var binder = new xplive.DataBinders.Finished();
        binder.domId = finishedBinderDomId;
        var widget = new sOn.Widgets.Table(finishedBinderDomId, placeholder);
        widget.enablePagination();
        widget.sorting = [[0, "desc"]];
        widget.areColumnsSortable = true;
        binder.attachWidget(widget);
        return binder;
    },
    Pomodoro: function() {
        var clock = new xplive.Clock();
        var pomodoro = new xplive.Pomodoro();
        pomodoro.clock = clock;
        return pomodoro;
    }
};

xplive.Factory.TotalsCalculator = function(tasksService, pomodoroInteractor){
    var calculator = new xplive.Interactors.TotalsCalculator();
    var widget = new xplive.Widgets.TodayTotals("todayTotalsWidget");
    calculator.attachTodayTotalsWidget(widget);
    calculator.attachTasksService(tasksService);
    calculator.attachPomodoroInteractor(pomodoroInteractor);
    return calculator;
};

xplive.Factory.TasksService = function(domConfig, session, tasksInteractor){
    var service = new xplive.Services.Tasks(session);
    if (tasksInteractor)
       service.attachInteractor(tasksInteractor);
    else
       service.attachInteractor(xplive.Factory.TasksInteractor(domConfig));
    service.attachStorage(new xplive.Storage.Server());
    return service;
};

xplive.Factory.PomodoroInteractor = function(domConfig){
    var interactor = new xplive.Interactors.Pomodoros();
    interactor.attachPomodoroLauncher(new sOn.Widgets.Button(
        "pomodoroLauncher", domConfig.placeholder, " ", 
        sOn.Widgets.Button.types.accept));
    interactor.attachPomodoroTerminator(new sOn.Widgets.Button(
        "pomodoroTerminator", domConfig.placeholder, " ", 
        sOn.Widgets.Button.types.accept));
    interactor.attachProgressBar(new xplive.Widgets.ProgressBar(
        "progressBar", $('#progress')));
    var pomodoro = xplive.Factory.Pomodoro();
    interactor.attachPomodoro(pomodoro);
    var box = new sOn.Widgets.TextBox(
        "sizeInMinutesBox", domConfig.placeholder);
    interactor.attachSizeInMinutesBox(box);
    interactor.attachAlertDialog(new xplive.Widgets.PomodoroPopup());
	interactor.attachWindowManager(new xplive.Widgets.WindowManager());
    var player = new xplive.Widgets.SoundPlayer('/static/meow');
    interactor.attachSoundPlayer(player);
    return interactor;
};

xplive.Factory.TeamInterpreter = function(){
    var interpreter = new xplive.Services.TeamInterpreter(); 
    interpreter.attachInactivityDetector(new xplive.Services.InactivityDetector());
    return interpreter;
};

xplive.Factory.TeamProxy = function(session){
    var proxy = new xplive.Services.TeamProxy(session);
    proxy.attachStorage(new xplive.Storage.Server());
    proxy.attachClock(new xplive.Clock());
    return proxy;
};

xplive.Factory.TeamService = function(session, 
                pomodoroDomConfig, tasksDomConfig, statusServiceConfig){
    var service = new xplive.Services.TeamService(session);
    if (pomodoroDomConfig){
       var pomodoroInteractor = xplive.Factory.PomodoroInteractor(pomodoroDomConfig);
       service.attachPomodoroInteractor(pomodoroInteractor);
    }
    service.attachTeamViewer(new xplive.Widgets.TeamViewer("teamViewer"));
    if (tasksDomConfig)
        service.attachTasksService(xplive.Factory.TasksService(tasksDomConfig));    
    service.attachSleepingPanel(new sOn.Widgets.Panel("sleeping"));
    service.attachWindowCloseDetector(new xplive.Services.WindowCloseDetector());
    service.attachTeamInterpreter(xplive.Factory.TeamInterpreter());
    service.attachStatusService(xplive.Factory.StatusService());
    return service;
};

xplive.Factory.TeamCommunicator = function(config, session){
    if (!session)
       session = new xplive.SessionManager().browserSession();
    var communicator = new xplive.Services.TeamCommunicator(session);
    communicator.attachChatProxy(new xplive.Chat.ChatProxy(session));
    communicator.attachMatesWidget(new xplive.Widgets.MatesWidget());
    communicator.attachClock(new xplive.Clock());
    communicator.attachWindowManager(new xplive.Widgets.WindowManager());
    var player = new xplive.Widgets.SoundPlayer('/static/ring');
    communicator.attachSoundPlayer(player);
    communicator.attachIncomingMessagesStack(new xplive.Services.MessagesStack());
    $('#teamChat').draggable({cancel: 'textarea,.whole-team-chat'});
    $('#teamMonitor').draggable();
    var nativeWidget = $('#wholeTeamChat');    
    communicator.attachWholeTeamChatViewer(
            new xplive.Widgets.ChatConversationViewer(nativeWidget));
    communicator.attachWholeTeamChatInput(new xplive.Widgets.ChatInputBox(
        "wholeTeamChatInput"));
    return communicator;
};

xplive.Factory.StatusService = function(){
    var service = new xplive.Services.StatusService();
    service.attachStatusWidget(new xplive.Widgets.StatusWidget({
        placeholder: 'teamMonitor', 
        elementId: 'statusPanel',
        dropdown: 'myLocation'
    }));
    return service;
};

xplive.Factory.CreateApp = function(config){
   var session = new xplive.SessionManager().browserSession();
   var teamProxy = xplive.Factory.TeamProxy(session);
   var tasksService = xplive.Factory.TasksService({
                placeholder: null,
                binderDomId: config.tasksBinderId,
                finishedBinderDomId: config.finishedTasksBinderId}, 
                session);
   var pomodoroInteractor = xplive.Factory.PomodoroInteractor({
                placeholder: null});
   var teamService = xplive.Factory.TeamService(session, null, null);
   teamService.attachPomodoroInteractor(pomodoroInteractor);
   teamService.attachTasksService(tasksService);
   var totalsCalculator = xplive.Factory.TotalsCalculator(tasksService, pomodoroInteractor);
   var activityDetector = new xplive.Services.UserActivityDetector();
   var teamCommunicator = xplive.Factory.TeamCommunicator(config);
   var statusService = teamService.get.statusService;
   function App(){
        this.teamCommunicator = teamCommunicator;
        this.tasksService = tasksService;
        this.pomodoroInteractor = pomodoroInteractor;
        this.teamService = teamService;
        this.tasksInteractor = tasksService.get.interactor;
        this.totalsCalculator = totalsCalculator;
        this.teamProxy = teamProxy;
        this.activityDetector = activityDetector;
        this.windowManager = new xplive.Widgets.WindowManager();
        this.statusService = statusService;
        this.initialize = function(){
            this.teamProxy.initialize();
            this.tasksService.initialize();            
            this.pomodoroInteractor.initialize();
            this.teamService.initialize();
            this.totalsCalculator.initialize();
            this.tasksService.loadExistingData();
            this.activityDetector.initialize();
            this.teamCommunicator.initialize();
            this.statusService.initialize();
        };
        this.myLocationIs = function(location){
            this.statusService.changeMyLocation(location);
        };
   };

   return new App();
};