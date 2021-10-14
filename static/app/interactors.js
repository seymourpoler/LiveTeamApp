xplive.Interactors.TasksCounter = function() {
    var findTheHighestTaskIdInArray = function(tasks){
        var highest = 0;
        for (var i = 0, len = tasks.length; i < len; i++){
            if (tasks[i].id > highest)
               highest = tasks[i].id;
        }
        return highest;
    };

    this.findTheHighestTaskId = function(ongoing, finished){
        var highestOngoing = findTheHighestTaskIdInArray(ongoing);
        var highestFinished = findTheHighestTaskIdInArray(finished);
        if (highestOngoing > highestFinished)
           return highestOngoing;
        else
           return highestFinished;
    };

};

xplive.Interactors.Exporter = function(){
    var taskArrayToCsv = function(taskArray){
        var str = '';
        for (var i = 0; i < taskArray.length; i++) {
            str += taskArray[i].toCSV() + '\r\n';
        }
        return str;
    }

    this.toCSV = function(allTasks){
        var str = taskArrayToCsv(allTasks.ongoingTasks);
        str += taskArrayToCsv(allTasks.finishedTasks);
        return str;
    };
};

xplive.Interactors.Tasks = function(placeholder) {

    var taskCount = 0;
    var self = this;

    ///// Inheritance:
    sOn.Interactors.Interactor.call(this, ['taskButton',
                                        'tasksBinder',
                                        'unexpectedTaskButton',
                                        'finishedBinder',
                                        'exportLauncher',
                                        'exportWidget'
                                ]);

    ///// Default dependencies configuration:
    this.timeDeltaCalculator = new xplive.Common.TimeDeltaCalculator();
    this.clock = new xplive.Clock();
    this.tasksCounter = new xplive.Interactors.TasksCounter();
    this.exporter = new xplive.Interactors.Exporter();

    this.onTaskStatusChanged = function(allTasks){}; // event

    this.allTasks = function(){ 
        return { currentTask: this.currentTask(),
                 ongoingTasks: this._tasksBinder.getBusinessCollection().models, 
                 finishedTasks: this._finishedBinder.getBusinessCollection().models};
    };

    var populateBinderWithTasks = function(tasks, binder){
        if (tasks){
          for (var i = 0, len = tasks.length; i<len; i++){
              var task = xplive.Tasks.FromRawObject(tasks[i]);
              binder.add(task);
          }
          binder.refresh();
        } 
    };

    this.populateFromStorage = function(allTasks){
        populateBinderWithTasks(allTasks.ongoingTasks, this._tasksBinder);
        populateBinderWithTasks(allTasks.finishedTasks, this._finishedBinder);
        taskCount = this.tasksCounter.findTheHighestTaskId(
                         self._tasksBinder.getBusinessCollection().models,
                         self._finishedBinder.getBusinessCollection().models);
    };

    this.whatTheUserCanSeeInTheScreen = function() {
        return $('body').html();
    };

    this.guiText = function() {
        return $('body').html();
    };

    this.startNewUnexpectedTask = function() {
        return startNewTask(new xplive.Tasks.UnexpectedTask());
    };

    this.startNewPlanifiedTask = function(name) {
        return startNewTask(new xplive.Tasks.PlanifiedTask(name));
    };

    var startNewTask = function(task) {
        stopCurrentTask();
        task.id = taskCount + 1;
        taskCount++;
        self._tasksBinder.add(task);
        self._tasksBinder.refresh();
        self.onTaskStatusChanged(self.allTasks());
        return task;
    };

    var stopCurrentTask = function(){
        var currentTime = self.clock.giveMeTheTime();
        applyAction(function(task) {
            task.stop(currentTime);
        }, self._tasksBinder);
        self._tasksBinder.refresh();
    };

    this.currentTask = function(){
        var ongoingTasks = this._tasksBinder.getBusinessCollection().models;
        for(var i = 0, len = ongoingTasks.length; i < len; i++)
            if (ongoingTasks[i].status == xplive.Status.RUNNING)
                return ongoingTasks[i];
        return null;
    };

    this.stopCurrentTask = function() {
        stopCurrentTask();
        this.onTaskStatusChanged(this.allTasks());
    };

    this.resumeStoppedTask = function(task) {
        stopCurrentTask();
        task.resume(this.clock.giveMeTheTime());
        this._tasksBinder.refresh();
        this.onTaskStatusChanged(this.allTasks());
    };

    this.finishTask = function(task) { 
        task.finish(this.clock.giveMeTheTime());
        this._finishedBinder.add(task);
        self.onTaskStatusChanged(self.allTasks());
    };

    var applyAction = function(action, container) {
        var currentTasksModels = container.getBusinessCollection().models;
        currentTasksModels.map(action);
    };

    /////////// Protected inherited methods:
    this._subscribeEvents = function() {
        this._exportLauncher.onClick = function(){
            var csv = self.exporter.toCSV(self.allTasks());
            self._exportWidget.show(csv);
        };

        this._taskButton.onClick = function() {
            self.startNewPlanifiedTask();
        };
        this._unexpectedTaskButton.onClick = function() {
            self.startNewUnexpectedTask();
        };
        this._tasksBinder.onColumnClicked = function(task, colName) {
            if (task.status == xplive.Status.STOPPED) self.resumeStoppedTask(task);
            else self.stopCurrentTask();
        };
        this._tasksBinder.onItemRemoval = function(task) {
            self.finishTask(task);
        };
        this._tasksBinder.onItemChanged = function(task) {
            self.onTaskStatusChanged(self.allTasks());
        };    	
    	this._finishedBinder.onItemRemoval = function (task) {
    		self.onTaskStatusChanged(self.allTasks());
    	};
    	this._finishedBinder.onItemChanged = function (task) {
    		self.onTaskStatusChanged(self.allTasks());
    	};
    };
};

