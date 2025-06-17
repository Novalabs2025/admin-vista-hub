export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_invitations: {
        Row: {
          accepted: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string
          avg_response_time: number | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          leads_generated: number | null
          properties_listed: number | null
          revenue_generated: number | null
          satisfaction_score: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          avg_response_time?: number | null
          conversions?: number | null
          created_at?: string | null
          date: string
          id?: string
          leads_generated?: number | null
          properties_listed?: number | null
          revenue_generated?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          avg_response_time?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          leads_generated?: number | null
          properties_listed?: number | null
          revenue_generated?: number | null
          satisfaction_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_seeker_interactions: {
        Row: {
          agent_id: string
          appointment_id: string | null
          attachments: Json | null
          created_at: string
          deal_id: string | null
          duration_minutes: number | null
          id: string
          interaction_date: string
          interaction_type: string
          notes: string | null
          outcome: string | null
          seeker_contact: string | null
          seeker_id: string | null
          seeker_name: string
        }
        Insert: {
          agent_id: string
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string
          interaction_type: string
          notes?: string | null
          outcome?: string | null
          seeker_contact?: string | null
          seeker_id?: string | null
          seeker_name: string
        }
        Update: {
          agent_id?: string
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          notes?: string | null
          outcome?: string | null
          seeker_contact?: string | null
          seeker_id?: string | null
          seeker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_appointment"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_deal"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_verifications: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          business_name: string | null
          cac_document_url: string | null
          created_at: string
          id: string
          id_document_url: string | null
          license_document_url: string | null
          location: string | null
          location_focus: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          business_name?: string | null
          cac_document_url?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          location?: string | null
          location_focus?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          business_name?: string | null
          cac_document_url?: string | null
          created_at?: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          location?: string | null
          location_focus?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          avg_property_price: number | null
          created_at: string | null
          date: string
          id: string
          new_agents: number | null
          new_leads: number | null
          new_properties: number | null
          total_agents: number | null
          total_leads: number | null
          total_properties: number | null
          total_revenue: number | null
        }
        Insert: {
          avg_property_price?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_agents?: number | null
          new_leads?: number | null
          new_properties?: number | null
          total_agents?: number | null
          total_leads?: number | null
          total_properties?: number | null
          total_revenue?: number | null
        }
        Update: {
          avg_property_price?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_agents?: number | null
          new_leads?: number | null
          new_properties?: number | null
          total_agents?: number | null
          total_leads?: number | null
          total_properties?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          agent_id: string
          appointment_date: string
          appointment_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          location: string | null
          notes: string | null
          property_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          seeker_email: string | null
          seeker_id: string | null
          seeker_name: string
          seeker_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          appointment_date: string
          appointment_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          seeker_email?: string | null
          seeker_id?: string | null
          seeker_name: string
          seeker_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          appointment_date?: string
          appointment_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          property_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          seeker_email?: string | null
          seeker_id?: string | null
          seeker_name?: string
          seeker_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_appointments_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_reminders: {
        Row: {
          appointment_id: string
          created_at: string
          error_message: string | null
          id: string
          message_template: string
          reminder_time: string
          reminder_type: string
          sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_template: string
          reminder_time: string
          reminder_type: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_template?: string
          reminder_time?: string
          reminder_type?: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reminders_appointment"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_analytics: {
        Row: {
          agent_id: string
          agent_messages: number | null
          avg_response_time_minutes: number | null
          conversation_duration_minutes: number | null
          conversation_id: string | null
          created_at: string
          engagement_score: number | null
          first_response_time_minutes: number | null
          id: string
          last_activity_at: string | null
          seeker_id: string | null
          seeker_messages: number | null
          total_messages: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_messages?: number | null
          avg_response_time_minutes?: number | null
          conversation_duration_minutes?: number | null
          conversation_id?: string | null
          created_at?: string
          engagement_score?: number | null
          first_response_time_minutes?: number | null
          id?: string
          last_activity_at?: string | null
          seeker_id?: string | null
          seeker_messages?: number | null
          total_messages?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_messages?: number | null
          avg_response_time_minutes?: number | null
          conversation_duration_minutes?: number | null
          conversation_id?: string | null
          created_at?: string
          engagement_score?: number | null
          first_response_time_minutes?: number | null
          id?: string
          last_activity_at?: string | null
          seeker_id?: string | null
          seeker_messages?: number | null
          total_messages?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant1_id: string
          participant2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant1_id: string
          participant2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant1_id?: string
          participant2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_tracking: {
        Row: {
          agent_id: string
          conversion_date: string
          conversion_stage: string
          conversion_value: number | null
          created_at: string
          deal_id: string | null
          id: string
          previous_stage: string | null
          property_id: string | null
          seeker_id: string | null
          time_to_conversion_hours: number | null
        }
        Insert: {
          agent_id: string
          conversion_date?: string
          conversion_stage: string
          conversion_value?: number | null
          created_at?: string
          deal_id?: string | null
          id?: string
          previous_stage?: string | null
          property_id?: string | null
          seeker_id?: string | null
          time_to_conversion_hours?: number | null
        }
        Update: {
          agent_id?: string
          conversion_date?: string
          conversion_stage?: string
          conversion_value?: number | null
          created_at?: string
          deal_id?: string | null
          id?: string
          previous_stage?: string | null
          property_id?: string | null
          seeker_id?: string | null
          time_to_conversion_hours?: number | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close_date: string | null
          agent_id: string
          commission_amount: number | null
          created_at: string
          deal_value: number | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          property_id: string | null
          seeker_email: string | null
          seeker_id: string | null
          seeker_name: string
          seeker_phone: string | null
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          agent_id: string
          commission_amount?: number | null
          created_at?: string
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          property_id?: string | null
          seeker_email?: string | null
          seeker_id?: string | null
          seeker_name: string
          seeker_phone?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          agent_id?: string
          commission_amount?: number | null
          created_at?: string
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          property_id?: string | null
          seeker_email?: string | null
          seeker_id?: string | null
          seeker_name?: string
          seeker_phone?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_deals_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_metrics: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          interaction_date: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          seeker_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          interaction_date?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          seeker_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          interaction_date?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          seeker_id?: string | null
        }
        Relationships: []
      }
      lead_ai_scores: {
        Row: {
          agent_id: string
          ai_insights: Json | null
          conversion_probability: number
          created_at: string
          engagement_score: number
          financial_readiness_score: number
          id: string
          lead_id: string
          scoring_factors: Json | null
          updated_at: string
          urgency_score: number
        }
        Insert: {
          agent_id: string
          ai_insights?: Json | null
          conversion_probability: number
          created_at?: string
          engagement_score: number
          financial_readiness_score: number
          id?: string
          lead_id: string
          scoring_factors?: Json | null
          updated_at?: string
          urgency_score: number
        }
        Update: {
          agent_id?: string
          ai_insights?: Json | null
          conversion_probability?: number
          created_at?: string
          engagement_score?: number
          financial_readiness_score?: number
          id?: string
          lead_id?: string
          scoring_factors?: Json | null
          updated_at?: string
          urgency_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_analytics: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          last_interaction_at: string | null
          lead_id: string
          most_active_hours: Json | null
          preferred_contact_method: string | null
          property_preferences: Json | null
          response_time_avg: number | null
          total_interactions: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          lead_id: string
          most_active_hours?: Json | null
          preferred_contact_method?: string | null
          property_preferences?: Json | null
          response_time_avg?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          lead_id?: string
          most_active_hours?: Json | null
          preferred_contact_method?: string | null
          property_preferences?: Json | null
          response_time_avg?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_analytics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          lead_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          lead_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string | null
          budget: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          location_interest: string | null
          match_score: number | null
          property_type_interest: string | null
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          agent_id?: string | null
          budget?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          location_interest?: string | null
          match_score?: number | null
          property_type_interest?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          agent_id?: string | null
          budget?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          location_interest?: string | null
          match_score?: number | null
          property_type_interest?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: []
      }
      market_data: {
        Row: {
          avg_days_on_market: number | null
          avg_price: number | null
          avg_price_per_sqm: number | null
          created_at: string
          data_date: string
          demand_score: number | null
          id: string
          location: string
          price_trend_percentage: number | null
          property_type: string
          sold_listings: number | null
          total_listings: number | null
        }
        Insert: {
          avg_days_on_market?: number | null
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          created_at?: string
          data_date: string
          demand_score?: number | null
          id?: string
          location: string
          price_trend_percentage?: number | null
          property_type: string
          sold_listings?: number | null
          total_listings?: number | null
        }
        Update: {
          avg_days_on_market?: number | null
          avg_price?: number | null
          avg_price_per_sqm?: number | null
          created_at?: string
          data_date?: string
          demand_score?: number | null
          id?: string
          location?: string
          price_trend_percentage?: number | null
          property_type?: string
          sold_listings?: number | null
          total_listings?: number | null
        }
        Relationships: []
      }
      market_trends: {
        Row: {
          avg_price: number | null
          created_at: string | null
          date: string
          days_on_market: number | null
          demand_score: number | null
          id: string
          location: string
          price_change_percentage: number | null
          property_type: string
          total_listings: number | null
        }
        Insert: {
          avg_price?: number | null
          created_at?: string | null
          date: string
          days_on_market?: number | null
          demand_score?: number | null
          id?: string
          location: string
          price_change_percentage?: number | null
          property_type: string
          total_listings?: number | null
        }
        Update: {
          avg_price?: number | null
          created_at?: string | null
          date?: string
          days_on_market?: number | null
          demand_score?: number | null
          id?: string
          location?: string
          price_change_percentage?: number | null
          property_type?: string
          total_listings?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      price_suggestions: {
        Row: {
          agent_id: string
          confidence_score: number | null
          created_at: string
          current_price: number
          expected_days_to_sell: number | null
          id: string
          is_active: boolean | null
          market_position: string | null
          property_id: string
          reasoning: Json | null
          suggested_price: number
        }
        Insert: {
          agent_id: string
          confidence_score?: number | null
          created_at?: string
          current_price: number
          expected_days_to_sell?: number | null
          id?: string
          is_active?: boolean | null
          market_position?: string | null
          property_id: string
          reasoning?: Json | null
          suggested_price: number
        }
        Update: {
          agent_id?: string
          confidence_score?: number | null
          created_at?: string
          current_price?: number
          expected_days_to_sell?: number | null
          id?: string
          is_active?: boolean | null
          market_position?: string | null
          property_id?: string
          reasoning?: Json | null
          suggested_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_suggestions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          lead_credits: number
          location: string | null
          location_focus: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          lead_credits?: number
          location?: string | null
          location_focus?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          lead_credits?: number
          location?: string | null
          location_focus?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agent_id: string | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          description: string | null
          id: string
          image_urls: Json | null
          landmark: string | null
          listing_type: string
          price: number
          property_type: string
          rejection_reason: string | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          status_change_reason: string | null
          status_history: Json | null
          updated_at: string
          views: number
          zip_code: string | null
        }
        Insert: {
          address: string
          agent_id?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: Json | null
          landmark?: string | null
          listing_type: string
          price: number
          property_type: string
          rejection_reason?: string | null
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          status_change_reason?: string | null
          status_history?: Json | null
          updated_at?: string
          views?: number
          zip_code?: string | null
        }
        Update: {
          address?: string
          agent_id?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: Json | null
          landmark?: string | null
          listing_type?: string
          price?: number
          property_type?: string
          rejection_reason?: string | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          status_change_reason?: string | null
          status_history?: Json | null
          updated_at?: string
          views?: number
          zip_code?: string | null
        }
        Relationships: []
      }
      property_forecasts: {
        Row: {
          agent_id: string
          confidence_interval: Json | null
          created_at: string
          forecast_date: string
          forecast_type: string
          forecast_value: number | null
          id: string
          property_id: string
        }
        Insert: {
          agent_id: string
          confidence_interval?: Json | null
          created_at?: string
          forecast_date: string
          forecast_type: string
          forecast_value?: number | null
          id?: string
          property_id: string
        }
        Update: {
          agent_id?: string
          confidence_interval?: Json | null
          created_at?: string
          forecast_date?: string
          forecast_type?: string
          forecast_value?: number | null
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_forecasts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_image_hashes: {
        Row: {
          agent_id: string
          created_at: string
          file_size: number | null
          hash_algorithm: string | null
          id: string
          image_hash: string
          image_url: string | null
          property_id: string
          similarity_score: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          file_size?: number | null
          hash_algorithm?: string | null
          id?: string
          image_hash: string
          image_url?: string | null
          property_id: string
          similarity_score?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          file_size?: number | null
          hash_algorithm?: string | null
          id?: string
          image_hash?: string
          image_url?: string | null
          property_id?: string
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_image_hashes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_performance: {
        Row: {
          agent_id: string
          average_time_on_page: number | null
          created_at: string
          demographic_data: Json | null
          id: string
          inquiry_count: number | null
          peak_viewing_hours: Json | null
          property_id: string
          total_views: number | null
          traffic_sources: Json | null
          unique_views: number | null
          updated_at: string
          viewing_requests: number | null
        }
        Insert: {
          agent_id: string
          average_time_on_page?: number | null
          created_at?: string
          demographic_data?: Json | null
          id?: string
          inquiry_count?: number | null
          peak_viewing_hours?: Json | null
          property_id: string
          total_views?: number | null
          traffic_sources?: Json | null
          unique_views?: number | null
          updated_at?: string
          viewing_requests?: number | null
        }
        Update: {
          agent_id?: string
          average_time_on_page?: number | null
          created_at?: string
          demographic_data?: Json | null
          id?: string
          inquiry_count?: number | null
          peak_viewing_hours?: Json | null
          property_id?: string
          total_views?: number | null
          traffic_sources?: Json | null
          unique_views?: number | null
          updated_at?: string
          viewing_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_performance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_messages: {
        Row: {
          broadcast_type: Database["public"]["Enums"]["broadcast_type"] | null
          content: string
          created_at: string
          id: string
          is_emergency: boolean
          is_read: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json | null
          recipient_id: string | null
          sender_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          broadcast_type?: Database["public"]["Enums"]["broadcast_type"] | null
          content: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          recipient_id?: string | null
          sender_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          broadcast_type?: Database["public"]["Enums"]["broadcast_type"] | null
          content?: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          recipient_id?: string | null
          sender_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_analytics: {
        Row: {
          active_subscribers: number | null
          churned_subscribers: number | null
          commission_revenue: number | null
          created_at: string | null
          date: string
          id: string
          new_subscribers: number | null
          other_revenue: number | null
          subscription_revenue: number | null
          total_revenue: number | null
        }
        Insert: {
          active_subscribers?: number | null
          churned_subscribers?: number | null
          commission_revenue?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_subscribers?: number | null
          other_revenue?: number | null
          subscription_revenue?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_subscribers?: number | null
          churned_subscribers?: number | null
          commission_revenue?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_subscribers?: number | null
          other_revenue?: number | null
          subscription_revenue?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      success_metrics_summary: {
        Row: {
          agent_id: string
          avg_deal_closure_time_days: number | null
          avg_response_time_minutes: number | null
          conversion_rate: number | null
          created_at: string
          deals_closed: number | null
          engagement_breakdown: Json | null
          id: string
          period_end: string
          period_start: string
          top_performing_hours: Json | null
          total_conversations: number | null
          total_deal_value: number | null
          total_engagements: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          avg_deal_closure_time_days?: number | null
          avg_response_time_minutes?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          engagement_breakdown?: Json | null
          id?: string
          period_end: string
          period_start: string
          top_performing_hours?: Json | null
          total_conversations?: number | null
          total_deal_value?: number | null
          total_engagements?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          avg_deal_closure_time_days?: number | null
          avg_response_time_minutes?: number | null
          conversion_rate?: number | null
          created_at?: string
          deals_closed?: number | null
          engagement_breakdown?: Json | null
          id?: string
          period_end?: string
          period_start?: string
          top_performing_hours?: Json | null
          total_conversations?: number | null
          total_deal_value?: number | null
          total_engagements?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_daily_analytics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      detect_image_duplicates: {
        Args: {
          p_image_hash: string
          p_agent_id: string
          p_similarity_threshold?: number
        }
        Returns: {
          property_id: string
          agent_id: string
          image_hash: string
          similarity_score: number
          created_at: string
        }[]
      }
      get_unread_message_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: { role_to_check: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin_or_super: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_message_as_read: {
        Args: { message_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string; is_read?: boolean }
        Returns: undefined
      }
      track_conversion: {
        Args: {
          p_agent_id: string
          p_seeker_id: string
          p_conversion_stage: string
          p_deal_id?: string
          p_property_id?: string
          p_conversion_value?: number
        }
        Returns: undefined
      }
      track_engagement_metric: {
        Args: {
          p_agent_id: string
          p_seeker_id: string
          p_metric_type: string
          p_metric_value?: number
          p_metadata?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "individual" | "business"
      app_role: "agent" | "admin" | "super_admin"
      broadcast_type:
        | "system_announcement"
        | "emergency_alert"
        | "general_broadcast"
      lead_status: "new" | "contacted" | "qualified" | "unqualified" | "closed"
      message_type: "chat" | "broadcast" | "emergency" | "announcement"
      notification_type:
        | "new_agent_pending_approval"
        | "system_update"
        | "agent_rejected"
        | "property_approved"
        | "property_rejected"
        | "property_submitted"
        | "payment_success"
      payment_status: "Paid" | "Pending" | "Failed"
      property_status:
        | "pending"
        | "approved"
        | "rejected"
        | "rented"
        | "sold"
        | "leased"
      subscription_plan: "free" | "premium"
      subscription_status:
        | "active"
        | "inactive"
        | "cancelled"
        | "incomplete"
        | "past_due"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["individual", "business"],
      app_role: ["agent", "admin", "super_admin"],
      broadcast_type: [
        "system_announcement",
        "emergency_alert",
        "general_broadcast",
      ],
      lead_status: ["new", "contacted", "qualified", "unqualified", "closed"],
      message_type: ["chat", "broadcast", "emergency", "announcement"],
      notification_type: [
        "new_agent_pending_approval",
        "system_update",
        "agent_rejected",
        "property_approved",
        "property_rejected",
        "property_submitted",
        "payment_success",
      ],
      payment_status: ["Paid", "Pending", "Failed"],
      property_status: [
        "pending",
        "approved",
        "rejected",
        "rented",
        "sold",
        "leased",
      ],
      subscription_plan: ["free", "premium"],
      subscription_status: [
        "active",
        "inactive",
        "cancelled",
        "incomplete",
        "past_due",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
