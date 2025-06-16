
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export const useAgentNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let channel: any = null;

    const setupChannel = async () => {
      console.log('Setting up agent verification notifications channel...');

      const handleNewAgentVerification = async (payload: any) => {
        console.log('New agent verification received!', payload);
        
        const newVerification = payload.new;
        
        // Create a notification for new agent verification
        try {
          const { error } = await supabase
            .from('notifications')
            .insert({
              type: 'new_agent_pending_approval',
              title: 'New Agent Verification Request',
              description: `A new agent has submitted verification documents and is waiting for approval. Account type: ${newVerification.account_type}`,
              user_id: null // This is a system-wide notification for admins
            });

          if (error) {
            console.error('Error creating notification:', error);
          } else {
            console.log('Notification created successfully for new agent verification');
            toast({
              title: "New Agent Verification",
              description: "A new agent has submitted verification documents",
            });
            
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['agent-verifications'] });
          }
        } catch (err) {
          console.error('Failed to create notification:', err);
        }
      };

      const handleAgentVerificationUpdate = async (payload: any) => {
        console.log('Agent verification updated!', payload);
        
        const updatedVerification = payload.new;
        const oldVerification = payload.old;
        
        // Only create notification if status changed to rejected
        if (oldVerification.status !== 'rejected' && updatedVerification.status === 'rejected') {
          try {
            const { error } = await supabase
              .from('notifications')
              .insert({
                type: 'agent_rejected',
                title: 'Agent Verification Rejected',
                description: `An agent verification has been rejected.`,
                user_id: updatedVerification.user_id // Notify the specific agent
              });

            if (error) {
              console.error('Error creating rejection notification:', error);
            } else {
              console.log('Rejection notification created successfully');
            }
          } catch (err) {
            console.error('Failed to create rejection notification:', err);
          }
        }
        
        // Invalidate queries on any update
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['agent-verifications'] });
      };

      // Create a unique channel name
      const channelName = `agent-notifications-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_verifications',
          },
          handleNewAgentVerification
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'agent_verifications',
          },
          handleAgentVerificationUpdate
        );

      // Subscribe to the channel
      const subscription = await channel.subscribe();
      console.log('Agent verification channel subscription status:', subscription);
    };

    setupChannel();

    return () => {
      if (channel) {
        console.log('Cleaning up agent verification channel subscription');
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [queryClient, toast]);
};
