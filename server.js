const http = require('http');
const fs = require('fs');

const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  switch (req.url) {

  case '/':
    fs.readFile('./public/index.html', (err, page) => {
      if (err) {
	res.writeHead(404);
	res.end(JSON.stringify(err));
	return;
      }
      res.writeHead(200);
      res.end(page);
    });
    break;

  case '/tictactoe.js':
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
    break;

  case '/style.css':
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
    break;

  default:
    res.writeHead(404);
    res.end('Nothing here\n');
  }
});

server.listen(process.env.PORT || 9898);

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
      joinRoom(action.username, action.roomNumber, ws);
      //console.log(rooms);
      break;

    case 'move':
      let r = rooms.slice();
      let room = roomExists(r, action.roomNumber);
      let user = room.users.filter(u => u.ws === ws)[0];

      // change rooms array
      if (!winner(room.board)) {
	if (room.users.length === 2) {
	  console.log('length === 2');
	  if (room.next === user.mark) {
	    console.log('room.next === user.mark');
	    if (room.board[action.square] === null) {
	      console.log('square != null');
	      room.board[action.square] = user.mark;
	      room.next = room.next === 'X' ? 'O' : 'X';
	    }
	  }
	}
      }
      rooms = r;

      // send clients updated board
      room.users.forEach(u => {
	u.ws.send(JSON.stringify({
	  type: 'update',
	  board: room.board,
	  status: winner(room.board) ? `${winner(room.board)} won` : `${room.next}'s turn`
	}));
      });
      break;

    default:
      console.log('? 1');
    }
  });

  ws.on('close', (e) => {
    //console.log('Client has disconnected');
    let r = rooms.slice();
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].users.length === 1) {
	if (rooms[i].users[0].ws === ws) {
	  console.log(`${rooms[i].users[0].username} abandoned`);
	  r.splice(i, 1);
	  rooms = r;
	}
      } else if (rooms[i].users.length === 2) {
	if (rooms[i].users[0].ws === ws) {
	  console.log(`${rooms[i].users[0].username} abandoned`);
	  r[i].users.shift();
	  rooms = r;
	}
	else if (rooms[i].users[1].ws === ws) {
	  console.log(`${rooms[i].users[1].username} abandoned`);
	  r[i].users.pop();
	  rooms = r;
	}
      }
    }
    console.log(rooms);
  });
});

function joinRoom(username, roomNumber, ws) {
  if (!username || !roomNumber) {
    console.log('Missing information');
    return;
  }
  let r = rooms.slice();
  let room = roomExists(r, roomNumber);
  if (!room) {
    r.push({
      number: roomNumber,
      users: [{ws: ws, username: username, mark: 'X'}],
      board: new Array(9).fill(null),
      next: 'X',
      status: 'Waiting for other player'
    });
    rooms = r;
    ws.send(JSON.stringify({
      type: 'update',
      board: new Array(9).fill(null),
      status: 'Waiting for other player'
    }));
  } else {
    if (room.users.length === 1) {
      room.users.push({ws: ws, username: username, mark: 'O'});
      room.status = `${room.next}'s turn`;
      rooms = r;

      room.users.forEach(u => {
	u.ws.send(JSON.stringify({
	  type: 'update',
	  board: new Array(9).fill(null),
	  status: `${room.next}'s turn`
	}));
      });
    } else {
      console.log('room is full');
    }
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

function winner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}
