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

let rooms = [
  {
    number: '666',
    users: [{ws: {}, username: 'peppino'}]
  },
  {
    number: '777',
    users: [{ws: {}, username: 'Gianni'}, {ws: {}, username: 'Bernardo'}]
  }
];

wss.on('connection', (ws) => {
  ws.on('message', (action) => {
    action = JSON.parse(action);
    switch (action.type) {
    case 'joinRoom':
      handleJoinRoomAction(action, ws);
      break;
    case 'exitRoom':
      break;
    default:
      console.log('?');
    }
  });

  ws.on('close', (e) => {
    console.log('Client has disconnected');
    let room;
    let username;

    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].users.length === 1) {
	if (rooms[i].users[0].ws === ws) {
	  console.log(`${rooms[i].users[0].username} abandoned`);
	} else if (rooms[i].users.length === 2) {
	  if (rooms[i].users[0].ws === ws)
	    console.log(`${rooms[i].users[0].username} abandoned`);
	  else if (rooms[i].users[1].ws === ws)
	    console.log(`${rooms[i].users[0].username} abandoned`);
	} else {
	  console.log('?');
	}
      }
    }
  });
});

function handleJoinRoomAction(action, ws) {
  let room = roomExists(rooms, action.room);
  if (room) {
    if (room.users.length === 1) {
      console.log('one user present');
      // room.users.push(action.user);
      // console.log(room);
    } else {
      console.log('room is full');
    }
  } else { // if room does not exist
    // room = {
    //   number: action.room,
    //   users : [action.user]
    // };
    // rooms.push(room);
    // console.log(rooms);

    // let client = clients.filter((c) => {
    //   return c === ws;
    // })[0];
    rooms.push({
      number: action.room,
      users: [{ws: ws, username: action.username}]
    });
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
