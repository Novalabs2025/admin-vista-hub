
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Users } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
}

const LiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data || [];
    },
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
        .select()
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscription
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const getUserInitials = (userId: string) => {
    // Simple fallback - you might want to fetch user data
    return userId.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Chat
            <span className="ml-auto text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" />
              Active
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
                        {getUserInitials(message.sender_id)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
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
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveChat;
