var app = require('express')()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

server.listen(process.env.PORT || 5000);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
	socket.on('sendMessage', function (msg) {
		io.sockets.emit('receivedMessage' + msg.receiver, msg);
	});

	socket.on('sendTeamMessage', function (msg) {
		io.sockets.emit('receivedTeamMessage' + msg.team, msg);
	});

	socket.on('confirmReception', function(msg){
		io.sockets.emit('confirmationReceived' + msg.confirmTo, msg);
	});
});
