const ws = new WebSocket('ws://localhost:9898/');
ws.onopen = function() {
  console.log('WebSocket Client Connected');
  // ws.send('Hi this is web client.');
};
ws.onmessage = function(e) {
  //console.log(e.data);
};

// let buttons = document.getElementsByTagName('button');
// for (let i = 0; i < buttons.length; i++) {
//   buttons[i].addEventListener('click', () => {
//     ws.send(JSON.stringify({clicked: buttons[i].id}));
//   });
// }

let moves = [null, null, 'X',
	     null, null, null,
	     'O', null, null];

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
      let squareContent = document.createTextNode(moves[squares+rows*3] ? moves[squares+rows*3] : '');
      square.appendChild(squareContent);
      row.appendChild(square);
    }
    board.appendChild(row);
  }
  return board;
}

document.getElementById('root').appendChild(renderBoard(moves));
