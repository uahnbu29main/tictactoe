const room = document.querySelector`canvas`.getContext`2d`;
const size = 510;
const socket = io();

room.id = 0;
room.myID = 0;
room.board = [];
room.result = [0,0,0];
room.turn = '';

room.font = 'bold 32px Verdana';
room.textAlign = 'center';
room.textBaseline = 'top';
room.lineCap = 'round';

room.draw = () => {
  room.beginPath();
  room.fillStyle = '#ecf0f1';
  room.fillRect(0, 0, size, size);
  room.beginPath();
  room.fillStyle = '#7f8c8d';
  room.fillRect(0, size, size, room.canvas.height - size);
  room.fillStyle = '#ecf0f1';
  room.fillText('Room ' + room.id, size/2, 518);
  room.fillText(`🏆 ${room.result[0]}/${room.result[0] + room.result[1] + room.result[2]} 🤝 ${room.result[2]}`, size/2, 558);
  room.fillText(room.turn, size/2, 598);
  room.lineWidth = 8;
  room.strokeStyle = '#7f8c8d';
  for (let i = 1; i < 3; i++) {
    room.beginPath();
    room.moveTo(i * size/3, 0);
    room.lineTo(i * size/3, size);
    room.stroke();
    room.beginPath();
    room.moveTo(0, i * size/3);
    room.lineTo(size, i * size/3);
    room.stroke();
  }
  room.lineWidth = 24;
  room.board.forEach((cell,i) => {
    room.beginPath();
    if (i%2) {
      room.strokeStyle = '#0abde3';
      room.arc((cell%3 + .5) * size/3, (parseInt(cell/3) + .5) * size/3, size/6 - 48, 0, Math.PI*2);
    } else {
      room.strokeStyle = '#ee5253';
      room.moveTo(cell%3 * size/3 + 48, parseInt(cell/3) * size/3 + 48);
      room.lineTo((cell%3 + 1) * size/3 - 48, parseInt(cell/3 + 1) * size/3 - 48);
      room.stroke();
      room.moveTo(cell%3 * size/3 + 48, parseInt(cell/3 + 1) * size/3 - 48);
      room.lineTo((cell%3 + 1) * size/3 - 48, parseInt(cell/3) * size/3 + 48);
    }
    room.stroke();
  });
};

room.canvas.onmousedown = e => {
  socket.emit('move', parseInt(e.offsetX / size * 3) + 3 * parseInt(e.offsetY / size * 3));
};

socket.on('connect', () => room.myID = socket.id);
socket.emit('new_player');
socket.on('room', data => {
  room.id = data.id;
  room.board = data.board;
  room.result = data.players[0] === room.myID
    ? data.result
    : [data.result[1], data.result[0], data.result[2]];
  room.turn = data.players.length === 1
    ? 'Finding opponent'
    : data.players[data.turn] === room.myID ? 'Your turn' : 'Opponent\'s turn';
  room.draw();
});
