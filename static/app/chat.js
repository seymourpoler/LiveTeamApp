
xplive.Chat.ChatProxy = function(session){
	var socket;
	var self = this;
	this.connect = function(){
		socket = io.connect(xplive.Common.ChatServerAddress);
		socket.on('receivedMessage' + session.team + session.username,
			function(msg){
			self.onReceivedMessage(msg);
		});
		socket.on('receivedTeamMessage' + session.team, 
			function(msg){
			self.onWholeTeamMessage(msg);
		});
		socket.on('confirmationReceived' + session.team + session.username,
			function(msg){
				msg.receiver = msg.receiver.replace(session.team, "");
				self.onConfirmationReceived(msg);
		});
	};

	this.confirmReception = function(msg){
		msg.confirmTo = session.team + msg.sender;
		socket.emit('confirmReception', msg);
	};

	this.sendMessage = function(msg){
		msg.receiver = session.team + msg.receiver;
		socket.emit('sendMessage', msg);
	};

	this.sendMessageToTeam = function(msg){
		socket.emit('sendTeamMessage', msg);
	};

	this.onConfirmationReceived = function(msg){

	};

	this.onReceivedMessage = function(msg){
		
	};

	this.onWholeTeamMessage = function(msg){
		
	};
}