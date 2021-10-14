var casper = require('casper').create();
var username = "mytestusername";
var appUrl = "http://localhost:5000/mytestteam/" + username;
var teamUrl = "http://localhost:5000/mytestteam/" + username + "#team";
var mateUrl = "http://localhost:5000/mytestteam/mytestmate#team";
var cleanUrl = "http://localhost:5000/test/integration/delete/mytestteam/" + username;
var cleanMateUrl = "http://localhost:5000/test/integration/delete/mytestteam/mytestmate";
var pomodoroMinutes = Math.ceil(Math.random() *  1000);

casper.start(appUrl);

casper.thenEvaluate(function I_specify_my_location(){
    xplive.App.myLocationIs(xplive.Common.Locations.IamWorkingFromHome);
});

casper.thenOpen(mateUrl);

casper.then(function My_mate_sees_my_location(){
	var args = arguments;
	this.wait(5000, function(){
		this.test.assertTextExists('not here right now', 'location is shared');
	});	
});

casper.thenOpen(cleanUrl);
casper.thenOpen(cleanMateUrl);

casper.run(function() {
    this.exit();
});
