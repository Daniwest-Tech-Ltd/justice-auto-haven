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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          staff_id: string
          status: string
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          staff_id: string
          status?: string
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          staff_id?: string
          status?: string
          time_in?: string | null
          time_out?: string | null
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
      car_comparisons: {
        Row: {
          car_ids: Json
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          car_ids?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          car_ids?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
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
      contact_submissions: {
        Row: {
          admin_reply: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
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
      daily_reports: {
        Row: {
          date: string
          file_path: string
          generated_at: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          date: string
          file_path: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          date?: string
          file_path?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: []
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
      messages: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean | null
          is_read: boolean | null
          message: string
          receiver_id: string | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message: string
          receiver_id?: string | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message?: string
          receiver_id?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
          activation_code: string | null
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
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activation_code?: string | null
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
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activation_code?: string | null
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
          suspended_at?: string | null
          suspended_reason?: string | null
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
      reviews: {
        Row: {
          admin_response: string | null
          car_id: string
          comment: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          rating: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          car_id: string
          comment: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          rating: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          car_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_car_id_fkey"
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
      sessions: {
        Row: {
          client_info: Json | null
          created_at: string | null
          id: string
          last_activity_at: string
          login_at: string
          logout_at: string | null
          user_id: string
        }
        Insert: {
          client_info?: Json | null
          created_at?: string | null
          id?: string
          last_activity_at?: string
          login_at?: string
          logout_at?: string | null
          user_id: string
        }
        Update: {
          client_info?: Json | null
          created_at?: string | null
          id?: string
          last_activity_at?: string
          login_at?: string
          logout_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      stock_sequence: {
        Row: {
          id: string
          last_number: number
          prefix: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string | null
        }
        Relationships: []
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
          category: string | null
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
          category?: string | null
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
          category?: string | null
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
      view_tracking: {
        Row: {
          car_id: string
          id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          car_id: string
          id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          car_id?: string
          id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          car_id: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_daily_attendance: {
        Args: { attendance_date?: string }
        Returns: number
      }
      generate_stock_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_verified_buyer: {
        Args: { p_car_id: string; p_user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_target_id?: string
          p_target_table?: string
          p_user_id: string
        }
        Returns: string
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
