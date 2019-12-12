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
  } else if (req.url === '/tictactoe.js') {
    fs.readFile('./public/tictactoe.js', (err, script) => {
      if (err) {
	res.writeHead(404);
	res.end(JSON.stringify(err));
	return;
      }
      res.writeHead(200, {
	'Content-Type': 'text/css'
      });
      res.end(script);
    });
  }  else if(req.url === '/style.css') {
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
  //connection.sendUTF('hi this is server.');

  connection.on('message', function(data) {
    //mesage in data.utf8Data;

    handleClientAction(data.utf8Data);

  });
  connection.on('close', function(reasonCode, description) {
    console.log('Client has disconnected.');
  });
});

let state = {
  rooms: []
};

//TODO
function handleClientAction(action) {
  if (action.type === 'joinRoom') {
    if ( state.rooms.filter(action.room)[0] ) { //if room already exists

    } else {

    }
  }
  // action = JSON.parse(action);
  // console.log(`received client action of type '${action.type}' for room ${action.room} from ${action.user}`);
}

//let board = Array(9).fill(null);
