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
      //console.log(e.data);
      let action = JSON.parse(e.data);

      console.log(action.type);

      if (action.type === 'create room') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

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

      } else if (action.type === 'second user access') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

	document.getElementById('status').textContent = '';
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

      } else if (action.type === 'join existing room') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

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

      } else if (action.type === 'update') {

	console.log(action.room);

	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

	document.getElementById('status').textContent = '';
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

	if (winner(action.room.board)) {
	  console.log('winner');
	  winner(action.room.board).positions.forEach((p) => {
	    document.getElementById(p).style.color =
	      winner(action.room.board).mark === mark ? 'green' : 'red';
	  });

	  document.getElementById('status').textContent = '';
	  let status = winner(action.room.board).mark === mark ?
	      document.createTextNode(`${"You won!"}`) :
	      document.createTextNode(`${"You lost!"}`);

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

	if (draw(action.room.board)) {
	  console.log('draw');
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
      } else if (action.type === 'resetBoard') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

	document.getElementById('status').textContent = '';
	let status = action.room.next === mark ?
	    document.createTextNode("New game! It's your turn!"):
	    document.createTextNode("New game! It's your opponent's turn");
	document.getElementById('status').appendChild((status));
      } else if (action.type === 'room number error') {
	document.querySelector('.modal-bg').style.display = '';//display modal window again
	document.getElementById('error-message').textContent = 'Please, insert a number';
      } else if (action.type === 'room full') {
	document.querySelector('.modal-bg').style.display = '';
	document.getElementById('error-message').textContent = 'Room full, try another number.';
      } else if (action.type === 'userLeft') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));

	document.getElementById('status').textContent = '';
	let status = document.createTextNode('Opponent left. Waiting for opponent.');
	document.getElementById('status').appendChild((status));
      }
    };

    function renderBoard(moves) {
      console.log(moves);
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
	      square: cell.id,
	      roomNumber: roomNumber,
	    }));
	  });
	  row.appendChild(cell);
	}
	board.appendChild(row);
      }
      return board;
    }

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

    function draw(board) {
      let emptyCells = board.filter((c) => {
	if (!c)
	  return true;
	else
	  return false;
      });

      if (emptyCells.length === 0)
	return true;
      else
	return false;
    }
  }

})();
