
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone, Calendar, AlertTriangle, Info } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  broadcast_type: 'system_announcement' | 'emergency_alert' | 'general_broadcast';
  created_at: string;
  is_emergency: boolean;
}

const SystemAnnouncements = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['system-announcements'],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from('realtime_messages')
        .select(`
          id,
          title,
          content,
          broadcast_type,
          created_at,
          is_emergency
        `)
        .in('broadcast_type', ['system_announcement', 'emergency_alert', 'general_broadcast'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const getAnnouncementIcon = (announcement: Announcement) => {
    if (announcement.is_emergency || announcement.broadcast_type === 'emergency_alert') {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (announcement.broadcast_type === 'system_announcement') {
      return <Info className="h-5 w-5 text-blue-500" />;
    }
    return <Megaphone className="h-5 w-5 text-gray-500" />;
  };

  const getAnnouncementBadge = (announcement: Announcement) => {
    if (announcement.is_emergency || announcement.broadcast_type === 'emergency_alert') {
      return <Badge variant="destructive">Emergency</Badge>;
    }
    if (announcement.broadcast_type === 'system_announcement') {
      return <Badge variant="default">System</Badge>;
    }
    return <Badge variant="secondary">General</Badge>;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            System Announcements
            {!isAdmin && (
              <Badge variant="outline" className="ml-auto">
                View Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading announcements...</div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`border rounded-lg p-4 ${
                      announcement.is_emergency || announcement.broadcast_type === 'emergency_alert'
                        ? 'border-red-200 bg-red-50'
                        : announcement.broadcast_type === 'system_announcement'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAnnouncementIcon(announcement)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.title && (
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          )}
                          {getAnnouncementBadge(announcement)}
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mb-4 opacity-50" />
                <p>No announcements available</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAnnouncements;
