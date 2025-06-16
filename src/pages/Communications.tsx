
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Radio, AlertTriangle, Megaphone, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LiveChat from '@/components/communications/LiveChat';
import BroadcastCenter from '@/components/communications/BroadcastCenter';
import EmergencyAlerts from '@/components/communications/EmergencyAlerts';
import SystemAnnouncements from '@/components/communications/SystemAnnouncements';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeCommunications } from '@/hooks/useRealtimeCommunications';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Communications = () => {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole('admin');

  // Set up real-time communications
  useRealtimeCommunications();

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .rpc('get_unread_message_count');

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
      
      return data || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Hub</h1>
          <p className="text-muted-foreground">
            Real-time messaging, broadcasts, and system announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Live Chat
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="broadcasts" 
            className="flex items-center gap-2" 
            disabled={!isAdmin}
          >
            <Radio className="h-4 w-4" />
            Broadcasts
            {!isAdmin && <span className="text-xs">(Admin Only)</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="emergency" 
            className="flex items-center gap-2" 
            disabled={!isAdmin}
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency
            {!isAdmin && <span className="text-xs">(Admin Only)</span>}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Chat</CardTitle>
              <CardDescription>
                Real-time messaging between admins and agents with presence tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveChat />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Center</CardTitle>
              <CardDescription>
                Send messages to all users or specific groups with different priority levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BroadcastCenter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Alerts</CardTitle>
              <CardDescription>
                Send urgent alerts to all users immediately with high priority notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmergencyAlerts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Announcements</CardTitle>
              <CardDescription>
                View and manage system-wide announcements, broadcasts, and emergency alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemAnnouncements />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communications;
