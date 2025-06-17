
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveChat from '@/components/communications/LiveChat';
import BroadcastCenter from '@/components/communications/BroadcastCenter';
import SystemAnnouncements from '@/components/communications/SystemAnnouncements';
import EmergencyAlerts from '@/components/communications/EmergencyAlerts';
import WhatsAppVoiceManager from '@/components/communications/WhatsAppVoiceManager';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useRealtimeCommunications } from '@/hooks/useRealtimeCommunications';

export default function Communications() {
  // Set up system notifications and realtime communications
  useSystemNotifications();
  useRealtimeCommunications();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="text-gray-600">Manage all communication channels and messaging</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Voice</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <LiveChat />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppVoiceManager />
        </TabsContent>

        <TabsContent value="broadcast">
          <BroadcastCenter />
        </TabsContent>

        <TabsContent value="announcements">
          <SystemAnnouncements />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
