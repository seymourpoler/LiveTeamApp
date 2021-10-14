xplive.Common.shouldAskOnWindowClosing = false;
xplive.Widgets.SoundPlayer.isTestMode = true;
var Duration = xplive.Common.Duration;

var spyTheBus = function(evtName, eventBus){
    var Spy = function(){
        this.called = false;
        this.callCount = 0;
        var self = this;
        this.subs = function(evtN, evargs){
            if (evtN == evtName){
                self.callCount++;
                self.called = true;
                self.eventArgs = evargs;
            }
        };
    };
    var spy = new Spy();
    eventBus.addSubscriber(spy.subs, evtName);
    return spy;
};

describe("UnexpectedTask", function () {
    it("has a startTime later than a planified task when started afterwards", function() {
    	var pastDate = new Date(2012, 1, 1);
    	var task = new xplive.Tasks.PlanifiedTask();
    	for (var i = 0; i < 10000; i++){
    		var spendSomeTime = i.toString();
    	}
        var task2 = new xplive.Tasks.UnexpectedTask();
		var diff1 = task.startTime - pastDate;
    	var diff2 = task2.startTime - pastDate;
        expect(diff2).toBeGreaterThan(diff1);
    });		

    it("can be serialized and deserialized", function(){
        var originalDate = new Date();
        var task = new xplive.Tasks.UnexpectedTask();
        task.resume(originalDate);
        task.stop(new Date(originalDate.valueOf() + 1000));
        var json = JSON.stringify(task);
        expect(json).not.toContain(originalDate.getFullYear().toString());

        var deserializedTask = xplive.Tasks.FromRawObject(JSON.parse(json));

        expect(deserializedTask.startTime).toEqual(task.startTime);
        expect(deserializedTask.startTime - task.startTime).toBe(0);
        expect(deserializedTask.elapsedTimeToday.delta).not.toBe(0);
        expect(deserializedTask.elapsedTime.delta).not.toBe(0);
        expect(deserializedTask.interruptionsCountToday).toBe(1);
    });  

    it("counts the elapsed time for today in addition to the total", function(){
        var task = new xplive.Tasks.UnexpectedTask();
        task.resume(new Date(new Date(2010, 1, 1).setMinutes(1)));
        task.stop(new Date(new Date(2010, 1, 1).setMinutes(2)));
        
        task.resume(new Date(new Date().setMinutes(1)));
        task.stop(new Date(new Date().setMinutes(2)));
        
        expect(task.elapsedTimeToday.delta).toBeGreaterThan(59000);
        expect(task.elapsedTimeToday.delta).toBeLessThan(61000);
        expect(task.elapsedTime.delta).toBeGreaterThan(110000);
        expect(task.elapsedTime.delta).toBeLessThan(130000);
    });    

    it("counts interruptiosn for today in addition to the total", function(){
        var task = new xplive.Tasks.UnexpectedTask();
        task.resume(new Date(new Date(2010, 1, 1).setMinutes(1)));
        task.stop(new Date(new Date(2010, 1, 1).setMinutes(2)));
        
        task.resume(new Date(new Date().setMinutes(1)));
        task.stop(new Date(new Date().setMinutes(2)));
        
        expect(task.interruptionsCount).toBe(2);
        expect(task.interruptionsCountToday).toBe(1);
    });    

    it("resets elapsedTimeToday if another day passes", function(){
        var task = new xplive.Tasks.UnexpectedTask();
        // came from the server like this:
        task.elapsedTimeToday.delta = 99000; 
        task.resume(new Date(new Date(2010, 1, 1).setMinutes(1)));
        task.stop(new Date(new Date(2010, 1, 1).setMinutes(2)));
        
        task.resume(new Date(new Date().setMinutes(1)));
        task.stop(new Date(new Date().setMinutes(2)));
        
        expect(task.elapsedTimeToday.delta).toBeGreaterThan(59000);
        expect(task.elapsedTimeToday.delta).toBeLessThan(61000);
    });        
});

describe("Tasks interactor", function() {
    var fakeDocument = "";
    var interactor;

    beforeEach(function() {
        fakeDocument = sOn.Testing.createFakeDocument();
        interactor = xplive.Factory.TasksInteractor({
            placeholder: fakeDocument,
            binderDomId: "table",
            finishedBinderDomId: "finishedTasks"
        });
        interactor.initialize();
    });

    it("hasnt been interrupted in the beginning", function() {
        var task = interactor.startNewPlanifiedTask();

        expect(task.interruptionsCount).toBe(0);
    });

    it("counts interruptions only when task is running", function() {
        var task = interactor.startNewPlanifiedTask();
        interactor.stopCurrentTask();
        interactor.stopCurrentTask();
        expect(task.interruptionsCount).toBe(1);
    });

    it("counts interruptions when stop the current to resume another", function() {
        var task = interactor.startNewPlanifiedTask();
        var task2 = interactor.startNewPlanifiedTask();

        interactor.resumeStoppedTask(task);

        expect(task2.interruptionsCount).toBe(1);
    });

    it("knows which one is the current task", function() {
        var task1 = interactor.startNewPlanifiedTask();
        var task2 = interactor.startNewPlanifiedTask();
        interactor.resumeStoppedTask(task1);
        var task3 = interactor.currentTask();

        expect(task3).toBe(task1);
    });

    it("adds the new task to databinder", function() {
        spyOn(interactor.get.tasksBinder, "add");

        var task = interactor.startNewPlanifiedTask();

        expect(interactor.get.tasksBinder.add).toHaveBeenCalledWith(task);
    });

    it("adds the existing task to databinder when loading from storage", function() {
        spyOn(interactor.get.tasksBinder, "add").andCallFake(function(task){
             expect(task.elapsedTime.seconds()).toBeGreaterThan(0);
             expect(task.startTime.getSeconds()).toBeGreaterThan(0);
        });
        spyOn(interactor.get.tasksBinder, "refresh");
        var task = {id: 100, kind: xplive.Kinds.PLANIFIED, 
                    startTime: "984505975238",
                    elapsedTime:{delta:5778}};
        interactor.populateFromStorage({
             ongoingTasks: [task]
        });

        expect(interactor.get.tasksBinder.add).toHaveBeenCalled();
        expect(interactor.get.tasksBinder.refresh).toHaveBeenCalled();
    });

    it("adds new tasks with correlative ids after the ones loaded from storage", function() {
        var task = {id: 100, kind: xplive.Kinds.PLANIFIED, 
                    startTime:"2012-08-09T18:10:59.199Z",
                    elapsedTime:{delta:5778}};
        var task2 = {id: 110, kind: xplive.Kinds.PLANIFIED, 
                    startTime:"2012-08-09T18:10:59.199Z",
                    elapsedTime:{delta:5778}};
        interactor.populateFromStorage({
             ongoingTasks: [task], 
             finishedTasks: [task2]
        });
        var task3 = interactor.startNewPlanifiedTask();

        expect(task3.id).toBe(111);
    });

    it("adds the existing finished task to databinder when loading from storage", function() {
        spyOn(interactor.get.finishedBinder, "add");
        spyOn(interactor.get.finishedBinder, "refresh");
        var task = new xplive.Tasks.PlanifiedTask();
        task.id = 100;
        interactor.populateFromStorage({
             finishedTasks: [task]
        });

        expect(interactor.get.finishedBinder.add).toHaveBeenCalled();
        expect(interactor.get.finishedBinder.refresh).toHaveBeenCalled();
    });

    it("adds all the existing tasks to binder from storage", function() {
        spyOn(interactor.get.finishedBinder, "add").andCallFake(function(tsk){
            expect(tsk.kind).toBe(xplive.Kinds.PLANIFIED);
        });
        var task = new xplive.Tasks.PlanifiedTask();
        task.id = 100;
        var task2 = new xplive.Tasks.PlanifiedTask();
        task2.id = 200;
        interactor.populateFromStorage({
             finishedTasks: [task, task2]
        });

        expect(interactor.get.finishedBinder.add.callCount).toBe(2);
    });

    it("refreshes the databinder when adding the task", function() {
        spyOn(interactor.get.tasksBinder, "refresh");

        var task = interactor.startNewPlanifiedTask();

        expect(interactor.get.tasksBinder.refresh).toHaveBeenCalled();
    });

    it("doesnt duplicate tasks", function() {
        interactor.startNewPlanifiedTask();
        interactor.startNewPlanifiedTask();
        interactor.startNewPlanifiedTask();

        var addedTasks = interactor.get.tasksBinder.getBusinessCollection();
        expect(addedTasks.length).toEqual(3);
    });

    it("stops all running tasks when adding a new one", function() {
        var first = "1st";
        var second = "2nd";
        interactor.get.tasksBinder.getBusinessCollection = function() {
            return new sOn.Models.sOnCollection({
                models: [new xplive.Tasks.PlanifiedTask()]
            });
        };
        interactor.get.tasksBinder.add = function(task) {
            if (task.name == first) expect(task.status).toEqual(xplive.Status.STOPPED);
            else if (task.name == second) expect(task.status).toEqual(xplive.Status.RUNNING);
            else throw new Error('this test has a bug');
        };

        interactor.startNewPlanifiedTask({name: second});
    });

    it("adds task to binder when the button is pressed", function() {
        spyOn(interactor.get.tasksBinder, "add");

        interactor.get.taskButton.doClick();

        expect(interactor.get.tasksBinder.add).toHaveBeenCalled();
    });

    it("adds the new task with different id", function() {
        var task = interactor.startNewPlanifiedTask();
        var task2 = interactor.startNewPlanifiedTask();

        expect(task.id).not.toEqual(task2.id);
    });
	
    it("adds unexpected task to binder when the button is pressed", function() {
        spyOn(interactor.get.tasksBinder, "add");

        interactor.get.unexpectedTaskButton.doClick();

        expect(interactor.get.tasksBinder.add).toHaveBeenCalled();
    });

    it("add the new unexpected task to the databinder", function() {
        spyOn(interactor.get.tasksBinder, "add");

        var task = interactor.startNewUnexpectedTask();

        expect(interactor.get.tasksBinder.add).toHaveBeenCalledWith(task);
    });

    it("handles the resume event from databinder", function() {
        spyOn(interactor, "resumeStoppedTask");
        interactor.get.tasksBinder.onColumnClicked({
            status: xplive.Status.STOPPED
        }, "action");

        expect(interactor.resumeStoppedTask).toHaveBeenCalled();
    });

    it("handles the stop event from databinder", function() {
        spyOn(interactor, "stopCurrentTask");
        interactor.get.tasksBinder.onColumnClicked({}, "action");

        expect(interactor.stopCurrentTask).toHaveBeenCalled();
    });

    it("stops the current task", function() {
        interactor.startNewUnexpectedTask();

        interactor.stopCurrentTask();

        expect(interactor.get.tasksBinder.getBusinessCollection().models[0].status).toEqual(xplive.Status.STOPPED);
    });

    it("fires event when a task is stopped", function() {
        var task = interactor.startNewUnexpectedTask();
        var eventFired = false;
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
            expect(allTasks.ongoingTasks[0]).toBe(task);
        };

        interactor.stopCurrentTask();

        expect(eventFired).toBeTruthy();
    });
	
	it("fires event when a task is modified", function() {
        var task = interactor.startNewUnexpectedTask();
        var eventFired = false;
		
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
        };

		interactor.get.tasksBinder.onItemChanged();
		
        expect(eventFired).toBeTruthy();
    });
	
    it("fires event when a finished task is deleted", function() {
        var task = interactor.startNewPlanifiedTask();
    	interactor.finishTask(task);
    	
    	var eventFired = false;
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
        };

    	interactor.get.finishedBinder.onItemRemoval(task);
        
        expect(eventFired).toBeTruthy();
    });	

    it("fires event when a task starts", function() {
        var eventFired = false;
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
            expect(allTasks.ongoingTasks.length).toBe(1);
        };
        interactor.startNewUnexpectedTask();

        expect(eventFired).toBeTruthy();
    });

    it("fires event when a task is finished", function() {
        var eventFired = false;
        var task = interactor.startNewUnexpectedTask();
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
            expect(allTasks.finishedTasks[0]).toBe(task);
        };
        interactor.finishTask(task);

        expect(eventFired).toBeTruthy();
    });

    it("fires event when a task is resumed", function() {
        var eventFired = false;
        var task = interactor.startNewUnexpectedTask();
        interactor.stopCurrentTask();
        interactor.onTaskStatusChanged = function(allTasks){
            eventFired = true;
        };
        interactor.resumeStoppedTask(task);

        expect(eventFired).toBeTruthy();
    });

    it("resumes the current task", function() {
        var task = interactor.startNewUnexpectedTask();
        interactor.stopCurrentTask();
        interactor.resumeStoppedTask(task);

        expect(interactor.get.tasksBinder.getBusinessCollection().models[0].status).toEqual(xplive.Status.RUNNING);
        expect(interactor.get.tasksBinder.getBusinessCollection().models[0].enabledAction).toEqual(xplive.Actions.STOP);
    });

    it("asks the binder to refresh on task resume", function() {
        spyOn(interactor.get.tasksBinder, "refresh");

        interactor.resumeStoppedTask(new xplive.Tasks.PlanifiedTask());

        expect(interactor.get.tasksBinder.refresh).toHaveBeenCalled();
    });

    it("stops all other tasks when resuming one", function() {
        var task1 = interactor.startNewUnexpectedTask();
        var task2 = interactor.startNewUnexpectedTask();
        interactor.stopCurrentTask();
        interactor.resumeStoppedTask(task1);
        interactor.resumeStoppedTask(task2);

        expect(interactor.get.tasksBinder.getBusinessCollection().get(task1.id).status).toEqual(xplive.Status.STOPPED);
        expect(interactor.get.tasksBinder.getBusinessCollection().get(task2.id).status).toEqual(xplive.Status.RUNNING);
    });

    it("stopping the task switches the task action so that it can be resumed", function() {
        interactor.startNewUnexpectedTask();

        interactor.stopCurrentTask();

        expect(interactor.get.tasksBinder.getBusinessCollection().models[0].enabledAction).toEqual(xplive.Actions.RESUME);
    });

    it("doesnt count elapsed time when task is stopped", function() {
        var task = interactor.startNewUnexpectedTask();
        interactor.stopCurrentTask();

        interactor.clock.giveMeTheTime = function() {
            return new Date(task.startTime.valueOf() + 5000);
        };
        
        interactor.stopCurrentTask();
        expect(task.elapsedTime.seconds()).toEqual(0);
    });

    it("finishes a task", function() {
        var task = interactor.startNewUnexpectedTask();
        interactor.finishTask(task);

        expect(interactor.get.tasksBinder.getBusinessCollection().models[0].status).toEqual(xplive.Status.FINISHED);
    });

    it("recalculates time delta for current interrupted task", function() {
        var task1 = interactor.startNewPlanifiedTask();
        
        interactor.clock.giveMeTheTime = function() {
            return new Date(task1.startTime.valueOf() +7000);
        };
        var task2 = interactor.startNewUnexpectedTask();

        expect(interactor.get.tasksBinder.getBusinessCollection().get(
            task1.id).elapsedTime.seconds()).toEqual(7);
    });


    it("finishes a task calculating the elapsed time", function() {
        var task = interactor.startNewUnexpectedTask();
        
        interactor.clock.giveMeTheTime = function() {
            return new Date(task.startTime.valueOf() + 7000);
        };
        interactor.finishTask(task);

        expect(interactor.get.tasksBinder.getBusinessCollection(
            ).models[0].elapsedTime.seconds()).toEqual(7);
    });

    it("finishes a stopped task without recalculating the elapsed time", function() {
        var task = interactor.startNewUnexpectedTask();
        interactor.clock.giveMeTheTime = function() {
            return new Date(task.startTime.valueOf() + 7000);
        };
        interactor.stopCurrentTask();
        interactor.finishTask(task);

        expect(interactor.get.tasksBinder.getBusinessCollection(
            ).models[0].elapsedTime.seconds()).toEqual(7);
    });

    it("adds the finished task to the finished tasks binder", function() {
        spyOn(interactor.get.finishedBinder, "add");
        var task = interactor.startNewPlanifiedTask();
        interactor.finishTask(task);

        expect(interactor.get.finishedBinder.add).toHaveBeenCalled();
    });

    it("subscribes the finish event to finish the selected task", function() {
        spyOn(interactor, "finishTask");
        var task = {
            id: 1
        };
        interactor.get.tasksBinder.onItemRemoval(task);

        expect(interactor.finishTask).toHaveBeenCalledWith(task);
    });

    it("exports tasks data in csv", function(){
        var csv = "some,csv,text";
        interactor.exporter.toCSV = function(){
            return csv;
        };

        spyOn(interactor.get.exportWidget, "show").andCallFake(function(exported){
            expect(exported).toBe(csv);
        });

        interactor.get.exportLauncher.doClick();

        expect(interactor.get.exportWidget.show).toHaveBeenCalled();
    });

    describe("Fine-grain integration", function() {
        it("adds the new task to the DOM", function() {
            var task = interactor.startNewPlanifiedTask();

            var rendered = fakeDocument.html();
            expect(rendered).toContain(xplive.Status.RUNNING);
        });
        it("handles the stop event from ui", function() {
            spyOn(interactor, "stopCurrentTask");
            var task = interactor.startNewPlanifiedTask();

            interactor.get.tasksBinder.onColumnClicked(task.id, "");

            expect(interactor.stopCurrentTask).toHaveBeenCalled();
        });
        it("elapsed time is calculated as the task is removed from ongoing tasks", function() {
            var task = interactor.startNewPlanifiedTask();

            interactor.clock.giveMeTheTime = function() {
                return new Date(task.startTime.valueOf() + 7000);
            };
            
            interactor.get.tasksBinder.itemRemovedFromCollection(task.id);

            expect(task.elapsedTime.seconds()).toEqual(7);
        });
    });
});

