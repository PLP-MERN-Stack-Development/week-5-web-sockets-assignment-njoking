# Socket.io Chat Server Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Server Setup Instructions

### 1. Create Server Directory Structure
```
server/
├── config/
│   ├── database.js
│   └── socket.js
├── controllers/
│   ├── messageController.js
│   ├── roomController.js
│   └── userController.js
├── models/
│   ├── User.js
│   ├── Room.js
│   └── Message.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── socket/
│   ├── handlers/
│   │   ├── messageHandlers.js
│   │   ├── roomHandlers.js
│   │   └── userHandlers.js
│   └── socketManager.js
├── utils/
│   ├── logger.js
│   └── helpers.js
├── package.json
└── server.js
```

### 2. Initialize Server Project
```bash
mkdir server
cd server
npm init -y
```

### 3. Install Dependencies
```bash
npm install express socket.io cors dotenv helmet morgan
npm install -D nodemon
```

### 4. Create package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### 5. Create Environment Variables (.env)
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8080
```

### 6. Main Server File (server.js)
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const socketManager = require('./socket/socketManager');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8080",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize socket manager
socketManager(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
```

### 7. Socket Manager (socket/socketManager.js)
```javascript
const messageHandlers = require('./handlers/messageHandlers');
const roomHandlers = require('./handlers/roomHandlers');
const userHandlers = require('./handlers/userHandlers');

// In-memory stores (use database in production)
const users = new Map();
const rooms = new Map();
const messages = new Map();

// Initialize default rooms
rooms.set('general', {
  id: 'general',
  name: 'General',
  type: 'public',
  participants: new Set(),
  createdAt: new Date()
});

rooms.set('random', {
  id: 'random',
  name: 'Random',
  type: 'public',
  participants: new Set(),
  createdAt: new Date()
});

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Initialize handlers with shared state
    const context = { io, socket, users, rooms, messages };
    
    messageHandlers(context);
    roomHandlers(context);
    userHandlers(context);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Remove user from all rooms
      const user = users.get(socket.id);
      if (user) {
        rooms.forEach(room => {
          if (room.participants.has(socket.id)) {
            room.participants.delete(socket.id);
            socket.to(room.id).emit('user-left', {
              userId: socket.id,
              username: user.username,
              roomId: room.id
            });
          }
        });
        
        users.delete(socket.id);
        
        // Broadcast updated user list
        io.emit('users-updated', Array.from(users.values()));
      }
    });
  });
};
```

### 8. Message Handlers (socket/handlers/messageHandlers.js)
```javascript
module.exports = ({ io, socket, users, rooms, messages }) => {
  // Send message
  socket.on('send-message', (messageData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      content: messageData.content,
      userId: socket.id,
      username: user.username,
      timestamp: new Date(),
      roomId: messageData.roomId,
      type: messageData.type || 'text',
      readBy: [socket.id],
      reactions: []
    };

    // Store message
    if (!messages.has(messageData.roomId)) {
      messages.set(messageData.roomId, []);
    }
    messages.get(messageData.roomId).push(message);

    // Broadcast to room
    io.to(messageData.roomId).emit('new-message', message);
  });

  // Mark message as read
  socket.on('mark-read', (messageId) => {
    // Find and update message read status
    messages.forEach(roomMessages => {
      const message = roomMessages.find(m => m.id === messageId);
      if (message && !message.readBy.includes(socket.id)) {
        message.readBy.push(socket.id);
        io.to(message.roomId).emit('message-read', {
          messageId,
          userId: socket.id
        });
      }
    });
  });

  // Add reaction to message
  socket.on('add-reaction', ({ messageId, emoji }) => {
    const user = users.get(socket.id);
    if (!user) return;

    messages.forEach(roomMessages => {
      const message = roomMessages.find(m => m.id === messageId);
      if (message) {
        let reaction = message.reactions.find(r => r.emoji === emoji);
        if (!reaction) {
          reaction = { emoji, users: [] };
          message.reactions.push(reaction);
        }
        if (!reaction.users.includes(socket.id)) {
          reaction.users.push(socket.id);
        }
        
        io.to(message.roomId).emit('reaction-added', {
          messageId,
          emoji,
          userId: socket.id
        });
      }
    });
  });

  // Remove reaction from message
  socket.on('remove-reaction', ({ messageId, emoji }) => {
    messages.forEach(roomMessages => {
      const message = roomMessages.find(m => m.id === messageId);
      if (message) {
        const reaction = message.reactions.find(r => r.emoji === emoji);
        if (reaction) {
          reaction.users = reaction.users.filter(uid => uid !== socket.id);
          if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        }
        
        io.to(message.roomId).emit('reaction-removed', {
          messageId,
          emoji,
          userId: socket.id
        });
      }
    });
  });

  // Typing indicator
  socket.on('typing', ({ isTyping, roomId }) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(roomId).emit('user-typing', {
      userId: socket.id,
      username: user.username,
      isTyping,
      roomId
    });
  });
};
```

