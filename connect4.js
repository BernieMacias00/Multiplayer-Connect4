// Bernabe Macias
// Game Project
// 3/20/24


// script.js
// Client-side code
// need socket.on, socket.emit, and socket io

var socket = io();
var playerRed = "R";
var playerYellow = "Y";
var currPlayer;
var gameOver = false;
var board;
var rows = 6;
var columns = 7;
var currColumns;

window.onload = function() {
  setGame();
}

var socket = io();
var playerRed = "R";
var playerYellow = "Y";
var currPlayer;
var gameOver = false;
var board;
var rows = 6;
var columns = 7;
var currColumns;

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('createGame');
});

socket.on('gameCreated', (gameId) => {
  console.log(`Game ${gameId} created`);
  // Show game ID or invite link
});

socket.on('playerJoined', (game) => {
  currPlayer = game.currPlayer;
  board = game.board;
  currColumns = game.currColumns;
  setGame();
});

socket.on('move', (r, c, player) => {
  board[r][c] = player;
  let tile = document.getElementById(r.toString() + "-" + c.toString());
  if (player === playerRed) {
    tile.classList.add("red-piece");
    currPlayer = playerYellow;
  } else {
    tile.classList.add("yellow-piece");
    currPlayer = playerRed;
  }
});

socket.on('gameOver', (winner) => {
  gameOver = true;
  document.getElementById("winner").innerText = `${winner} Wins`;
});

function setGame() {
  board = [];
  currColumns = [5, 5, 5, 5, 5, 5, 5];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < columns; c++) {
      let tile = document.createElement("div");
      tile.id = r.toString() + "-" + c.toString();
      tile.classList.add("tile");
      tile.addEventListener("click", setPiece);
      document.getElementById("board").append(tile);
      row.push(' ');
    }
    board.push(row);
  }
}

function setPiece() {
  if (gameOver) {
    return;
  }
  let coords = this.id.split("-");
  let r = parseInt(coords[0]);
  let c = parseInt(coords[1]);
  r = currColumns[c];
  if (r < 0 || board[r][c] !== ' ') {
    return; // Don't allow a move if the column is full or the tile is already occupied
  }
  socket.emit('move', r, c);
}