
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Send } from 'lucide-react';

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
        .select()
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

  const { data: emergencyAlerts, isLoading } = useQuery({
    queryKey: ['emergency-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;
      return data || [];
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

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-semibold">Emergency Alert System</h3>
        </div>
        <p className="text-red-700 text-sm">
          Emergency alerts are sent immediately to all users and should only be used for urgent situations.
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
            />
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
            />
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
            Recent Emergency Alerts
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
                      {alert.title && (
                        <h4 className="font-semibold text-red-800 mb-1">{alert.title}</h4>
                      )}
                      <p className="text-red-700 mb-2">{alert.content}</p>
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Emergency Alert</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No emergency alerts sent</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyAlerts;