### 9. Room Handlers (socket/handlers/roomHandlers.js)
```javascript
module.exports = ({ io, socket, users, rooms, messages }) => {
  // Join room
  socket.on('join-room', (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.join(roomId);
    
    const room = rooms.get(roomId);
    if (room) {
      room.participants.add(socket.id);
      
      // Send room messages to user
      const roomMessages = messages.get(roomId) || [];
      socket.emit('room-messages', roomMessages);
      
      // Notify others
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: user.username,
        roomId
      });
      
      // Send updated room info
      io.to(roomId).emit('room-updated', {
        id: room.id,
        name: room.name,
        type: room.type,
        participantCount: room.participants.size
      });
    }
  });

  // Leave room
  socket.on('leave-room', (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.leave(roomId);
    
    const room = rooms.get(roomId);
    if (room) {
      room.participants.delete(socket.id);
      
      socket.to(roomId).emit('user-left', {
        userId: socket.id,
        username: user.username,
        roomId
      });
      
      io.to(roomId).emit('room-updated', {
        id: room.id,
        name: room.name,
        type: room.type,
        participantCount: room.participants.size
      });
    }
  });

  // Create room
  socket.on('create-room', (roomData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = {
      id: roomData.id,
      name: roomData.name,
      type: roomData.type,
      participants: new Set([socket.id]),
      createdAt: new Date(),
      createdBy: socket.id
    };

    rooms.set(room.id, room);
    messages.set(room.id, []);
    
    socket.join(room.id);
    
    // Broadcast new room to all users
    io.emit('room-created', {
      id: room.id,
      name: room.name,
      type: room.type,
      createdBy: user.username
    });
  });

  // Get room list
  socket.on('get-rooms', () => {
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participantCount: room.participants.size,
      createdAt: room.createdAt
    }));
    
    socket.emit('rooms-list', roomList);
  });
};
```

### 10. User Handlers (socket/handlers/userHandlers.js)
```javascript
module.exports = ({ io, socket, users, rooms, messages }) => {
  // User login
  socket.on('user-login', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      isOnline: true,
      lastSeen: new Date(),
      socketId: socket.id
    };

    users.set(socket.id, user);
    
    // Send current users list
    socket.emit('users-list', Array.from(users.values()));
    
    // Send available rooms
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participantCount: room.participants.size
    }));
    socket.emit('rooms-list', roomList);
    
    // Broadcast new user to others
    socket.broadcast.emit('user-joined-app', user);
    
    console.log(`User logged in: ${user.username} (${socket.id})`);
  });

  // Update user profile
  socket.on('update-profile', (profileData) => {
    const user = users.get(socket.id);
    if (user) {
      Object.assign(user, profileData);
      users.set(socket.id, user);
      
      // Broadcast updated profile
      io.emit('user-updated', user);
    }
  });

  // Get online users
  socket.on('get-online-users', () => {
    const onlineUsers = Array.from(users.values()).filter(user => user.isOnline);
    socket.emit('online-users', onlineUsers);
  });
};
```

### 11. Running the Server

1. Create all the files above in the server directory
2. Run `npm install` to install dependencies
3. Create a `.env` file with your configuration
4. Start the server:
   ```bash
   npm run dev  # For development with nodemon
   # or
   npm start    # For production
   ```

### 12. Client Connection Update

Update your frontend socket connection to point to your server:

```javascript
// In src/context/SocketContext.tsx
const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
```

## Production Deployment

### Using Railway, Render, or Heroku:

1. **Prepare for deployment:**
   ```bash
   # Add to package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Environment variables:**
   - `NODE_ENV=production`
   - `PORT` (set by platform)
   - `CLIENT_URL` (your frontend URL)

3. **Deploy the server** to your chosen platform
4. **Update frontend** to connect to your deployed server URL

### Database Integration (Optional)

For production, consider adding:
- MongoDB with Mongoose
- PostgreSQL with Prisma
- Redis for session management

This completes your Socket.io chat server setup!