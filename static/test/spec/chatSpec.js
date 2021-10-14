var casper = require('casper');
var casperForYeray = casper.create();
var casperForLaura = casper.create();
var yeray = "Yeray";
var laura = "Laura";
var superTeam = "MyTestTeam";
var yeraysAccount = "http://localhost:5000/" + superTeam + "/" + yeray;
var laurasAccount = "http://localhost:5000/" + superTeam + "/" + laura;
var deleteYeraysAccount = "http://localhost:5000/test/integration/delete/" + superTeam + "/" + yeray;
var deleteLaurasAccount = "http://localhost:5000/test/integration/delete/" + superTeam + "/" + laura;
var casperForYerayDone = false, casperForLauraDone = false;
var msg = "Hello Laura!";

casperForLaura.start(laurasAccount);
casperForYeray.start(yeraysAccount);

casperForYeray.then(function message_is_not_present_in_screen(){
    this.test.assertTextDoesntExist(msg);
});

casperForYeray.thenEvaluate(function Yeray_starts_a_new_chat_with_my_Laura(msg, laura){
    xplive.App.teamCommunicator.sendMessage(msg).to(laura);
}, {msg: msg, laura: laura});

casperForYeray.then(function message_is_present_in_Yerays_screen(){
    this.test.assertTextExists(msg, arguments.callee.name.toString());
});

casperForLaura.wait(2000, function(){});
casperForLaura.then(function the_message_is_received(){
    //this.echo(this.getHTML());
    this.test.assertTextExists(msg,
        arguments.callee.name.toString());
});

casperForYeray.wait(2000, function(){});

casperForLaura.thenOpen(deleteYeraysAccount);
casperForYeray.thenOpen(deleteLaurasAccount);

casperForLaura.run(function() {
    this.echo('Laura is closing session');
    casperForLauraDone = true;
    if (casperForYerayDone)
        this.exit();
});

casperForYeray.run(function() {
    this.echo('Yeray is closing session');
    casperForYerayDone = true;
    if (casperForLauraDone)
        this.exit();
});