describe("Tasks databinder", function() {
    var fakeDocument = "";
    var binder, task;

    beforeEach(function() {
        fakeDocument = sOn.Testing.createFakeDocument();
        binder = xplive.Factory.TasksBinder(fakeDocument, "tableId");
        binder.initialize();
        task = new xplive.Tasks.PlanifiedTask();
        task.shortDescription = "testing...";
        task.longDescription = "long desc...";
        task.ticketId = "123";
    });

    function containsCss(details, cssClass) {
        for (var i = 0; i < details.length; i++) {
            if (details[i].cssClass == cssClass) return true;
        };
        return false;
    };

    it("sets the right css class for running status", function() {
        binder.add(new xplive.Tasks.PlanifiedTask("test"));

        var taskRenderDetailsCalculator = new xplive.DataBinders.TaskRenderDetails("action", binder);

        var details = taskRenderDetailsCalculator.calculateBy(0);

        expect(details.length).toBeGreaterThan(0);
        expect(containsCss(details, xplive.DataBinders.TaskRenderDetails.runningStatus)).toBeTruthy();
    	expect(containsCss(details, xplive.DataBinders.TaskRenderDetails.taskOnCss)).toBeTruthy();
    });

    it("sets the right css class for unexpected running status", function() {
        binder.add(new xplive.Tasks.UnexpectedTask("test"));

        var taskRenderDetailsCalculator = new xplive.DataBinders.TaskRenderDetails("action", binder);

        var details = taskRenderDetailsCalculator.calculateBy(0);

        expect(containsCss(details, xplive.DataBinders.TaskRenderDetails.unexpectedRunningStatus)).toBeTruthy();
    });

    it("sets the right css class for stopped status", function() {
        var task = new xplive.Tasks.PlanifiedTask("test");
        task.status = xplive.Status.STOPPED;
        binder.add(task);

        var taskRenderDetailsCalculator = new xplive.DataBinders.TaskRenderDetails("action", binder);
        var details = taskRenderDetailsCalculator.calculateBy(0);

        expect(details.length).toBeGreaterThan(0);
        expect(containsCss(details, xplive.DataBinders.TaskRenderDetails.stoppedStatus)).toBeTruthy();
    	expect(containsCss(details, xplive.DataBinders.TaskRenderDetails.taskOffCss)).toBeTruthy();
    });

    it("adds the new task to UI", function() {
        expect(task.startTime.toString()).toContain("GMT");

        binder.add(task);

        var rendered = fakeDocument.html();
        expect(rendered).toContain(xplive.Status.RUNNING);
        expect(rendered).toContain(xplive.Kinds.PLANIFIED);
        expect(rendered).toContain(task.id);
    });

    it("shows the number of interruptions", function() {
        task.interruptionsCount = 888;

        binder = xplive.Factory.FinishedTasksBinder(fakeDocument, "tableId");
        binder.initialize();
        binder.add(task);

        var rendered = fakeDocument.html();
        expect(rendered).toContain("888");
    });

    it("does not modify the task in order to draw it", function() {
        var time = task.startTime;

        binder.add(task);

        expect(task.startTime).toEqual(time);
    });

    it("knows how to render title, description and ticketId", function() {
        binder.add(task);

        var rendered = fakeDocument.html();
        expect(task.shortDescription).toBeTruthy();
        expect(rendered).toContain(task.shortDescription);
        expect(rendered).toContain(task.ticketId);
    });

    describe("Time delta and duration", function() {
        var calculator = new xplive.Common.TimeDeltaCalculator();
        it("counts milliseconds", function() {
            var d1 = new Date(2012, 2, 2, 15, 0, 0);
            var d2 = new Date(2012, 2, 2, 15, 0, 5);
            var delta = calculator.timeDelta(d1, d2);

            expect(delta).toBe(5000);
        });
        it("knows that a minute is no more than 60 seconds", function() {
            var duration = new Duration();
            var d1 = new Date(2012, 2, 2, 15, 0, 0);
            var d2 = new Date(2012, 2, 2, 15, 0, 30);
            duration.delta += calculator.timeDelta(d1, d2);
            var d3 = new Date(2012, 2, 2, 15, 0, 50);
            duration.delta += calculator.timeDelta(d2, d3);
            var d4 = new Date(2012, 2, 2, 15, 1, 10);
            duration.delta += calculator.timeDelta(d3, d4);
            expect(duration.minutes()).toBe(1);
            expect(duration.seconds()).toBe(10);
        });
        it("shows the number of hours, minutes and seconds elapsed", function() {
            var duration = new Duration();
            duration.delta = 2 * 60 * 60 * 1000;

            expect(duration.hours()).toBe(2);
            expect(duration.toString()).toContain("2h");
        });
        it("does not show hours when less than an hour has passed", function() {
            var duration = new Duration();
            duration.delta = 30 * 60 * 1000;

            expect(duration.hours()).toBe(0);
            expect(duration.toString()).not.toContain("0h");
        });
    });
});

describe("Session", function(){
    var manager;
    beforeEach(function(){
        manager = new xplive.SessionManager();
        manager.locationGetter.path = function(){ return "/team/test"};
    });

    it("can get username and team from current location", function(){
        var session = manager.browserSession();
        expect(session.username).toBe("test");
        expect(session.team).toBe("team");
    });
    it("decodes uri and clean spaces", function(){
        manager.locationGetter.path = function(){ return "/team/%20té"};
        var session = manager.browserSession();
        expect(session.username).toBe("té");
        expect(session.team).toBe("team");
    });    
    it("lowers the case for the username", function(){
        manager.locationGetter.path = function(){ return "/Team/Test"};
        var session = manager.browserSession();
        expect(session.username).toBe("test");
        expect(session.team).toBe("team");
    });        
    it("creates a random session id", function(){
        var session = manager.browserSession();
        expect(session.sid).toBeDefined();
        expect(session.sid.length).toBeGreaterThan(2);
        expect(session.sid).not.toEqual(manager.browserSession().sid);
    });
});

describe("the tasks service", function(){
    it("uses the bus to notify about a task change", function(){
        sOn.Factory.ResetEventBus();
        var fakeDocument = sOn.Testing.createFakeDocument();
        var eventBus = sOn.Factory.EventBus();
        var spy = spyTheBus(xplive.Events.taskChanged, eventBus);
        var service = xplive.Factory.TasksService({placeholder: fakeDocument});
        service.initialize();
        service.get.storage.saveTasks = function(){};

        service.get.interactor.onTaskStatusChanged({id:7});

        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.id).toEqual(7);
    });
});

describe("The interaction between tasks service, totals calculator and pomodoro", function(){
    var service, session, interactor, allTasks, totalsCalculator, pomodoroInteractor;

    beforeEach(function(){
    	session = {username: 'test', team: 'testteam'};
        service = xplive.Factory.TasksService({}, session);
        pomodoroInteractor = xplive.Factory.PomodoroInteractor({});
        totalsCalculator = xplive.Factory.TotalsCalculator(service, pomodoroInteractor);
        interactor = sinon.stub(service.get.interactor);
        allTasks = {ongoingTasks: [], finishedTasks: []};
        service.initialize();
        sOn.Testing.avoidServerCall(service.get.storage);
    });

    it("asks the storage to persist as the interactor tell us about some change", function(){
        spyOn(service.get.storage, "saveTasks");

        interactor.onTaskStatusChanged(allTasks);

        expect(service.get.storage.saveTasks).toHaveBeenCalled();
    });

    it("remembers which task is the current", function(){
        var currentTask = interactor.startNewPlanifiedTask();
        
        interactor.onTaskStatusChanged(allTasks);

        expect(service.currentTask()).toBe(currentTask);
    });    

    it("asks the storage for the current data to load", function(){
        var storage = sinon.stub(service.get.storage, "loadTasks");
        
        service.loadExistingData();

        expect(storage.called).toBeTruthy();
    });

    it("sends the server data for the interactor to populate", function(){
        sOn.Testing.stubServerResponse(service.get.storage, allTasks);
        var spy = sinon.stub(totalsCalculator, "recalculateTasksTotals");

        var allProcesedTasks = {};
        interactor.allTasks = function(){
            return allProcesedTasks;
        };

        service.loadExistingData();

        expect(interactor.populateFromStorage.calledWith(allTasks)).toBeTruthy();
        expect(spy.calledWith(allProcesedTasks))
    });

    it("counts pomodoros finished for every task", function(){
        totalsCalculator.initialize();
        
        sOn.Testing.stubServerResponse(service.get.storage, allTasks);
        var spy = sinon.stub(totalsCalculator, "recalculateTasksTotals");

        var allProcesedTasks = { currentTask: { pomodoros: 0}};
        interactor.allTasks = function(){
            return allProcesedTasks;
        };

        service.loadExistingData();
        pomodoroInteractor.startPomodoro();
        pomodoroInteractor.stopPomodoro();
        pomodoroInteractor.startPomodoro();
        pomodoroInteractor.stopPomodoro();

        expect(allProcesedTasks.currentTask.pomodoros).toBe(2);
    });    

    it("updates current task when it gets the tasks from server", function(){
        var allProcesedTasks = {currentTask: {id: 888}};
        interactor.allTasks = function(){
            return allProcesedTasks;
        };
        service.handleLoadedTasks(allTasks);

        expect(service.currentTask().id).toBe(888);
    });    
});

