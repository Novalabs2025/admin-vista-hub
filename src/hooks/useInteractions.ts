
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Interaction {
  id: string;
  agent_id: string;
  seeker_id?: string;
  seeker_name: string;
  seeker_contact?: string;
  deal_id?: string;
  appointment_id?: string;
  interaction_type: string;
  interaction_date: string;
  duration_minutes?: number;
  outcome?: string;
  notes?: string;
  attachments?: any;
  created_at: string;
}

interface CreateInteractionData {
  agent_id: string;
  seeker_name: string;
  interaction_type: string;
  seeker_id?: string;
  seeker_contact?: string;
  deal_id?: string;
  appointment_id?: string;
  interaction_date?: string;
  duration_minutes?: number;
  outcome?: string;
  notes?: string;
  attachments?: any;
}

export const useInteractions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interactions, isLoading, error } = useQuery({
    queryKey: ['interactions'],
    queryFn: async (): Promise<Interaction[]> => {
      const { data, error } = await supabase
        .from('agent_seeker_interactions')
        .select('*')
        .order('interaction_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching interactions:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const createInteraction = useMutation({
    mutationFn: async (interactionData: CreateInteractionData) => {
      const { data, error } = await supabase
        .from('agent_seeker_interactions')
        .insert(interactionData)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast({
        title: "Success",
        description: "Interaction logged successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    interactions,
    isLoading,
    error,
    createInteraction,
  };
};
