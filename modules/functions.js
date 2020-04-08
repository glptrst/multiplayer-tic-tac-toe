(function(exports){

  // If there is a winner, return obj with winner mark and positions.
  // Return null otherwise.
  const winner = function(board) {
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
  };

  // If it's a draw, return true, otherwise false.
  const draw = function(board) {
    if (winner(board))
      return false;

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
  };

  exports.winner = winner;
  exports.draw = draw;

}(typeof exports === 'undefined' ? this.functions = {} : exports));