describe("the team proxy", function(){
    var proxy, originalEventFactory, eventBus;

    beforeEach(function(){
        originalEventFactory = sOn.Factory.EventBus;
        eventBus = new sOn.EventBus();
        sOn.Factory.EventBus = function(){return eventBus;};
        proxy = xplive.Factory.TeamProxy({team:'test', username:'test'});
        proxy.initialize();
        proxy.reset();
        sOn.Testing.avoidServerCall(proxy.get.storage);
    });

    afterEach(function(){
        sOn.Factory.EventBus = originalEventFactory;
    });

    it("starts the clock on initialization", function(){
        proxy = xplive.Factory.TeamProxy({team:'test', username:'test'});

        var spy = sinon.stub(proxy.get.clock, "start");

        proxy.initialize();

        expect(spy.called).toBeTruthy();
    });

    it("informs bus subscribers about new team activity", function(){
        var activity = {id:1000};
        sOn.Testing.stubServerResponse(proxy.get.storage, activity);
        var spy = spyTheBus(xplive.Events.thereIsNewTeamActivity, eventBus);
        
        proxy.get.clock.onTick();
        
        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs).toBe(activity);
    });    

    it("sends my activity even if my window is not active", function(){
        eventBus.emit(xplive.Events.userIsNotInteractingWithWindow);
        for (var i = 0; i < xplive.Common.ActivityIsSentAtLeast + 2; i++)
            proxy.get.clock.onTick();        
        spyOn(proxy.get.storage, "updateUserActivity");

        eventBus.emit(xplive.Events.iAmDoingTheSameThing);

        expect(proxy.get.storage.updateUserActivity).toHaveBeenCalled();
    });

    it("informs bus subscribers about a new tick", function(){
        spyOn(eventBus, "emit").andCallFake(function(evtName){
            expect(evtName).toBe(xplive.Events.itIsTimeToReviewMyActivity); 
        });

        proxy.get.clock.onTick();
        
        expect(eventBus.emit).toHaveBeenCalled();
    });    

    it("sends user activity on event", function(){
        var act = {id:7};
        spyOn(proxy.get.storage, "updateUserActivity").andCallFake(function(evtName, activity){
            expect(activity).toBe(act); 
        });

        eventBus.emit(xplive.Events.iHaveChangedMyActivity, act);
        
        expect(proxy.get.storage.updateUserActivity).toHaveBeenCalled();
    });    

    it("does not retrieves team activity if user is inactive", function(){             
        spyOn(proxy.get.storage, "retrieveTeamActivity");

        eventBus.emit(xplive.Events.userIsNotInteractingWithWindow);

        expect(proxy.get.storage.retrieveTeamActivity).not.toHaveBeenCalled();
    });

    it("does not update team info if nothing has been updated ever", function(){
        spyOn(proxy.get.storage, "updateUserActivity");
        
        eventBus.emit(xplive.Events.iAmDoingTheSameThing);

        expect(proxy.get.storage.updateUserActivity).not.toHaveBeenCalled();
    });    

    it("updates team info every bunch of ticks even if nothing is new", function(){
        spyOn(proxy.get.storage, "updateUserActivity");
        for (var i = 0; i < xplive.Common.ActivityIsSentAtLeast +2; i++)
            proxy.get.clock.onTick();
        eventBus.emit(xplive.Events.iAmDoingTheSameThing);
        expect(proxy.get.storage.updateUserActivity).toHaveBeenCalled();
        expect(proxy.get.storage.updateUserActivity.callCount).toBe(1);
    });            
});

describe("Totals Calculator", function(){
    var calculator;

    beforeEach(function(){
        sOn.Factory.ResetEventBus();
        app = xplive.Factory.CreateApp({});
        calculator = app.totalsCalculator;
        app.initialize();
        calculator.get.todayTotalsWidget.show = function(){};
        sOn.Testing.avoidServerCall(app.tasksService.get.storage);        
    });

    it("updates totals when task change", function(){
        spyOn(calculator.get.todayTotalsWidget, "show");
        
        calculator.get.tasksService.onTaskStatusChanged({
            currentTask: {}, ongoingTasks: {}, finishedTasks: {}
        });

        expect(calculator.get.todayTotalsWidget.show).toHaveBeenCalled();
    });

    it("shows total pomodoros finished today", function(){        
        calculator.get.pomodoroInteractor.stopPomodoro();
        calculator.get.pomodoroInteractor.startPomodoro();
        spyOn(calculator.get.todayTotalsWidget, "show").andCallFake(
            function (totals){
            expect(totals.pomodoros).toBe(2);
        });

        calculator.get.pomodoroInteractor.stopPomodoro();
        
        expect(calculator.get.todayTotalsWidget.show).toHaveBeenCalled();
    });

    it("shows todays totals in the widget", function(){
        var task = new xplive.Tasks.PlanifiedTask();
        task.interruptionsCount = 3;
        var allTasks = { ongoingTasks: [ task ]};
        calculator.get.pomodoroInteractor.stopPomodoro();

        spyOn(calculator.get.todayTotalsWidget, "show").andCallFake(
        	function (totals){
    		expect(new Date().toTimeString()).toContain(
    			totals.lastCalculationTime.substring(0, 4));
            expect(totals.pomodoros).toBe(1);
    	});

        calculator.recalculateTasksTotals(allTasks);        

        expect(calculator.get.todayTotalsWidget.show).toHaveBeenCalled();
    });

    it("do not count interruptions twice", function(){
        var task = new xplive.Tasks.PlanifiedTask();
        task.stop();
        var allTasks = { ongoingTasks: [ task ]};
        
        spyOn(calculator.get.todayTotalsWidget, "show").andCallFake(
            function (totals){
            expect(totals.interruptions).toBe(1);
        });

        calculator.recalculateTasksTotals(allTasks);        
        calculator.recalculateTasksTotals(allTasks);        
    });    

    it("do not count interruptions from other day", function(){
        var task = new xplive.Tasks.PlanifiedTask();
        task.interruptionsCount = 2;
        task.interruptionsCountToday = 1;
        var allTasks = { ongoingTasks: [ task ]};
        
        spyOn(calculator.get.todayTotalsWidget, "show").andCallFake(
            function (totals){
            expect(totals.interruptions).toBe(1);
        });

        calculator.recalculateTasksTotals(allTasks);        
    });        

    it("recalculates totals for a single task", function(){
        var task = new xplive.Tasks.PlanifiedTask();
        task.stop(new Date());
        task.resume(new Date());
        task.stop(new Date());
        task.resume(new Date());
        task.stop(new Date());
        task.resume(new Date());

        var allTasks = { ongoingTasks: [ task]};

        calculator.recalculateTasksTotals(allTasks);        
        var todayTotals = calculator.tasksTotals()[0];

        expect(todayTotals.planifiedTasks).toBe(1);
        expect(todayTotals.interruptions).toBe(3);
        expect(todayTotals.unexpectedTasks).toBe(0);
        expect(todayTotals.time.toString()).toContain(
            task.elapsedTime.seconds());
        expect(todayTotals.time.toString()).toContain(
            task.elapsedTime.minutes());
    });

    it("counts all tasks", function(){
        var allTasks = { ongoingTasks: [
                new xplive.Tasks.PlanifiedTask(),
                new xplive.Tasks.PlanifiedTask(),
                new xplive.Tasks.UnexpectedTask()]};
        
        calculator.recalculateTasksTotals(allTasks);
        var todayTotals = calculator.tasksTotals()[0];

        expect(todayTotals.planifiedTasks).toBe(2);
        expect(todayTotals.unexpectedTasks).toBe(1);        
    });

    it("counts also finished tasks", function(){
        var allTasks = { ongoingTasks: [], finishedTasks: [
                new xplive.Tasks.PlanifiedTask(),
                new xplive.Tasks.PlanifiedTask(),
                new xplive.Tasks.UnexpectedTask()]};
        
        calculator.recalculateTasksTotals(allTasks);
        var todayTotals = calculator.tasksTotals()[0];

        expect(todayTotals.planifiedTasks).toBe(2);
        expect(todayTotals.unexpectedTasks).toBe(1);
    });

    it("only calculates todays totals in the first total item", function(){
        var timeAgoTask = new xplive.Tasks.PlanifiedTask();
        timeAgoTask.resume(new Date('01/01/2010'));
        var allTasks = { ongoingTasks: [], finishedTasks: [
                timeAgoTask,
                new xplive.Tasks.PlanifiedTask(),
                new xplive.Tasks.UnexpectedTask()]};
        
        calculator.recalculateTasksTotals(allTasks);
        var todayTotals = calculator.tasksTotals()[0];

        expect(todayTotals.planifiedTasks).toBe(1);
        expect(todayTotals.unexpectedTasks).toBe(1);
    });

    it("todays totals do not count the work done yesterday although the task keeps ongoing", function(){
        var yesterdayTask = new xplive.Tasks.PlanifiedTask();
        yesterdayTask.resume(new Date(new Date().setHours(-28))); // yesterday
        yesterdayTask.stop(new Date(new Date().setHours(-25))); // 3 hours
        var allTasks = { ongoingTasks: [yesterdayTask], finishedTasks: []};        
        calculator.recalculateTasksTotals(allTasks);
        var todayTotals = calculator.tasksTotals()[0];
        expect(todayTotals.timeDelta).toBe(0);

        yesterdayTask.resume(new Date()); // restarted now

        calculator.recalculateTasksTotals(allTasks);
        var todayTotals = calculator.tasksTotals()[0];
        expect(todayTotals.timeDelta).toBe(0);
    });    
});

describe("today totals widget", function(){
    it("renders today totals", function(){
        var widget = new xplive.Widgets.TodayTotals("widgetId");
        widget.initialize();

        widget.show({
            timeDelta: 3000, interruptions: 5000, 
            planifiedTasks: 222, unexpectedTasks: 777, 
            pomodoros: 999});

        expect(widget.html()).toContain("m:"); // elapsed time
        expect(widget.html()).toContain("5000");
        expect(widget.html()).toContain("222");
        expect(widget.html()).toContain("777");
        expect(widget.html()).toContain("999");
    });
});

describe("Exporter", function(){
    var exporter;

    it("exports tasks to csv", function(){
        exporter = new xplive.Interactors.Exporter();

        var allTasks = { 
            ongoingTasks: 
            [ new xplive.Tasks.PlanifiedTask({
                id:111, shortDescription: "test", longDescription: "longTest",
                ticketId: "#222"})
            ], 
            finishedTasks: 
            [ new xplive.Tasks.PlanifiedTask({
                id:333, shortDescription: "test2", longDescription: "longTest2",
                ticketId: "#444"})
            ]
        };

        var csv = exporter.toCSV(allTasks);

        expect(csv).toContain(",");
        expect(csv).toContain("111");
        expect(csv).toContain("#222");
        expect(csv).toContain("test");
        expect(csv).toContain("longTest");
        expect(csv).toContain("333");
        expect(csv).toContain("#444");
        expect(csv).toContain("test2");
        expect(csv).toContain("longTest2");
    });

    // TODO: empty tasks exports nothing?
});

