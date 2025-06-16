
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SystemAnnouncements = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Fetch system announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['system-announcements'],
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
          profiles:sender_id (
            full_name
          )
        `)
        .in('message_type', ['announcement', 'broadcast', 'emergency'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          <h3 className="text-lg font-semibold">System Announcements</h3>
        </div>
        {!isAdmin && (
          <Badge variant="secondary">Read Only</Badge>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`${
                announcement.is_emergency 
                  ? 'border-l-4 border-l-red-500 bg-red-50' 
                  : announcement.message_type === 'broadcast'
                  ? 'border-l-4 border-l-blue-500 bg-blue-50'
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {announcement.is_emergency && (
                      <Badge variant="destructive">Emergency</Badge>
                    )}
                    {announcement.message_type === 'broadcast' && (
                      <Badge variant="default">Broadcast</Badge>
                    )}
                    {announcement.message_type === 'announcement' && (
                      <Badge variant="secondary">Announcement</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className={`text-sm ${
                  announcement.is_emergency ? 'text-red-700' : 'text-muted-foreground'
                }`}>
                  {announcement.content}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>By: {announcement.profiles?.full_name || 'System'}</span>
                    {announcement.broadcast_type && (
                      <span>Type: {announcement.broadcast_type.replace('_', ' ')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(announcement.created_at).toLocaleDateString()} at{' '}
                      {new Date(announcement.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemAnnouncements;