xplive.Interactors.TotalsCalculator = function(){
  
    sOn.Interactors.Interactor.call(this, 
        ['todayTotalsWidget', 'tasksService', 'pomodoroInteractor']);
    var self = this;
    pomodorosCount = 0;
    allTasksReceived = { ongoingTasks: [], finishedTasks: []};

    var TodayTotals = function(){
        this.planifiedTasks = 0;
        this.unexpectedTasks = 0;
        this.interruptions = 0;
        this.time = "";
        this.timeDelta = 0;
        this.pomodoros = 0;

        this.prepareTimes = function(){
            this.time = new xplive.Common.Duration(this.timeDelta);
            this.lastCalculationTime = new Date().toTimeString().substring(0, 8);
        };

        this.setPomodorosCount = function(count){
            this.pomodoros = count;
        };

        this.addTaskToTotal = function(task){
            if (!task.hasBeenStartedToday())
                return;
            if (task.kind == xplive.Kinds.PLANIFIED)
                this.planifiedTasks++;
            else 
                this.unexpectedTasks++;
            this.interruptions += task.interruptionsCountToday;
            if (task.elapsedTimeToday)
                this.timeDelta += task.elapsedTimeToday.delta;
            else
                this.timeDelta += task.elapsedTime.delta;
        };
    };

    var recalculateTaskGroup = function(todayTotals, taskGroup){
        if (taskGroup)
            for (var i = 0, len = taskGroup.length; i < len; i++)
                todayTotals.addTaskToTotal(taskGroup[i]);
    };

    this.recalculateTasksTotals = function(allTasks){
        var todayTotals = new TodayTotals();
        recalculateTaskGroup(todayTotals, allTasks.ongoingTasks);
        recalculateTaskGroup(todayTotals, allTasks.finishedTasks);
        todayTotals.prepareTimes();
        todayTotals.setPomodorosCount(pomodorosCount);
        this._todayTotalsWidget.show(todayTotals);
        this.totals = [todayTotals];
    };

    this.whatTheUserCanSeeInTheScreen = function(){
        return "1";
    };

    this.tasksTotals = function(){
        return this.totals;
    };

    var onPomodoroFinished = function(evtName, evtArgs){
            pomodorosCount++;
            self.recalculateTasksTotals(allTasksReceived);
            if (allTasksReceived.currentTask){
                allTasksReceived.currentTask.pomodoros++;
            }
    };

    this._subscribeEvents = function(){
        this._tasksService.onTaskStatusChanged = function(allTasks){
            allTasksReceived = allTasks;
            self.recalculateTasksTotals(allTasksReceived);
        };
        sOn.Factory.EventBus().addSubscriber(
            onPomodoroFinished, xplive.Events.pomodoroFinished);
    };
};

