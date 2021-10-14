var casper = require('casper').create();
var superTeam = "MyTestTeam" + Math.random().toString();
var myUsername = "SomeUsername";
var myAccount = "http://localhost:5000/" + superTeam + "/" + myUsername;
var deleteAccount = "http://localhost:5000/test/integration/delete/" + superTeam + "/" + myUsername;

var help_text = "invite your colleagues";

casper.start(myAccount);

casper.then(function help_dialog_is_visible_for_first_time_login(){
    this.test.assertTextExist('Welcome');
    this.test.assertTextExist(help_text);
});

casper.thenOpen(myAccount); // reload the page

casper.then(function help_dialog_is_not_visible_for_second_login(){
    this.test.assertTextDoesntExist('Welcome');
    this.test.assertTextDoesntExist(help_text);
});

casper.thenOpen(deleteAccount);

casper.run(function() {
     this.exit();
});
