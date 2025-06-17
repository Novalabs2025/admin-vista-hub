
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

type WhatsAppVoiceMessage = Tables<'whatsapp_voice_messages'>;

export const useWhatsAppVoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: voiceMessages, isLoading, error } = useQuery({
    queryKey: ['whatsapp-voice-messages'],
    queryFn: async (): Promise<WhatsAppVoiceMessage[]> => {
      const { data, error } = await supabase
        .from('whatsapp_voice_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching voice messages:', error);
        throw new Error(error.message);
      }

      return data || [];
    },
  });

  // Set up real-time subscription for voice messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-voice-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_voice_messages',
        },
        (payload) => {
          console.log('Voice message update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Voice Message",
              description: "A new voice message has been received",
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as WhatsAppVoiceMessage;
            if (updated.transcription_status === 'completed') {
              toast({
                title: "Transcription Complete",
                description: "Voice message has been transcribed",
              });
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['whatsapp-voice-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('whatsapp_voice_messages')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-voice-messages'] });
    }
  };

  const retranscribe = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-voice-message', {
        body: { voiceMessageId: messageId, retranscribe: true }
      });

      if (error) throw error;

      toast({
        title: "Processing",
        description: "Retranscription started",
      });
    } catch (error) {
      console.error('Error retranscribing:', error);
      toast({
        title: "Error",
        description: "Failed to start retranscription",
        variant: "destructive",
      });
    }
  };

  return {
    voiceMessages,
    isLoading,
    error,
    markAsRead,
    retranscribe
  };
};