describe("Pomodoro", function() {
    var pomodoro;

    beforeEach(function() {
        pomodoro = xplive.Factory.Pomodoro();
        pomodoro.clock.start = function() {}; // timer is a stub
    });

    describe("how it changes the status", function() {
        var statusHasChanged;

        beforeEach(function() {
            statusHasChanged = false;
        });

        it("tells the clock to start", function() {
            spyOn(pomodoro.clock, "start").andCallFake(function(milliseconds){
                expect(milliseconds).toBeGreaterThan(999);
            });

            pomodoro.start();

            expect(pomodoro.clock.start).toHaveBeenCalled();
        });

        it("tell the clock to stop", function() {
            var spy = sinon.stub(pomodoro.clock, "stop");

            pomodoro.finish();

            expect(spy.called).toBeTruthy();
        });

        it("tell subscribers that it is ongoing", function() {
            pomodoro.start();

            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
                expect(change.status).toBe(xplive.Status.RUNNING);
                expect(change.sizeInMinutes).toBe(pomodoro.sizeInMinutes);
            };

            pomodoro.clock.onTick(new Date());
            expect(statusHasChanged).toBeTruthy();
        });

        it("tell subscribers that time is over", function() {
            pomodoro.sizeInMinutes = 20;
            pomodoro.start();
            var spy = sinon.stub(pomodoro.clock, "stop");
            pomodoro.onTimeOver = function() {
                statusHasChanged = true;
            };

            pomodoro.clock.onTick(new Date(new Date().valueOf() + 1000 * 60 * 40));
            expect(statusHasChanged).toBeTruthy();
            expect(spy.called).toBeTruthy();
        });        

        it("tell subscribers the remaining time and percentage", function() {
            pomodoro.sizeInMinutes = 30
            var now = new Date();
            pomodoro.start();

            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
                expect(change.remainingMinutes).toBe(21);
            	expect(change.percent).toBeGreaterThan(32.8);
                expect(change.percent).toBeLessThan(33.8);
            };

            var newTime = new Date(now);
            newTime.setMinutes(now.getMinutes() + 10.2);
            pomodoro.clock.onTick(newTime);
            expect(statusHasChanged).toBeTruthy();
        });

        it("tell subscribers the remaining time when pomodoro lasts less than a minute", function() {
            pomodoro.sizeInMinutes = 1
            var now = new Date();
            pomodoro.start();

            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
                expect(change.remainingMinutes).toBe(1);
            	expect(change.percent).toBe(10);
            };

            var newTime = new Date(now);
            newTime.setSeconds(now.getSeconds() + 10);
            pomodoro.clock.onTick(newTime);
            expect(statusHasChanged).toBeTruthy();
        });        
    	
        it("tell subscribers the remaining time when pomodoro, always", function() {
            pomodoro.sizeInMinutes = 2
            var now = new Date();
            pomodoro.start();

            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
                expect(change.remainingMinutes).toBe(2);
            	expect(change.percent).toBe(50);
            };

            var newTime = new Date(now);
            newTime.setMinutes(now.getMinutes() + 1);
            pomodoro.clock.onTick(newTime);
            expect(statusHasChanged).toBeTruthy();
        });            	

        it("tell subscribers that it is onoing when started for the second pomodoro", function() {
            pomodoro.start();
            pomodoro.finish();
            pomodoro.start();
            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
                expect(change.status).toBe(xplive.Status.RUNNING);
            };

            pomodoro.clock.onTick(new Date());
            expect(statusHasChanged).toBeTruthy();
        });
    });

    describe("stopped status", function() {
        it("knows there is no status change when it has finished already", function() {
            pomodoro.start();
            pomodoro.finish();
            var statusHasChanged = false;
            pomodoro.onStatusChanged = function(change) {
                statusHasChanged = true;
            };

            pomodoro.clock.onTick(new Date());
            expect(statusHasChanged).toBeFalsy();
        });
    });
})


describe("Pomodoro Interactor", function(){
    var interactor, execAsync, eventBus;

    beforeEach(function(){
        execAsync = xplive.Common.ExecAsync;
        xplive.Common.ExecAsync = function(f,d){ f();};
        interactor = xplive.Factory.PomodoroInteractor({});
        interactor.initialize();
        interactor.get.alertDialog.alert = function(){};
    	interactor.get.windowManager.changeTitle = function (){};
        sOn.Factory.ResetEventBus();
        eventBus = sOn.Factory.EventBus();
    });

    afterEach(function(){
        xplive.Common.ExecAsync = execAsync;
    });

    it("enables and refreses the minutes box at the end", function(){
        interactor.get.pomodoro.sizeInMinutes = 77;
        interactor.get.pomodoroLauncher.doClick();
        
        spyOn(interactor.get.sizeInMinutesBox, "enable");
        spyOn(interactor.get.sizeInMinutesBox, "setText");

        interactor.get.pomodoroTerminator.doClick();

        expect(interactor.get.sizeInMinutesBox.setText).toHaveBeenCalled();
        expect(interactor.get.sizeInMinutesBox.enable).toHaveBeenCalled();
    });

    it("tells the pomodoro to start when the launcher is pressed", function(){
        var spy = sinon.stub(interactor.get.pomodoro, "start");
        var buttonSpy = sinon.stub(interactor.get.pomodoroLauncher, "hide");
        var buttonSpyStop = sinon.stub(interactor.get.pomodoroTerminator, "show");

        interactor.get.pomodoroLauncher.doClick();

        expect(spy.called).toBeTruthy();
        expect(buttonSpy.called).toBeTruthy();
        expect(buttonSpyStop.called).toBeTruthy();
    });

    it("enables launcher once the time is over", function(){
        var spy = sinon.stub(interactor.get.pomodoroLauncher, "show");
        
        interactor.get.pomodoro.onTimeOver();

        expect(spy.called).toBeTruthy();
    });    

    it("tell subscribers that time is over", function(){
        var spy = spyTheBus(xplive.Events.pomodoroFinished, eventBus);
        
        interactor.get.pomodoro.onTimeOver();

        expect(spy.called).toBeTruthy();
    });        

    it("alerts the user once the time is over", function(){
        var spy = sinon.stub(interactor.get.alertDialog, "alert");
        
        interactor.get.pomodoro.onTimeOver();

        expect(spy.called).toBeTruthy();
    });        

    it("sets the pomodoro size reading the textbox", function(){
        interactor.get.sizeInMinutesBox.text = function(){
            return "22";
        };

        interactor.get.pomodoroLauncher.doClick();

        expect(interactor.get.pomodoro.sizeInMinutes).toBe(22);
    });

    it("tells the pomodoro to finish when the launcher is pressed", function(){
        var spy = sinon.stub(interactor.get.pomodoro, "finish");
        var buttonSpy = sinon.stub(interactor.get.pomodoroLauncher, "show");

        interactor.get.pomodoroTerminator.doClick();

        expect(spy.called).toBeTruthy();
        expect(buttonSpy.called).toBeTruthy();
    });

    it("tells the widget to render the beginning pomodoro", function(){
        spyOn(interactor.get.progressBar, "update").andCallFake(function(progress){
            expect(progress.remainingMinutes).toContain(interactor.get.pomodoro.sizeInMinutes.toString());
            expect(progress.sizeInMinutes).toBe(interactor.get.pomodoro.sizeInMinutes);
            expect(progress.percent).toEqual(0);
        });

        interactor.get.pomodoroLauncher.doClick();

        expect(interactor.get.progressBar.update).toHaveBeenCalled();
    });

    it("tells the widget to render the end of the pomodoro", function(){
    	spyOn(interactor.get.windowManager, "changeTitle");
        spyOn(interactor.get.soundPlayer, "play");
    	spyOn(interactor.get.progressBar, "inactiveBar");
        spyOn(interactor.get.progressBar, "update").andCallFake(function(progress){
        	expect(isNaN(parseInt(progress.remainingMinutes))).toBeTruthy();
            expect(progress.sizeInMinutes).toBe(interactor.get.pomodoro.sizeInMinutes);
            expect(progress.percent).toEqual(100);
        });
		interactor.get.pomodoroTerminator.doClick();

        expect(interactor.get.progressBar.update).toHaveBeenCalled();
    	expect(interactor.get.progressBar.inactiveBar).toHaveBeenCalled();
    	expect(interactor.get.windowManager.changeTitle).toHaveBeenCalled();
        expect(interactor.get.soundPlayer.play).toHaveBeenCalled();
    });

    it("tells the widget to render the pomodoro's progress", function(){
        var total = 10, remainingMinutes = 7.1;
    	spyOn(interactor.get.windowManager, "changeTitle");
        spyOn(interactor.get.progressBar, "update").andCallFake(function(progress){
            expect(progress.remainingMinutes).toContain("7");
            expect(progress.sizeInMinutes).toBe(total);
            expect(progress.percent).toEqual(29);
        });

        interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: remainingMinutes,
            sizeInMinutes: total,
            percent: 29
        });

        expect(interactor.get.progressBar.update).toHaveBeenCalled();
    	expect(interactor.get.windowManager.changeTitle).toHaveBeenCalled();
    });    
	
    it("pops up the pomodoro change event", function(){
        var spy = spyTheBus(xplive.Events.pomodoroChanged, eventBus);
        
        interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: 10,
            sizeInMinutes: 50,
            percent: 29
        });

        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.remainingMinutes).toContain("10");
        expect(spy.eventArgs.isOn).toBeTruthy();
    });    

    it("doesnt fire the pomodoro change event if is in same minute", function(){
        interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: 10,
            sizeInMinutes: 50,
            percent: 29
        });

        var spy = spyTheBus(xplive.Events.pomodoroChanged, eventBus);
        
        interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: 10,
            sizeInMinutes: 50,
            percent: 31
        });

        expect(spy.called).toBeFalsy();
    });        

    it("remarks the minute change", function(){
        interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: 5,
            sizeInMinutes: 10,
        	percent: 50
        });
    	spyOn(interactor.get.progressBar, "remarkMinuteChange");

    	interactor.get.pomodoro.onStatusChanged({
            remainingMinutes: 6,
            sizeInMinutes: 10,
            percent: 60
        });

        expect(interactor.get.progressBar.remarkMinuteChange).toHaveBeenCalled();
    });    	
});


describe("ProgressBar Widget", function () {
	var bar;
	
	beforeEach(function () {
		bar = new xplive.Widgets.ProgressBar("", sOn.Testing.createFakeDocument());
		bar.initialize();
	});
	
	it("displays the percentage", function () {
		expect(bar.html()).toContain("0%");
		
		bar.update({remainingMinutes: 777, percent: 20});
		
		expect(bar.html()).toContain("20%");
		expect(bar.html()).toContain("777");
	});
	
	it("can be inactive", function () {
		bar.inactiveBar();
		
		expect(bar.html()).not.toContain("active");
	});	
	
	it("is active on start", function () {
		bar.inactiveBar();
		bar.start();
		
		expect(bar.html()).toContain("active");
	});		
	
	it("can remark a minute change", function () {
		bar.remarkMinuteChange();
		
		expect(bar.html()).toContain("minuteChange");
	});
});

