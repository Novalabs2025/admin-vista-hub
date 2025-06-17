
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConversationAnalytics {
  id: string;
  agent_id: string;
  seeker_id?: string;
  conversation_id?: string;
  total_messages: number;
  agent_messages: number;
  seeker_messages: number;
  avg_response_time_minutes: number;
  first_response_time_minutes?: number;
  conversation_duration_minutes?: number;
  engagement_score: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EngagementMetric {
  id: string;
  agent_id: string;
  seeker_id?: string;
  metric_type: string;
  metric_value: number;
  interaction_date: string;
  metadata?: any;
  created_at: string;
}

export interface ConversionTracking {
  id: string;
  agent_id: string;
  seeker_id?: string;
  conversion_stage: string;
  conversion_date: string;
  deal_id?: string;
  property_id?: string;
  conversion_value?: number;
  time_to_conversion_hours?: number;
  previous_stage?: string;
  created_at: string;
}

export interface SuccessMetricsSummary {
  id: string;
  agent_id: string;
  period_start: string;
  period_end: string;
  total_conversations: number;
  avg_response_time_minutes: number;
  total_engagements: number;
  conversion_rate: number;
  deals_closed: number;
  total_deal_value: number;
  avg_deal_closure_time_days: number;
  top_performing_hours?: any;
  engagement_breakdown?: any;
  created_at: string;
  updated_at: string;
}

export const useSuccessMetrics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversationAnalytics, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversationAnalytics'],
    queryFn: async (): Promise<ConversationAnalytics[]> => {
      const { data, error } = await supabase
        .from('conversation_analytics')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversation analytics:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const { data: engagementMetrics, isLoading: engagementLoading } = useQuery({
    queryKey: ['engagementMetrics'],
    queryFn: async (): Promise<EngagementMetric[]> => {
      const { data, error } = await supabase
        .from('engagement_metrics')
        .select('*')
        .order('interaction_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching engagement metrics:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const { data: conversionTracking, isLoading: conversionLoading } = useQuery({
    queryKey: ['conversionTracking'],
    queryFn: async (): Promise<ConversionTracking[]> => {
      const { data, error } = await supabase
        .from('conversion_tracking')
        .select('*')
        .order('conversion_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversion tracking:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const { data: successSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['successSummary'],
    queryFn: async (): Promise<SuccessMetricsSummary[]> => {
      const { data, error } = await supabase
        .from('success_metrics_summary')
        .select('*')
        .order('period_end', { ascending: false });
      
      if (error) {
        console.error('Error fetching success summary:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });

  const trackEngagement = useMutation({
    mutationFn: async ({
      agentId,
      seekerId,
      metricType,
      metricValue = 1,
      metadata
    }: {
      agentId: string;
      seekerId?: string;
      metricType: string;
      metricValue?: number;
      metadata?: any;
    }) => {
      const { error } = await supabase.rpc('track_engagement_metric', {
        p_agent_id: agentId,
        p_seeker_id: seekerId,
        p_metric_type: metricType,
        p_metric_value: metricValue,
        p_metadata: metadata
      });
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementMetrics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const trackConversion = useMutation({
    mutationFn: async ({
      agentId,
      seekerId,
      conversionStage,
      dealId,
      propertyId,
      conversionValue
    }: {
      agentId: string;
      seekerId?: string;
      conversionStage: string;
      dealId?: string;
      propertyId?: string;
      conversionValue?: number;
    }) => {
      const { error } = await supabase.rpc('track_conversion', {
        p_agent_id: agentId,
        p_seeker_id: seekerId,
        p_conversion_stage: conversionStage,
        p_deal_id: dealId,
        p_property_id: propertyId,
        p_conversion_value: conversionValue
      });
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversionTracking'] });
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
    conversationAnalytics,
    engagementMetrics,
    conversionTracking,
    successSummary,
    isLoading: conversationLoading || engagementLoading || conversionLoading || summaryLoading,
    trackEngagement,
    trackConversion,
  };
};
