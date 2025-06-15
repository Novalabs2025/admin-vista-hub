
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from "@/components/ui/use-toast";

type Notification = Tables<'notifications'>;

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, ...queryInfo } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notifications:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  useEffect(() => {
    const handleNewNotification = (payload: any) => {
        console.log('New notification received!', payload);
        toast({
          title: "New Notification",
          description: (payload.new as Notification).title,
        });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    
    const handleNotificationUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const channel = supabase
      .channel('realtime-notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        handleNewNotification
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        handleNotificationUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return { notifications, unreadCount, ...queryInfo };
};