describe("Team service", function(){
    var service, session, eventBus;

    beforeEach(function(){
        sOn.Factory.ResetEventBus();
        eventBus = sOn.Factory.EventBus();
        session = { username: "mate1", team: "team1", host: "host", sid: 111};
        service = xplive.Factory.TeamService(session, {}, {});
        service.initialize();       
    });

    afterEach(function(){
        sOn.Factory.ResetEventBus();
    });

    describe("how it informs the team about my general status", function(){
        it("sends the location when user changes it", function(){
            var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
            service.get.statusService.onLocationChanged('sweet home');

            eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});
            
            expect(spy.called).toBeTruthy();
            expect(spy.eventArgs.statusLocation).toEqual('sweet home');
        });
    });

    describe("how it informs about task change", function(){
        it("informs the team inmediatly", function(){
            service.get.tasksService.currentTask = function(){
                return new xplive.Tasks.PlanifiedTask({ id: 100});
            };
            var allTasks = [{id:1}];
            var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
            
            eventBus.emit(xplive.Events.taskChanged, allTasks);

            expect(spy.called).toBeTruthy();
            expect(spy.eventArgs.currentTask.id).toEqual(100);
        });
    });    

    it("tells the team I am not leaving, because I almost close the window, but I answered NO in the confirmation", function(){
        service.onClosing(); 
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);

        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});
        
        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.isApparentlyOffline).toBeFalsy();
    });

    describe("how it informs the team about my pomodoro status", function(){
        beforeEach(function(){
            service.get.pomodoroInteractor.startPomodoro(777);            
        });

        it("tells the team that I have started a pomodoro", function(){
            var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);

            eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});
            
            expect(spy.called).toBeTruthy();
            var json = JSON.stringify(spy.eventArgs);
            expect(json).toContain("isOn");
            expect(json).toContain("true");
            expect(json).toContain("777"); // minutes
        });

        var tells_team_that_pomodoro_is_finished = function(service){
            service.get.pomodoroInteractor.stopPomodoro();
            var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
            
            eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});

            return spy; 
        };

        it("tells the team that I have finished a pomodoro", function(){
            var spy = tells_team_that_pomodoro_is_finished(service);
            
            expect(spy.called).toBeTruthy();
            var json = JSON.stringify(spy.eventArgs);
            expect(json).toContain("false");
        });    

        it("tells the team that I have finished even with the totals calculator also subscribed to pomodoro interactor", function(){
            var app = xplive.Factory.CreateApp({});
            app.initialize();
            service = app.teamService;

            var spy = tells_team_that_pomodoro_is_finished(service);

            expect(spy.called).toBeTruthy();
        });        
    });

    it("tells the team about pomodoro progress and current task, on clock interval", function(){
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        
        service.get.pomodoroInteractor.onPomodoroChanged({isOn: true, 
            minutes: 10});
        service.get.tasksService.currentTask = function(){
            return new xplive.Tasks.PlanifiedTask({ id: 100});
        };
        
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity);

        expect(spy.called).toBeTruthy();
        var json = JSON.stringify(spy.eventArgs);
        var json = JSON.stringify(spy.eventArgs);
        expect(json).toContain("10");
        expect(spy.eventArgs.currentTask.id).toBe(100);
    });

    it("does not update team info if nothing has been updated", function(){
        service.get.pomodoroInteractor.onPomodoroChanged({isOn: true, 
            minutes: 10});
        service.get.tasksService.currentTask = function(){
            return new xplive.Tasks.PlanifiedTask();
        };
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity);
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity);

        expect(spy.called).toBeFalsy();
    });

    it("informs bus when nothing new has happened", function(){
        var spy = spyTheBus(xplive.Events.iAmDoingTheSameThing, eventBus);

        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity,
            new Date(2012, 1,1,0,0,0));
        var activityOne = spy.eventArgs.id;
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity,
            new Date(2012, 1,2,1,1,1));
        var activityTwo = spy.eventArgs.id;
        expect(spy.called).toBeTruthy();
        expect(activityOne).not.toEqual(activityTwo);
    });

    it("updates team info if pomodoro changed", function(){
        service.get.pomodoroInteractor.fireEvent(
            xplive.Events.pomodoroChanged, {isOn: true, 
            minutes: 10});
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});
        service.get.pomodoroInteractor.fireEvent(
            xplive.Events.pomodoroChanged, {isOn: true, 
            minutes: 9});
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, {});        
        
        expect(spy.called).toBeTruthy();
    });    

    it("sends an activity id which is consecutive every time", function(){
        var activityIds = [];
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        service.get.pomodoroInteractor.fireEvent(
            xplive.Events.pomodoroChanged, {isOn: true, 
            minutes: 10});
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, 
                        new Date(2012, 1,1,0,0,0));
        activityIds.push(spy.eventArgs.id);
        service.get.pomodoroInteractor.fireEvent(
            xplive.Events.pomodoroChanged, {isOn: true, 
            minutes: 9});
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity,
                        new Date(2012, 1,1,1,1,1));
        activityIds.push(spy.eventArgs.id);
        
        expect(activityIds.length).toBe(2);
        expect(activityIds[0]).toBeLessThan(activityIds[1]);
    });        

    it("sends the sid inside the activity", function(){
        var activityIds = [];
        var spy = spyTheBus(xplive.Events.iAmDoingTheSameThing, eventBus);
        eventBus.emit(xplive.Events.itIsTimeToReviewMyActivity, 
                        new Date(2012, 1,1,0,0,0));
        expect(spy.eventArgs.sid).toEqual(session.sid);
    });            

    it("displays team activity on clock interval", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": {id: 1000, "currentTask": {"status": "Running", 
                        "kind": "Planified", "name": "", 
                        "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, 
                        "longDescription": "  ", "elapsedTime": {"delta": 0}, 
                        "interruptionsCount": 0, "startTime": 985372475861, 
                        "ticketId": "   ", "shortDescription": "someTask", 
                        "id": 10}}}

        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].currentTask.id).toBe(10);
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).toContain("sometask");
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).not.toContain("pomodoro");
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);


        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("emits the signal for other to update mate activity", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}},
            "mate2": {id: 1000, "currentTask": {"status": "Running",
                "kind": "Planified", "name": "",
                "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0},
                "longDescription": "  ", "elapsedTime": {"delta": 0},
                "interruptionsCount": 0, "startTime": 985372475861,
                "ticketId": "   ", "shortDescription": "someTask",
                "id": 10}}}

        var spy = spyTheBus(xplive.Events.thereIsNewMateActivity, eventBus);

        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(spy.called);
        expect(spy.eventArgs.activity.id).toBe(1000);
        expect(spy.eventArgs.mate).toBe('mate2');
        expect(spy.callCount).toBe(1);
    });

    it("displays team activity if user is active again", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": {id: 1000, "currentTask": {"status": "Running", 
                        "kind": "Planified", "name": "", 
                        "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, 
                        "longDescription": "  ", "elapsedTime": {"delta": 0}, 
                        "interruptionsCount": 0, "startTime": 985372475861, 
                        "ticketId": "   ", "shortDescription": "someTask", 
                        "id": 10}}}
        spyOn(service.get.teamViewer, "updateTeamActivity");
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("shows monitor and hides sleeping panel if user is active again", function(){
        spyOn(service.get.teamViewer, "show");
        spyOn(service.get.sleepingPanel, "hide");
        
        eventBus.emit(xplive.Events.userIsActiveAgain);

        expect(service.get.teamViewer.show).toHaveBeenCalled();
        expect(service.get.sleepingPanel.hide).toHaveBeenCalled();
    });

    it("interprets pomodoro activity to send it clear to the widget", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": {id: 1000, "currentTask": {"status": "Running", 
                        "kind": "Planified", "name": "", "enabledAction": "Stop", 
                        "elapsedTimeToday": {"delta": 0}, 
                        "longDescription": "  ", "elapsedTime": {"delta": 0}, 
                        "interruptionsCount": 0, "startTime": 985372475861, 
                        "ticketId": "   ", "shortDescription": "someTask", 
                        "id": 10}, pomodoro: { isOn: true, remainingMinutes: 22}}}

        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate1"].itsMe).toBeTruthy();
            expect(activities["mate2"].isOnPomodoro).toBeTruthy();
            expect(activities["mate2"].itsMe).toBeFalsy();
            expect(activities["mate2"].username).toBe("mate2");
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).toContain("sometask");
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).toContain("pomodoro");
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("mate2");
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("22");
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("interprets inactivity to send it clear to the widget", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": {id: 1000, "currentTask": null, 
                        pomodoro: null}};
        
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].isTakingBreak).toBeTruthy();
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("knows when there are several sessions opened with the same account", function(){
        service.get.pomodoroInteractor.startPomodoro(777);
        var activity = {
            "mate1": {id: 500, sid: 456}, 
            "mate2": {id: 1000}
        };
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate1"].severalSessionsOpenWithSameAccount)
            .toBeTruthy();
            expect(activities["mate2"].severalSessionsOpenWithSameAccount)
            .toBeFalsy();
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);
        
        expect(service.get.teamViewer.updateTeamActivity)
            .toHaveBeenCalled();
    });

    it("knows when there is just one session opened for a given username", function(){
        service.get.pomodoroInteractor.startPomodoro(777);
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, {});

        var activity = {"mate1": {id: 1000, sid: session.sid}};
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate1"].severalSessionsOpenWithSameAccount)
            .toBeFalsy();
        });
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity)
            .toHaveBeenCalled();
    });

    it("interprets current task to send it clear to the widget", function(){
        var activity = {"mate1": {id: 500, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": 
                        {id: 1000, "currentTask": 
                            {"status": "Running", "kind": "Planified", 
                            "name": "", "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 409374}, 
                            "longDescription": "  ", "elapsedTime": {"delta": 409374}, 
                            "interruptionsCount": 2, "startTime": 985348497250, 
                            "ticketId": "777", 
                            "shortDescription": "TESTXX", "id": 2}, 
                         pomodoro: null}
                        };

        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].isApparentlyOffline).toBeFalsy();
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });    

    describe("the inactivity detector", function(){
        var detector = new xplive.Services.InactivityDetector();

        it("removes member activity when its date is too old", function(){
            var currentTime = new Date(2012, 1, 1, 19, 0, 0);
            var oldTime = new Date(2012, 1, 1, 1, 0, 0);
            var recentTime = new Date(2012, 1, 1, 12, 0, 0);
            var oldActivity = new xplive.Services.MemberActivity();
            var recentActivity = new xplive.Services.MemberActivity();
            oldActivity.generateId(oldTime);
            recentActivity.generateId(recentTime);
            var activity = {"mate1": recentActivity, 
                            "mate2": oldActivity};

            detector.discardInactiveUsers(activity, currentTime);

            expect(activity.mate2).toBeFalsy();
        });
    });
    
    it("does not display member activity when its date is too old", function(){
        var activity = {"mate1": {id: 1, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 409374}, "longDescription": "  ", "elapsedTime": {"delta": 409374}, "interruptionsCount": 2, "startTime": 985348497250, "ticketId": "   ", "shortDescription": "  ", "id": 1}}, 
                        "mate2": {id: 2, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}}}
        service.get.teamInterpreter.parseActivity = function(act){
            delete act["mate2"];
        };
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"]).toBeFalsy()
        });
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("considers mate offline when its activityId is the same after several refresh", function(){
        var currentTime = new Date(2012, 1, 1, 19, 0, 0);
        var recentTime = new Date(2012, 1, 1, 12, 0, 0);
        var recentActivity = new xplive.Services.MemberActivity();
        recentActivity.generateId(recentTime);
        var activity = {"mate2": {id: recentActivity.id, 
                        "currentTask": {"status": "Running", "kind": "Planified", "name": "", 
                                  "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, 
                                  "longDescription": "  ", "elapsedTime": {"delta": 0}, 
                                  "interruptionsCount": 0, "startTime": 985372475861, 
                                  "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}}}
        for (var i = 0; i < xplive.Common.MaximunMissingMateUpdatesToConsiderOffline; i++)
            eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].isApparentlyOffline).toBeTruthy();
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("offline");
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).toContain("offline");
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("mate2");
        });

        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("considers mate offline when someone else has marked him as offline", function(){
        var currentTime = new Date(2012, 1, 1, 19, 0, 0);
        var recentTime = new Date(2012, 1, 1, 12, 0, 0);
        var recentActivity = new xplive.Services.MemberActivity();
        recentActivity.generateId(recentTime);
        var activity = {"mate2": {id: recentActivity.id, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}, isApparentlyOffline: true}}
        
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].isApparentlyOffline).toBeTruthy();
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("offline");
            expect(activities["mate2"].info.displayableInfo.toLowerCase()
                ).toContain("offline");
            expect(activities["mate2"].info.shortDisplayableInfo.toLowerCase()
                ).toContain("mate2");
        });

        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    var tellsEveryBodyThatMateIsOfflineWhenHeIs = function(){
        var currentTime = new Date(2012, 1, 1, 19, 0, 0);
        var recentTime = new Date(2012, 1, 1, 12, 0, 0);
        var recentActivity = new xplive.Services.MemberActivity();
        recentActivity.generateId(recentTime);
        var activity = {"mate2": 
            {id: recentActivity.id, 
                "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 0}, 
                            "longDescription": "  ", 
                            "elapsedTime": {"delta": 0}, 
                            "interruptionsCount": 0, 
                            "startTime": 985372475861, 
                            "ticketId": "   ", 
                            "shortDescription": "  ", 
                            "id": 10}
            }
        };
        for (var i = 0; i < xplive.Common.MaximunMissingMateUpdatesToConsiderOffline; i++)
            eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);        
        var spy = spyTheBus(xplive.Events.iAmUpdatingMyMatesActivity, eventBus);
        
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        return [activity, spy, recentActivity];
    };

    it("tells everybody that mate is offline when he is", function(){
        var fixtures = tellsEveryBodyThatMateIsOfflineWhenHeIs();
        var spy = fixtures[1];
        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.session.username).toBe("mate2");
        expect(spy.eventArgs.session.host).toBeDefined();
        var recentActivity = fixtures[2];
        expect(spy.eventArgs.activity.id).toBeGreaterThan(recentActivity.id);
        expect(spy.eventArgs.activity.isApparentlyOffline).toBeTruthy();
    });

    it("tells everybody that mate is offline only once", function(){
        var fixtures = tellsEveryBodyThatMateIsOfflineWhenHeIs();
        var activity = fixtures[0];
        var spy = fixtures[1];
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(spy.callCount).toBe(1);
    });

    it("tells my mates that I am leaving", function(){        
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        
        service.onClosing();

        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.isApparentlyOffline).toBeTruthy();
    });        

    it("tells my mates that I am leaving", function(){        
        var spy = spyTheBus(xplive.Events.iHaveChangedMyActivity, eventBus);
        
        service.onClosing();

        expect(spy.called).toBeTruthy();
        expect(spy.eventArgs.isApparentlyOffline).toBeTruthy();
    });            

    it("always updates the task when refreshing the activity, even if no task", function(){
        var act = new xplive.Services.MemberActivity();
        act.refresh(new Date(), {id:1});
        expect(act.currentTask.id).toBe(1);
        act.refresh(new Date(), null);
        expect(act.currentTask).toBeFalsy();
    });

    it("does not considers mate offline when he comes back after some missing updates", function(){
        var currentTime = new Date(2012, 1, 1, 19, 0, 0);
        var recentTime = new Date(2012, 1, 1, 12, 0, 0);
        var recentActivity = new xplive.Services.MemberActivity();
        recentActivity.generateId(recentTime);
        var activity = {"mate2": {id: recentActivity.id, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}},
                        "mate3": {id: recentActivity.id, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}}};
        for (var i = 0; i < xplive.Common.MaximunMissingMateUpdatesToConsiderOffline; i++)
            eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);
        spyOn(service.get.teamViewer, "updateTeamActivity").andCallFake(function(activities){
            expect(activities["mate2"].isApparentlyOffline).toBeFalsy();
            expect(activities["mate3"].isApparentlyOffline).toBeTruthy();
        });

        activity = {"mate2": {id: recentActivity.id + 100, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}},
                    "mate3": {id: recentActivity.id, "currentTask": {"status": "Running", "kind": "Planified", "name": "", "enabledAction": "Stop", "elapsedTimeToday": {"delta": 0}, "longDescription": "  ", "elapsedTime": {"delta": 0}, "interruptionsCount": 0, "startTime": 985372475861, "ticketId": "   ", "shortDescription": "  ", 
                        "id": 10}}};
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);
        eventBus.emit(xplive.Events.thereIsNewTeamActivity, activity);

        expect(service.get.teamViewer.updateTeamActivity).toHaveBeenCalled();
    });

    it("cant be configured to send wrong offline activity", function(){
        expect(xplive.Common.MaximunMissingMateUpdatesToConsiderOffline).toBeGreaterThan(
            xplive.Common.ActivityIsSentAtLeast);
    });

    it("subscribes to teamviewer to pop event through the bus", function(){
       var spy = spyTheBus(xplive.Events.onShowMateInfo, eventBus);

       service.get.teamViewer.onShowMateInfo('mate2');

       expect(spy.called).toBeTruthy();
       expect(spy.eventArgs).toBe('mate2');
    });

    it("doesnt fire event when I try to show myself", function(){
        var spy = spyTheBus(xplive.Events.onShowMateInfo, eventBus);

        service.get.teamViewer.onShowMateInfo('mate1');

        expect(spy.called).toBeFalsy();
    });
});

