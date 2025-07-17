import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Hash, 
  Plus, 
  Users, 
  LogOut, 
  Settings,
  Lock,
  Globe
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { UserProfile } from './UserProfile';
import { NotificationSystem } from './NotificationSystem';

export const ChatSidebar: React.FC = () => {
  const { 
    user, 
    rooms, 
    currentRoom, 
    setCurrentRoom, 
    logout, 
    createRoom,
    users 
  } = useSocket();
  
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim(), newRoomType);
      setNewRoomName('');
      setIsCreateDialogOpen(false);
    }
  };

  const onlineUsers = users.filter(u => u.isOnline);

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ChatVerse</h2>
          <div className="flex items-center space-x-2">
            <NotificationSystem />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-status-online rounded-full animate-online-pulse" />
          <span className="text-sm text-muted-foreground">{user?.username}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Rooms Section */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Rooms
            </h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Enter room name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-type">Room Type</Label>
                    <Select value={newRoomType} onValueChange={(value: 'public' | 'private') => setNewRoomType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>Public</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2">
                            <Lock className="w-4 h-4" />
                            <span>Private</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateRoom} className="w-full">
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1">
            {rooms.map((room) => (
              <Button
                key={room.id}
                variant={currentRoom === room.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setCurrentRoom(room.id)}
              >
                <div className="flex items-center space-x-2 w-full">
                  {room.type === 'private' ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Hash className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">{room.name}</span>
                  {room.participants.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {room.participants.length}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Online Users Section */}
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Online Users ({onlineUsers.length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-status-online border-2 border-card rounded-full" />
                </div>
                <span className="text-sm truncate">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
      
      {/* Profile Section */}
      <div className="p-4 border-t border-border">
        <UserProfile />
      </div>
    </div>
  );
};