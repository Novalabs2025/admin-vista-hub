
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Users } from 'lucide-react';

type BroadcastType = 'system_announcement' | 'emergency_alert' | 'general_broadcast';

const BroadcastCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('general_broadcast');

  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcastData: {
      title: string;
      content: string;
      broadcast_type: BroadcastType;
    }) => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .insert({
          sender_id: user?.id || '',
          recipient_id: null, // null for broadcast messages
          message_type: 'broadcast',
          broadcast_type: broadcastData.broadcast_type,
          title: broadcastData.title,
          content: broadcastData.content,
          is_emergency: broadcastData.broadcast_type === 'emergency_alert'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Broadcast Sent",
        description: "Your message has been broadcast to all users",
      });
      setTitle('');
      setContent('');
      setBroadcastType('general_broadcast');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (error) => {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to send broadcast message",
        variant: "destructive",
      });
    },
  });

  const { data: broadcasts, isLoading } = useQuery({
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
          is_emergency,
          sender_id
        `)
        .eq('message_type', 'broadcast')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  const handleSendBroadcast = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendBroadcastMutation.mutate({
      title,
      content,
      broadcast_type: broadcastType,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Broadcast Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-type">Message Type</Label>
            <Select value={broadcastType} onValueChange={(value: BroadcastType) => setBroadcastType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select broadcast type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_broadcast">General Broadcast</SelectItem>
                <SelectItem value="system_announcement">System Announcement</SelectItem>
                <SelectItem value="emergency_alert">Emergency Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Enter broadcast title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Enter your broadcast message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleSendBroadcast}
            disabled={sendBroadcastMutation.isPending || !content.trim()}
            className="w-full"
          >
            {sendBroadcastMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Broadcast
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Broadcasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : broadcasts && broadcasts.length > 0 ? (
            <div className="space-y-4">
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {broadcast.title && (
                        <h4 className="font-semibold mb-1">{broadcast.title}</h4>
                      )}
                      <p className="text-gray-700 mb-2">{broadcast.content}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          broadcast.broadcast_type === 'emergency_alert' 
                            ? 'bg-red-100 text-red-800'
                            : broadcast.broadcast_type === 'system_announcement'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {broadcast.broadcast_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span>{new Date(broadcast.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No broadcasts sent yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastCenter;
