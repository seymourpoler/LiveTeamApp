var casper = require('casper').create();
var username = "mytestusername";
var appUrl = "http://localhost:5000/mytestteam/" + username;
var teamUrl = "http://localhost:5000/mytestteam/" + username + "#team";
var mateUrl = "http://localhost:5000/mytestteam/mytestmate#team";
var cleanUrl = "http://localhost:5000/test/integration/delete/mytestteam/" + username;
var cleanMateUrl = "http://localhost:5000/test/integration/delete/mytestteam/mytestmate";
var pomodoroMinutes = Math.ceil(Math.random() *  1000);

casper.start(appUrl);

casper.thenEvaluate(function I_start_a_new_task(){
    xplive.App.tasksInteractor.startNewPlanifiedTask();
});

casper.thenOpen(appUrl);

casper.then(function I_see_the_started_task_on_reload(){
    this.test.assertTextExists('Running', arguments.callee.name.toString());
});

casper.thenEvaluate(function I_start_a_pomodoro(mins){
	xplive.App.pomodoroInteractor.startPomodoro(mins);
}, {mins: pomodoroMinutes});

casper.thenOpen(teamUrl);

casper.then(function I_see_myself_on_pomodoro_in_the_team_monitor(){
	var args = arguments;
	this.wait(5000, function(){
	    this.test.assertTextExists(pomodoroMinutes.toString(), args.callee.name.toString());
	});
});

casper.thenOpen(mateUrl);

casper.then(function My_mate_sees_my_pomodoro_in_the_team_monitor(){
	var args = arguments;
	this.wait(5000, function(){
		this.test.assertTextExists(pomodoroMinutes.toString(), 
					"mate can see pomodoro minutes");
	});	
});

casper.thenOpen(cleanUrl);
casper.thenOpen(cleanMateUrl);

casper.run(function() {
    this.exit();
});
