'use strict';
const http = require('http');
const fs = require('fs');

const WebSocket = require('ws');

/*             */
/* HTTP SERVER */
/*             */
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
	'Content-Type': 'text/javscript'
      });
      res.end(script);
    });
  } else if (req.url === '/style.css') {
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

server.listen(process.env.PORT || 9898);

/*                  */
/* WEBSOCKET SERVER */
/*                  */
const wss = new WebSocket.Server({ server });

let rooms = [
  // {
  //   number: '666',
  //   users: [{ws: {...}, mark: 'X'}]
  // },
  // {
  //   number: '777',
  //   users: [{ws: {...}, mark: 'X'}, {ws: {}, mark: 'O'}]
  // }
];

wss.on('connection', (ws) => {
  ws.on('message', (action) => {

    action = JSON.parse(action);

    if (action.type === 'joinRoom') {
      joinRoom(ws, action.roomNumber);
    } else if (action.type === 'move')  {
      let r = rooms.slice();
      let room = roomExists(r, action.roomNumber);
      let user = room.users.filter(u => u.ws === ws)[0];

      // change rooms array
      if (!winner(room.board)) {
	if (room.users.length === 2) {
	  if (room.next === user.mark) {
	    if (room.board[action.square] === null) {
	      room.board[action.square] = user.mark;
	      room.next = room.next === 'X' ? 'O' : 'X';
	      rooms = r;
	      room.users.forEach(u => {
		u.ws.send(JSON.stringify({
		  type: 'update',
		  board: room.board,
		  status: winner(room.board) ? `${winner(room.board).mark} won` : `${room.next}'s turn`,
		  winner: winner(room.board)
		}));
	      });
	    }
	  }
	}
      }
    } else if (action.type === 'newGame') {
      let r = rooms.slice();
      let room = roomExists(r, action.roomNumber);

      room.board = new Array(9).fill(null);
      room.status = room.status = `${room.next}'s turn`;

      room.users.forEach((u) => {
	u.ws.send(JSON.stringify({
	  type: 'resetBoard',
	  board: room.board,
	  status: room.status
	}));
      });

      rooms = r;

    } else {
      console.log('? 1');
    }
  });

  ws.on('close', (e) => {
    let r = rooms.slice();
    for (let i = 0; i < r.length; i++) {
      if (r[i].users.length === 1) {
	if (r[i].users[0].ws === ws) {
	  r.splice(i, 1);
	  rooms = r;
	}
      } else if (r[i].users.length === 2) {
	if (r[i].users[0].ws === ws)
	  r[i].users.shift();
	else if (r[i].users[1].ws === ws)
	  r[i].users.pop();

	r[i].board = new Array(9).fill(null);
	r[i].status = 'Opponent left. Waiting for opponent.';
	rooms = r;
	r[i].users[0].ws.send(JSON.stringify({
	  type: 'update',
	  board: r[i].board,
	  status: r[i].status
	}));
      }
    }
  });
});

function joinRoom(ws, roomNumber) {
  if (! /^\d+$/.exec(roomNumber) ) {
    ws.send(JSON.stringify({
      type: 'room number error'
    }));
    return;
  }

  let r = rooms.slice();
  let room = roomExists(r, roomNumber);
  if (!room) {
    r.push({
      number: roomNumber,
      users: [{ws: ws, mark: 'X'}],
      board: new Array(9).fill(null),
      next: 'X',
      status: 'Waiting for other player'
    });
    rooms = r;
    ws.send(JSON.stringify({
      type: 'update',
      board: new Array(9).fill(null),
      status: 'Waiting for other player',
      room: roomNumber,
      mark: 'X'
    }));
  } else {
    if (room.users.length === 1) {
      room.users.push({ws: ws, mark: room.users[0].mark === 'X' ? 'O' : 'X'});
      room.status = `${room.next}'s turn`;
      rooms = r;

      room.users[0].ws.send(JSON.stringify({
	type: 'update',
	board: new Array(9).fill(null),
	status: `${room.next}'s turn`
      }));
      room.users[1].ws.send(JSON.stringify({
	type: 'update',
	board: new Array(9).fill(null),
	status: `${room.next}'s turn`,
	room: roomNumber,
	mark: room.users[0].mark === 'X' ? 'O' : 'X'
      }));
    } else {
      ws.send(JSON.stringify({
	type: 'room full'
      }));
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
      return {mark: board[a], positions: lines[i]};
    }
  }
  return null;
}