describe("ExclusiveButtonToolbar", function(){
    var widget, fakeDocument;

    beforeEach(function() {
        fakeDocument = sOn.Testing.createFakeDocument();
    });

    it("deactivates everythingelse when one is activated", function(){
        widget = new xplive.Widgets.ExclusiveButtonToolbar(fakeDocument);
        widget.addButtons({
            'tasks': 'tasksTab',
            'pomodoros': 'pomodorosTab',
            'history': 'historyTab'
        });

        widget.activate('pomodoros');
        
        expect(widget.getButton('tasks').getCssClasses()).not.toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
        expect(widget.getButton('history').getCssClasses()).not.toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
        expect(widget.getButton('pomodoros').getCssClasses()).toContain(
            xplive.Widgets.ExclusiveButtonToolbar.activeCss);
    });
});

describe("ExclusivePanelList", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.ExclusivePanelList(fakeDocument);
        widget.addPanels({
            'tasks': 'tasksPanel_domId',
            'pomodoros': 'pomodorosPanel_domId'
        });
    });


    it("hides everythingelse when one is shown", function(){
        widget.show('pomodoros');
        
        expect(widget.getPanel('tasks').visible()).toBeFalsy();
        expect(widget.getPanel('pomodoros').visible()).toBeTruthy();
    });

    it("can show all but one", function(){
        widget.showAllBut('pomodoros');

        expect(widget.getPanel('tasks').visible()).toBeTruthy();
        expect(widget.getPanel('pomodoros').visible()).toBeFalsy();
    });
});

describe("Team Viewer Widget", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        $('#teamViewer').remove();
        widget = new xplive.Widgets.TeamViewer("teamViewer", fakeDocument);
        widget.initialize();
    });

    it("renders serveral members activity", function(){
        var activity = {mate1: 
                            {id: 500, "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 409374}, 
                            "longDescription": "  ", 
                            "elapsedTime": {"delta": 409374}, 
                            "interruptionsCount": 2, 
                            "startTime": 985348497250, "ticketId": "   ", 
                            "shortDescription": "  ", "id": 1},
                            username: "mate1",
                            isOnPomodoro: false,
                            isTakingBreak: false,
                            info: {displayableUsername: "mate1", 
                                   displayableInfo: "mate1    ",
                                   shortDisplayableInfo: "mate1"},
                            itsMe: true
                            }, 
                        mate2: {id: 1000, "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 0}, 
                            "longDescription": "  ", "elapsedTime": 
                            {"delta": 0}, "interruptionsCount": 0, 
                            "startTime": 985372475861, "ticketId": "   ", 
                            "shortDescription": "  ", 
                            "id": 10}, 
                            username: "mate2",
                            isTakingBreak: false,
                            isOnPomodoro: true,
                            pomodoro: { isOn: true, remainingMinutes: 777},
                            info: {
                              displayableUsername: 'mate2',
                              displayableInfo: "mate2  pomodoro   777 ",
                              shortDisplayableInfo: "mate2    777"}
                        },
                        mate3: {id: 1000, "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 0}, 
                            "longDescription": "  ", "elapsedTime": 
                            {"delta": 0}, "interruptionsCount": 0, 
                            "startTime": 985372475861, "ticketId": "   ", 
                            "shortDescription": "  ", 
                            "id": 10}, 
                            username: "mate2",
                            isApparentlyOffline: true,
                            isTakingBreak: true,
                            isOnPomodoro: false,
                            pomodoro: { isOn: true, remainingMinutes: 777},
                            info: {
                                displayableUsername: 'mate3',
                                displayableInfo: "mate3   pomodoro   777   offline ",
                                shortDisplayableInfo: "mate3    777     offline"}
                        }
                        };

        widget.updateTeamActivity(activity);

        expect(widget.membersButtons["mate1"].html().toUpperCase()).toContain("MATE1");
        expect(widget.membersButtons["mate1"].getCssClasses()).toContain(
            xplive.Styles.memberAvailable);
        expect(widget.membersButtons["mate1"].getCssClasses()).toContain(
            xplive.Styles.memberIsMyself);
        expect(widget.membersButtons["mate2"].html().toUpperCase()).toContain("MATE2");
        expect(widget.membersButtons["mate2"].getCssClasses()).toContain(
            xplive.Styles.memberOnPomodoro);
        expect(widget.membersButtons["mate3"].html().toUpperCase()).toContain("MATE3");
        expect(widget.membersButtons["mate3"].html().toUpperCase()).toContain("OFFLINE");
        expect(widget.membersButtons["mate3"].getCssClasses()).toContain(
            xplive.Styles.memberOffline);
        expect(widget.html()).toContain("mate1");
    });

    it("renders message when there is not team activity", function(){
        widget.updateTeamActivity({});

        expect(JSON.stringify(widget.membersButtons)).toBe("{}");
    });

    it("renders members activity details", function(){
        var activity = {mate1: 
                            {id: 500, "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 409374}, 
                            "longDescription": "  ", 
                            "elapsedTime": {"delta": 409374}, 
                            "interruptionsCount": 2, 
                            "startTime": 985348497250, "ticketId": "   ", 
                            "shortDescription": "  ", "id": 1},
                            username: "mate1",
                            isOnPomodoro: false,
                            isTakingBreak: false,
                            info: {displayableInfo: "someTask"}
                            }};

        widget.updateTeamActivity(activity);

        spyOn(widget, "onShowMateInfo");
        widget.membersButtons["mate1"].doClick();

        expect(widget.onShowMateInfo).toHaveBeenCalled();
    });    

    it("renders members activity updating css classes if necessary", function(){
        var activity = {mate1: 
                            {id: 500, "currentTask": {"status": "Running", 
                            "kind": "Planified", "name": "", 
                            "enabledAction": "Stop", 
                            "elapsedTimeToday": {"delta": 409374}, 
                            "longDescription": "  ", 
                            "elapsedTime": {"delta": 409374}, 
                            "interruptionsCount": 2, 
                            "startTime": 985348497250, "ticketId": "   ", 
                            "shortDescription": "  ", "id": 1},
                            username: "mate1",
                            isOnPomodoro: false,
                            isTakingBreak: false, 
                            info: {}
                            }};

        widget.updateTeamActivity(activity);
        activity.mate1.isApparentlyOffline = true;
        widget.updateTeamActivity(activity);

        expect(fakeDocument.html()).not.toContain(
            xplive.Styles.memberAvailable);
        expect(fakeDocument.html()).toContain(
            xplive.Styles.memberOffline);

        activity.mate1.isApparentlyOffline = false;
        activity.mate1.isTakingBreak = true;
        widget.updateTeamActivity(activity);        

        expect(fakeDocument.html()).not.toContain(
            xplive.Styles.memberOffline);
        expect(fakeDocument.html()).toContain(
            xplive.Styles.memberIsTakingBreak);        
    });    

    it("notices user when several sessions are opened, changing the color of the button", function(){
        var activity = {mate1: 
            {id: 500, 
            "severalSessionsOpenWithSameAccount": true,
            "currentTask": {"status": "Running", 
            "kind": "Planified", "name": "", 
            "enabledAction": "Stop", 
            "elapsedTimeToday": {"delta": 409374}, 
            "longDescription": "  ", 
            "elapsedTime": {"delta": 409374}, 
            "interruptionsCount": 2, 
            "startTime": 985348497250, "ticketId": "   ", 
            "shortDescription": "  ", "id": 1},
            username: "mate1",
            isOnPomodoro: true,
            isTakingBreak: false,
            info: {}
            }};

        widget.updateTeamActivity(activity);
        
        expect(fakeDocument.html()).toContain(
            xplive.Styles.severalSessionsOpenWithSameAccount);
    });    
});

describe("UserActivityDetector", function(){
    var detector, eventBus;

    beforeEach(function(){
        sOn.Factory.ResetEventBus();
        eventBus = sOn.Factory.EventBus();
        detector = new xplive.Services.UserActivityDetector();
    });

    afterEach(function(){
        detector.reset();
    });

    it("notifies listener when user becomes inactive", function(){
        var spy = spyTheBus(xplive.Events.userIsNotInteractingWithWindow, eventBus);

        waitsFor(function(){
            detector.initialize(100); 
            return spy.called;
        }, "time out, idle detector is not working!", 200);
        runs(function(){
            expect(spy.called).toBeTruthy();
        });
    });

    it("notifies listener when user becomes active again", function(){
        var spyInactivity = spyTheBus(xplive.Events.userIsNotInteractingWithWindow, eventBus);
        var spyActivity = spyTheBus(xplive.Events.userIsActiveAgain, eventBus);
        waitsFor(function(){
            detector.initialize(200); 
            return spyInactivity.called;
        }, "1- time out, idle detector is not working!", 400
        );
        runs(function(){
            waitsFor(function(){
                 $('body').mousedown();
                 return spyActivity.called;
            }, "2- time out, idle detector is not working!", 400);
            runs(function(){
                expect(spyActivity.called).toBeTruthy();
            });            
        });
    });    
});

describe("Window close detector", function(){
    var detector;

    it("notifies listener when window is being closed", function(){
        var called = false;
        var listener = { onClosing: function(){ called = true}};
        detector = new xplive.Services.WindowCloseDetector();
        detector.initialize();
        detector.subscribe(listener);

        window.onbeforeunload();

        expect(called).toBeTruthy();
    });
});

describe("the sound player", function(){
    var player, fakeDocument;
    beforeEach(function(){
        xplive.Widgets.SoundPlayer.isTestMode = false;
    });

    it("renders the markup properly", function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        player = new xplive.Widgets.SoundPlayer('../meow', fakeDocument);

        player.initialize();
        
        expect(fakeDocument.html()).toContain('src="../meow.ogg"');
    });

    afterEach(function(){
        xplive.Widgets.SoundPlayer.isTestMode = true;
    });
});

describe("the way the factory assembles the app", function(){
    it("creates artifacts that communicate with the event bus", function(){
        var fakeDocument = sOn.Testing.createFakeDocument();
        var app = xplive.Factory.CreateApp({
                    tasksPlaceholder: fakeDocument,
                    tasksBinderId: "tasks",
                    finishedTasksBinderId: "finishedTasks",
                    pomodorosPlaceholder: fakeDocument
        });
        expect(app.activityDetector).toBeDefined();
        expect(app.teamProxy).toBeDefined();
        expect(app.teamCommunicator).toBeDefined();
        app.initialize();
    });
});

