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

    console.log(action.type);

    if (action.type === 'connection') {
      connect(ws, action.roomNumber);
    } else if (action.type === 'move')  {
      let r = rooms.slice();
      let room = roomExists(r, action.roomNumber);
      let user = room.users.filter(u => u.ws === ws)[0];

      // change rooms array
      if (!winner(room.board)) {
	if (room.users.length === 2) {
	  if (room.next === user.mark) {
	    if (room.board[action.square] === null) {
	      room.board[action.square] = user.mark; //TODO: change board using method object?
	      room.update({next: room.next === 'X' ? 'O' : 'X', winner: winner(room.board)});
	      rooms = r; 
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
      let r = rooms.slice();
      let room = roomExists(r, action.roomNumber);

      room.board = new Array(9).fill(null);
      //room.status = `${room.next}'s turn`;

      room.users.forEach((u) => {
	u.ws.send(JSON.stringify({
	  type: 'resetBoard',
	  board: room.board,
	  //status: room.status
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
	//r[i].status = 'Opponent left. Waiting for opponent.';
	//TODO: communicate to client that opponent left without using the status
	r[i].opponentLeft = true;
	rooms = r;
	r[i].users[0].ws.send(JSON.stringify({
	  type: 'update',
	  board: r[i].board,
	  //status: r[i].status
	  opponentLeft: r[i].opponentLeft
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

  let r = rooms.slice();
  let room = roomExists(r, roomNumber);

  if (!room) {
    room = new Room( roomNumber,
		     [{ws: ws, mark: 'X'}],
		     new Array(9).fill(null),
		     'X' );
    r.push(room);
    rooms = r;
    ws.send(JSON.stringify({
      type: 'create room',
      room: room.hideWs()
    }));
  } else {
    if (room.users.length === 1) {
      room.update({users: [room.users[0], {ws: ws, mark: room.users[0].mark === 'X' ? 'O' : 'X'}]});
      rooms = r;
      room.users[0].ws.send(JSON.stringify({ //an opponent is joining the client's room
	type: 'second user access',
	room: room
      }));

      room = new Room(room.number, room.users, room.board, room.next);
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
  constructor(number, users, board, next) {
    this.number = number;
    this.users = users;
    this.board = board;
    this.next = next;
    this.winner = null;
  }
  update(config) {
    return Object.assign(this, config);
  }
  hideWs () { // create copy of room without ws data
    return new Room(this.number,
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
		    this.board, this.next);
  }
}
