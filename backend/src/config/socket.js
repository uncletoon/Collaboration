const { Server } = require('socket.io');

let io = null;
// Map to track active user socket mappings: userId -> socketId
const userSockets = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User authentication/identity registration on socket connection
    socket.on('register_user', (userId) => {
      if (userId) {
        const uIdStr = String(userId);
        userSockets.set(uIdStr, socket.id);
        socket.join(`user_${uIdStr}`);
        console.log(`User ${uIdStr} registered with socket ${socket.id} and joined room user_${uIdStr}`);
      }
    });

    // Join a specific chat room (group or DM)
    socket.on('join_chat_room', (roomId) => {
      if (roomId) {
        socket.join(`chat_${roomId}`);
        console.log(`Socket ${socket.id} joined chat room chat_${roomId}`);
      }
    });

    // Leave a specific chat room
    socket.on('leave_chat_room', (roomId) => {
      if (roomId) {
        socket.leave(`chat_${roomId}`);
        console.log(`Socket ${socket.id} left chat room chat_${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Find and remove mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`Removed mapping for user ${userId}`);
          break;
        }
      }
    });
  });

  return io;
}

// Helper to send real-time notification to a specific user
function sendNotification(userId, notification) {
  if (!io) return;
  const uIdStr = String(userId);
  console.log(`Sending real-time notification to user_${uIdStr}:`, notification.title);
  io.to(`user_${uIdStr}`).emit('notification', notification);
}

// Helper to broadcast new chat message within a room
function broadcastChatMessage(roomId, message) {
  if (!io) return;
  console.log(`Broadcasting chat message to room chat_${roomId}`);
  io.to(`chat_${roomId}`).emit('chat_message', message);
  
  // Also emit to individual user rooms for notifications if they are not in the room
  // This will be handled in the controller logic when saving the message to the DB
}

// Helper to broadcast general events or room joins
function getIo() {
  return io;
}

module.exports = {
  initSocket,
  sendNotification,
  broadcastChatMessage,
  getIo,
  userSockets,
};
