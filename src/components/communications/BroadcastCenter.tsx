
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Send, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const BroadcastCenter = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent broadcasts
  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          title,
          content,
          broadcast_type,
          created_at,
          profiles:sender_id (
            full_name
          )
        `)
        .eq('message_type', 'broadcast')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Send broadcast mutation
  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('realtime_messages')
        .insert({
          sender_id: user?.id,
          title,
          content,
          message_type: 'broadcast',
          broadcast_type: broadcastType,
          recipient_id: null // Broadcast to all
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      setBroadcastType('');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast({
        title: 'Broadcast sent',
        description: 'Your message has been sent to all users.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error sending broadcast',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !broadcastType) return;
    sendBroadcastMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Send Broadcast Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Send Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Broadcast Type</label>
              <Select value={broadcastType} onValueChange={setBroadcastType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select broadcast type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system_announcement">System Announcement</SelectItem>
                  <SelectItem value="general_broadcast">General Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Broadcast title..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your broadcast message..."
                rows={4}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={!title.trim() || !content.trim() || !broadcastType || sendBroadcastMutation.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Broadcast
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {broadcasts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No broadcasts sent yet
              </p>
            ) : (
              broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{broadcast.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {broadcast.broadcast_type?.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(broadcast.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{broadcast.content}</p>
                  <div className="text-xs text-muted-foreground">
                    Sent by: {broadcast.profiles?.full_name || 'Unknown'}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastCenter;
