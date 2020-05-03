'use strict';
const functions = require('./public/modules/functions.js');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  switch (req.url) {
  case '/': {
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
  }
  case '/tictactoe.js': {
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
    break;
  }
  case '/modules/functions.js': {
    fs.readFile('./public/modules/functions.js', (err, script) => {
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
    break;
  }
  case '/style.css': {
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
  }
  default: {
    res.writeHead(404);
    res.end('Nothing here\n');
  }}
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

  ws.on('message', (req) => {
    try {
      req = JSON.parse(req);
    } catch(e) {
      console.log(e);
      return;
    }

    switch (req.type) {
    case 'connection': {
      connect(ws, req.roomNumber);
      break;
    }
    case 'move':  {
      let room = roomExists(rooms, req.roomNumber);
      makeMove(ws, room, req.cell);
      break;
    }
    case 'newGame': {
      let room = roomExists(rooms, req.roomNumber);
      startNewGame(room);
      break;
    }
    default: {
      console.log('? 1');
    }}
  });

  ws.on('close', (e) => {
    disconnectUser(ws);
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
		     Board.empty(),
		     'X',
		     null );
    rooms.push(room);
    ws.send(JSON.stringify({
      type: 'create room',
      room: room.hideWs()
    }));
  } else {
    if (room.users.length === 1) {
      let updatedRoom = room.update({users: [room.users[0], {ws: ws, mark: room.users[0].mark === 'X' ? 'O' : 'X'}]});

      rooms = rooms.filter((r) => r.number !== room.number);
      room = updatedRoom;
      rooms.push(room);
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

function makeMove(ws, room, cell) {
  let user;
  try {
    user = room.users.filter(u => u.ws === ws)[0];
  } catch(e) {
    console.log(e);
  }
  if (room && room.users.length === 2 && room.board.cells[cell] === null &&
      room.next === user.mark &&
      !functions.draw(room.board.cells) && !functions.winner(room.board.cells)) {
    let updatedRoom = room.update({next: room.next === 'X' ? 'O' : 'X',
				   board: room.board.update(cell, user.mark)});
    rooms = rooms.filter((r) => r.number !== room.number);
    room = updatedRoom;
    rooms.push(room);
    room.users.forEach(u => {
      u.ws.send(JSON.stringify({
      	type: 'update',
      	room: room.hideWs()
      }));
    });
  }
}

function startNewGame(room) {
  let updatedRoom = room.update({board: Board.empty()});
  rooms = rooms.filter((r) => r.number !== room.number);
  room = updatedRoom;
  rooms.push(room);

  room.users.forEach((u) => {
    u.ws.send(JSON.stringify({
      type: 'resetBoard',
      room: room.hideWs()
    }));
  });
}

function disconnectUser(ws) {
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].users.length === 1) {
      if (rooms[i].users[0].ws === ws) {
	rooms.splice(i, 1);
      }
    } else {
      rooms[i] = rooms[i].update({
	users: rooms[i].users.filter((u) => !(u.ws === ws))
      });

      rooms[i] = rooms[i].update({board: Board.empty()});
      rooms[i].users[0].ws.send(JSON.stringify({
	type: 'userLeft',
	room: rooms[i].hideWs()
      }));
    }
  }
}

function roomExists(rooms, number) {
  return rooms.filter((room) => {
    return room.number === number;
  })[0];
};

class Room {
  constructor(number, users, board, next) {
    this.number = number;
    this.users = users;
    this.board = board;
    this.next = next;
  }
  update(config) {
    return Object.assign(new Room(), this, config);
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
		   );
  }
}

class Board {
  constructor(cells) {
    this.cells = cells;
  }
  static empty() {
    return new Board(new Array(9).fill(null));
  }
  update(cell, value) {
    let cells = this.cells.slice();
    cells[cell] = value;
    return new Board(cells);
  }
}
