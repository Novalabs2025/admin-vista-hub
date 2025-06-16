
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Radio, AlertTriangle, Megaphone } from 'lucide-react';
import LiveChat from '@/components/communications/LiveChat';
import BroadcastCenter from '@/components/communications/BroadcastCenter';
import EmergencyAlerts from '@/components/communications/EmergencyAlerts';
import SystemAnnouncements from '@/components/communications/SystemAnnouncements';
import { useAuth } from '@/contexts/AuthContext';

const Communications = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Hub</h1>
          <p className="text-muted-foreground">
            Real-time messaging, broadcasts, and system announcements
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="flex items-center gap-2" disabled={!isAdmin}>
            <Radio className="h-4 w-4" />
            Broadcasts
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2" disabled={!isAdmin}>
            <AlertTriangle className="h-4 w-4" />
            Emergency
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
                Real-time messaging between admins and agents
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
                Send messages to all users or specific groups
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
                Send urgent alerts to all users immediately
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
                View and manage system-wide announcements
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
