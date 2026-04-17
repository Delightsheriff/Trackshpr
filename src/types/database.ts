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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      customer_addresses: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_default: boolean
          label: string | null
          seller_id: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string | null
          seller_id: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          order_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          order_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          id: string
          seller_id: string
          order_id: string | null
          recipient_phone: string
          recipient_kind: "customer" | "rider"
          event: "order_created" | "order_picked_up" | "order_delivered" | "order_failed"
          channel: "whatsapp" | "sms"
          status: "sent" | "failed"
          provider_message_id: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          order_id?: string | null
          recipient_phone: string
          recipient_kind: "customer" | "rider"
          event: "order_created" | "order_picked_up" | "order_delivered" | "order_failed"
          channel: "whatsapp" | "sms"
          status: "sent" | "failed"
          provider_message_id?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          order_id?: string | null
          recipient_phone?: string
          recipient_kind?: "customer" | "rider"
          event?: "order_created" | "order_picked_up" | "order_delivered" | "order_failed"
          channel?: "whatsapp" | "sms"
          status?: "sent" | "failed"
          provider_message_id?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_token: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          direct_phone: string | null
          id: string
          item: string
          notes: string | null
          nudge_sent: boolean | null
          order_number: number | null
          photo_url: string | null
          proof_photo_url: string | null
          rider_id: string | null
          rider_name: string | null
          rider_phone: string | null
          rider_token: string
          seller_id: string
          seller_photo_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_token?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          direct_phone?: string | null
          id?: string
          item: string
          notes?: string | null
          nudge_sent?: boolean | null
          order_number?: number | null
          photo_url?: string | null
          proof_photo_url?: string | null
          rider_id?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          rider_token?: string
          seller_id: string
          seller_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_token?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          direct_phone?: string | null
          id?: string
          item?: string
          notes?: string | null
          nudge_sent?: boolean | null
          order_number?: number | null
          photo_url?: string | null
          proof_photo_url?: string | null
          rider_id?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          rider_token?: string
          seller_id?: string
          seller_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_waitlist: {
        Row: {
          created_at: string
          id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seller_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_waitlist_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          photo_url: string | null
          price: number
          quantity: number
          seller_id: string
          sku: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          name: string
          photo_url?: string | null
          price: number
          quantity?: number
          seller_id: string
          sku?: string | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          name?: string
          photo_url?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          sku?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          brand_color: string | null
          brand_name: string | null
          business_name: string | null
          city: string | null
          contact_numbers: Json | null
          created_at: string | null
          description: string | null
          display_option: string | null
          id: string
          instagram_handle: string | null
          is_pro: boolean
          logo_url: string | null
          onboarding_complete: boolean
          order_count: number
          phone: string | null
          pickup_address: string | null
          push_token: string | null
          secondary_phone: string | null
          tiktok_handle: string | null
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_name?: string | null
          business_name?: string | null
          city?: string | null
          contact_numbers?: Json | null
          created_at?: string | null
          description?: string | null
          display_option?: string | null
          id: string
          instagram_handle?: string | null
          is_pro?: boolean
          logo_url?: string | null
          onboarding_complete?: boolean
          order_count?: number
          phone?: string | null
          pickup_address?: string | null
          push_token?: string | null
          secondary_phone?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_name?: string | null
          business_name?: string | null
          city?: string | null
          contact_numbers?: Json | null
          created_at?: string | null
          description?: string | null
          display_option?: string | null
          id?: string
          instagram_handle?: string | null
          is_pro?: boolean
          logo_url?: string | null
          onboarding_complete?: boolean
          order_count?: number
          phone?: string | null
          pickup_address?: string | null
          push_token?: string | null
          secondary_phone?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      riders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          seller_id: string
          total_deliveries: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          seller_id: string
          total_deliveries?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          seller_id?: string
          total_deliveries?: number
        }
        Relationships: [
          {
            foreignKeyName: "riders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          product_id: string
          quantity: number
          seller_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          product_id: string
          quantity: number
          seller_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          seller_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customers_with_stats: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          failed_count: number | null
          id: string | null
          name: string | null
          notes: string | null
          order_count: number | null
          phone: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string | null
          photo_url: string | null
          price: number | null
          quantity: number | null
          seller_id: string | null
          sku: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          photo_url?: string | null
          price?: number | null
          quantity?: number | null
          seller_id?: string | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          photo_url?: string | null
          price?: number | null
          quantity?: number | null
          seller_id?: string | null
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_product_stock: {
        Args: {
          p_note?: string
          p_product_id: string
          p_quantity: number
          p_type: string
        }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          photo_url: string | null
          price: number
          quantity: number
          seller_id: string
          sku: string | null
          unit: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_delivered_order_stock: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      check_contact_numbers_primary: {
        Args: { contact_numbers: Json }
        Returns: boolean
      }
      create_product_with_initial_stock: {
        Args: {
          p_description?: string
          p_low_stock_threshold?: number
          p_name: string
          p_photo_url?: string
          p_price: number
          p_quantity?: number
          p_seller_id: string
          p_sku?: string
          p_unit?: string
        }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          photo_url: string | null
          price: number
          quantity: number
          seller_id: string
          sku: string | null
          unit: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_user: { Args: never; Returns: undefined }
      get_analytics_daily_chart: {
        Args: { p_seller_id: string }
        Returns: {
          day: string
          delivered: number
          total: number
        }[]
      }
      get_analytics_overview: {
        Args: { p_seller_id: string }
        Returns: {
          avg_delivery_minutes: number
          last_30_delivered: number
          last_30_failed: number
          last_30_total: number
          month_total: number
          success_rate: number
        }[]
      }
      get_analytics_top_riders: {
        Args: { p_seller_id: string }
        Returns: {
          delivered_count: number
          rider_id: string
          rider_name: string
          success_rate: number
        }[]
      }
      restock_product_stock: {
        Args: { p_note?: string; p_product_id: string; p_quantity: number }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          photo_url: string | null
          price: number
          quantity: number
          seller_id: string
          sku: string | null
          unit: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
