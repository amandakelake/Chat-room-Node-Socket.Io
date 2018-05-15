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
  socket.join(room);
  currentRoom[socket.id] = room;
  // 让用户知道自己进入了新的房间
  socket.emit('joinResult', { room: room });
  // 广播，让其他用户知道有新用户进房间了
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has joined ${room}.`
  });

  // 确认有哪些用户在该房间里
  let usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    let usersInRommSummary = `Users currently in ${room} : `;
    for(let index in usersInRoom) {
      const userSocketId = usersInRoom[index].id;
      if (userSocketId !== socket.id) {
        if (index > 0) {
          usersInRommSummary += ', ';
        }
        usersInRommSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}