describe("the team communicator", function(){
    var communicator, session;

    beforeEach(function(){
        session = { username: "mate1", team: "team1", host: "host"};
        communicator = xplive.Factory.TeamCommunicator({}, session);
        communicator.get.windowManager.animateTitle = function(){};
        sOn.Factory.ResetEventBus();
        communicator.initialize();
    });

    it("set the focus in the team chat input as it initializes", function(){
        communicator = xplive.Factory.TeamCommunicator({}, session);
        spyOn(communicator.get.wholeTeamChatInput, 'focus');
    
        communicator.initialize();
        
        expect(communicator.get.wholeTeamChatInput.focus).toHaveBeenCalled();
    });

    it("cleans text input when sends the team chat message through the proxy", function(){
        communicator.get.matesWidget.showNewMessage = function(){};
        spyOn(communicator.get.chatProxy, "sendMessageToTeam").andCallFake(function(msg){
            expect(msg.receiver).toEqual(xplive.Common.Team);
            expect(msg.body).toEqual('hello');
            expect(msg.sender).toEqual('mate1');
        });
        communicator.get.wholeTeamChatInput.text = function(){ return 'hello';}
        communicator.get.wholeTeamChatInput.onEnter();

        expect(communicator.get.chatProxy.sendMessageToTeam).toHaveBeenCalled();
    });

    it("sends the team chat message through the proxy", function(){
        communicator.get.matesWidget.showNewMessage = function(){};
        spyOn(communicator.get.chatProxy, "sendMessageToTeam").andCallFake(function(msg){
            expect(msg.receiver).toEqual(xplive.Common.Team);
            expect(msg.body).toEqual('hello');
            expect(msg.sender).toEqual('mate1');
        });
        communicator.get.wholeTeamChatInput.text = function(){ return 'hello';}
        communicator.get.wholeTeamChatInput.onEnter();

        expect(communicator.get.chatProxy.sendMessageToTeam).toHaveBeenCalled();
    });

    it("sends the messages through the chat proxy", function(){
        communicator.get.matesWidget.showNewMessage = function(){};
        spyOn(communicator.get.chatProxy, "sendMessage").andCallFake(function(msg){
            expect(msg.receiver).toEqual('john');
            expect(msg.body).toEqual('hello');
            expect(msg.sender).toEqual('mate1');
        });

        communicator.sendMessage("hello").to('john');

        expect(communicator.get.chatProxy.sendMessage).toHaveBeenCalled();
    });

    it("receives the messages to display them in the widget", function(){
        var receiptTime = new Date(2013,1,1, 10, 30, 0);
        communicator.get.clock.giveMeTheTime = function(){
            return receiptTime;
        };
        spyOn(communicator.get.matesWidget, "showNewMessage")
            .andCallFake(function(mate, msg){
                expect(mate).toEqual('john');
                expect(msg.body).toEqual('morning');
                expect(msg.receiptTime).toEqual(receiptTime);
                expect(msg.visibleReceiptTime).toContain("10:30");
            });

        communicator.get.chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(communicator.get.matesWidget.showNewMessage).toHaveBeenCalled();
    });

    it("receives the team chat messages to display them in the widget", function(){
        var receiptTime = new Date(2013,1,1, 10, 30, 0);
        communicator.get.clock.giveMeTheTime = function(){
            return receiptTime;
        };
        spyOn(communicator.get.wholeTeamChatViewer, "showMessage").andCallFake(
            function(msg){
                expect(msg.visibleReceiptTime).toContain("10:30");
        });

        communicator.get.chatProxy.onWholeTeamMessage({
            sender: 'john', body: 'morning'});

        expect(communicator.get.wholeTeamChatViewer.showMessage).toHaveBeenCalled();
    });    

    it("retains the incoming message if user is on pomodoro", function(){
        sOn.Factory.EventBus().emit(xplive.Events.newPomodoroStarted);
        spyOn(communicator.get.matesWidget, "showNewMessage");

        communicator.get.chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(communicator.get.matesWidget.showNewMessage
                ).not.toHaveBeenCalled();
    });    

    describe("the messages stack", function(){
        it("stores the messages and pop them in the stored order", function(){
            var stack = new xplive.Services.MessagesStack();
            var msg1 = {id:1, body:"hello"};
            var msg2 = {id:2, body:"bye"};

            stack.storeMessage(msg1);
            stack.storeMessage(msg2);

            var poped = stack.popAllMessages();
            expect(poped[0].id).toBe(msg1.id);
            expect(poped[1].id).toBe(msg2.id);
            expect(poped.length).toBe(2);
            var cleaned = stack.popAllMessages();
            expect(cleaned.length).toBe(0);
        });
    });

    it("shows the retained messages when pomodoro finishes", function(){
        var msgs = [{id:1, sender: 'john', body:'hello'}];
        communicator.get.incomingMessagesStack.popAllMessages = function(){
            return msgs;
        };
        spyOn(communicator.get.matesWidget, "showNewMessage");

        sOn.Factory.EventBus().emit(xplive.Events.pomodoroFinished);
        
        expect(communicator.get.matesWidget.showNewMessage
                ).toHaveBeenCalledWith('john', msgs[0]);
    });        

    it("alerts when the retained messages are displayed", function(){
        var msgs = [{id:1, sender: 'john', body:'hello'}];
        communicator.get.incomingMessagesStack.popAllMessages = function(){
            return msgs;
        };
        spyOn(communicator.get.soundPlayer, "play");

        sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
        sOn.Factory.EventBus().emit(xplive.Events.pomodoroFinished);
        
        expect(communicator.get.soundPlayer.play
                ).toHaveBeenCalled();
    });            

    it("does not alert if there are no retained message and pomodoro ends", function(){
        communicator.get.incomingMessagesStack.popAllMessages = function(){
            return [];
        };
        spyOn(communicator.get.soundPlayer, "play");

        sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
        sOn.Factory.EventBus().emit(xplive.Events.pomodoroFinished);
        
        expect(communicator.get.soundPlayer.play
                ).not.toHaveBeenCalled();
    });                

    it("shows all the retained messages when pomodoro finishes", function(){
        var msgs = [{id:1, sender: 'john', body:'hello'},
                    {id:2, sender: 'john', body:'whats up'}];
        communicator.get.incomingMessagesStack.popAllMessages = function(){
            return msgs;
        };
        spyOn(communicator.get.matesWidget, "showNewMessage");

        sOn.Factory.EventBus().emit(xplive.Events.pomodoroFinished);
        
        expect(communicator.get.matesWidget.showNewMessage
                ).toHaveBeenCalled();
        expect(communicator.get.matesWidget.showNewMessage.callCount
                ).toBe(2);
    });            

    it("saves the incoming message in the stack when user is on pomodoro", function(){
        var msg = {sender: 'john', body: 'morning'};
        sOn.Factory.EventBus().emit(xplive.Events.newPomodoroStarted);
        spyOn(communicator.get.incomingMessagesStack, "storeMessage");

        communicator.get.chatProxy.onReceivedMessage(msg);

        expect(communicator.get.incomingMessagesStack.storeMessage
                ).toHaveBeenCalledWith(msg);
    });        

    it("moves the message from pending to sent", function(){
        var receiptTime = new Date(2013,1,1, 10, 30, 0);
        communicator.get.clock.giveMeTheTime = function(){
            return receiptTime;
        };
        spyOn(communicator.get.matesWidget, "moveMessageFromPendingToSent")
            .andCallFake(function(mate, msg){
                expect(mate).toEqual('lucas');
                expect(msg.body).toEqual('morning');
            });

        communicator.get.chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas'});

        expect(communicator.get.matesWidget.moveMessageFromPendingToSent).toHaveBeenCalled();
    });    

    it("moves the message from pending to sent only if it is not repeated", function(){
        communicator.get.matesWidget.moveMessageFromPendingToSent = function(){};
        communicator.get.chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas', id:1});

        spyOn(communicator.get.matesWidget, "moveMessageFromPendingToSent");

        communicator.get.chatProxy.onConfirmationReceived({
            sender: 'john', body: 'morning', receiver: 'lucas', id:1});

        expect(communicator.get.matesWidget.moveMessageFromPendingToSent).not.toHaveBeenCalled();
    });        

    it("confirms the reception of a new message", function(){
        var originalDate = new Date(2013,1,1, 11, 30, 0); 
        var receiptTime = new Date(2013,1,1, 10, 30, 0);
        communicator.get.clock.giveMeTheTime = function(){
            return receiptTime;
        };
        spyOn(communicator.get.chatProxy, "confirmReception")
            .andCallFake(function(msg){
                expect(msg.sender).toEqual('john');
                expect(msg.body).toEqual('morning');
                expect(msg.receiptTime).toBe(originalDate);
            });

        communicator.get.chatProxy.onReceivedMessage(
            {sender: 'john', body: 'morning', receiptTime: originalDate});

        expect(communicator.get.chatProxy.confirmReception).toHaveBeenCalled();
    });    

    it("receives the messages and alerts user about it", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsNotVisible);
        spyOn(communicator.get.soundPlayer, 'play');
        spyOn(communicator.get.windowManager, "animateTitle");

        communicator.get.chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(communicator.get.windowManager.animateTitle).toHaveBeenCalled();
        expect(communicator.get.soundPlayer.play).toHaveBeenCalled();
    });    

    it("receives the messages but doesnt alert if window is visible", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        spyOn(communicator.get.soundPlayer, 'play');
        spyOn(communicator.get.windowManager, "animateTitle");

        communicator.get.chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(communicator.get.windowManager.animateTitle).not.toHaveBeenCalled();
        expect(communicator.get.soundPlayer.play).not.toHaveBeenCalled();
    });        

    it("receives the messages and alerts because of inactivity", function(){
        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        sOn.Factory.EventBus().emit(xplive.Events.userIsNotInteractingWithWindow);
        spyOn(communicator.get.soundPlayer, 'play');
        spyOn(communicator.get.windowManager, "animateTitle");
        spyOn(communicator.get.windowManager, "popUpNotification");

        communicator.get.chatProxy.onReceivedMessage({sender: 'john', body: 'morning'});

        expect(communicator.get.windowManager.animateTitle).toHaveBeenCalled();
        expect(communicator.get.windowManager.popUpNotification).toHaveBeenCalled();
        expect(communicator.get.soundPlayer.play).toHaveBeenCalled();
    });            

    it("stops title animation when user comes back to the app", function(){
        spyOn(communicator.get.windowManager, "stopTitleAnimation");

        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        
        expect(communicator.get.windowManager.stopTitleAnimation).toHaveBeenCalled();
    });            

    it("closes current notificatio when user comes back to the app", function(){
        spyOn(communicator.get.windowManager, "closeCurrentNotification");

        sOn.Factory.EventBus().emit(xplive.Events.windowIsVisible);
        
        expect(communicator.get.windowManager.closeCurrentNotification).toHaveBeenCalled();
    });                

    it("tells the widget that mates activity has to be updated", function(){
        spyOn(communicator.get.matesWidget, "updateMateActivity")
            .andCallFake(function(mate, activity){
                expect(mate).toEqual('john');
                expect(activity.isOnPomodoro).toBeTruthy();
            });

        sOn.Factory.EventBus().emit(xplive.Events.thereIsNewMateActivity, {
            mate: 'john', activity: {isOnPomodoro: true}
        });

        expect(communicator.get.matesWidget.updateMateActivity).toHaveBeenCalled();
    });

    it("tells the widget that mates activity has to be updated", function(){
        spyOn(communicator.get.matesWidget, "showMateInfo");

        sOn.Factory.EventBus().emit(xplive.Events.onShowMateInfo, 'john');

        expect(communicator.get.matesWidget.showMateInfo).
                toHaveBeenCalledWith('john');
    });

    it("sends the message through the proxy when is introduced in the widget", function(){
        communicator.get.matesWidget.showNewMessage = function(){};
        spyOn(communicator.get.chatProxy, "sendMessage")
            .andCallFake(function(msg){
                expect(msg.receiver).toEqual('john');
                expect(msg.sender).toEqual(session.username);
                expect(msg.body).toEqual('hello');
            });
        communicator.get.matesWidget.onNewMessageIntroduced('john', 'hello');

        expect(communicator.get.chatProxy.sendMessage).toHaveBeenCalled();
    });

    it("draws the sent message in the widget", function(){
        spyOn(communicator.get.matesWidget, "showNewMessage")
            .andCallFake(function(mate, msg){
                expect(mate).toEqual('john');
                expect(msg.sender).toEqual('mate1');
                expect(msg.body).toEqual('hello');
            });

        communicator.sendMessage("hello").to('john');

        expect(communicator.get.matesWidget.showNewMessage).toHaveBeenCalled();
    });

    it("connects the chat proxy to the socket on initialization", function(){
        communicator = xplive.Factory.TeamCommunicator({}, session);
        spyOn(communicator.get.chatProxy, "connect");

        communicator.initialize();

        expect(communicator.get.chatProxy.connect).toHaveBeenCalled();
    });

    it("adds a new consecutive id to every message created", function(){
        communicator.get.clock.giveMeTheTime = function(){
            return new Date(20012, 1, 1, 10, 30, 0);
        };
        var ids = [];
        spyOn(communicator.get.matesWidget, "showPendingMessage").
            andCallFake(function(receiver, msg){
            ids.push(msg.id);
        });

        communicator.get.matesWidget.onNewMessageIntroduced('john', 'hello');
        communicator.get.matesWidget.onNewMessageIntroduced('john', 'bye');
        
        expect(communicator.get.matesWidget.showPendingMessage).
                toHaveBeenCalled();
        expect(ids[1]).toBeGreaterThan(ids[0]);
    });

    it("draws the new introduced message", function(){
        communicator.get.clock.giveMeTheTime = function(){
            return new Date(20012, 1, 1, 10, 30, 0);
        };
        spyOn(communicator.get.matesWidget, "showPendingMessage").
            andCallFake(function(receiver, msg){
                expect(receiver).toBe('john');
                expect(msg.visibleReceiptTime).toContain("10:30");
                expect(msg.sender).toBe(session.username);
                expect(msg.body).toBe('hello');
        });
        communicator.get.matesWidget.onNewMessageIntroduced('john', 'hello');

        expect(communicator.get.matesWidget.showPendingMessage).
                toHaveBeenCalled();
    });
});

