const ws = new WebSocket('ws://localhost:9898/');

let username = window.prompt('Your Name:');
let room = window.prompt('Room (a three digit number):');

ws.onopen = function() {
  console.log('WebSocket Client Connected');
  // ws.send('Hi this is web client.');
  ws.send(JSON.stringify({
    type: 'joinRoom',
    room: room,
    username: username
  }));
};
ws.onmessage = function(e) {
  //console.log(e.data);
};

let moves = [null, null, null,
	     null, null, null,
	     null, null, null];

document.getElementById('board').appendChild(renderBoard(moves));

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

let buttons = document.getElementsByTagName('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', () => {
    ws.send(JSON.stringify({
      type: 'move',
      square: buttons[i].id,
      user: username,
      room: room,
    }));
  });
}
