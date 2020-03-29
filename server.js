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
  //   next: 'X',
  //   users: [{ws: {...}, mark: 'X'}]
  //   board: ...
  // },
  // {
  //   number: '777',
  //   next: 'O',
  //   users: [{ws: {...}, mark: 'X'}, {ws: {}, mark: 'O'}]
  //   board: ...
  // }
];

wss.on('connection', (ws) => {
  ws.on('message', (action) => {

    action = JSON.parse(action);
    //console.log(action.type);

    if (action.type === 'connection') {
      connect(ws, action.roomNumber);
    } else if (action.type === 'move')  {
      let room = roomExists(rooms, action.roomNumber);
      let user = room.users.filter(u => u.ws === ws)[0];

      // change rooms array
      if (!winner(room.board)) {
	if (room.users.length === 2) {
	  if (room.next === user.mark) {
	    if (room.board[action.square] === null) {
	      room.updateBoard(action.square, user.mark);
	      room.update({next: room.next === 'X' ? 'O' : 'X',
			   winner: winner(room.board)});
	      room.users.forEach(u => {
		u.ws.send(JSON.stringify({
		  type: 'update',
		  room: room.hideWs()
		}));
	      });
	    }
	  }
	}
      }
    } else if (action.type === 'newGame') {
      let room = roomExists(rooms, action.roomNumber);

      room.update({board: new Array(9).fill(null)});

      room.users.forEach((u) => {
	u.ws.send(JSON.stringify({
	  type: 'resetBoard',
	  room: room.hideWs()
	}));
      });

    } else {
      console.log('? 1');
    }
  });

  ws.on('close', (e) => {
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].users.length === 1) {
	if (rooms[i].users[0].ws === ws) {
	  rooms.splice(i, 1);
	}
      } else if (rooms[i].users.length === 2) {
	if (rooms[i].users[0].ws === ws)
	  rooms[i].users.shift();
	else if (rooms[i].users[1].ws === ws)
	  rooms[i].users.pop();

	rooms[i].update({board: new Array(9).fill(null)});
	rooms[i].users[0].ws.send(JSON.stringify({
	  type: 'userLeft',
	  room: rooms[i]
	}));
      }
    }
  });
});

function connect(ws, roomNumber) {
  if (! /^\d+$/.exec(roomNumber)) {//check whether input is a number
    ws.send(JSON.stringify({
      type: 'room number error'
    }));
    return;
  }

  let room = roomExists(rooms, roomNumber);

  if (!room) {
    room = new Room( roomNumber,
		     [{ws: ws, mark: 'X'}],
		     new Array(9).fill(null),
		     'X',
		     null );
    rooms.push(room);
    ws.send(JSON.stringify({
      type: 'create room',
      room: room.hideWs()
    }));
  } else {
    if (room.users.length === 1) {
      room.update({users: [room.users[0], {ws: ws, mark: room.users[0].mark === 'X' ? 'O' : 'X'}]});
      room.users[0].ws.send(JSON.stringify({ //an opponent is joining the client's room
	type: 'second user access',
	room: room.hideWs()
      }));

      room.users[1].ws.send(JSON.stringify( //client is joining an opponent's room
	{
	  type: 'join existing room',
	  room: room.hideWs()
	}
      ));
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

class Room {
  constructor(number, users, board, next, winner) {
    this.number = number;
    this.users = users;
    this.board = board;
    this.next = next;
    this.winner = winner;
  }
  update(config) {
    return Object.assign(this, config);
  }
  updateBoard(cell, value) {
    let board = this.board.slice();
    board[cell] = value;
    return this.update({board: board});
  }
  hideWs () { // create copy of room without ws data
    return new Room( this.number,
		     this.users
		     ?
		     this.users.length === 1
		     ?
		     [ {ws: 'hidden', mark: this.users[0].mark}]
		     :
		     [
		       {ws: 'hidden', mark: this.users[0].mark},
		       {ws: 'hidden', mark: this.users[1].mark}
		     ]
		     : this.users,
		     this.board,
		     this.next,
		     this.winner
		   );
  }
}

// TODO: handle winner in the client side?
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