describe("the MatesWidget", function(){
    var widget , fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.MatesWidget(fakeDocument);
    });

    describe("the integration", function(){
        it("creates the widget also before showing the message", function(){
            widget.showNewMessage("mate66", {body: 'yesyes'});

            expect(fakeDocument.html()).toContain('yesyes');        
        });
    })

    it("renders members activity details", function(){
        var activity = {mate1:
            {id: 500, "currentTask": {"status": "Running",
                "kind": "Planified", "name": "",
                "enabledAction": "Stop",
                "elapsedTimeToday": {"delta": 409374},
                "longDescription": "  ",
                "elapsedTime": {"delta": 409374},
                "interruptionsCount": 2,
                "startTime": 985348497250, "ticketId": "   ",
                "shortDescription": "  ", "id": 1},
                username: "mate1",
                isOnPomodoro: false,
                isTakingBreak: false,
                info: {displayableInfo: "someTask"}
            }
        };
        expect(fakeDocument.html().toLowerCase()).not.toContain("modal");
        widget.membersDetailsWidgets["mate1"] = {
            updateMateActivity: function(){}
        };
        spyOn(widget.membersDetailsWidgets["mate1"], "updateMateActivity");

        widget.updateMateActivity("mate1", activity);

        expect(widget.membersDetailsWidgets["mate1"].updateMateActivity).toHaveBeenCalled();
    });

    it('focuses on the chat input when I open the dialog', function(){
        widget.updateMateActivity("mate1", null);
        spyOn(widget.membersDetailsWidgets['mate1'], "focusOnInput");

        widget.showMateInfo('mate1');

        expect(widget.membersDetailsWidgets['mate1'].focusOnInput
                ).toHaveBeenCalled();        
    });

    it('brings the widget to front on show', function(){
        widget.updateMateActivity("mate1", null);
        widget.updateMateActivity("mate2", null);

        var zindex1, zindex2;
        spyOn(widget.membersDetailsWidgets["mate1"], "bringToFront").
                andCallFake(function(zindex){
                zindex1 = zindex;
            });
        spyOn(widget.membersDetailsWidgets["mate2"], "bringToFront").
                andCallFake(function(zindex){
                zindex2 = zindex;
            });

        widget.showMateInfo('mate1');
        widget.showMateInfo('mate2');

        expect(widget.membersDetailsWidgets["mate1"].bringToFront).toHaveBeenCalled();
        expect(widget.membersDetailsWidgets["mate2"].bringToFront).toHaveBeenCalled();
        expect(zindex2).toBeGreaterThan(zindex1);
    });

    it('brings the widget to front when the header is clicked', function(){
        widget.updateMateActivity("mate1", null);

        var zindexes = [];
        spyOn(widget.membersDetailsWidgets["mate1"], "bringToFront").
            andCallFake(function(zindex){
                zindexes.push(zindex);
            });

        var header = fakeDocument.find('.' + xplive.Widgets.TeamMate.headerCss);
        header.click();
        header.click();
        expect(widget.membersDetailsWidgets["mate1"].bringToFront).toHaveBeenCalled();
        expect(zindexes[1]).toBeGreaterThan(zindexes[0]);
    });

    it('brings the widget to front when the header is clicked', function(){
        widget.updateMateActivity("mate1", null);
        spyOn(widget.membersDetailsWidgets["mate1"], "showNewMessage");

        var msg = {body: 'hello'};
        widget.showNewMessage('mate1', msg);

        expect(widget.membersDetailsWidgets["mate1"].showNewMessage).
            toHaveBeenCalledWith(msg);
    });    

    it('shows the pending message', function(){
        widget.updateMateActivity("mate1", null);
        spyOn(widget.membersDetailsWidgets["mate1"], "showPendingMessage");

        var msg = {id: 1, body: 'hello'};
        widget.showPendingMessage('mate1', msg);

        expect(widget.membersDetailsWidgets["mate1"].showPendingMessage).
            toHaveBeenCalledWith(msg);
    });        

    it('moves pending message to sent', function(){
        var msg = {id: 1, body: 'hello'};
        var msg2 = {id: 2, body: 'hello'};
        widget.showPendingMessage('mate1', msg);
        widget.showPendingMessage('mate1', msg2);

        spyOn(widget.membersDetailsWidgets["mate1"], "clearPendingMessages");
        spyOn(widget.membersDetailsWidgets["mate1"], "showPendingMessage");
        spyOn(widget.membersDetailsWidgets["mate1"], "showNewMessage");

        widget.moveMessageFromPendingToSent("mate1", msg);

        expect(widget.membersDetailsWidgets["mate1"].showPendingMessage).
            toHaveBeenCalledWith(msg2);
        expect(widget.membersDetailsWidgets["mate1"].clearPendingMessages).
            toHaveBeenCalled();
        expect(widget.membersDetailsWidgets["mate1"].showNewMessage).
            toHaveBeenCalledWith(msg);            
    });            

    it('clears pending messages', function(){
        widget.updateMateActivity("mate1", null);
        spyOn(widget.membersDetailsWidgets["mate1"], "clearPendingMessages");

        widget.clearPendingMessages('mate1');

        expect(widget.membersDetailsWidgets["mate1"].clearPendingMessages).
            toHaveBeenCalled();
    });        

    it('pops up the new introduced message', function(){
        widget.updateMateActivity("mate1", null);
        spyOn(widget, "onNewMessageIntroduced");

        widget.membersDetailsWidgets["mate1"].onNewMessageIntroduced('hello');

        expect(widget.onNewMessageIntroduced).
            toHaveBeenCalledWith("mate1", 'hello');
    });        
});

describe("TeamMate widget", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.TeamMate("id", fakeDocument, "test");
        widget.initialize();
    });

    describe("integration with DOM", function(){
        it("the chat input box", function(){
            var inputBox = new xplive.Widgets.ChatInputBox(
                                "wholeTeamChatInputTest", fakeDocument);
            inputBox.initialize();

            inputBox.setText("hello");
            expect(fakeDocument.html()).toContain("hello");
            spyOn(inputBox, "onMessageEntered");
            inputBox.onEnter();
            expect(fakeDocument.html()).not.toContain("hello");            
            expect(inputBox.focus).toBeDefined();
            expect(inputBox.onMessageEntered).toHaveBeenCalledWith('hello');
        });

        it("fires the event when the header is clicked", function(){
            spyOn(widget, "onHeaderClick");
            var header = fakeDocument.find("." + xplive.Widgets.TeamMate.headerCss);
            expect(header.length).toBe(1);

            header.click();

            expect(widget.onHeaderClick).toHaveBeenCalled();
        });
        it("fires the event when text is entered", function(){
            spyOn(widget, "onNewMessageIntroduced");

            widget.inputTextArea.onMessageEntered('hello');

            expect(widget.onNewMessageIntroduced).toHaveBeenCalledWith('hello');
            expect(widget.inputTextArea.text()).toBeFalsy();
        });
        it("renders the message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello'};
            widget.showNewMessage(msg);

            var txt = fakeDocument.html();
            expect(txt).toContain(msg.sender);
            expect(txt).toContain(msg.visibleReceiptTime);
            expect(txt).toContain(msg.body);
        });
        it("renders the pending message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello', id:1};

            widget.showPendingMessage(msg);

            var txt = fakeDocument.html();
            expect(txt).toContain(msg.sender);
            expect(txt).toContain(msg.visibleReceiptTime);
            expect(txt).toContain(msg.body);
        });

        it("clears the pending message properly", function(){
            var msg = {sender: 'lucas', 
                visibleReceiptTime: "10:35", body:'hello', id:1};
                
            widget.showPendingMessage(msg);
            widget.clearPendingMessages();

            var txt = fakeDocument.html();
        });        
    });

    it("renders mate username and current task", function(){
        var userActivity = {username: "test", info: {displayableInfo: "lalala"}};
        widget.updateMateActivity(userActivity);
        widget.showMate();

        expect(widget.html()).toContain(userActivity.username);
        expect(widget.html()).toContain("closeBtn");
        expect(widget.html()).toContain(userActivity.info.displayableInfo);
        expect(widget.visible()).toBeTruthy();
        var warning = fakeDocument.find("." + xplive.Widgets.TeamMate.pomodoroWarning);
        expect(warning.css("display")).toBe("none");
    });

    it("can change position randomly", function(){
        var top1 = widget.getNativeWidget().css('top');
        var left1 = widget.getNativeWidget().css('left');
        
        widget.changePositionRandomly();
        
        var top2 = widget.getNativeWidget().css('top');
        var left2 = widget.getNativeWidget().css('left');   
        expect(top1).not.toEqual(top2);
        expect(left1).not.toEqual(left2);
    });

    it("shows pomodoro warning", function(){
        var userActivity = {username: "test", 
        info:{displayableInfo: "lalala"}, isOnPomodoro: true};
        widget.updateMateActivity(userActivity);
        widget.showMate();

        var warning = fakeDocument.find("." + xplive.Widgets.TeamMate.pomodoroWarning);
        expect(warning.css("display")).not.toBe("none");
    });    

    it("closes when close button is pressed", function(){
        var userActivity = {username: "test"};
        widget.showMate(userActivity);
        widget.closeBtn.doClick();

        expect(widget.visible()).toBeFalsy();
    });
});

describe("the configuration", function(){
    it("has values that make sense", function(){
        expect(xplive.Common.MaximunMissingMateUpdatesToConsiderOffline
                ).toBeGreaterThan(xplive.Common.ActivityIsSentAtLeast);
    });
});

describe("the ActivityFormatter", function(){
    it ("generates info when current task is not detailed", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {}
        });

        expect(info.summaryDisplayableInfo.toUpperCase()).toContain('TASK');
    });
    it("prioritizes the location info when user is not there", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {ticketId: '#123'}, 
            statusLocation: xplive.Common.Locations.IamNotHere
        });

        expect(info.displayableInfo.toUpperCase()).toContain('NOT HERE');
        expect(info.summaryDisplayableInfo.toUpperCase()).toContain('NOT HERE');
    });
    it("prioritizes the location even when user is taking a break", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {ticketId: '#123'}, 
            isTakingBreak: true,
            statusLocation: xplive.Common.Locations.IamNotHere
        });

        expect(info.displayableInfo.toUpperCase()).toContain('NOT HERE');
        expect(info.summaryDisplayableInfo.toUpperCase()).toContain('NOT HERE');
    });    
    it("shows location when I am not at my office desk", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {ticketId: '#123'}, 
            statusLocation: xplive.Common.Locations.IamWorkingFromHome
        });

        expect(info.displayableInfo.toUpperCase()).toContain('123');
        expect(info.displayableInfo.toUpperCase()).toContain('FROM HOME');
        expect(info.summaryDisplayableInfo.toUpperCase()).toContain('FROM HOME');
    });    
    it ("removes duplicated hashes from the ticketId", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {ticketId: '#123'}
        });

        expect(info.summaryDisplayableInfo.toUpperCase()).toEqual('(#123)');
    });    
    it ("can be on pomodoro but without any task running", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            isOnPomodoro: true,
            pomodoro: {remainingMinutes: '20'}
        });

        expect(info.summaryDisplayableInfo.toUpperCase()).toEqual('');
    });        
    it ("shows task detail and ticketId", function(){
        var info = xplive.Services.ActivityFormatter.generateDisplayableInfo({
            currentTask: {shortDescription: 'lalala', ticketId: '#123'}
        });

        expect(info.summaryDisplayableInfo.toUpperCase()).toEqual('(LALALA, #123)');
        expect(info.displayableInfo.toUpperCase()).toContain('TICKET');
        expect(info.displayableInfo.toUpperCase()).toContain('LALALA');
        expect(info.displayableInfo.toUpperCase()).toContain('123');
    });    
});

describe("the way I can inform about my status to my team", function(){
    var app, statusService;

    beforeEach(function(){
        sOn.Factory.ResetEventBus();
        app = xplive.Factory.CreateApp({});
        statusService = app.statusService;
        app.initialize();
    });

    it("connects the business API with the service", function(){
        spyOn(statusService, 'changeMyLocation');

        app.myLocationIs('sweet home');

        expect(statusService.changeMyLocation).toHaveBeenCalledWith('sweet home');
    });

    it("connects GUI with the service", function(){
        spyOn(statusService, 'changeMyLocation');

        statusService.get.statusWidget.onLocationChanged('sweet home');

        expect(statusService.changeMyLocation).toHaveBeenCalledWith('sweet home');
    });

    it("fires event when the location is changed", function(){
        spyOn(statusService, "onLocationChanged");

        statusService.changeMyLocation('whatever');

        expect(statusService.onLocationChanged).toHaveBeenCalled();
    });
});

describe("the status widget", function(){
    var widget, fakeDocument;

    beforeEach(function(){
        fakeDocument = sOn.Testing.createFakeDocument();
        widget = new xplive.Widgets.StatusWidget({
            elementId: 'statusWidget',
            dropdown:'locationDropdown',
            placeholder: fakeDocument
        });
        widget.initialize();
    });

    it("populates dropdown with the default choices", function(){
        var html = fakeDocument.html().toUpperCase();
        expect(html).toContain(
            xplive.Common.Locations.IamNotHere.toUpperCase());
        expect($('#locationDropdown').html().toUpperCase()).toContain(
            xplive.Common.Locations.IamWorkingFromHome.toUpperCase());
    });

    it("pops up event when the status dropdown selection changes", function(){
        spyOn(widget, "onLocationChanged");

        widget.locationDropdown.onChange(xplive.Common.IamNotHere);

        expect(widget.onLocationChanged).toHaveBeenCalledWith(xplive.Common.IamNotHere);
    });
});
