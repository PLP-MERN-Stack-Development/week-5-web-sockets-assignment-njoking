import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MessageCircle, Users, Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      login(username.trim());
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-chat">
            <MessageCircle className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ChatVerse
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect, chat, and collaborate in real-time
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Real-time</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Multiplayer</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 bg-card rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Instant</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-chat border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Join the conversation</CardTitle>
            <CardDescription>
              Enter your username to start chatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-input"
                  disabled={isLoading}
                  maxLength={20}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  'Join Chat'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Built with Socket.io and React</p>
        </div>
      </div>
    </div>
  );
};