import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  timestamp: Date;
  roomId: string;
  type: 'text' | 'image' | 'file';
  readBy: string[];
  reactions: { emoji: string; users: string[] }[];
}

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private';
  participants: string[];
  createdAt: Date;
  lastMessage?: Message;
}

interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
}

interface SocketContextType {
  socket: Socket | null;
  user: User | null;
  users: User[];
  rooms: Room[];
  messages: Message[];
  currentRoom: string | null;
  typingUsers: TypingUser[];
  isConnected: boolean;
  
  // Actions
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => void;
  setTyping: (isTyping: boolean) => void;
  setCurrentRoom: (roomId: string) => void;
  login: (username: string) => void;
  logout: () => void;
  createRoom: (name: string, type: 'public' | 'private') => void;
  markMessageAsRead: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // For development, we'll use a mock socket implementation
    // In a real application, you would connect to your Socket.io server
    const mockSocket = {
      connected: true,
      on: (event: string, callback: any) => {
        // Mock event listeners
        if (event === 'connect') {
          setTimeout(() => callback(), 100);
        }
      },
      emit: (event: string, ...args: any[]) => {
        console.log(`Socket emit: ${event}`, args);
        // Mock emit responses
        if (event === 'join-room') {
          setTimeout(() => {
            const [roomId] = args;
            mockReceiveMessage(`Welcome to room ${roomId}!`, 'system', roomId);
          }, 500);
        }
      },
      disconnect: () => {
        console.log('Socket disconnected');
      }
    } as any;

    setSocket(mockSocket);
    setIsConnected(true);

    // Initialize default rooms
    const defaultRooms: Room[] = [
      {
        id: 'general',
        name: 'General',
        type: 'public',
        participants: [],
        createdAt: new Date()
      },
      {
        id: 'random',
        name: 'Random',
        type: 'public',
        participants: [],
        createdAt: new Date()
      }
    ];
    setRooms(defaultRooms);
    setCurrentRoom('general');

    return () => {
      mockSocket.disconnect();
    };
  }, []);

  const mockReceiveMessage = (content: string, username: string, roomId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      userId: username === 'system' ? 'system' : '1',
      username,
      timestamp: new Date(),
      roomId,
      type: 'text',
      readBy: [],
      reactions: []
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const login = (username: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      username,
      isOnline: true
    };
    setUser(newUser);
    setUsers(prev => [...prev, newUser]);
    
    toast({
      title: "Connected!",
      description: `Welcome to ChatVerse, ${username}!`
    });
  };

  const logout = () => {
    setUser(null);
    setUsers([]);
    setMessages([]);
    setCurrentRoom(null);
    
    toast({
      title: "Disconnected",
      description: "You have been logged out."
    });
  };

  const joinRoom = (roomId: string) => {
    if (socket && user) {
      socket.emit('join-room', roomId);
      setCurrentRoom(roomId);
      
      toast({
        title: "Joined room",
        description: `You joined ${rooms.find(r => r.id === roomId)?.name || roomId}`
      });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (socket && user && currentRoom) {
      const message: Message = {
        id: Date.now().toString(),
        content,
        userId: user.id,
        username: user.username,
        timestamp: new Date(),
        roomId: currentRoom,
        type,
        readBy: [user.id],
        reactions: []
      };
      
      socket.emit('send-message', message);
      setMessages(prev => [...prev, message]);
    }
  };

  const setTyping = (isTyping: boolean) => {
    if (socket && user && currentRoom) {
      socket.emit('typing', { isTyping, roomId: currentRoom });
    }
  };

  const createRoom = (name: string, type: 'public' | 'private') => {
    if (socket && user) {
      const room: Room = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        type,
        participants: [user.id],
        createdAt: new Date()
      };
      
      setRooms(prev => [...prev, room]);
      socket.emit('create-room', room);
      
      toast({
        title: "Room created",
        description: `Created room "${name}"`
      });
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (socket && user) {
      socket.emit('mark-read', messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, readBy: [...new Set([...msg.readBy, user.id])] }
          : msg
      ));
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (socket && user) {
      socket.emit('add-reaction', { messageId, emoji });
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find(r => r.emoji === emoji);
          if (existingReaction) {
            if (!existingReaction.users.includes(user.id)) {
              existingReaction.users.push(user.id);
            }
          } else {
            msg.reactions.push({ emoji, users: [user.id] });
          }
        }
        return msg;
      }));
    }
  };

  const removeReaction = (messageId: string, emoji: string) => {
    if (socket && user) {
      socket.emit('remove-reaction', { messageId, emoji });
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          msg.reactions = msg.reactions.map(r => 
            r.emoji === emoji 
              ? { ...r, users: r.users.filter(uid => uid !== user.id) }
              : r
          ).filter(r => r.users.length > 0);
        }
        return msg;
      }));
    }
  };

  const value: SocketContextType = {
    socket,
    user,
    users,
    rooms,
    messages,
    currentRoom,
    typingUsers,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
    setCurrentRoom,
    login,
    logout,
    createRoom,
    markMessageAsRead,
    addReaction,
    removeReaction
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};