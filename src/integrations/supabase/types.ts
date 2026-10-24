export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      barber_subscriptions: {
        Row: {
          amount_cents: number | null
          archived_at: string | null
          barber_id: string
          checkout_url: string | null
          created_at: string
          id: string
          paid_until: string | null
          provider_id: string | null
          state: string
          tenant_id: string
        }
        Insert: {
          amount_cents?: number | null
          archived_at?: string | null
          barber_id: string
          checkout_url?: string | null
          created_at?: string
          id?: string
          paid_until?: string | null
          provider_id?: string | null
          state?: string
          tenant_id: string
        }
        Update: {
          amount_cents?: number | null
          archived_at?: string | null
          barber_id?: string
          checkout_url?: string | null
          created_at?: string
          id?: string
          paid_until?: string | null
          provider_id?: string | null
          state?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_records: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id: string
          kind: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_receipts: {
        Row: {
          appointment_id: string
          client_id: string
          created_at: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          appointment_id: string
          client_id: string
          created_at?: string | null
          tenant_id?: string
          token?: string
        }
        Update: {
          appointment_id?: string
          client_id?: string
          created_at?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      saas_settings: {
        Row: {
          id: boolean
          logo: string
          name: string
          price_per_barber_cents: number | null
          trial_days: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          logo?: string
          name?: string
          price_per_barber_cents?: number | null
          trial_days?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          logo?: string
          name?: string
          price_per_barber_cents?: number | null
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payment_orders: {
        Row: {
          amount_cents: number
          approved_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_data: Json | null
          payment_method: string
          provider_order_id: string | null
          provider_payment_id: string | null
          state: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_method: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          state?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_method?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          state?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payment_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "barber_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_cents: number
          approved: boolean
          paid_at: string | null
          period_end: string
          provider_payment_id: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          approved: boolean
          paid_at?: string | null
          period_end: string
          provider_payment_id: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          approved?: boolean
          paid_at?: string | null
          period_end?: string
          provider_payment_id?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "barber_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          slug: string
          status: string
          trial_ends_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          slug: string
          status?: string
          trial_ends_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string
          status?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          active: boolean
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_subscription_payment: {
        Args: {
          approved_at: string
          cents: number
          is_approved: boolean
          pid: string
          sid: string
        }
        Returns: undefined
      }
      barber_can_book: { Args: { bid: string; tid: string }; Returns: boolean }
      book_appointment: { Args: { input: Json }; Returns: Json }
      booking_receipt: { Args: { receipt_token: string }; Returns: Json }
      busy_slots: { Args: never; Returns: Json }
      busy_slots_for_shop: { Args: { tid: string }; Returns: Json }
      claim_barber_checkout: { Args: { bid: string }; Returns: Json }
      claim_subscription_payment_order: {
        Args: { method: string; sid: string }
        Returns: Json
      }
      create_shop: {
        Args: { shop_name: string; shop_slug: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      platform_mercado_pago_config_private: { Args: never; Returns: Json }
      platform_mercado_pago_config_status: { Args: never; Returns: Json }
      platform_sales_history: {
        Args: { p_since?: string; p_until?: string }
        Returns: {
          amount_cents: number
          approved: boolean
          barber_name: string
          payment_at: string
          period_end: string
          shop_name: string
          shop_slug: string
          subscription_state: string
          updated_at: string
        }[]
      }
      platform_save_mercado_pago_config: {
        Args: {
          p_access_token?: string
          p_app_url?: string
          p_public_key?: string
          p_webhook_secret?: string
        }
        Returns: Json
      }
      public_shop: { Args: { shop_slug?: string }; Returns: Json }
      shop_booking_access: { Args: { tid: string }; Returns: Json }
      tenant_admin: { Args: { tid: string }; Returns: boolean }
      tenant_is_public: { Args: { tid: string }; Returns: boolean }
      tenant_staff: { Args: { tid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "attendant" | "barber"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "attendant", "barber"],
    },
  },
} as const
