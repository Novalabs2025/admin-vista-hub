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
      agent_verifications: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          id: string
          id_document_url: string | null
          license_document_url: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          id?: string
          id_document_url?: string | null
          license_document_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          location: string | null
          location_focus: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          location_focus?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          location_focus?: string | null
          phone_number?: string | null
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
          state: string
          updated_at: string
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
          state: string
          updated_at?: string
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
          state?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "individual" | "business"
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
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
