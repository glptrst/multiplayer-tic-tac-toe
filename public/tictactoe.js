'use strict';

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
      if (action.winner) {
	action.winner.positions.forEach((p) => {
	  document.getElementById(p).style.color = 'red';
	});

	document.getElementById('status').textContent = '';
	let status = document.createTextNode(`Status of the game: ${action.status}. `);
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
      document.getElementById('board').appendChild(renderBoard(action.board));
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
      let status = document.createTextNode(`New Game started! ${action.status}`);
      document.getElementById('status').appendChild((status));
    } else if (action.type === 'room number error') {
      document.querySelector('.modal-bg').style.display = '';
      document.getElementById('error-message').textContent = 'Please, insert a number';
    } else if (action.type === 'room full') {
      document.querySelector('.modal-bg').style.display = '';
      document.getElementById('error-message').textContent = 'Room full, try another number.';
    }
  };

  let moves = [null, null, null,
	       null, null, null,
	       null, null, null];
}

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
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
  return board;
}
