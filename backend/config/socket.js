const socketIo = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    // Allow user to join specific rooms (like their user ID or their role room 'NGO', 'Donor', 'Admin')
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = { initSocket, getIO };
