
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeCommunications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time subscription for all communication events
    const channel = supabase
      .channel('communications-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_messages'
        },
        (payload) => {
          console.log('New message received:', payload);
          
          const newMessage = payload.new;
          
          // Invalidate relevant queries based on message type
          if (newMessage.message_type === 'chat') {
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          } else if (newMessage.message_type === 'broadcast') {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
            queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
          } else if (newMessage.message_type === 'emergency') {
            queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
            
            // Show urgent notification for emergency alerts
            if (newMessage.is_emergency) {
              toast({
                title: "🚨 Emergency Alert",
                description: newMessage.title || "New emergency alert received",
                variant: "destructive",
                duration: 10000, // Show for 10 seconds
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'realtime_messages'
        },
        (payload) => {
          console.log('Message updated:', payload);
          // Invalidate all communication queries to reflect updates
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
          queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'realtime_messages'
        },
        (payload) => {
          console.log('Message deleted:', payload);
          // Invalidate all communication queries to reflect deletions
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
          queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['system-announcements'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  return null; // This is a utility hook that doesn't return JSX
};
