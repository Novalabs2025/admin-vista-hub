
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmergencyAlerts = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent emergency alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['emergency-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles:sender_id (
            full_name
          )
        `)
        .eq('message_type', 'emergency')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Send emergency alert mutation
  const sendAlertMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('realtime_messages')
        .insert({
          sender_id: user?.id,
          title,
          content,
          message_type: 'emergency',
          broadcast_type: 'emergency_alert',
          is_emergency: true,
          recipient_id: null // Send to all users
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
      toast({
        title: 'Emergency alert sent',
        description: 'Emergency alert has been sent to all users immediately.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error sending emergency alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    sendAlertMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Emergency alerts will be sent to all users immediately and marked as high priority. 
          Use only for urgent situations that require immediate attention.
        </AlertDescription>
      </Alert>

      {/* Send Emergency Alert Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Send Emergency Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendAlert} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Alert Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Emergency alert title..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Alert Message</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the emergency situation and required actions..."
                rows={4}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={!title.trim() || !content.trim() || sendAlertMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Emergency Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emergency Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No emergency alerts sent yet
              </p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="border-l-4 border-l-red-500 bg-red-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-800">{alert.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Emergency</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-red-700">{alert.content}</p>
                  <div className="text-xs text-muted-foreground">
                    Sent by: {alert.profiles?.full_name || 'Unknown'}
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

export default EmergencyAlerts;
