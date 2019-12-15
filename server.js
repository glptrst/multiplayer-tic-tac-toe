const http = require('http');
const fs = require('fs');

var WebSocket = require('ws');

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

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (action) => {
    handleClientAction(JSON.parse(action));
  });

  ws.on('close', (e) => {
    console.log('Client has disconnected');
  });
});

let rooms = [{number: "666",
	      users: ['gennarino']
	     }];

//TODO
function handleClientAction(action) {
  if (action.type === 'joinRoom') {
    let room = roomExists(rooms, action.room);
    if (room) {
      if (room.users.length === 1) {
	room.users.push(action.user);
	console.log(room);
      } else {
	console.log('room is full');
      }
    } else {
      room = {
      	number: action.room,
      	users : [action.user]
      };
      rooms.push(room);
      console.log(rooms);
    }
  } else if (action.type === 'exitRoom') {
    
  }
}

function roomExists(rooms, number) {
  return rooms.filter((room) => {
    if (room.number === number)
      return true;
    else
      return false;
  })[0];
};
