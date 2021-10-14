var productionApp, interactor, tasksService, totalsCalculator, 
	screenText, xplive, pomodoroInteractor;
var team = "integration_test_team"
var username = "integration_test_username"
var mainUrl = "/" + team + "/" + username;

var onLoadComplete = function(appWindow){
	productionApp = appWindow;
	interactor = productionApp.xplive.App.tasksInteractor;
    totalsCalculator = productionApp.xplive.App.totalsCalculator;
    xplive = productionApp.xplive;
	pomodoroInteractor = productionApp.xplive.App.pomodoroInteractor;
	productionApp.xplive.Common.shouldAskOnWindowClosing = false;
	screenText = "";
};

var onLoadCompleteFakeServer = function(appWindow){
	onLoadComplete(appWindow);
	productionApp.xplive.App.tasksService.get.storage.saveTasks = function(){ console.log("Faking task save");};
	productionApp.xplive.App.tasksService.get.storage.loadTasks = function(){ console.log("Faking task load");};
};

describe("XPLive, The eXtreme Programming productivity tool", function(){
	
 // ------------   This part is technical, not intended for stakeholders	

	beforeEach(function(){
		sOn.Testing.Integration.loadTargetWindow(mainUrl, 
			onLoadCompleteFakeServer);
	});
		
 // ------------   This is the behavior (what stakeholders understand):

 describe("Tasks management", function(){

	it("can start unexpected task, which are intended for unexpected interruptions", function(){
		interactor.startNewUnexpectedTask();
		
		screenText = interactor.whatTheUserCanSeeInTheScreen();
		expect(screenText).toContain(xplive.Status.RUNNING);
		expect(screenText).toContain(xplive.Kinds.UNEXPECTED);
	});	

	describe("when a planified task starts", function(){
		var task;

		beforeEach(function(){
			task = interactor.startNewPlanifiedTask();
		});

		it("shows the work in progress", function(){
			screenText = interactor.whatTheUserCanSeeInTheScreen();
			expect(screenText).toContain(xplive.Status.RUNNING);
			expect(screenText).toContain(xplive.Kinds.PLANIFIED);
			expect(screenText).toContain(task.id);
			expect(screenText).toContain(task.enabledAction);
		});	

		it("can also start another task but has to stop the first one", function(){
			interactor.startNewPlanifiedTask();
		
			screenText = interactor.whatTheUserCanSeeInTheScreen();
			expect(screenText).toContain(xplive.Status.RUNNING);
			expect(screenText).toContain(xplive.Status.STOPPED);
		});

		it("can finish the current task telling the user the elapsed time", function(){
			interactor.finishTask(task);

			screenText = interactor.whatTheUserCanSeeInTheScreen();
			expect(screenText).toContain(xplive.Status.FINISHED);
			expect(screenText).toContain(task.elapsedTime.seconds());
		});

		describe("and the the task is stopped", function(){
			beforeEach(function(){
				interactor.stopCurrentTask();
			});

         it("knows the total amount of work done today, so far", function(){
            var totalsText = totalsCalculator.whatTheUserCanSeeInTheScreen();
            expect(totalsText).toContain("1");
            var totals = totalsCalculator.tasksTotals();
            var todayTotals = totals[0];
            expect(todayTotals.planifiedTasks).toBe(1);
            expect(todayTotals.interruptions).toBe(1);
            expect(todayTotals.unexpectedTasks).toBe(0);
            expect(todayTotals.time.toString()).toContain(task.elapsedTime.seconds());
            expect(todayTotals.time.toString()).toContain(task.elapsedTime.minutes());
         });

			it("tells the user that task is stopped", function(){
				interactor.stopCurrentTask();

				screenText = interactor.whatTheUserCanSeeInTheScreen();
				expect(screenText).toContain(xplive.Status.STOPPED);
			});	

			it("knows how many seconds and minutes I've been working on the task", function(){
				expect(task.elapsedTime.seconds()).toBeLessThan(0.1);
			});

			describe("and it is resumed", function(){
				beforeEach(function(){
					interactor.resumeStoppedTask(task);
				});
		
				it("tells the user that task is running again", function(){
					screenText = interactor.whatTheUserCanSeeInTheScreen();
					expect(screenText).toContain(xplive.Status.RUNNING);
				});	

				it("can stop the task again and know how many times has been stopped", function(){
					for(var i = 0; i < 222; i++){
						interactor.stopCurrentTask();
						interactor.resumeStoppedTask(task);
					};
					interactor.finishTask(task);
					finishedTasksText = interactor.get.finishedBinder.rawUI();

					expect(finishedTasksText).toContain("223");
				});
			});
	
		});
	});

 });

 describe("Pomodoros", function(){  
 	it("asks the progess bar group to show that it has been started", function(){
		var progress = pomodoroInteractor.get.progressBar.html();
		expect(progress).toContain("0%");    
		expect(progress).not.toContain("1 minutes left");

		pomodoroInteractor.startPomodoro(1); // one minute
		progress = pomodoroInteractor.get.progressBar.html();

		expect(progress).toContain("%");    
		expect(progress).toContain("1 minutes left");
    });
 });

});

