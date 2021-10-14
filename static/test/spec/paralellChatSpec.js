var casper = require('casper').create();
var yeray = "Yeray";
var laura = "Laura";
var carlos = "Carlos";
var teamName = "MyTestTeam";
var yeraysAccount = "http://localhost:5000/" + teamName + "/" + yeray;
var laurasAccount = "http://localhost:5000/" + teamName + "/" + laura;
var carlosAccount = "http://localhost:5000/" + teamName + "/" + carlos;
var deleteYeraysAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + yeray;
var deleteLaurasAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + laura;
var deleteCarlosAccount = "http://localhost:5000/test/integration/delete/" + teamName + "/" + carlos;

var msg = "Hello guys!";
var otherMessage = "How you doing Laura?";
var chatTopic = "Christmas party";

casper.start(yeraysAccount);

casper.thenEvaluate(function Yeray_starts_a_new_chat_with_Laura_and_Carlos(){
    xplive.App.chatService.sendMessage(msg).
    		to(laura, carlos).onTopic(chatTopic);
});

casper.thenEvaluate(function Yeray_also_starts_a_private_conversation_with_Laura(){
    xplive.App.chatService.sendMessage(otherMessage).to(laura);
});

casper.thenOpen(laurasAccount);

casper.thenEvaluate(function Laura_sees_both_messages_from_Yeray(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(msg), 
								arguments.callee.name.toString());
	    this.test.assertTrue(messages.from(yeray).contain(otherMessage), 
								arguments.callee.name.toString());
	});	
});

casper.thenOpen(carlosAccount);

casper.thenEvaluate(function Carlos_sees_the_group_chat_message_from_Yeray(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(msg), 
								arguments.callee.name.toString());
	    this.test.assertFalse(messages.from(yeray).contain(otherMessage), 
								arguments.callee.name.toString());
	});	
});


casper.thenOpen(deleteYeraysAccount);
casper.thenOpen(deleteLaurasAccount);
casper.thenOpen(deleteCarlosAccount);

casper.run(function() {
    this.exit();
});