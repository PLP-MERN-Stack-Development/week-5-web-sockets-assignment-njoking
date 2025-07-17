import React from 'react';
import { SocketProvider, useSocket } from '@/context/SocketContext';
import { LoginForm } from '@/components/LoginForm';
import { ChatInterface } from '@/components/ChatInterface';

const ChatApp: React.FC = () => {
  const { user } = useSocket();

  if (!user) {
    return <LoginForm />;
  }

  return <ChatInterface />;
};

const Index = () => {
  return (
    <SocketProvider>
      <ChatApp />
    </SocketProvider>
  );
};

export default Index;
