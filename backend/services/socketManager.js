const { getIO } = require('../config/socket');

const socketManager = {
  /**
   * Send notification to a specific user's room (room:userId)
   */
  emitToUser: (userId, eventType, data) => {
    try {
      const io = getIO();
      if (io) {
        const roomName = `room:${userId}`;
        io.to(roomName).emit(eventType, data);
        console.log(`[SocketManager]: Emitted event '${eventType}' to user room '${roomName}'`);
      }
    } catch (err) {
      console.error('SocketManager emitToUser failed:', err);
    }
  },

  /**
   * Send notification to a specific role room (e.g. 'NGO', 'Donor', 'Admin')
   */
  emitToRole: (role, eventType, data) => {
    try {
      const io = getIO();
      if (io) {
        io.to(role).emit(eventType, data);
        console.log(`[SocketManager]: Emitted event '${eventType}' to role room '${role}'`);
      }
    } catch (err) {
      console.error('SocketManager emitToRole failed:', err);
    }
  },

  /**
   * Broadcast to all connected clients
   */
  emitToAll: (eventType, data) => {
    try {
      const io = getIO();
      if (io) {
        io.emit(eventType, data);
        console.log(`[SocketManager]: Broadcasted event '${eventType}' to all clients`);
      }
    } catch (err) {
      console.error('SocketManager emitToAll failed:', err);
    }
  }
};

module.exports = socketManager;
