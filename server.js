const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let games = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('createGame', () => {
    const gameId = generateGameId();
    games[gameId] = {
        playerRed: null,
        playerYellow: null,
        board: Array(6).fill().map(() => Array(7).fill(' ')), // Initialize the board with empty strings
        currPlayer: 'R',
        gameOver: false,
        rows: 6,
        columns: 7,
        currColumns: [5, 5, 5, 5, 5, 5, 5]
      };
    socket.join(gameId);
    socket.gameId = gameId;
    socket.emit('gameCreated', gameId);
    console.log(`Game ${gameId} created`);
  });

  socket.on('joinGame', (gameId) => {
    if (games[gameId]) {
      const game = games[gameId];
      if (!game.playerRed) {
        game.playerRed = socket.id;
        socket.color = 'R';
      } else if (!game.playerYellow) {
        game.playerYellow = socket.id;
        socket.color = 'Y';
      } else {
        socket.emit('gameAlreadyFull');
        return;
      }
      socket.join(gameId);
      socket.gameId = gameId;
      io.to(gameId).emit('playerJoined', game);
      console.log(`Player ${socket.id} joined game ${gameId}`);
    } else {
      socket.emit('gameNotFound');
    }
  });

  socket.on('move', (r, c) => {
    const game = games[socket.gameId];
    if (game && !game.gameOver && (socket.id === game.playerRed || socket.id === game.playerYellow)) {
      const currPlayer = game.currPlayer === 'R' ? game.playerRed : game.playerYellow;
      if (socket.id === currPlayer) {
        const row = getNextEmptyRow(game.board, c);
        if (row !== -1) {
          game.board[row][c] = game.currPlayer;
          game.currColumns[c]--;
          const winner = checkWinner(game.board, row, c, game.rows, game.columns);
          if (winner) {
            game.gameOver = true;
            io.to(socket.gameId).emit('gameOver', winner);
          } else {
            game.currPlayer = game.currPlayer === 'R' ? 'Y' : 'R';
            io.to(socket.gameId).emit('move', row, c, game.currPlayer);
          }
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    const gameId = socket.gameId;
    if (gameId) {
      const game = games[gameId];
      if (game) {
        if (game.playerRed === socket.id) {
          game.playerRed = null;
        } else if (game.playerYellow === socket.id) {
          game.playerYellow = null;
        }
        if (!game.playerRed && !game.playerYellow) {
          delete games[gameId];
          console.log(`Game ${gameId} ended`);
        }
      }
    }
  });
});

function generateGameId() {
  return Math.random().toString(36).substr(2, 6);
}

function getNextEmptyRow(board, c) {
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r][c] === ' ') {
      return r;
    }
  }
  return -1;
}

function checkWinner(board, r, c, rows, columns) {
  const player = board[r][c];

  // Horizontal check
  let count = 0;
  for (let i = 0; i < columns; i++) {
    if (board[r][i] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
  }

  // Vertical check
  count = 0;
  for (let i = 0; i < rows; i++) {
    if (board[i][c] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
  }

  // Diagonal check (top-left to bottom-right)
  count = 0;
  let i = r, j = c;
  while (i >= 0 && j >= 0) {
    if (board[i][j] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
    i--;
    j--;
  }
  i = r + 1;
  j = c + 1;
  while (i < rows && j < columns) {
    if (board[i][j] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
    i++;
    j++;
  }

  // Diagonal check (top-right to bottom-left)
  count = 0;
  i = r;
  j = c;
  while (i >= 0 && j < columns) {
    if (board[i][j] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
    i--;
    j++;
  }
  i = r + 1;
  j = c - 1;
  while (i < rows && j >= 0) {
    if (board[i][j] === player) {
      count++;
    } else {
      count = 0;
    }
    if (count === 4) {
      return player;
    }
    i++;
    j--;
  }

  return null;
}

http.listen(port, () => {
  console.log(`Server running on port ${port}`);
});