
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Deal {
  id: string;
  agent_id: string;
  seeker_id?: string;
  seeker_name: string;
  seeker_email?: string;
  seeker_phone?: string;
  property_id?: string;
  deal_value?: number;
  commission_amount?: number;
  stage: string;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateDealData {
  agent_id: string;
  seeker_name: string;
  stage: string;
  seeker_email?: string;
  seeker_phone?: string;
  property_id?: string;
  deal_value?: number;
  commission_amount?: number;
  probability?: number;
  expected_close_date?: string;
  source?: string;
  notes?: string;
}

export const useDeals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching deals:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const createDeal = useMutation({
    mutationFn: async (dealData: CreateDealData) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Success",
        description: "Deal created successfully",
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

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Success",
        description: "Deal updated successfully",
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
    deals,
    isLoading,
    error,
    createDeal,
    updateDeal,
  };
};
