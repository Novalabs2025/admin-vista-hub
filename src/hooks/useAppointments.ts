
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuccessMetrics } from './useSuccessMetrics';

export interface Appointment {
  id: string;
  agent_id: string;
  seeker_id?: string;
  seeker_name: string;
  seeker_email?: string;
  seeker_phone?: string;
  property_id?: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
  notes?: string;
  location?: string;
  duration_minutes?: number;
  reminder_sent?: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

interface CreateAppointmentData {
  agent_id: string;
  seeker_name: string;
  appointment_date: string;
  appointment_type: string;
  seeker_email?: string;
  seeker_phone?: string;
  property_id?: string;
  notes?: string;
  location?: string;
  duration_minutes?: number;
  status?: string;
}

export const useAppointments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackEngagement, trackConversion } = useSuccessMetrics();

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching appointments:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Track engagement and conversion
      trackEngagement.mutate({
        agentId: data.agent_id,
        seekerId: data.seeker_id,
        metricType: 'appointment_book',
        metadata: { appointment_type: data.appointment_type }
      });
      
      trackConversion.mutate({
        agentId: data.agent_id,
        seekerId: data.seeker_id,
        conversionStage: 'appointment',
        propertyId: data.property_id
      });
      
      toast({
        title: "Success",
        description: "Appointment created successfully",
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

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
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

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
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
    appointments,
    isLoading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
