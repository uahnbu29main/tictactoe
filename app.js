const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.get('/', (req,res) => res.sendFile(path.join(__dirname, 'index.html')));
server.listen(5000, () => console.log('Server on port 5000 started'));

let rooms = [];
let gameOver = (room,player) => {
  room.result[player]++;
  room.board = [];
  room.turn = (room.turn + room.board.length) % 2;
  room.players.forEach(player => io.sockets.to(player).emit('room', room));
};

io.on('connection', socket => {
  socket.on('new_player', () => {
    let room;
    rooms.forEach(checkingRoom => {
      if (checkingRoom.players.length === 1) {room = checkingRoom; }
    });
    if (!room) {rooms.push(room = {
      id: ((min,max) => parseInt(Math.random() * (max - min + 1)) + min)(10000,99999),
      players: [],
      board: [],
      result: [0,0,0],
      turn: parseInt(Math.random() * 2)
    }); }
    room.players.push(socket.id);
    room.players.forEach(player => io.sockets.to(player).emit('room', room));
  });
  socket.on('move', data => {
    let room;
    rooms.forEach(checkingRoom => {
      if (checkingRoom.players.includes(socket.id)) {room = checkingRoom; }
    });
    if (room.players.length === 1) {return; }
    let board = room.board;
    if (room.turn !== room.players.indexOf(socket.id)) {return; }
    if (board.includes(data) || !Array(9).fill().map((_,i) => i).includes(data)) {return; }
    board[board.length] = data;
    if (board.length === 9) {gameOver(room, 2); }
    let moves = [board.filter((_,i) => i%2), board.filter((_,i) => !(i%2))];
    if ((room.turn + board.length)%2) {moves = [moves[1], moves[0]]; }
    moves.forEach((cells,player) => {
      for (let i = 0; i < 3; i++) {
        if (cells.filter(cell => parseInt(cell/3) === i).length === 3) {gameOver(room,player); }
        if (cells.filter(cell => cell%3 === i).length === 3) {gameOver(room,player); }
      }
      if (cells.filter(cell => parseInt(cell/3) === cell%3).length === 3) {gameOver(room,player); }
      if (cells.filter(cell => parseInt(cell/3) + cell%3 === 2).length === 3) {gameOver(room,player); }
    });
    room.turn = 1 - room.turn;
    room.players.forEach(player => io.sockets.to(player).emit('room', room));
  });
  socket.on('disconnect', () => {
    let room;
    rooms.forEach(checkingRoom => {
      if (checkingRoom.players.includes(socket.id)) {room = checkingRoom; }
    });
    if (room.players.length === 2) {
      let potentialRoom;
      rooms.forEach(checkingRoom => {
        if (checkingRoom.players.length === 1) {potentialRoom = checkingRoom; }
      });
      room.players.splice(room.players.indexOf(socket.id), 1);
      if (potentialRoom) {
        potentialRoom.players.push(room.players[0]);
        rooms.splice(rooms.indexOf(room), 1);
      } else {potentialRoom = room; }
      potentialRoom.board = [];
      potentialRoom.result = [0,0,0];
      potentialRoom.turn = parseInt(Math.random() * 2);
      potentialRoom.players.forEach(player => io.sockets.to(player).emit('room', potentialRoom));
    } else {
      rooms.splice(rooms.indexOf(room), 1);
    }
  });
});