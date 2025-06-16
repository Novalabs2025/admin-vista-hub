import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Send, Calendar, User, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface EmergencyAlert {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_emergency: boolean;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
}

const EmergencyAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const sendEmergencyAlertMutation = useMutation({
    mutationFn: async (alertData: {
      title: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .insert({
          sender_id: user?.id || '',
          recipient_id: null, // null for broadcast messages
          message_type: 'emergency',
          broadcast_type: 'emergency_alert',
          title: alertData.title,
          content: alertData.content,
          is_emergency: true
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Emergency Alert Sent",
        description: "Emergency alert has been sent to all users",
      });
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
    onError: (error) => {
      console.error('Error sending emergency alert:', error);
      toast({
        title: "Error",
        description: "Failed to send emergency alert",
        variant: "destructive",
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('realtime_messages')
        .delete()
        .eq('id', alertId)
        .eq('sender_id', user?.id); // Only allow deleting own alerts

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Alert Deleted",
        description: "The emergency alert has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
    onError: (error) => {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    },
  });

  const { data: emergencyAlerts = [], isLoading } = useQuery({
    queryKey: ['emergency-alerts'],
    queryFn: async (): Promise<EmergencyAlert[]> => {
      // First get the messages
      const { data: messages, error: messagesError } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          title,
          content,
          created_at,
          is_emergency,
          sender_id
        `)
        .eq('message_type', 'emergency')
        .eq('is_emergency', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (messagesError) throw messagesError;
      if (!messages) return [];

      // Get sender profiles separately
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', senderIds);

      // Combine the data
      return messages.map(message => {
        const sender = profiles?.find(p => p.id === message.sender_id);
        return {
          ...message,
          sender_name: sender?.full_name || null,
          sender_role: sender?.role || null
        };
      });
    },
  });

  const handleSendAlert = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter an alert message",
        variant: "destructive",
      });
      return;
    }

    sendEmergencyAlertMutation.mutate({
      title,
      content,
    });
  };

  const getSenderName = (alert: EmergencyAlert) => {
    return alert.sender_name || `User ${alert.sender_id.substring(0, 8)}`;
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

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-semibold">Emergency Alert System</h3>
        </div>
        <p className="text-red-700 text-sm">
          Emergency alerts are sent immediately to all users and should only be used for urgent situations.
          All emergency alerts are logged and tracked for accountability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Send Emergency Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alert-title">Alert Title</Label>
            <Input
              id="alert-title"
              placeholder="URGENT: Enter alert title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-red-300 focus:border-red-500"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-content">Alert Message</Label>
            <Textarea
              id="alert-content"
              placeholder="Enter emergency alert details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="border-red-300 focus:border-red-500"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{content.length}/1000 characters</p>
          </div>

          <Button
            onClick={handleSendAlert}
            disabled={sendEmergencyAlertMutation.isPending || !content.trim()}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {sendEmergencyAlertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Alert...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Send Emergency Alert
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Emergency Alerts ({emergencyAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : emergencyAlerts && emergencyAlerts.length > 0 ? (
            <div className="space-y-4">
              {emergencyAlerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {alert.title && (
                          <h4 className="font-semibold text-red-800">{alert.title}</h4>
                        )}
                        <Badge variant="destructive">Emergency</Badge>
                      </div>
                      <p className="text-red-700 mb-3 whitespace-pre-wrap">{alert.content}</p>
                      <div className="flex items-center gap-4 text-sm text-red-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{getSenderName(alert)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {alert.sender_id === user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Emergency Alert</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this emergency alert? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAlertMutation.mutate(alert.id)}
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
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <p>No emergency alerts sent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyAlerts;