xplive.Interactors.Pomodoros = function(){
    sOn.Interactors.Interactor.call(this, 
        ['progressBar', 'pomodoroLauncher', 'pomodoro',
        'pomodoroTerminator','sizeInMinutesBox',
        'alertDialog', 'windowManager', 'soundPlayer']);

    var self = this;
    var lastChangePercent = -1;
	var lastChangeMinute = -1;

	function prepareTheRemainingMinutesText(change) {
		if (change.percent >= 100)
			return "Finished";
		if (change.remainingMinutes == 0)
    		return "less than a minute left";
    	else
    		return "about " + change.remainingMinutes + " minutes left";
	};
	
    var updateUIandSubscribers = function(change, remainingMinutes) {
        if (lastChangePercent != change.percent){
          self._progressBar.update(change);
          self._windowManager.changeTitle(change.remainingMinutes);
          if (remainingMinutes != lastChangeMinute){
            self._progressBar.remarkMinuteChange();
            self._sizeInMinutesBox.setText(remainingMinutes);
            informSubscribers(xplive.Events.pomodoroChanged, {isOn: true, 
                remainingMinutes: change.remainingMinutes});
          }
        }
    }

    var handlePomodoroChange = function(changeObj){
    	var change = new sOn.Models.sOnDTO(changeObj).clone();
        var remaining = change.remainingMinutes;
    	change.remainingMinutes = prepareTheRemainingMinutesText(change);
        updateUIandSubscribers(change, remaining);
    	lastChangeMinute = remaining; 
        lastChangePercent = change.percent;        
    };

    var updateUIOnFinish = function(){
        self._soundPlayer.play();
        handlePomodoroChange({
                sizeInMinutes: self._pomodoro.sizeInMinutes,
                remainingMinutes: 0,
                percent: 100
        });
        self._progressBar.inactiveBar();
    	self._windowManager.changeTitle("LiveTeamApp");
        self._pomodoroLauncher.show();
        self._pomodoroTerminator.hide();
        self._sizeInMinutesBox.enable();
        self._sizeInMinutesBox.setText(self._pomodoro.sizeInMinutes);
    };

    var updateUIOnStart = function(){
    	self._progressBar.start();
    	handlePomodoroChange({
                sizeInMinutes: self._pomodoro.sizeInMinutes,
                remainingMinutes: self._pomodoro.sizeInMinutes,
                 percent: 0
        });
    	self._pomodoroLauncher.hide();
        self._pomodoroTerminator.show();
        self._sizeInMinutesBox.disable();
    };

    this.fireEvent = function(eventName, eventArgs){
        informSubscribers(eventName, eventArgs);
    };

    var informSubscribers = function(eventName, eventArgs){
        sOn.Factory.EventBus().emit(eventName, eventArgs);
    };

    this.startPomodoro = function(minutes){
        self._pomodoro.sizeInMinutes = minutes;
        self._pomodoro.start();
        updateUIOnStart();
        informSubscribers(xplive.Events.newPomodoroStarted, 
            {isOn: true, remainingMinutes: minutes});
    };

    this.stopPomodoro = function(){
        self._pomodoro.finish();
        finalizePomodoro();
    };

    var finalizePomodoro = function(){
        updateUIOnFinish();
        informSubscribers(xplive.Events.pomodoroFinished, 
            {isOn: false, remainingMinutes: 0});
    };

    this._subscribeEvents = function(){
        self._pomodoroLauncher.onClick = function(){
            var minutes = parseInt(self._sizeInMinutesBox.text());
            if (isNaN(minutes))
                minutes = 30;
            self.startPomodoro(minutes);
        };
        self._pomodoroTerminator.onClick = function(){
            self.stopPomodoro();
        };
        self._pomodoro.onStatusChanged = function(change){
            handlePomodoroChange(change);
        };
        self._pomodoro.onTimeOver = function(){
            finalizePomodoro();
            xplive.Common.ExecAsync(function(){
                self._alertDialog.alert();
            }, 1000);
        };
    };

    this._postInitialize = function(){
        if (!this._sizeInMinutesBox.text())
            this._sizeInMinutesBox.setText(this._pomodoro.sizeInMinutes.toString());
    };

    this.onPomodoroChanged = function(){}; // event
    this.onPomodoroFinished = function(){}; // event
    this.onPomodoroStarted = function(){}; // event
};
