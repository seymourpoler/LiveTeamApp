var casper = require('casper').create();
var appUrl = "http://localhost:5000/mytestteam/mytestusername"

casper.start(appUrl);

casper.thenEvaluate(function I_select_the_tasks_tab(){
    dashboardTabs.getButton('tasks').doClick();
});

casper.then(function it_shows_the_tasks_panel() {
    var isVisible = this.evaluate(function(){
        return panels.getPanel('tasks').visible();
    });
    this.test.assert(isVisible, arguments.callee.name.toString());
});

casper.thenEvaluate(function I_select_the_pomodoro_tab(){
    dashboardTabs.getButton('pomodoro').doClick();
});

// doesnt work because of a bug in phantomjs:
// http://code.google.com/p/phantomjs/issues/detail?id=632
// https://github.com/n1k0/casperjs/issues/101
casper.then(function it_shows_the_pomodoro_panel() {
    var isVisible = this.evaluate(function(){
        return panels.getPanel('pomodoro').visible();
    });
    this.test.assert(isVisible, arguments.callee.name.toString());
});

casper.run(function() {
    this.echo("Testing menus and tabs");
    this.exit();
});