
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export const usePropertyNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let channel: any = null;

    const setupChannel = async () => {
      console.log('Setting up property notifications channel...');

      const handleNewProperty = async (payload: any) => {
        console.log('New property submitted!', payload);
        
        const newProperty = payload.new;
        
        // Create a notification for new property submission
        try {
          const { error } = await supabase
            .from('notifications')
            .insert({
              type: 'property_submitted',
              title: 'New Property Submission',
              description: `A new ${newProperty.property_type} property has been submitted for approval at ${newProperty.address}`,
              user_id: null // System-wide notification for admins
            });

          if (error) {
            console.error('Error creating property notification:', error);
          } else {
            console.log('Property notification created successfully');
            toast({
              title: "New Property Submission",
              description: `A new ${newProperty.property_type} property has been submitted`,
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (err) {
          console.error('Failed to create property notification:', err);
        }
      };

      const handlePropertyUpdate = async (payload: any) => {
        console.log('Property updated!', payload);
        
        const updatedProperty = payload.new;
        const oldProperty = payload.old;
        
        // Create notifications for status changes
        if (oldProperty.status !== updatedProperty.status) {
          let notificationType = '';
          let title = '';
          let description = '';
          
          if (updatedProperty.status === 'approved') {
            notificationType = 'property_approved';
            title = 'Property Approved';
            description = `Your property at ${updatedProperty.address} has been approved and is now live`;
          } else if (updatedProperty.status === 'rejected') {
            notificationType = 'property_rejected';
            title = 'Property Rejected';
            description = `Your property at ${updatedProperty.address} has been rejected. ${updatedProperty.rejection_reason || 'Please contact support for details.'}`;
          }
          
          if (notificationType) {
            try {
              const { error } = await supabase
                .from('notifications')
                .insert({
                  type: notificationType,
                  title,
                  description,
                  user_id: updatedProperty.agent_id // Notify the specific agent
                });

              if (error) {
                console.error('Error creating property status notification:', error);
              } else {
                console.log('Property status notification created successfully');
              }
            } catch (err) {
              console.error('Failed to create property status notification:', err);
            }
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      // Create a unique channel name
      const channelName = `property-notifications-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'properties',
          },
          handleNewProperty
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'properties',
          },
          handlePropertyUpdate
        );

      // Subscribe to the channel
      const subscription = await channel.subscribe();
      console.log('Property notifications channel subscription status:', subscription);
    };

    setupChannel();

    return () => {
      if (channel) {
        console.log('Cleaning up property notifications channel subscription');
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [queryClient, toast]);
};
