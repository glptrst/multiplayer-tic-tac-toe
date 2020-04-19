'use strict';

(() => {

  let mark;
  let roomNumber;

  document.getElementById('roomButton').addEventListener('click', () => {
    document.querySelector('.modal-bg').style.display = 'none';
    roomNumber = document.getElementsByTagName('input')[0].value;
    startApp(roomNumber);
  });
  document.getElementsByClassName("modal-bg")[0].addEventListener("keyup", (event) => {
    event.preventDefault();
    if (event.keyCode === 13) {
      document.querySelector('.modal-bg').style.display = 'none';
      roomNumber = document.getElementsByTagName('input')[0].value;
      startApp(roomNumber);
    }
  });

  function startApp(roomNumber) {
    const HOST = location.origin.replace(/^http/, 'ws');
    const ws = new WebSocket(HOST);

    ws.onopen = function() {
      console.log('WebSocket Client Connected');
      ws.send(JSON.stringify({
	type: 'connection',
	roomNumber: roomNumber,
      }));
    };
    ws.onmessage = function(e) {
      let action = JSON.parse(e.data);

      switch (action.type) {
      case 'create room': {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = document.createTextNode('Waiting for opponent');
	document.getElementById('status').appendChild((status));

	document.getElementById('room').textContent = '';
	let roomText = document.createTextNode(`ROOM ${action.room.number}`);
	document.getElementById('room').appendChild((roomText));

	mark = 'X';
	document.getElementById('mark').textContent = '';
	let markText = document.createTextNode(`Your mark is ${mark}`);
	document.getElementById('mark').appendChild((markText));
	break;
      }
      case 'second user access': {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));
	break;
      }
      case 'join existing room': {
	mark = action.room.users[0].mark === 'X' ? 'O' : 'X';
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

	document.getElementById('room').textContent = '';
	let roomText = document.createTextNode(`ROOM ${action.room.number}`);
	document.getElementById('room').appendChild((roomText));	
	
	mark = action.room.users[0].mark === 'X' ? 'O' : 'X';
	document.getElementById('mark').textContent = '';
	let markText = document.createTextNode(`Your mark is ${mark}`);
	document.getElementById('mark').appendChild((markText));
	break;
      }
      case 'update': {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

	if (functions.winner(action.room.board.cells)) {
	  functions.winner(action.room.board.cells).positions.forEach((p) => {
	    document.getElementById(p).style.color =
	      functions.winner(action.room.board.cells).mark === mark ? 'green' : 'red';
	  });

	  document.getElementById('status').textContent = '';
	  let status = functions.winner(action.room.board.cells).mark === mark ?
	      document.createTextNode(`${"You won! "}`) :
	      document.createTextNode(`${"You lost! "}`);

	  let link = document.createElement('span');
	  let linkTxt = document.createTextNode('Click here to start a new game');
	  link.style.cursor = 'pointer';
	  link.appendChild(linkTxt);
	  link.addEventListener('click', () => {
	    ws.send(JSON.stringify({
	      type: 'newGame',
	      roomNumber: roomNumber,
	    }));
	  });
	  document.getElementById('status').appendChild((status));
	  document.getElementById('status').appendChild((link));
	}

	if (functions.draw(action.room.board.cells)) {
	  document.getElementById('status').textContent = '';
	  let status = document.createTextNode("It's a draw!");
	  let link = document.createElement('span');
	  let linkTxt = document.createTextNode('Click here to start a new game');
	  link.appendChild(linkTxt);
	  link.addEventListener('click', () => {
	    ws.send(JSON.stringify({
	      type: 'newGame',
	      roomNumber: roomNumber,
	    }));
	  });
	  document.getElementById('status').appendChild((status));
	  document.getElementById('status').appendChild((link));
	}
	break;
      }
      case 'resetBoard': {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = action.room.next === mark ?
	    document.createTextNode("New game! It's your turn!"):
	    document.createTextNode("New game! It's your opponent's turn");
	document.getElementById('status').appendChild((status));
	break;
      }
      case 'room number error': {
	document.querySelector('.modal-bg').style.display = '';//display modal window again
	document.getElementById('error-message').textContent = 'Please, insert a number';
	break;
      }
      case 'room full': {
	document.querySelector('.modal-bg').style.display = '';
	document.getElementById('error-message').textContent = 'Room full, try another number.';
	break;
      }
      case 'userLeft': {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board.cells));

	document.getElementById('status').textContent = '';
	let status = document.createTextNode('Opponent left. Waiting for opponent.');
	document.getElementById('status').appendChild((status));
	break;
      }
      default: {
	console.log(`action not known: ${action.type}`);
      }}
    };

    function renderBoard(moves) {
      let board = document.createElement('table');
      for (let rows = 0; rows < 3; rows++) {
	let row = document.createElement('tr');
	row.className= 'row';
	for (let cells = 0; cells < 3; cells++) {
	  let cell = document.createElement('td');
	  cell.className = 'square';
	  cell.id = cells+rows*3;
	  let cellContent = document.createTextNode(moves[cells+rows*3] ? moves[cells+rows*3] : '');
	  cell.appendChild(cellContent);
	  cell.addEventListener('click', () => {
	      ws.send(JSON.stringify({
		type: 'move',
		cell: cell.id,
		roomNumber: roomNumber,
	      }));
	  });
	  row.appendChild(cell);
	}
	board.appendChild(row);
      }
      return board;
    }
  }
})();
