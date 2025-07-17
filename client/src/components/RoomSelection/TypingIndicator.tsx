import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-muted-foreground text-sm animate-message-slide-in">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-typing rounded-full animate-typing-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-typing rounded-full animate-typing-pulse" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-typing rounded-full animate-typing-pulse" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="italic">{getTypingText()}...</span>
    </div>
  );
};