
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

type Notification = Tables<'notifications'>;

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, roles } = useAuth();

  // Check if user is admin or super_admin
  const isAdmin = roles?.includes('admin') || roles?.includes('super_admin');

  const { data: notifications, ...queryInfo } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      let query = supabase.from('notifications').select('*');
      
      if (isAdmin) {
        // Admins get both their own notifications and system-wide notifications (user_id is null)
        query = query.or(`user_id.eq.${user?.id},user_id.is.null`);
      } else {
        // Regular users only get their own notifications
        query = query.eq('user_id', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notifications:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user, // Only run query when user is available
  });

  useEffect(() => {
    let channel: any = null;

    const setupChannel = async () => {
      const handleNewNotification = (payload: any) => {
        console.log('New notification received!', payload);
        const newNotification = payload.new as Notification;
        
        // Only show toast for notifications relevant to current user
        const isRelevantNotification = isAdmin ? 
          (newNotification.user_id === user?.id || newNotification.user_id === null) :
          (newNotification.user_id === user?.id);
          
        if (isRelevantNotification) {
          toast({
            title: newNotification.title,
            description: newNotification.description,
          });
        }
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };
      
      const handleNotificationUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      // Create a unique channel name to avoid conflicts
      const channelName = `notifications-main-${Date.now()}`;
      
      channel = supabase
        .channel(channelName)
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
        );

      // Subscribe to the channel
      const subscription = await channel.subscribe();
      console.log('Main notification channel subscription status:', subscription);
    };

    if (user) {
      setupChannel();
    }

    return () => {
      if (channel) {
        console.log('Cleaning up main notification channel subscription');
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [queryClient, toast, user, isAdmin]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return { notifications, unreadCount, ...queryInfo };
};
