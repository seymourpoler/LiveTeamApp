var casper = require('casper').create();
var yeray = "Yeray";
var laura = "Laura";
var carlos = "Carlos";
var dani = "Daniel";
var teamName = "MyTestTeam";
var yeraysAccount = "http://localhost:5000/" + teamName + "/" + yeray;
var laurasAccount = "http://localhost:5000/" + teamName + "/" + laura;
var carlosAccount = "http://localhost:5000/" + teamName + "/" + carlos;
var danisAccount = "http://localhost:5000/" + teamName + "/" + dani;
var deleteYeraysAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + yeray;
var deleteLaurasAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + laura;
var deleteCarlosAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + carlos;
var deleteDanisAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + dani;

var msg = "Hello guys!";
var otherMessage = "how are you?";
var chatTopic = "Sprint demo";

casper.start(yeraysAccount);

casper.thenEvaluate(function Yeray_starts_a_new_chat_with_Laura_and_Carlos(){
	xplive.App.chatService.sendMessage(msg).
			to(laura, carlos).onTopic(chatTopic);
});

casper.thenEvaluate(function and_he_remembers_that_Dani_should_be_in_the_chat(){
	var text = xplive.App.chatService.whatTheUserCanReadInTheScreen();

    xplive.App.chatService.sendMessage(otherMessage).to(
    	laura, carlos, dani).onTopic(chatTopic);
});

casper.thenOpen(danisAccount);

casper.thenEvaluate(function Dani_can_see_only_the_last_message_from_the_chat(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertFalse(messages.onTopic(chatTopic).contain(msg), 
								arguments.callee.name.toString());
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(otherMessage), 
								arguments.callee.name.toString());
	});	
});


casper.thenOpen(deleteYeraysAccount);
casper.thenOpen(deleteLaurasAccount);
casper.thenOpen(deleteCarlosAccount);
casper.thenOpen(deleteDanisAccount);

casper.run(function() {
    this.exit();
});