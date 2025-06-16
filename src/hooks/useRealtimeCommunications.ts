
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeCommunications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let messageChannel: any = null;

    const setupRealtimeSubscriptions = async () => {
      console.log('Setting up realtime communications...');

      // Handle new messages
      const handleNewMessage = (payload: any) => {
        console.log('New realtime message:', payload);
        const newMessage = payload.new;
        
        // Invalidate relevant queries based on message type
        if (newMessage.message_type === 'chat') {
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
        } else if (newMessage.message_type === 'broadcast') {
          queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
        } else if (newMessage.message_type === 'emergency') {
          queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
          
          // Show urgent toast for emergency messages
          if (newMessage.is_emergency) {
            toast({
              title: "Emergency Alert",
              description: newMessage.title || newMessage.content,
              variant: "destructive",
            });
          }
        }
        
        // Update system announcements if it's a broadcast type
        if (newMessage.broadcast_type) {
          queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
        }
      };

      // Create channel for realtime messages
      const channelName = `realtime-communications-${Date.now()}`;
      
      messageChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_messages',
          },
          handleNewMessage
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'realtime_messages',
          },
          () => {
            // Invalidate all message queries on updates
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
            queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
            queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
          }
        );

      const subscription = await messageChannel.subscribe();
      console.log('Realtime communications subscription status:', subscription);
    };

    setupRealtimeSubscriptions();

    return () => {
      if (messageChannel) {
        console.log('Cleaning up realtime communications subscription');
        supabase.removeChannel(messageChannel);
        messageChannel = null;
      }
    };
  }, [queryClient, toast]);
};
