import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Smile, MoreHorizontal, Check, CheckCheck } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSocket } from '@/context/SocketContext';

dayjs.extend(relativeTime);

interface MessageBubbleProps {
  id: string;
  content: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  readBy: string[];
  reactions: { emoji: string; users: string[] }[];
  userId: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  username,
  timestamp,
  isOwn,
  readBy,
  reactions,
  userId
}) => {
  const { user, addReaction, removeReaction, users } = useSocket();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.includes(user?.id || '');

    if (userHasReacted) {
      removeReaction(id, emoji);
    } else {
      addReaction(id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const isRead = readBy.length > 1; // More than just the sender
  const readCount = readBy.length - 1; // Exclude sender

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Username for non-own messages */}
        {!isOwn && (
          <div className="text-xs text-muted-foreground mb-1 px-3">
            {username}
          </div>
        )}
        
        <div className="relative">
          {/* Message Bubble */}
          <div
            className={`
              px-4 py-2 rounded-2xl shadow-message animate-message-slide-in
              ${isOwn 
                ? 'bg-gradient-message text-message-sent-foreground rounded-br-md' 
                : 'bg-message-received text-message-received-foreground rounded-bl-md'
              }
            `}
          >
            <p className="text-sm leading-relaxed break-words">{content}</p>
            
            {/* Timestamp and Read Status */}
            <div className={`flex items-center justify-end mt-1 space-x-1 ${isOwn ? 'text-message-sent-foreground/70' : 'text-message-received-foreground/70'}`}>
              <span className="text-xs">
                {dayjs(timestamp).format('HH:mm')}
              </span>
              {isOwn && (
                <div className="flex items-center space-x-1">
                  {isRead ? (
                    <CheckCheck className="w-3 h-3 text-primary-glow" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  {readCount > 0 && (
                    <span className="text-xs">
                      {readCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Actions */}
          <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1`}>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-card hover:bg-accent">
                  <Smile className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align={isOwn ? "end" : "start"}>
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-accent"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {reactions.filter(r => r.users.length > 0).map((reaction, index) => (
              <Button
                key={`${reaction.emoji}-${index}`}
                variant="ghost"
                size="sm"
                className="h-6 px-2 bg-card hover:bg-accent border border-border text-xs"
                onClick={() => handleReaction(reaction.emoji)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span>{reaction.users.length}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Relative Time */}
        <div className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'} px-1`}>
          {dayjs(timestamp).fromNow()}
        </div>
      </div>
    </div>
  );
};