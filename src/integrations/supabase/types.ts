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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          language: string | null
          last_login: string | null
          name: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          language?: string | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          language?: string | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          additional_images: string[] | null
          after_sales: string | null
          anti_theft_features: string | null
          brand: string | null
          cash_price: number | null
          colors: string[] | null
          created_at: string | null
          description: string | null
          down_payment: number | null
          drive_type: string | null
          email: string | null
          emergency_support: string | null
          engine_size: string | null
          engine_type: string | null
          excess_info: string | null
          financing_partner: string | null
          free_accessories: string | null
          fuel_consumption: string | null
          fuel_type: string | null
          id: string
          import_docs: string | null
          included_addons: string | null
          inspection_cert: string | null
          insurance_cost: number | null
          insurance_provider: string | null
          insurance_type: string | null
          interior_features: string | null
          is_sold: boolean | null
          keyless_entry: boolean | null
          kra_docs: string | null
          loan_processing_fee: number | null
          location: string | null
          location_link: string | null
          logbook_status: string | null
          main_image: string | null
          model: string | null
          monthly_installment: number | null
          name: string | null
          ntas_account_linked: boolean | null
          optional_addons: string | null
          ownership_transfer: string | null
          parts_availability: boolean | null
          price: number | null
          repayment_period: string | null
          reputation_score: number | null
          safety_features: string | null
          sales_contract: string | null
          service_centers: string | null
          showroom_name: string | null
          sms: string | null
          sold_out_date: string | null
          status: string | null
          tags: string[] | null
          tax_inclusive_price: number | null
          tracking_device: boolean | null
          transmission: string | null
          updated_at: string | null
          valuation_report: string | null
          warranty_period: string | null
          whatsapp_number: string | null
          year: string | null
        }
        Insert: {
          additional_images?: string[] | null
          after_sales?: string | null
          anti_theft_features?: string | null
          brand?: string | null
          cash_price?: number | null
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          down_payment?: number | null
          drive_type?: string | null
          email?: string | null
          emergency_support?: string | null
          engine_size?: string | null
          engine_type?: string | null
          excess_info?: string | null
          financing_partner?: string | null
          free_accessories?: string | null
          fuel_consumption?: string | null
          fuel_type?: string | null
          id?: string
          import_docs?: string | null
          included_addons?: string | null
          inspection_cert?: string | null
          insurance_cost?: number | null
          insurance_provider?: string | null
          insurance_type?: string | null
          interior_features?: string | null
          is_sold?: boolean | null
          keyless_entry?: boolean | null
          kra_docs?: string | null
          loan_processing_fee?: number | null
          location?: string | null
          location_link?: string | null
          logbook_status?: string | null
          main_image?: string | null
          model?: string | null
          monthly_installment?: number | null
          name?: string | null
          ntas_account_linked?: boolean | null
          optional_addons?: string | null
          ownership_transfer?: string | null
          parts_availability?: boolean | null
          price?: number | null
          repayment_period?: string | null
          reputation_score?: number | null
          safety_features?: string | null
          sales_contract?: string | null
          service_centers?: string | null
          showroom_name?: string | null
          sms?: string | null
          sold_out_date?: string | null
          status?: string | null
          tags?: string[] | null
          tax_inclusive_price?: number | null
          tracking_device?: boolean | null
          transmission?: string | null
          updated_at?: string | null
          valuation_report?: string | null
          warranty_period?: string | null
          whatsapp_number?: string | null
          year?: string | null
        }
        Update: {
          additional_images?: string[] | null
          after_sales?: string | null
          anti_theft_features?: string | null
          brand?: string | null
          cash_price?: number | null
          colors?: string[] | null
          created_at?: string | null
          description?: string | null
          down_payment?: number | null
          drive_type?: string | null
          email?: string | null
          emergency_support?: string | null
          engine_size?: string | null
          engine_type?: string | null
          excess_info?: string | null
          financing_partner?: string | null
          free_accessories?: string | null
          fuel_consumption?: string | null
          fuel_type?: string | null
          id?: string
          import_docs?: string | null
          included_addons?: string | null
          inspection_cert?: string | null
          insurance_cost?: number | null
          insurance_provider?: string | null
          insurance_type?: string | null
          interior_features?: string | null
          is_sold?: boolean | null
          keyless_entry?: boolean | null
          kra_docs?: string | null
          loan_processing_fee?: number | null
          location?: string | null
          location_link?: string | null
          logbook_status?: string | null
          main_image?: string | null
          model?: string | null
          monthly_installment?: number | null
          name?: string | null
          ntas_account_linked?: boolean | null
          optional_addons?: string | null
          ownership_transfer?: string | null
          parts_availability?: boolean | null
          price?: number | null
          repayment_period?: string | null
          reputation_score?: number | null
          safety_features?: string | null
          sales_contract?: string | null
          service_centers?: string | null
          showroom_name?: string | null
          sms?: string | null
          sold_out_date?: string | null
          status?: string | null
          tags?: string[] | null
          tax_inclusive_price?: number | null
          tracking_device?: boolean | null
          transmission?: string | null
          updated_at?: string | null
          valuation_report?: string | null
          warranty_period?: string | null
          whatsapp_number?: string | null
          year?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          communication_method: string | null
          country: string | null
          created_at: string | null
          date_joined: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          gender_other: string | null
          id: string
          id_document_url: string | null
          kra_pin: string | null
          last_name: string | null
          license_number: string | null
          national_id: string | null
          notification_channels: Json | null
          passport_url: string | null
          phone: string | null
          preferences: Json | null
          role: string | null
          status: string | null
          theme: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          communication_method?: string | null
          country?: string | null
          created_at?: string | null
          date_joined?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          gender_other?: string | null
          id: string
          id_document_url?: string | null
          kra_pin?: string | null
          last_name?: string | null
          license_number?: string | null
          national_id?: string | null
          notification_channels?: Json | null
          passport_url?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          communication_method?: string | null
          country?: string | null
          created_at?: string | null
          date_joined?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          gender_other?: string | null
          id?: string
          id_document_url?: string | null
          kra_pin?: string | null
          last_name?: string | null
          license_number?: string | null
          national_id?: string | null
          notification_channels?: Json | null
          passport_url?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          additional_images: string[] | null
          available: boolean | null
          created_at: string | null
          description: string | null
          features: string | null
          id: string
          location: string | null
          main_image: string | null
          make: string | null
          model: string | null
          price_per_day: number | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          additional_images?: string[] | null
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: string | null
          id?: string
          location?: string | null
          main_image?: string | null
          make?: string | null
          model?: string | null
          price_per_day?: number | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          additional_images?: string[] | null
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: string | null
          id?: string
          location?: string | null
          main_image?: string | null
          make?: string | null
          model?: string | null
          price_per_day?: number | null
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      trade_ins: {
        Row: {
          car_condition: string | null
          car_images: string[] | null
          car_make: string | null
          car_mileage: string | null
          car_model: string | null
          car_year: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          car_condition?: string | null
          car_images?: string[] | null
          car_make?: string | null
          car_mileage?: string | null
          car_model?: string | null
          car_year?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          car_condition?: string | null
          car_images?: string[] | null
          car_make?: string | null
          car_mileage?: string | null
          car_model?: string | null
          car_year?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
          user_phone?: string | null
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
