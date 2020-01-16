'use strict';
let roomNumber = window.prompt('Choose room number:');

const HOST = location.origin.replace(/^http/, 'ws');
const ws = new WebSocket(HOST);

ws.onopen = function() {
  console.log('WebSocket Client Connected');
  ws.send(JSON.stringify({
    type: 'joinRoom',
    roomNumber: roomNumber,
  }));
};
ws.onmessage = function(e) {
  //console.log(e.data);
  let action = JSON.parse(e.data);

  if (action.type === 'update') {
    document.getElementById('board').textContent = '';
    document.getElementById('board').appendChild(renderBoard(action.board));
    let buttons = document.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', () => {
	ws.send(JSON.stringify({
	  type: 'move',
	  square: buttons[i].id,
	  roomNumber: roomNumber,
	}));
      });
    }

    document.getElementById('status').textContent = '';
    let status = document.createTextNode(`Status of the game: ${action.status}`);
    document.getElementById('status').appendChild((status));

    if (action.room) {
      document.getElementById('room').textContent = '';
      let roomText = document.createTextNode(`You are in room ${action.room}`);
      document.getElementById('room').appendChild((roomText));
    }
    if (action.mark) {
      document.getElementById('mark').textContent = '';
      let markText = document.createTextNode(`Your mark is ${action.mark}`);
      document.getElementById('mark').appendChild((markText));
    }
    if (action.newGame) {
      document.getElementById('status').textContent = '';
      let status = document.createTextNode(`Status of the game: ${action.status}. `);
      let link = document.createElement('span');
      let linkTxt = document.createTextNode('Click here to start a new game');
      link.appendChild(linkTxt);
      document.getElementById('status').addEventListener('click', () => {
	ws.send(JSON.stringify({
	  type: 'newGame',
	  roomNumber: roomNumber,
	}));
      });
      document.getElementById('status').appendChild((status));
      document.getElementById('status').appendChild((link));
    }
  } else if ('resetBoard') {
    document.getElementById('board').textContent = '';
    document.getElementById('board').appendChild(renderBoard(action.board));
    let buttons = document.getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', () => {
	ws.send(JSON.stringify({
	  type: 'move',
	  square: buttons[i].id,
	  roomNumber: roomNumber,
	}));
      });
    }

    document.getElementById('status').textContent = '';
    let status = document.createTextNode(`New Game started! ${action.status}`);
    document.getElementById('status').appendChild((status));
  } else if (action.type === 'room number error') {
    roomNumber = window.prompt('You must insert a number:');
    ws.send(JSON.stringify({
      type: 'joinRoom',
      roomNumber: roomNumber,
    }));
  } else if (action.type === 'room full') {
    roomNumber = window.prompt('Room full, try another number:');
    ws.send(JSON.stringify({
      type: 'joinRoom',
      roomNumber: roomNumber,
    }));
  }
};

let moves = [null, null, null,
	     null, null, null,
	     null, null, null];

function renderBoard(moves) {
  let board = document.createElement('div');
  for (let rows = 0; rows < 3; rows++) {
    let row = document.createElement('div');
    row.className = 'row';
    for (let squares = 0; squares < 3; squares++) {
      let square = document.createElement('button');
      square.className = 'square';
      square.id = squares+rows*3;
      let squareContent = document.createTextNode(moves[squares+rows*3] ? moves[squares+rows*3] : '');
      square.appendChild(squareContent);
      row.appendChild(square);
    }
    board.appendChild(row);
  }
  return board;
}
