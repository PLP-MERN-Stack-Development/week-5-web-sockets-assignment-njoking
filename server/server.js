// server.js - Enhanced Socket.io chat server with core features

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data stores
const chatRooms = {
  general: {
    users: {},
    messages: [],
    typingUsers: {}
  },
  random: {
    users: {},
    messages: [],
    typingUsers: {}
  }
};

const privateMessages = {};
const activeUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Authentication Middleware
  socket.use(([event, ...args], next) => {
    if (['register_user', 'login'].includes(event)) return next();
    if (!socket.data.user) return next(new Error('Unauthorized'));
    next();
  });

  // User Registration and Authentication
  socket.on('register_user', ({ username, avatar }, callback) => {
    if (Object.values(activeUsers).some(u => u.username === username)) {
      return callback({ error: 'Username already taken' });
    }

    socket.data.user = {
      id: socket.id,
      username,
      avatar,
      joinedAt: new Date().toISOString()
    };

    activeUsers[socket.id] = socket.data.user;
    
    // Join default room
    socket.join('general');
    chatRooms.general.users[socket.id] = socket.data.user;

    // Notify all clients
    io.emit('active_users', Object.values(activeUsers));
    io.to('general').emit('room_users', {
      room: 'general',
      users: Object.values(chatRooms.general.users)
    });

    // Send initial data
    callback({
      success: true,
      user: socket.data.user,
      rooms: Object.keys(chatRooms),
      messages: chatRooms.general.messages.slice(-50)
    });
  });

  // Room Management
  socket.on('join_room', (room, callback) => {
    if (!chatRooms[room]) {
      chatRooms[room] = {
        users: {},
        messages: [],
        typingUsers: {}
      };
    }

    // Leave previous rooms
    Object.keys(chatRooms).forEach(r => {
      if (chatRooms[r].users[socket.id]) {
        socket.leave(r);
        delete chatRooms[r].users[socket.id];
        io.to(r).emit('room_users', {
          room: r,
          users: Object.values(chatRooms[r].users)
        });
      }
    });

    // Join new room
    socket.join(room);
    chatRooms[room].users[socket.id] = socket.data.user;
    
    io.to(room).emit('room_users', {
      room,
      users: Object.values(chatRooms[room].users)
    });

    callback({
      messages: chatRooms[room].messages.slice(-50),
      users: Object.values(chatRooms[room].users)
    });
  });

  // Message Handling
  socket.on('send_message', ({ room, text }, callback) => {
    if (!room || !text) return callback({ error: 'Invalid message data' });

    const message = {
      id: Date.now().toString(),
      room,
      text,
      sender: socket.data.user,
      timestamp: new Date().toISOString(),
      readBy: [socket.id]
    };

    chatRooms[room].messages.push(message);
    
    // Limit stored messages
    if (chatRooms[room].messages.length > 100) {
      chatRooms[room].messages.shift();
    }

    io.to(room).emit('receive_message', message);
    callback({ success: true, message });
  });

  // Private Messaging
  socket.on('private_message', ({ to, text }, callback) => {
    const recipientSocket = Object.entries(activeUsers)
      .find(([id, user]) => user.username === to)?.[0];
    
    if (!recipientSocket) return callback({ error: 'User not found' });

    const message = {
      id: Date.now().toString(),
      text,
      from: socket.data.user,
      to: activeUsers[recipientSocket],
      timestamp: new Date().toISOString(),
      read: false
    };

    // Store message for both users
    const conversationId = [socket.id, recipientSocket].sort().join('-');
    if (!privateMessages[conversationId]) {
      privateMessages[conversationId] = [];
    }
    privateMessages[conversationId].push(message);

    // Emit to both parties
    socket.emit('private_message', message);
    socket.to(recipientSocket).emit('private_message', message);
    
    callback({ success: true });
  });

  // Typing Indicators
  socket.on('typing', ({ room, isTyping }) => {
    if (isTyping) {
      chatRooms[room].typingUsers[socket.id] = socket.data.user.username;
    } else {
      delete chatRooms[room].typingUsers[socket.id];
    }
    io.to(room).emit('typing_users', Object.values(chatRooms[room].typingUsers));
  });

  // Message Read Receipts
  socket.on('mark_read', ({ messageId, room }) => {
    if (room) {
      const message = chatRooms[room].messages.find(m => m.id === messageId);
      if (message && !message.readBy.includes(socket.id)) {
        message.readBy.push(socket.id);
        io.to(room).emit('message_read', { messageId, readBy: message.readBy });
      }
    } else {
      // Handle private message read receipts
      // Implementation would be similar to above
    }
  });

  // Disconnection Handler
  socket.on('disconnect', () => {
    if (socket.data.user) {
      console.log(`${socket.data.user.username} disconnected`);
      
      // Remove from all rooms
      Object.keys(chatRooms).forEach(room => {
        if (chatRooms[room].users[socket.id]) {
          delete chatRooms[room].users[socket.id];
          delete chatRooms[room].typingUsers[socket.id];
          io.to(room).emit('room_users', {
            room,
            users: Object.values(chatRooms[room].users)
          });
          io.to(room).emit('typing_users', Object.values(chatRooms[room].typingUsers));
        }
      });

      // Remove from active users
      delete activeUsers[socket.id];
      io.emit('active_users', Object.values(activeUsers));
    }
  });
});

// API Endpoints
app.get('/api/rooms', (req, res) => {
  res.json({
    rooms: Object.keys(chatRooms),
    activeUsers: Object.values(activeUsers)
  });
});

app.get('/api/room/:name', (req, res) => {
  const room = chatRooms[req.params.name];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  
  res.json({
    users: Object.values(room.users),
    messages: room.messages.slice(-50)
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    users: Object.keys(activeUsers).length,
    rooms: Object.keys(chatRooms).length
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };