const { verifySocketToken } = require('../middleware/auth');
const { queries } = require('../database');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

function registerSocketHandlers(io) {
  // ─── Auth middleware for Socket.IO ─────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifySocketToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: userId, username } = socket.user;
    console.log(`🔌  ${username} connected (socket: ${socket.id})`);

    // Mark user as online and broadcast presence to the other user
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId, username });

    // ─── Send message ────────────────────────────────────────────────────────
    socket.on('message:send', (data, ack) => {
      try {
        const { content, type, imageUrl } = data;

        // Validate
        if (type === 'text' && (!content || content.trim().length === 0)) {
          return ack && ack({ error: 'Message content is empty' });
        }
        if (type === 'image' && !imageUrl) {
          return ack && ack({ error: 'Image URL is required' });
        }
        if (content && content.length > 5000) {
          return ack && ack({ error: 'Message too long (max 5000 characters)' });
        }

        // Save to DB (positional params for node:sqlite)
        const result = queries.insertMessage.run(
          userId,
          type === 'text' ? content.trim() : null,
          type || 'text',
          imageUrl || null
        );

        const savedMessage = queries.getMessageById.get(result.lastInsertRowid);

        // Broadcast to all connected clients (including sender)
        io.emit('message:new', savedMessage);

        // Acknowledge success to sender
        ack && ack({ success: true, message: savedMessage });
      } catch (err) {
        console.error('message:send error:', err);
        ack && ack({ error: 'Failed to send message' });
      }
    });

    // ─── Typing indicators ───────────────────────────────────────────────────
    socket.on('typing:start', () => {
      socket.broadcast.emit('typing:start', { userId, username });
    });

    socket.on('typing:stop', () => {
      socket.broadcast.emit('typing:stop', { userId, username });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`❌  ${username} disconnected (${reason})`);
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId, username });
    });
  });
}

/**
 * Returns an array of online user IDs.
 */
function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

module.exports = { registerSocketHandlers, getOnlineUsers };
