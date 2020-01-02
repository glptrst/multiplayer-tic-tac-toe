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
	console.log('click');
	ws.send(JSON.stringify({
	  type: 'move',
	  square: buttons[i].id,
	  roomNumber: roomNumber,
	}));
      });
    }

    document.getElementById('status').textContent = '';
    let status = document.createTextNode(action.status);
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

//document.getElementById('board').appendChild(renderBoard(moves));

function renderBoard(moves) {
  console.log('creating board');
  let board = document.createElement('div');
  for (let rows = 0; rows < 3; rows++) {
    console.log('creating row');
    let row = document.createElement('div');
    row.className = 'row';
    for (let squares = 0; squares < 3; squares++) {
      console.log('creating square');
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
