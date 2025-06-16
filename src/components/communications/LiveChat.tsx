
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Users, Wifi, Clock } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
}

interface OnlineUser {
  user_id: string;
  full_name: string | null;
  role: string | null;
  last_seen: string;
}

const LiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async (): Promise<Message[]> => {
      // First get the messages
      const { data: messageData, error: messagesError } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id
        `)
        .eq('message_type', 'chat')
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;
      if (!messageData) return [];

      // Get sender profiles separately
      const senderIds = [...new Set(messageData.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', senderIds);

      // Combine the data
      return messageData.map(message => {
        const sender = profiles?.find(p => p.id === message.sender_id);
        return {
          ...message,
          sender_name: sender?.full_name || null,
          sender_role: sender?.role || null
        };
      });
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .insert({
          sender_id: user?.id || '',
          content,
          message_type: 'chat'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_messages',
          filter: 'message_type=eq.chat'
        },
        (payload) => {
          console.log('New message received:', payload);
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Set up presence tracking for online users
  useEffect(() => {
    const presenceChannel = supabase.channel('chat-presence');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach(userId => {
          const presences = state[userId];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            users.push({
              user_id: userId,
              full_name: presence.full_name || null,
              role: presence.role || null,
              last_seen: presence.online_at || new Date().toISOString()
            });
          }
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          // Get user profile for presence
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();

          await presenceChannel.track({
            user_id: user.id,
            full_name: profile?.full_name || 'Unknown User',
            role: profile?.role || 'admin',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (message: Message) => {
    if (message.sender_name) {
      return message.sender_name;
    }
    return `User ${message.sender_id.substring(0, 8)}`;
  };

  const getUserRole = (message: Message) => {
    return message.sender_role || 'admin';
  };

  const getUserInitials = (message: Message) => {
    const name = getUserDisplayName(message);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Online Users Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Online Users ({onlineUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((onlineUser) => (
              <div key={onlineUser.user_id} className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {onlineUser.full_name || 'Unknown User'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {onlineUser.role}
                </Badge>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <span className="text-sm text-muted-foreground">No users online</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Chat
            <span className="ml-auto text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Wifi className="h-4 w-4 text-green-500" />
              Connected
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_id === user?.id ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(message)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          message.sender_id === user?.id
                            ? 'text-primary-foreground/90'
                            : 'text-muted-foreground'
                        }`}>
                          {getUserDisplayName(message)}
                        </span>
                        <Badge 
                          variant={getUserRole(message) === 'admin' ? 'default' : 'secondary'}
                          className="text-xs px-1 py-0"
                        >
                          {getUserRole(message)}
                        </Badge>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <p className={`text-xs ${
                          message.sender_id === user?.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </ScrollArea>
          
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                maxLength={1000}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-1">
              {newMessage.length}/1000 characters
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveChat;
