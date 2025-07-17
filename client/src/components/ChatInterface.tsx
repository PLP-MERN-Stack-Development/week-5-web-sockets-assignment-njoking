import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatSidebar } from './ChatSidebar';
import { Hash, Lock, Users } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export const ChatInterface: React.FC = () => {
  const { 
    messages, 
    currentRoom, 
    rooms, 
    user, 
    typingUsers,
    users 
  } = useSocket();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRoomData = rooms.find(room => room.id === currentRoom);
  const roomMessages = messages.filter(msg => msg.roomId === currentRoom);
  const roomTypingUsers = typingUsers.filter(tu => tu.roomId === currentRoom && tu.userId !== user?.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  if (!currentRoom || !currentRoomData) {
    return (
      <div className="flex h-screen bg-background">
        <ChatSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mx-auto">
              <Hash className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium">Welcome to ChatVerse</h2>
            <p className="text-muted-foreground">Select a room to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {currentRoomData.type === 'private' ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Hash className="w-5 h-5 text-muted-foreground" />
                )}
                <h1 className="text-lg font-semibold">{currentRoomData.name}</h1>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentRoomData.type}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{users.filter(u => u.isOnline).length} online</span>
            </div>
          </div>
          
          {currentRoomData.type === 'public' && (
            <p className="text-sm text-muted-foreground mt-1">
              Welcome to #{currentRoomData.name}! This is a public room where everyone can chat.
            </p>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {roomMessages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Be the first to say something in #{currentRoomData.name}!
                </p>
              </div>
            ) : (
              roomMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  username={message.username}
                  timestamp={message.timestamp}
                  isOwn={message.userId === user?.id}
                  readBy={message.readBy}
                  reactions={message.reactions}
                  userId={message.userId}
                />
              ))
            )}
            
            {/* Typing Indicator */}
            {roomTypingUsers.length > 0 && (
              <TypingIndicator users={roomTypingUsers.map(tu => tu.username)} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <MessageInput />
      </div>
    </div>
  );
};