
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Users, Trash2, Calendar, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type BroadcastType = 'system_announcement' | 'emergency_alert' | 'general_broadcast';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  broadcast_type: BroadcastType;
  created_at: string;
  is_emergency: boolean;
  sender_id: string;
  sender?: {
    full_name: string | null;
    role: string | null;
  };
}

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
        .select(`
          id,
          title,
          content,
          broadcast_type,
          created_at,
          is_emergency,
          sender_id,
          sender:profiles!sender_id(
            full_name,
            role
          )
        `)
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

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('realtime_messages')
        .delete()
        .eq('id', broadcastId)
        .eq('sender_id', user?.id); // Only allow deleting own broadcasts

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Broadcast Deleted",
        description: "The broadcast has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (error) => {
      console.error('Error deleting broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to delete broadcast",
        variant: "destructive",
      });
    },
  });

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async (): Promise<Broadcast[]> => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          title,
          content,
          broadcast_type,
          created_at,
          is_emergency,
          sender_id,
          sender:profiles!sender_id(
            full_name,
            role
          )
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

  const getBroadcastTypeLabel = (type: BroadcastType) => {
    switch (type) {
      case 'system_announcement':
        return 'System Announcement';
      case 'emergency_alert':
        return 'Emergency Alert';
      case 'general_broadcast':
        return 'General Broadcast';
      default:
        return type;
    }
  };

  const getBroadcastTypeColor = (type: BroadcastType) => {
    switch (type) {
      case 'emergency_alert':
        return 'destructive';
      case 'system_announcement':
        return 'default';
      case 'general_broadcast':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderName = (broadcast: Broadcast) => {
    return broadcast.sender?.full_name || `User ${broadcast.sender_id.substring(0, 8)}`;
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
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Enter your broadcast message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{content.length}/1000 characters</p>
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
            Recent Broadcasts ({broadcasts.length})
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
                <div key={broadcast.id} className={`border rounded-lg p-4 ${
                  broadcast.is_emergency ? 'border-red-200 bg-red-50' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {broadcast.title && (
                          <h4 className="font-semibold">{broadcast.title}</h4>
                        )}
                        <Badge variant={getBroadcastTypeColor(broadcast.broadcast_type)}>
                          {getBroadcastTypeLabel(broadcast.broadcast_type)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{broadcast.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{getSenderName(broadcast)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(broadcast.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {broadcast.sender_id === user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this broadcast? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBroadcastMutation.mutate(broadcast.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>No broadcasts sent yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastCenter;
