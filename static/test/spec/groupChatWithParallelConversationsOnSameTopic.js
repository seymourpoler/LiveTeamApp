var casper = require('casper').create();
var jesus = "Jesus";
var oscar = "Oscar";
var carlos = "Carlos";
var ivan = "Ivan";
var dani = "Dani";
var teamName = "MyTestTeam";
var jesusAccount = "http://localhost:5000/" + teamName + "/" + jesus;
var oscarsAccount = "http://localhost:5000/" + teamName + "/" + oscar;
var carlosAccount = "http://localhost:5000/" + teamName + "/" + carlos;
var ivansAccount = "http://localhost:5000/" + teamName + "/" + ivan;
var deleteJesusAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + jesus;
var deleteOscarsAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + oscar;
var deleteIvansAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + ivan;

var msg = "Hello guys!";
var otherMessage = "Whats the craic!";
var chatTopic = "Sprint meeting";

casper.start(jesusAccount);

casper.thenEvaluate(function Jesus_starts_a_new_chat_with_Oscar_and_Carlos(){
    xplive.App.chatService.sendMessage(msg).
    		to(oscar, carlos).onTopic(chatTopic);
});

casper.thenEvaluate(function Jesus_starts_another_chat_with_Ivan_and_Dani_about_the_same_topic(){
    xplive.App.chatService.sendMessage(otherMessage).
    		to(ivan, dani).onTopic(chatTopic);
});

casper.thenOpen(oscarsAccount);

casper.thenEvaluate(function Oscar_sees_only_one_message_from_Jesus(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(msg), 
								arguments.callee.name.toString());
	    this.test.assertFalse(messages.onTopic(chatTopic).contain(otherMessage), 
								arguments.callee.name.toString());
	});	
});

casper.thenOpen(ivansAccount);

casper.thenEvaluate(function Ivan_sees_only_one_message_from_Jesus(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(
	    	otherMessage), arguments.callee.name.toString());
	    this.test.assertFalse(messages.onTopic(chatTopic).contain(
	    	msg), arguments.callee.name.toString());
	});	
});


casper.thenOpen(deleteJesusAccount);
casper.thenOpen(deleteOscarsAccount);
casper.thenOpen(deleteIvansAccount);

casper.run(function() {
    this.exit();
});