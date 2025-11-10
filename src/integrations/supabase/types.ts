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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          staff_id: string
          status: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          staff_id: string
          status?: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_type: string
          created_at: string | null
          id: string
          issued_date: string | null
          user_id: string
        }
        Insert: {
          badge_type: string
          created_at?: string | null
          id?: string
          issued_date?: string | null
          user_id: string
        }
        Update: {
          badge_type?: string
          created_at?: string | null
          id?: string
          issued_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          links: Json | null
          published_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          links?: Json | null
          published_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          links?: Json | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          drive_type: string | null
          engine: string | null
          fuel_type: string | null
          id: string
          images: Json | null
          is_featured: boolean | null
          is_rental: boolean | null
          make: string
          mileage: string | null
          model: string
          price: number
          status: string | null
          stock_id: string | null
          transmission: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          drive_type?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_rental?: boolean | null
          make: string
          mileage?: string | null
          model: string
          price: number
          status?: string | null
          stock_id?: string | null
          transmission?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          drive_type?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_rental?: boolean | null
          make?: string
          mileage?: string | null
          model?: string
          price?: number
          status?: string | null
          stock_id?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          lead_id: string
          next_follow_up: string | null
          notes: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          lead_id: string
          next_follow_up?: string | null
          notes?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          lead_id?: string
          next_follow_up?: string | null
          notes?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          id: string
          interest: string | null
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_cars: {
        Row: {
          car_id: string
          created_at: string | null
          featured_date: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          featured_date?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          featured_date?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_cars_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          id: string
          net_pay: number
          notes: string | null
          overtime_pay: number | null
          pay_period_end: string
          pay_period_start: string
          payment_date: string | null
          payment_status: string | null
          staff_id: string
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay: number
          notes?: string | null
          overtime_pay?: number | null
          pay_period_end: string
          pay_period_start: string
          payment_date?: string | null
          payment_status?: string | null
          staff_id: string
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          overtime_pay?: number | null
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string | null
          payment_status?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          county_city: string | null
          created_at: string | null
          email: string
          exact_location: string | null
          full_name: string
          gender: string | null
          id: string
          is_suspended: boolean | null
          phone: string
          preferred_contact: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          county_city?: string | null
          created_at?: string | null
          email: string
          exact_location?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_suspended?: boolean | null
          phone: string
          preferred_contact?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          county_city?: string | null
          created_at?: string | null
          email?: string
          exact_location?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_suspended?: boolean | null
          phone?: string
          preferred_contact?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rentals: {
        Row: {
          car_id: string
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          car_id: string
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          payment_type: string | null
          sale_date: string | null
          sale_price: number
          updated_at: string | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_type?: string | null
          sale_date?: string | null
          sale_price: number
          updated_at?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_type?: string | null
          sale_date?: string | null
          sale_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          created_at: string
          department: string
          documents: Json | null
          email: string
          emergency_contact: string | null
          full_name: string
          hire_date: string
          id: string
          phone: string
          photo_url: string | null
          position: Database["public"]["Enums"]["staff_role"]
          profile_id: string | null
          salary: number | null
          staff_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          department: string
          documents?: Json | null
          email: string
          emergency_contact?: string | null
          full_name: string
          hire_date?: string
          id?: string
          phone: string
          photo_url?: string | null
          position: Database["public"]["Enums"]["staff_role"]
          profile_id?: string | null
          salary?: number | null
          staff_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          department?: string
          documents?: Json | null
          email?: string
          emergency_contact?: string | null
          full_name?: string
          hire_date?: string
          id?: string
          phone?: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_role"]
          profile_id?: string | null
          salary?: number | null
          staff_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ins: {
        Row: {
          admin_notes: string | null
          car_condition: string | null
          car_make: string
          car_mileage: string | null
          car_model: string
          car_year: number
          created_at: string | null
          description: string | null
          estimated_value: number | null
          id: string
          images: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          car_condition?: string | null
          car_make: string
          car_mileage?: string | null
          car_model: string
          car_year: number
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          images?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          car_condition?: string | null
          car_make?: string
          car_mileage?: string | null
          car_model?: string
          car_year?: number
          created_at?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          images?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_type: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_type?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_type?: string | null
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      staff_role:
        | "ceo"
        | "manager"
        | "sales_executive"
        | "technician"
        | "accountant"
        | "hr_manager"
        | "receptionist"
        | "driver"
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
    Enums: {
      app_role: ["admin", "customer"],
      staff_role: [
        "ceo",
        "manager",
        "sales_executive",
        "technician",
        "accountant",
        "hr_manager",
        "receptionist",
        "driver",
      ],
    },
  },
} as const
