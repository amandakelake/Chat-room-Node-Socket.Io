const socketio = require('socket.io');
let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

exports.listen = (server) => {
  io = socketio.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', (socket) => {
    // 用户登录，赋予访客名
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    // 把用户放进Lobby聊天室
    joinRoom(socket, 'Lobby');
    // 处理用户消息，nickNames是实参
    handleMessageBroadcasting(socket, nickNames);
    // 用户更名
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    // 用户创建和变更聊天室
    handleRoomJoining(socket);

    // 用户发请求时， 提供已经被占用的聊天室列表
    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    // 用户离开,清除逻辑
    handleClientDisconnection(socket, nickNames, namesUsed);
  })
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  // 生成新名字
  const name = `Guest ${guestNumber}`;
  // 把用户昵称跟客户端连接ID关联起来
  nickNames[socket.id] = name;
  // 广播，让用户知道他们的昵称
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  // 已用昵称列表
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {

}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {

}

function handleMessageBroadcasting(socket) {

}

function handleRoomJoining(socket) {

}

function handleClientDisconnection(socket) {

}