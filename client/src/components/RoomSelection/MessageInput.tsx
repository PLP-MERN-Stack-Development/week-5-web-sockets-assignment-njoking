import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Image as ImageIcon,
  Mic,
  MicOff
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

const EMOJI_SHORTCUTS = {
  ':)': '😊',
  ':(': '😢',
  ':D': '😃',
  ':P': '😛',
  '<3': '❤️',
  ':heart:': '❤️',
  ':thumbs_up:': '👍',
  ':thumbs_down:': '👎',
  ':fire:': '🔥',
  ':party:': '🎉'
};

const COMMON_EMOJIS = [
  '😊', '😂', '😍', '🤔', '😢', '😡', '🙄', '😴',
  '👍', '👎', '❤️', '💯', '🔥', '🎉', '✨', '💡'
];

export const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { sendMessage, setTyping, currentRoom } = useSocket();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleTyping = (value: string) => {
    setMessage(value);
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      setTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(false);
    }, 1000);
  };

  const processMessageForEmojis = (text: string): string => {
    let processedText = text;
    
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      const regex = new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, emoji);
    });
    
    return processedText;
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentRoom) return;

    const processedMessage = processMessageForEmojis(message.trim());
    sendMessage(processedMessage);
    setMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      setTyping(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = (type: 'image' | 'file') => {
    // In a real application, you would handle file upload here
    console.log(`Upload ${type} clicked`);
    // For demo purposes, send a placeholder message
    sendMessage(`📎 ${type === 'image' ? 'Image' : 'File'} uploaded`, type);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real application, you would handle voice recording here
    if (!isRecording) {
      console.log('Start recording...');
      // Start voice recording
    } else {
      console.log('Stop recording...');
      // Stop and send voice message
      sendMessage('🎤 Voice message', 'file');
    }
  };

  if (!currentRoom) {
    return (
      <div className="p-4 border-t border-border bg-card">
        <div className="text-center text-muted-foreground">
          Select a room to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end space-x-2">
        {/* File Upload Actions */}
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileUpload('file')}
            className="h-8 w-8 p-0"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileUpload('image')}
            className="h-8 w-8 p-0"
            title="Upload image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (try :) or :heart:)"
            className="min-h-[40px] max-h-[120px] resize-none pr-12 bg-background"
            rows={1}
          />
          
          {/* Emoji Picker */}
          <div className="absolute right-2 bottom-2">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Emoji Shortcuts</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>:) → 😊</div>
                    <div>:heart: → ❤️</div>
                    <div>:fire: → 🔥</div>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    {COMMON_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Voice Recording */}
        <Button
          variant={isRecording ? "destructive" : "ghost"}
          size="sm"
          onClick={toggleRecording}
          className={`h-8 w-8 p-0 ${isRecording ? 'animate-pulse' : ''}`}
          title={isRecording ? "Stop recording" : "Start voice message"}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
          size="sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Typing Indicator Helper */}
      {message.trim() && (
        <div className="mt-2 text-xs text-muted-foreground">
          {Object.keys(EMOJI_SHORTCUTS).some(shortcut => message.includes(shortcut)) && (
            <span>✨ Emoji shortcuts detected! They'll be converted when sent.</span>
          )}
        </div>
      )}
    </div>
  );
};