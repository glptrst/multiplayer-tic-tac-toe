'use strict';

(() => {

  let mark;
  let roomNumber;

  document.getElementById('roomButton').addEventListener('click', () => {
    document.querySelector('.modal-bg').style.display = 'none';
    roomNumber = document.getElementsByTagName('input')[0].value;
    startApp(roomNumber);
  });

  // click #roomButton when pressing the Return Key
  document.getElementsByClassName("modal-bg")[0].addEventListener("keyup", (event) => {
    event.preventDefault();
    if (event.keyCode === 13) {
      document.getElementById("roomButton").click();
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
	let buttons = document.getElementsByClassName('square');
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
	let buttons = document.getElementsByClassName('square');
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
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

      } else if (action.type === 'join existing room') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));
	let buttons = document.getElementsByClassName('square');
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
	let buttons = document.getElementsByClassName('square');
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
	let status = mark === action.room.next ?
	    document.createTextNode(`Your turn`) :
	    document.createTextNode(`Opponent's turn`);
	document.getElementById('status').appendChild((status));

	if (action.room.winner) {
	  console.log('winner');
	  action.room.winner.positions.forEach((p) => {
	    document.getElementById(p).style.color =
	      action.room.winner.mark === mark ? 'green' : 'red';
	  });

	  document.getElementById('status').textContent = '';
	  let status = action.room.winner.mark === mark ?
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
      } else if (action.type === 'resetBoard') {
	document.getElementById('board').textContent = '';
	document.getElementById('board').appendChild(renderBoard(action.room.board));
	let buttons = document.getElementsByClassName('square');
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
	let buttons = document.getElementsByClassName('square');
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
	let status = document.createTextNode('Opponent left. Waiting for opponent.');
	document.getElementById('status').appendChild((status));
      }
    };

    let moves = [null, null, null,
		 null, null, null,
		 null, null, null];
  }

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
	row.appendChild(cell);
      }
      board.appendChild(row);
    }
    return board;
  }

})();
