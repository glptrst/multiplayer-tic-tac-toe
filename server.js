const http = require('http');
const fs = require('fs');

var WebSocketServer = require('websocket').server;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile('./public/index.html', (err, page) => {
      if (err) {
	res.writeHead(404);
	res.end(JSON.stringify(err));
	return;
      }
      res.writeHead(200);
      res.end(page);
    });
  } else if(req.url === '/style.css') {
    fs.readFile('./public/style.css', (err, style) => {
      if (err) {
	res.writeHead(404);
	res.end(JSON.stringify(err));
	return;
      }
      res.writeHead(200, {
	'Content-Type': 'text/css'
      });
      res.end(style);
    });        
  } else {
    res.writeHead(404);
    res.end('Nothing here\n');
  }
});

server.listen(9898);

const wsServer = new WebSocketServer({
  httpServer: server
});

wsServer.on('request', function(request) {
  const connection = request.accept(null, request.origin);
  console.log('A client has connected');
  connection.on('message', function(message) {
    console.log('Received Message:', message.utf8Data);
    //connection.sendUTF('Hi this is WebSocket server!');
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Client has disconnected.');
  });
});

const board = Array(9).fill(null);


