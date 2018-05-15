// 定义一个Chat类
let Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = (room, text) => {
  const message = {
    room,
    text
  };
  this.socket.emit('message', message);
};

Chat.prototype.changeRoom = room => {
  this.socket.emit('join', {
    newRoom: room
  });
};

Chat.prototype.processCommand = command => {
  const words = command.split(' ');
  const command = words[0].substring(1, words[0].length).toLowerCase();
  let meaasge;
  switch (command) {
    case 'join':
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case 'nick':
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
    default:
      message = 'Unrecognized command.';
      break;
  }

  return message;
};
