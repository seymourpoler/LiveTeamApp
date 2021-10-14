var casper = require('casper').create();
var username = "Yeray";
var mate = "Laura";
var mate2 = "Carlos";
var teamName = "MyTestTeam";
var myHomePage = "http://localhost:5000/" + teamName + "/" + username;
var myMateHomePage = "http://localhost:5000/" + teamName + "/" + mate;
var myMate2HomePage = "http://localhost:5000/" + teamName + "/" + mate2;
var cleanUrl = "http://localhost:5000/test/integration/delete/" + teamName + "/" + username;
var cleanMateUrl = "http://localhost:5000/test/integration/delete/" + teamName + "/" + mate;
var cleanMate2Url = "http://localhost:5000/test/integration/delete/" + teamName + "/" + mate2;

var msg = "Hello guys!";
var chatTopic = "Bugfixes";

casper.start(myHomePage);

casper.thenEvaluate(function I_start_a_new_chat_with_my_two_mates(){
	var text = xplive.App.chatService.whatTheUserCanReadInTheScreen();
	expect(text).not.toContain(msg);

    xplive.App.chatService.sendTeamMessage(msg).onTopic(chatTopic);

	text = xplive.App.chatService.whatTheUserCanReadInTheScreen();
	expect(text).toContain(msg);    
});

casper.thenOpen(myMateHomePage);

casper.thenEvaluate(function My_mate_sees_the_message_I_have_just_sent_to_her(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.teamMessages();
	    this.test.assertTrue(messages.teamMessages.contain(msg), 
								arguments.callee.name.toString());
	});	
});

casper.thenOpen(myMate2HomePage);

casper.thenEvaluate(function My_mate_sees_the_message_I_have_just_sent_to_his(){
	this.wait(5000, function(){
	    var messages = xplive.App.chatService.readMessages();
	    this.test.assertTrue(messages.onTopic(chatTopic).contain(msg), 
								arguments.callee.name.toString());
	});	
});


casper.thenOpen(cleanUrl);
casper.thenOpen(cleanMateUrl);
casper.thenOpen(cleanMate2Url);

casper.run(function() {
    this.exit();
});