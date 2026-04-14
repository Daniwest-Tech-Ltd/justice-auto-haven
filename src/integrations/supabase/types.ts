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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          slug: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_security_settings: {
        Row: {
          auto_block_suspicious: boolean | null
          behaviour_monitoring_enabled: boolean | null
          confidence_threshold: number | null
          created_at: string | null
          facial_recognition_enabled: boolean | null
          fraud_detection_enabled: boolean | null
          id: string
          threat_detection_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_block_suspicious?: boolean | null
          behaviour_monitoring_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          facial_recognition_enabled?: boolean | null
          fraud_detection_enabled?: boolean | null
          id?: string
          threat_detection_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_block_suspicious?: boolean | null
          behaviour_monitoring_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          facial_recognition_enabled?: boolean | null
          fraud_detection_enabled?: boolean | null
          id?: string
          threat_detection_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      allowed_ips: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      anomaly_baselines: {
        Row: {
          baseline_data: Json
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          last_updated: string | null
        }
        Insert: {
          baseline_data: Json
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          baseline_data?: Json
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      application_documents: {
        Row: {
          application_id: string
          document_type: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          document_type: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          document_type?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "asset_finance_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_finance_applications: {
        Row: {
          admin_notes: string | null
          business_type: string | null
          county_town: string | null
          created_at: string
          date_of_birth: string | null
          deposit_amount: number | null
          email: string
          employer_or_business: string | null
          employment_duration: string | null
          employment_type: string
          finance_amount: number | null
          full_name: string
          id: string
          id_number: string
          job_title: string | null
          kra_pin: string
          monthly_income: number | null
          phone: string
          repayment_period: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
          vehicle_name: string | null
          vehicle_price: number | null
          years_in_operation: number | null
        }
        Insert: {
          admin_notes?: string | null
          business_type?: string | null
          county_town?: string | null
          created_at?: string
          date_of_birth?: string | null
          deposit_amount?: number | null
          email: string
          employer_or_business?: string | null
          employment_duration?: string | null
          employment_type: string
          finance_amount?: number | null
          full_name: string
          id?: string
          id_number: string
          job_title?: string | null
          kra_pin: string
          monthly_income?: number | null
          phone: string
          repayment_period?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          vehicle_price?: number | null
          years_in_operation?: number | null
        }
        Update: {
          admin_notes?: string | null
          business_type?: string | null
          county_town?: string | null
          created_at?: string
          date_of_birth?: string | null
          deposit_amount?: number | null
          email?: string
          employer_or_business?: string | null
          employment_duration?: string | null
          employment_type?: string
          finance_amount?: number | null
          full_name?: string
          id?: string
          id_number?: string
          job_title?: string | null
          kra_pin?: string
          monthly_income?: number | null
          phone?: string
          repayment_period?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_name?: string | null
          vehicle_price?: number | null
          years_in_operation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_finance_applications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_settings: {
        Row: {
          apple_oauth_enabled: boolean | null
          created_at: string | null
          email_verification_enabled: boolean | null
          facebook_oauth_enabled: boolean | null
          google_oauth_enabled: boolean | null
          id: string
          password_min_length: number | null
          password_require_symbols: boolean | null
          phone_verification_enabled: boolean | null
          session_timeout_minutes: number | null
          signup_enabled: boolean | null
          two_fa_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          apple_oauth_enabled?: boolean | null
          created_at?: string | null
          email_verification_enabled?: boolean | null
          facebook_oauth_enabled?: boolean | null
          google_oauth_enabled?: boolean | null
          id?: string
          password_min_length?: number | null
          password_require_symbols?: boolean | null
          phone_verification_enabled?: boolean | null
          session_timeout_minutes?: number | null
          signup_enabled?: boolean | null
          two_fa_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          apple_oauth_enabled?: boolean | null
          created_at?: string | null
          email_verification_enabled?: boolean | null
          facebook_oauth_enabled?: boolean | null
          google_oauth_enabled?: boolean | null
          id?: string
          password_min_length?: number | null
          password_require_symbols?: boolean | null
          phone_verification_enabled?: boolean | null
          session_timeout_minutes?: number | null
          signup_enabled?: boolean | null
          two_fa_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          files_backed_up: number | null
          id: string
          rows_backed_up: number | null
          started_at: string | null
          status: string
          tables_backed_up: number | null
          total_size_mb: number | null
          triggered_by: string | null
          users_backed_up: number | null
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          files_backed_up?: number | null
          id?: string
          rows_backed_up?: number | null
          started_at?: string | null
          status?: string
          tables_backed_up?: number | null
          total_size_mb?: number | null
          triggered_by?: string | null
          users_backed_up?: number | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          files_backed_up?: number | null
          id?: string
          rows_backed_up?: number | null
          started_at?: string | null
          status?: string
          tables_backed_up?: number | null
          total_size_mb?: number | null
          triggered_by?: string | null
          users_backed_up?: number | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_by: string | null
          error_message: string | null
          file_path: string | null
          file_size_mb: number | null
          id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size_mb?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size_mb?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      backup_settings: {
        Row: {
          auto_backup_enabled: boolean | null
          backup_auth_users: boolean | null
          backup_database: boolean | null
          backup_frequency: string | null
          backup_storage: boolean | null
          backup_time: string | null
          backup_timezone: string | null
          created_at: string | null
          id: string
          last_backup_at: string | null
          next_scheduled_backup: string | null
          retention_days: number | null
          updated_at: string | null
        }
        Insert: {
          auto_backup_enabled?: boolean | null
          backup_auth_users?: boolean | null
          backup_database?: boolean | null
          backup_frequency?: string | null
          backup_storage?: boolean | null
          backup_time?: string | null
          backup_timezone?: string | null
          created_at?: string | null
          id?: string
          last_backup_at?: string | null
          next_scheduled_backup?: string | null
          retention_days?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_backup_enabled?: boolean | null
          backup_auth_users?: boolean | null
          backup_database?: boolean | null
          backup_frequency?: string | null
          backup_storage?: boolean | null
          backup_time?: string | null
          backup_timezone?: string | null
          created_at?: string | null
          id?: string
          last_backup_at?: string | null
          next_scheduled_backup?: string | null
          retention_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_stats: {
        Row: {
          backup_health: string | null
          database_size_mb: number | null
          id: string
          last_successful_backup: string | null
          storage_size_mb: number | null
          total_files: number | null
          total_rows: number | null
          total_tables: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          backup_health?: string | null
          database_size_mb?: number | null
          id?: string
          last_successful_backup?: string | null
          storage_size_mb?: number | null
          total_files?: number | null
          total_rows?: number | null
          total_tables?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          backup_health?: string | null
          database_size_mb?: number | null
          id?: string
          last_successful_backup?: string | null
          storage_size_mb?: number | null
          total_files?: number | null
          total_rows?: number | null
          total_tables?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      blocked_ips: {
        Row: {
          active: boolean | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip: string
          reason: string
        }
        Insert: {
          active?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip: string
          reason: string
        }
        Update: {
          active?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip?: string
          reason?: string
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
      branding_settings: {
        Row: {
          accent_color: string | null
          created_at: string | null
          footer_text: string | null
          hero_images: Json | null
          hero_text: string | null
          id: string
          logo_icon_url: string | null
          logo_primary_url: string | null
          logo_white_url: string | null
          primary_color: string | null
          secondary_color: string | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          footer_text?: string | null
          hero_images?: Json | null
          hero_text?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_primary_url?: string | null
          logo_white_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          footer_text?: string | null
          hero_images?: Json | null
          hero_text?: string | null
          id?: string
          logo_icon_url?: string | null
          logo_primary_url?: string | null
          logo_white_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_links?: Json | null
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
      car_activity_logs: {
        Row: {
          action: string
          car_id: string | null
          created_at: string | null
          details: Json | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          car_id?: string | null
          created_at?: string | null
          details?: Json | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          car_id?: string | null
          created_at?: string | null
          details?: Json | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_activity_logs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_comments: {
        Row: {
          car_id: string
          comment_text: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          parent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          car_id: string
          comment_text: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          car_id?: string
          comment_text?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_comments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "car_comments"
            referencedColumns: ["id"]
          },
        ]
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
      car_expenses: {
        Row: {
          amount: number
          car_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_type: string
          id: string
          paid_at: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          car_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_type: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          car_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_type?: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_expenses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_inquiries: {
        Row: {
          assigned_to: string | null
          car_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          follow_up_date: string | null
          id: string
          message: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          car_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          follow_up_date?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          car_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          follow_up_date?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_inquiries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_likes: {
        Row: {
          car_id: string
          created_at: string
          id: string
          reaction_type: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          reaction_type: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_likes_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_ratings: {
        Row: {
          car_id: string
          created_at: string
          id: string
          rating: number
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          rating: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          rating?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_ratings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          additional_images: Json | null
          available_colors: string[] | null
          color: string | null
          created_at: string | null
          description: string | null
          drive_type: string | null
          engine: string | null
          fuel_type: string | null
          id: string
          images: Json | null
          import_type: string | null
          inquiries_count: number | null
          inspection_date: string | null
          inspection_status: string | null
          insurance_expiry: string | null
          insurance_status: string | null
          is_featured: boolean | null
          is_published: boolean | null
          is_rental: boolean | null
          last_price_change: string | null
          listed_at: string | null
          logbook_status: string | null
          main_images: Json | null
          make: string
          meta_description: string | null
          meta_title: string | null
          mileage: string | null
          model: string
          month: string | null
          notes: string | null
          ntsa_status: string | null
          previous_price: number | null
          price: number
          promotion_tag: string | null
          publish_scheduled_at: string | null
          purchase_price: number | null
          reserved_at: string | null
          reserved_by: string | null
          sold_at: string | null
          status: string | null
          stock_id: string | null
          supplier: string | null
          test_drives_count: number | null
          transmission: string | null
          updated_at: string | null
          views_count: number | null
          vin: string | null
          vin_history: string | null
          year: number
        }
        Insert: {
          additional_images?: Json | null
          available_colors?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          drive_type?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          import_type?: string | null
          inquiries_count?: number | null
          inspection_date?: string | null
          inspection_status?: string | null
          insurance_expiry?: string | null
          insurance_status?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_rental?: boolean | null
          last_price_change?: string | null
          listed_at?: string | null
          logbook_status?: string | null
          main_images?: Json | null
          make?: string
          meta_description?: string | null
          meta_title?: string | null
          mileage?: string | null
          model?: string
          month?: string | null
          notes?: string | null
          ntsa_status?: string | null
          previous_price?: number | null
          price?: number
          promotion_tag?: string | null
          publish_scheduled_at?: string | null
          purchase_price?: number | null
          reserved_at?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          status?: string | null
          stock_id?: string | null
          supplier?: string | null
          test_drives_count?: number | null
          transmission?: string | null
          updated_at?: string | null
          views_count?: number | null
          vin?: string | null
          vin_history?: string | null
          year?: number
        }
        Update: {
          additional_images?: Json | null
          available_colors?: string[] | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          drive_type?: string | null
          engine?: string | null
          fuel_type?: string | null
          id?: string
          images?: Json | null
          import_type?: string | null
          inquiries_count?: number | null
          inspection_date?: string | null
          inspection_status?: string | null
          insurance_expiry?: string | null
          insurance_status?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_rental?: boolean | null
          last_price_change?: string | null
          listed_at?: string | null
          logbook_status?: string | null
          main_images?: Json | null
          make?: string
          meta_description?: string | null
          meta_title?: string | null
          mileage?: string | null
          model?: string
          month?: string | null
          notes?: string | null
          ntsa_status?: string | null
          previous_price?: number | null
          price?: number
          promotion_tag?: string | null
          publish_scheduled_at?: string | null
          purchase_price?: number | null
          reserved_at?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          status?: string | null
          stock_id?: string | null
          supplier?: string | null
          test_drives_count?: number | null
          transmission?: string | null
          updated_at?: string | null
          views_count?: number | null
          vin?: string | null
          vin_history?: string | null
          year?: number
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_name: string
          created_at: string | null
          database_status: string | null
          email: string
          environment: string
          id: string
          location: string
          phone: string
          storage_status: string | null
          system_version: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string | null
          database_status?: string | null
          email?: string
          environment?: string
          id?: string
          location?: string
          phone?: string
          storage_status?: string | null
          system_version?: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          database_status?: string | null
          email?: string
          environment?: string
          id?: string
          location?: string
          phone?: string
          storage_status?: string | null
          system_version?: string
          updated_at?: string | null
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
      content_comments: {
        Row: {
          comment_text: string
          contact_email: string | null
          contact_phone: string | null
          content_id: string
          content_type: string
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          parent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment_text: string
          contact_email?: string | null
          contact_phone?: string | null
          content_id: string
          content_type: string
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment_text?: string
          contact_email?: string | null
          contact_phone?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          reaction_type: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reaction_type: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reaction_type?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cookies_log: {
        Row: {
          created_at: string | null
          decision: string
          id: string
          timestamp: string
          user_agent: string | null
          user_ip: string | null
        }
        Insert: {
          created_at?: string | null
          decision: string
          id?: string
          timestamp?: string
          user_agent?: string | null
          user_ip?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string
          id?: string
          timestamp?: string
          user_agent?: string | null
          user_ip?: string | null
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
        Relationships: []
      }
      crypto_inventory: {
        Row: {
          algorithm: string
          asset_name: string
          asset_type: string
          created_at: string | null
          expiry_date: string | null
          id: string
          key_size: number | null
          notes: string | null
          owner: string | null
          pqc_migration_status: string | null
          pqc_ready: boolean | null
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          algorithm: string
          asset_name: string
          asset_type: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          key_size?: number | null
          notes?: string | null
          owner?: string | null
          pqc_migration_status?: string | null
          pqc_ready?: boolean | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          algorithm?: string
          asset_name?: string
          asset_type?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          key_size?: number | null
          notes?: string | null
          owner?: string | null
          pqc_migration_status?: string | null
          pqc_ready?: boolean | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      email_logs: {
        Row: {
          application_id: string | null
          body: string | null
          created_at: string | null
          email_type: string
          id: string
          recipient: string
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          application_id?: string | null
          body?: string | null
          created_at?: string | null
          email_type: string
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          application_id?: string | null
          body?: string | null
          created_at?: string | null
          email_type?: string
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "asset_finance_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      failed_logins: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          ip: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          ip?: string | null
          reason?: string | null
          user_id?: string | null
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
      firewall_rules: {
        Row: {
          country_code: string | null
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          id: string
          ip_address: string | null
          ip_range: string | null
          rule_name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          ip_address?: string | null
          ip_range?: string | null
          rule_name: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          ip_address?: string | null
          ip_range?: string | null
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      followup_rules: {
        Row: {
          created_at: string
          days_after: number
          enabled: boolean
          id: string
          status_filter: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          days_after: number
          enabled?: boolean
          id?: string
          status_filter: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          days_after?: number
          enabled?: boolean
          id?: string
          status_filter?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          description: string | null
          file_url: string | null
          generated_at: string | null
          generated_by: string
          id: string
          metadata: Json | null
          pages: number | null
          title: string
          type: string
          version: string | null
          word_count: number | null
        }
        Insert: {
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by: string
          id?: string
          metadata?: Json | null
          pages?: number | null
          title: string
          type: string
          version?: string | null
          word_count?: number | null
        }
        Update: {
          description?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string
          id?: string
          metadata?: Json | null
          pages?: number | null
          title?: string
          type?: string
          version?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      geofence_violations: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_channels: Json | null
          alert_sent: boolean | null
          booking_id: string | null
          created_at: string
          geofence_id: string
          id: string
          latitude: number
          longitude: number
          notes: string | null
          rental_car_id: string
          speed: number | null
          violation_type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_channels?: Json | null
          alert_sent?: boolean | null
          booking_id?: string | null
          created_at?: string
          geofence_id: string
          id?: string
          latitude: number
          longitude: number
          notes?: string | null
          rental_car_id: string
          speed?: number | null
          violation_type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_channels?: Json | null
          alert_sent?: boolean | null
          booking_id?: string | null
          created_at?: string
          geofence_id?: string
          id?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          rental_car_id?: string
          speed?: number | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_violations_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          alert_on_entry: boolean | null
          alert_on_exit: boolean | null
          center_lat: number | null
          center_lng: number | null
          coordinates: Json
          created_at: string
          created_by: string | null
          description: string | null
          geofence_type: string
          id: string
          is_active: boolean | null
          name: string
          radius_meters: number | null
          speed_limit: number | null
          updated_at: string
        }
        Insert: {
          alert_on_entry?: boolean | null
          alert_on_exit?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          coordinates: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          geofence_type?: string
          id?: string
          is_active?: boolean | null
          name: string
          radius_meters?: number | null
          speed_limit?: number | null
          updated_at?: string
        }
        Update: {
          alert_on_entry?: boolean | null
          alert_on_exit?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          coordinates?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          geofence_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          radius_meters?: number | null
          speed_limit?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gps_devices: {
        Row: {
          battery_level: number | null
          created_at: string
          device_id: string
          device_name: string | null
          device_type: string | null
          firmware_version: string | null
          id: string
          imei: string | null
          is_active: boolean | null
          last_ping: string | null
          rental_car_id: string | null
          sim_number: string | null
          updated_at: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          device_id: string
          device_name?: string | null
          device_type?: string | null
          firmware_version?: string | null
          id?: string
          imei?: string | null
          is_active?: boolean | null
          last_ping?: string | null
          rental_car_id?: string | null
          sim_number?: string | null
          updated_at?: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          firmware_version?: string | null
          id?: string
          imei?: string | null
          is_active?: boolean | null
          last_ping?: string | null
          rental_car_id?: string | null
          sim_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      incident_timeline: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          evidence: Json | null
          forensic_data: Json | null
          id: string
          incident_id: string | null
          is_critical: boolean | null
          performed_by: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          evidence?: Json | null
          forensic_data?: Json | null
          id?: string
          incident_id?: string | null
          is_critical?: boolean | null
          performed_by?: string | null
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          evidence?: Json | null
          forensic_data?: Json | null
          id?: string
          incident_id?: string | null
          is_critical?: boolean | null
          performed_by?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_timeline_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequence: {
        Row: {
          id: string
          last_number: number
          prefix: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          due_date: string | null
          grand_total: number
          id: string
          invoice_no: string
          items: Json
          notes: string | null
          order_id: string | null
          pdf_url: string | null
          sent_email: boolean | null
          sent_whatsapp: boolean | null
          status: string
          subtotal: number
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_no: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          status?: string
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_no?: string
          items?: Json
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
          status?: string
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "whitelist_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          job_number: string | null
          notes: string | null
          parts: Json | null
          priority: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_number?: string | null
          notes?: string | null
          parts?: Json | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_number?: string | null
          notes?: string | null
          parts?: Json | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      localization_settings: {
        Row: {
          auto_language_detection: boolean | null
          available_languages: Json | null
          created_at: string | null
          default_language: string | null
          id: string
          rtl_support: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_language_detection?: boolean | null
          available_languages?: Json | null
          created_at?: string | null
          default_language?: string | null
          id?: string
          rtl_support?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_language_detection?: boolean | null
          available_languages?: Json | null
          created_at?: string | null
          default_language?: string | null
          id?: string
          rtl_support?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
      mitre_mappings: {
        Row: {
          created_at: string | null
          detection_rules: Json | null
          event_type: string
          id: string
          mitigation_steps: Json | null
          tactic_id: string
          tactic_name: string
          technique_id: string
          technique_name: string
        }
        Insert: {
          created_at?: string | null
          detection_rules?: Json | null
          event_type: string
          id?: string
          mitigation_steps?: Json | null
          tactic_id: string
          tactic_name: string
          technique_id: string
          technique_name: string
        }
        Update: {
          created_at?: string | null
          detection_rules?: Json | null
          event_type?: string
          id?: string
          mitigation_steps?: Json | null
          tactic_id?: string
          tactic_name?: string
          technique_id?: string
          technique_name?: string
        }
        Relationships: []
      }
      notification_config: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          email_provider: string | null
          id: string
          push_enabled: boolean | null
          sms_enabled: boolean | null
          sms_provider: string | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          email_provider?: string | null
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          sms_provider?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          email_provider?: string | null
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          sms_provider?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          subject: string | null
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          subject?: string | null
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          subject?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
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
      otp_audit_trail: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          otp_id: string | null
          performed_by: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          otp_id?: string | null
          performed_by?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          otp_id?: string | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_audit_trail_otp_id_fkey"
            columns: ["otp_id"]
            isOneToOne: false
            referencedRelation: "two_factor_auth"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_config: {
        Row: {
          auto_currency_conversion: boolean | null
          bank_details: Json | null
          bank_transfer_enabled: boolean | null
          created_at: string | null
          id: string
          mpesa_consumer_key: string | null
          mpesa_consumer_secret: string | null
          mpesa_enabled: boolean | null
          mpesa_shortcode: string | null
          paypal_client_id: string | null
          paypal_enabled: boolean | null
          paypal_secret: string | null
          stripe_enabled: boolean | null
          stripe_public_key: string | null
          stripe_secret_key: string | null
          updated_at: string | null
        }
        Insert: {
          auto_currency_conversion?: boolean | null
          bank_details?: Json | null
          bank_transfer_enabled?: boolean | null
          created_at?: string | null
          id?: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_enabled?: boolean | null
          mpesa_shortcode?: string | null
          paypal_client_id?: string | null
          paypal_enabled?: boolean | null
          paypal_secret?: string | null
          stripe_enabled?: boolean | null
          stripe_public_key?: string | null
          stripe_secret_key?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_currency_conversion?: boolean | null
          bank_details?: Json | null
          bank_transfer_enabled?: boolean | null
          created_at?: string | null
          id?: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_enabled?: boolean | null
          mpesa_shortcode?: string | null
          paypal_client_id?: string | null
          paypal_enabled?: boolean | null
          paypal_secret?: string | null
          stripe_enabled?: boolean | null
          stripe_public_key?: string | null
          stripe_secret_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_ipn_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          payload: Json
          payment_id: string | null
          pesapal_notification_type: string | null
          pesapal_tracking_id: string | null
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          payload: Json
          payment_id?: string | null
          pesapal_notification_type?: string | null
          pesapal_tracking_id?: string | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json
          payment_id?: string | null
          pesapal_notification_type?: string | null
          pesapal_tracking_id?: string | null
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_ipn_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: string
          pesapal_merchant_reference: string | null
          pesapal_order_tracking_id: string | null
          pesapal_tracking_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string
          pesapal_merchant_reference?: string | null
          pesapal_order_tracking_id?: string | null
          pesapal_tracking_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string
          pesapal_merchant_reference?: string | null
          pesapal_order_tracking_id?: string | null
          pesapal_tracking_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "whitelist_orders"
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
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_data_deletion: boolean | null
          allow_data_export: boolean | null
          cookie_auto_consent: boolean | null
          cookie_consent_enabled: boolean | null
          created_at: string | null
          data_retention_days: number | null
          id: string
          privacy_policy_url: string | null
          terms_url: string | null
          updated_at: string | null
        }
        Insert: {
          allow_data_deletion?: boolean | null
          allow_data_export?: boolean | null
          cookie_auto_consent?: boolean | null
          cookie_consent_enabled?: boolean | null
          created_at?: string | null
          data_retention_days?: number | null
          id?: string
          privacy_policy_url?: string | null
          terms_url?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_data_deletion?: boolean | null
          allow_data_export?: boolean | null
          cookie_auto_consent?: boolean | null
          cookie_consent_enabled?: boolean | null
          created_at?: string | null
          data_retention_days?: number | null
          id?: string
          privacy_policy_url?: string | null
          terms_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          activation_code: string | null
          auth_provider: string | null
          avatar_url: string | null
          blocked_at: string | null
          country_code: string | null
          county_city: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          exact_location: string | null
          failed_attempts: number | null
          fingerprint_enabled: boolean | null
          full_name: string
          gender: string | null
          id: string
          is_online: boolean | null
          is_suspended: boolean | null
          last_login_attempt: string | null
          last_seen: string | null
          lock_until: string | null
          login_attempts: number | null
          password_set: boolean | null
          phone: string
          preferred_2fa: string | null
          preferred_contact: string | null
          reactivation_otp: string | null
          reactivation_otp_expires: string | null
          security_notes: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          theme: string | null
          theme_mode: string | null
          totp_enabled: boolean | null
          two_fa_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_status?: string | null
          activation_code?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          country_code?: string | null
          county_city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          exact_location?: string | null
          failed_attempts?: number | null
          fingerprint_enabled?: boolean | null
          full_name: string
          gender?: string | null
          id?: string
          is_online?: boolean | null
          is_suspended?: boolean | null
          last_login_attempt?: string | null
          last_seen?: string | null
          lock_until?: string | null
          login_attempts?: number | null
          password_set?: boolean | null
          phone: string
          preferred_2fa?: string | null
          preferred_contact?: string | null
          reactivation_otp?: string | null
          reactivation_otp_expires?: string | null
          security_notes?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          theme?: string | null
          theme_mode?: string | null
          totp_enabled?: boolean | null
          two_fa_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_status?: string | null
          activation_code?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          blocked_at?: string | null
          country_code?: string | null
          county_city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          exact_location?: string | null
          failed_attempts?: number | null
          fingerprint_enabled?: boolean | null
          full_name?: string
          gender?: string | null
          id?: string
          is_online?: boolean | null
          is_suspended?: boolean | null
          last_login_attempt?: string | null
          last_seen?: string | null
          lock_until?: string | null
          login_attempts?: number | null
          password_set?: boolean | null
          phone?: string
          preferred_2fa?: string | null
          preferred_contact?: string | null
          reactivation_otp?: string | null
          reactivation_otp_expires?: string | null
          security_notes?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          theme?: string | null
          theme_mode?: string | null
          totp_enabled?: boolean | null
          two_fa_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      receipt_sequence: {
        Row: {
          id: string
          last_number: number
          prefix: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_number?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount_paid: number
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_id: string | null
          payment_method: string
          payment_reference: string | null
          pdf_url: string | null
          receipt_no: string
          sent_email: boolean | null
          sent_whatsapp: boolean | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          customer_id: string
          customer_name: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          pdf_url?: string | null
          receipt_no: string
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_id?: string | null
          payment_method?: string
          payment_reference?: string | null
          pdf_url?: string | null
          receipt_no?: string
          sent_email?: boolean | null
          sent_whatsapp?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_bookings: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          days: number | null
          end_date: string
          hours: number | null
          id: string
          notes: string | null
          rental_car_id: string
          start_date: string
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          days?: number | null
          end_date: string
          hours?: number | null
          id?: string
          notes?: string | null
          rental_car_id: string
          start_date: string
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          days?: number | null
          end_date?: string
          hours?: number | null
          id?: string
          notes?: string | null
          rental_car_id?: string
          start_date?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_rental_car_id_fkey"
            columns: ["rental_car_id"]
            isOneToOne: false
            referencedRelation: "rental_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_cars: {
        Row: {
          additional_images: Json | null
          available: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          fuel_type: string | null
          id: string
          main_images: Json | null
          make: string
          mileage: string | null
          model: string
          name: string
          price_per_day: number | null
          price_per_hour: number
          stock_id: string | null
          transmission: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          additional_images?: Json | null
          available?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          main_images?: Json | null
          make: string
          mileage?: string | null
          model: string
          name: string
          price_per_day?: number | null
          price_per_hour: number
          stock_id?: string | null
          transmission?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          additional_images?: Json | null
          available?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          main_images?: Json | null
          make?: string
          mileage?: string | null
          model?: string
          name?: string
          price_per_day?: number | null
          price_per_hour?: number
          stock_id?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number
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
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_receipt_sequence: {
        Row: {
          last_number: number
          prefix: string
          updated_at: string | null
        }
        Insert: {
          last_number?: number
          prefix?: string
          updated_at?: string | null
        }
        Update: {
          last_number?: number
          prefix?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      salary_receipts: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          id: string
          net_pay: number
          pay_period: string
          payroll_id: string | null
          receipt_number: string
          sent_at: string | null
          staff_id: string
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay?: number
          pay_period: string
          payroll_id?: string | null
          receipt_number: string
          sent_at?: string | null
          staff_id: string
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay?: number
          pay_period?: string
          payroll_id?: string | null
          receipt_number?: string
          sent_at?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_receipts_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_receipts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
      security_config: {
        Row: {
          bot_protection_enabled: boolean | null
          brute_force_protection: boolean | null
          created_at: string | null
          csrf_protection_enabled: boolean | null
          encryption_level: string | null
          id: string
          jwt_expiry_hours: number | null
          lockout_duration_minutes: number | null
          max_login_attempts: number | null
          rate_limit_requests: number | null
          rate_limit_window_minutes: number | null
          rate_limiting_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          bot_protection_enabled?: boolean | null
          brute_force_protection?: boolean | null
          created_at?: string | null
          csrf_protection_enabled?: boolean | null
          encryption_level?: string | null
          id?: string
          jwt_expiry_hours?: number | null
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          rate_limit_requests?: number | null
          rate_limit_window_minutes?: number | null
          rate_limiting_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bot_protection_enabled?: boolean | null
          brute_force_protection?: boolean | null
          created_at?: string | null
          csrf_protection_enabled?: boolean | null
          encryption_level?: string | null
          id?: string
          jwt_expiry_hours?: number | null
          lockout_duration_minutes?: number | null
          max_login_attempts?: number | null
          rate_limit_requests?: number | null
          rate_limit_window_minutes?: number | null
          rate_limiting_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          severity: string
          source_ip: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          severity: string
          source_ip?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string
          source_ip?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_assets: Json | null
          affected_users: Json | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          impact_assessment: string | null
          incident_number: string
          iocs: Json | null
          mitre_tactics: Json | null
          mitre_techniques: Json | null
          remediation_steps: Json | null
          resolved_at: string | null
          severity: string
          status: string
          timeline: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_assets?: Json | null
          affected_users?: Json | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact_assessment?: string | null
          incident_number: string
          iocs?: Json | null
          mitre_tactics?: Json | null
          mitre_techniques?: Json | null
          remediation_steps?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string
          timeline?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_assets?: Json | null
          affected_users?: Json | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          impact_assessment?: string | null
          incident_number?: string
          iocs?: Json | null
          mitre_tactics?: Json | null
          mitre_techniques?: Json | null
          remediation_steps?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string
          timeline?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_playbooks: {
        Row: {
          actions: Json
          approval_required: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          execution_count: number | null
          failure_count: number | null
          id: string
          last_executed: string | null
          name: string
          success_count: number | null
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          actions: Json
          approval_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          last_executed?: string | null
          name: string
          success_count?: number | null
          trigger_conditions: Json
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          approval_required?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          last_executed?: string | null
          name?: string
          success_count?: number | null
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: []
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
      sms_logs: {
        Row: {
          api_response: Json | null
          created_at: string
          error_message: string | null
          id: string
          message: string
          phone: string
          sent_at: string | null
          sms_type: string
          status: string
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          phone: string
          sent_at?: string | null
          sms_type?: string
          status?: string
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          phone?: string
          sent_at?: string | null
          sms_type?: string
          status?: string
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          admin_phone: string | null
          created_at: string
          id: string
          notify_on_new_lead: boolean | null
          notify_on_new_order: boolean | null
          notify_on_registration: boolean | null
          otp_expiry_minutes: number | null
          sandbox_mode: boolean | null
          sender_name: string | null
          sms_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          admin_phone?: string | null
          created_at?: string
          id?: string
          notify_on_new_lead?: boolean | null
          notify_on_new_order?: boolean | null
          notify_on_registration?: boolean | null
          otp_expiry_minutes?: number | null
          sandbox_mode?: boolean | null
          sender_name?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          admin_phone?: string | null
          created_at?: string
          id?: string
          notify_on_new_lead?: boolean | null
          notify_on_new_order?: boolean | null
          notify_on_registration?: boolean | null
          otp_expiry_minutes?: number | null
          sandbox_mode?: boolean | null
          sender_name?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_url: string | null
          branch: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string
          first_name: string
          id: string
          last_login: string | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["staff_role"]
          status: string | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          branch?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          last_login?: string | null
          last_name: string
          phone?: string | null
          role: Database["public"]["Enums"]["staff_role"]
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          branch?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          staff_id: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
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
      storage_settings: {
        Row: {
          allowed_file_types: string[] | null
          backup_enabled: boolean | null
          backup_schedule: string | null
          created_at: string | null
          id: string
          max_upload_size_mb: number | null
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_file_types?: string[] | null
          backup_enabled?: boolean | null
          backup_schedule?: string | null
          created_at?: string | null
          id?: string
          max_upload_size_mb?: number | null
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_file_types?: string[] | null
          backup_enabled?: boolean | null
          backup_schedule?: string | null
          created_at?: string | null
          id?: string
          max_upload_size_mb?: number | null
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_health: {
        Row: {
          created_at: string | null
          id: string
          last_checked: string | null
          latency_ms: number | null
          message: string | null
          status: string
          suggestions: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          latency_ms?: number | null
          message?: string | null
          status: string
          suggestions?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_checked?: string | null
          latency_ms?: number | null
          message?: string | null
          status?: string
          suggestions?: Json | null
        }
        Relationships: []
      }
      system_health_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name: string
          status: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          category: string
          created_at: string | null
          details: Json | null
          id: string
          metric_name: string
          metric_value: number | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string | null
          details?: Json | null
          id?: string
          metric_name: string
          metric_value?: number | null
          status: string
        }
        Update: {
          category?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number | null
          status?: string
        }
        Relationships: []
      }
      system_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time: number | null
          job_name: string
          last_run: string | null
          next_run: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time?: number | null
          job_name: string
          last_run?: string | null
          next_run?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time?: number | null
          job_name?: string
          last_run?: string | null
          next_run?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          severity: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          severity?: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
          type?: string
        }
        Relationships: []
      }
      system_maintenance: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          is_active: boolean
          message: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          message?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          message?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          currency_format: Json | null
          date_format: string | null
          default_country: string | null
          default_currency: string | null
          favicon_url: string | null
          id: string
          support_email: string | null
          support_phone: string | null
          system_description: string | null
          system_logo_url: string | null
          system_name: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp_support: string | null
        }
        Insert: {
          created_at?: string | null
          currency_format?: Json | null
          date_format?: string | null
          default_country?: string | null
          default_currency?: string | null
          favicon_url?: string | null
          id?: string
          support_email?: string | null
          support_phone?: string | null
          system_description?: string | null
          system_logo_url?: string | null
          system_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_support?: string | null
        }
        Update: {
          created_at?: string | null
          currency_format?: Json | null
          date_format?: string | null
          default_country?: string | null
          default_currency?: string | null
          favicon_url?: string | null
          id?: string
          support_email?: string | null
          support_phone?: string | null
          system_description?: string | null
          system_logo_url?: string | null
          system_name?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_support?: string | null
        }
        Relationships: []
      }
      test_drive_bookings: {
        Row: {
          car_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          feedback: string | null
          id: string
          notes: string | null
          salesperson_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          feedback?: string | null
          id?: string
          notes?: string | null
          salesperson_id?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          feedback?: string | null
          id?: string
          notes?: string | null
          salesperson_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drive_bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_intelligence: {
        Row: {
          active: boolean | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          first_seen: string | null
          id: string
          ioc_type: string
          ioc_value: string
          last_seen: string | null
          metadata: Json | null
          source: string
          threat_category: string | null
          threat_level: string
        }
        Insert: {
          active?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          first_seen?: string | null
          id?: string
          ioc_type: string
          ioc_value: string
          last_seen?: string | null
          metadata?: Json | null
          source: string
          threat_category?: string | null
          threat_level: string
        }
        Update: {
          active?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          first_seen?: string | null
          id?: string
          ioc_type?: string
          ioc_value?: string
          last_seen?: string | null
          metadata?: Json | null
          source?: string
          threat_category?: string | null
          threat_level?: string
        }
        Relationships: []
      }
      tracking_alerts: {
        Row: {
          alert_type: string
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          latitude: number | null
          longitude: number | null
          message: string
          metadata: Json | null
          rental_car_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message: string
          metadata?: Json | null
          rental_car_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message?: string
          metadata?: Json | null
          rental_car_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
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
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
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
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
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
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
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
      trip_history: {
        Row: {
          avg_speed: number | null
          booking_id: string | null
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          end_location: Json | null
          end_time: string | null
          fuel_consumed: number | null
          id: string
          idle_time_minutes: number | null
          max_speed: number | null
          rental_car_id: string
          route_points: Json | null
          start_location: Json
          start_time: string
          total_distance_km: number | null
          trip_status: string | null
          updated_at: string
          violations_count: number | null
        }
        Insert: {
          avg_speed?: number | null
          booking_id?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          end_location?: Json | null
          end_time?: string | null
          fuel_consumed?: number | null
          id?: string
          idle_time_minutes?: number | null
          max_speed?: number | null
          rental_car_id: string
          route_points?: Json | null
          start_location: Json
          start_time: string
          total_distance_km?: number | null
          trip_status?: string | null
          updated_at?: string
          violations_count?: number | null
        }
        Update: {
          avg_speed?: number | null
          booking_id?: string | null
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          end_location?: Json | null
          end_time?: string | null
          fuel_consumed?: number | null
          id?: string
          idle_time_minutes?: number | null
          max_speed?: number | null
          rental_car_id?: string
          route_points?: Json | null
          start_location?: Json
          start_time?: string
          total_distance_km?: number | null
          trip_status?: string | null
          updated_at?: string
          violations_count?: number | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          has_webauthn: boolean | null
          id: string
          last_seen: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          has_webauthn?: boolean | null
          id?: string
          last_seen?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          has_webauthn?: boolean | null
          id?: string
          last_seen?: string | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      user_fingerprints: {
        Row: {
          counter: number
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          last_used: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          last_used?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_otps: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          purpose: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          purpose: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last_four: string | null
          method_type: string
          mpesa_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          method_type: string
          mpesa_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          method_type?: string
          mpesa_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          allow_session_tracking: boolean | null
          created_at: string | null
          data_sharing: boolean | null
          email_notifications: boolean | null
          hide_email: boolean | null
          hide_online_status: boolean | null
          hide_phone: boolean | null
          hide_profile: boolean | null
          id: string
          marketing_emails: boolean | null
          newsletter_enabled: boolean | null
          personalized_ads: boolean | null
          push_notifications: boolean | null
          security_alerts: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp_notifications: boolean | null
        }
        Insert: {
          allow_session_tracking?: boolean | null
          created_at?: string | null
          data_sharing?: boolean | null
          email_notifications?: boolean | null
          hide_email?: boolean | null
          hide_online_status?: boolean | null
          hide_phone?: boolean | null
          hide_profile?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          personalized_ads?: boolean | null
          push_notifications?: boolean | null
          security_alerts?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp_notifications?: boolean | null
        }
        Update: {
          allow_session_tracking?: boolean | null
          created_at?: string | null
          data_sharing?: boolean | null
          email_notifications?: boolean | null
          hide_email?: boolean | null
          hide_online_status?: boolean | null
          hide_phone?: boolean | null
          hide_profile?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          newsletter_enabled?: boolean | null
          personalized_ads?: boolean | null
          push_notifications?: boolean | null
          security_alerts?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          whatsapp_notifications?: boolean | null
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active: string | null
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_totp: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          secret_key: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret_key: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret_key?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_tracking: {
        Row: {
          accuracy: number | null
          altitude: number | null
          battery_voltage: number | null
          booking_id: string | null
          created_at: string
          device_id: string | null
          fuel_level: number | null
          heading: number | null
          id: string
          ignition_status: boolean | null
          latitude: number
          longitude: number
          recorded_at: string
          rental_car_id: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          battery_voltage?: number | null
          booking_id?: string | null
          created_at?: string
          device_id?: string | null
          fuel_level?: number | null
          heading?: number | null
          id?: string
          ignition_status?: boolean | null
          latitude: number
          longitude: number
          recorded_at?: string
          rental_car_id: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          battery_voltage?: number | null
          booking_id?: string | null
          created_at?: string
          device_id?: string | null
          fuel_level?: number | null
          heading?: number | null
          id?: string
          ignition_status?: boolean | null
          latitude?: number
          longitude?: number
          recorded_at?: string
          rental_car_id?: string
          speed?: number | null
        }
        Relationships: []
      }
      vehicle_views: {
        Row: {
          car_id: string
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          car_id: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          car_id?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_views_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_webhook_logs: {
        Row: {
          created_at: string
          from_number: string | null
          id: string
          message_data: Json
          message_id: string | null
          message_type: string | null
          timestamp: number | null
        }
        Insert: {
          created_at?: string
          from_number?: string | null
          id?: string
          message_data: Json
          message_id?: string | null
          message_type?: string | null
          timestamp?: number | null
        }
        Update: {
          created_at?: string
          from_number?: string | null
          id?: string
          message_data?: Json
          message_id?: string | null
          message_type?: string | null
          timestamp?: number | null
        }
        Relationships: []
      }
      whitelist_orders: {
        Row: {
          admin_notes: string | null
          car_id: string
          car_make: string
          car_model: string
          car_price: number
          car_year: number
          contact_method: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          payment_method: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          admin_notes?: string | null
          car_id: string
          car_make: string
          car_model: string
          car_price: number
          car_year: number
          contact_method: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          payment_method?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          admin_notes?: string | null
          car_id?: string
          car_make?: string
          car_model?: string
          car_price?: number
          car_year?: number
          contact_method?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          payment_method?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_orders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
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
      otp_statistics: {
        Row: {
          active_unverified: number | null
          expired_total: number | null
          generated_last_24h: number | null
          total_verified: number | null
          verification_rate: number | null
          verified_last_24h: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      block_user: {
        Args: { _admin_id: string; _reason?: string; _user_id: string }
        Returns: boolean
      }
      can_user_login: { Args: { _user_id: string }; Returns: Json }
      create_daily_attendance: {
        Args: { attendance_date?: string }
        Returns: number
      }
      generate_activation_code: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      generate_reactivation_otp: {
        Args: { _admin_id: string; _user_id: string }
        Returns: string
      }
      generate_receipt_number: { Args: never; Returns: string }
      generate_salary_receipt_number: { Args: never; Returns: string }
      generate_stock_id: { Args: never; Returns: string }
      get_days_in_stock: { Args: { car_listed_at: string }; Returns: number }
      get_profit_margin: {
        Args: { purchase_price: number; selling_price: number }
        Returns: number
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission_category: string
          permission_name: string
        }[]
      }
      handle_failed_login: {
        Args: { _ip?: string; _user_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
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
      reactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: boolean
      }
      reset_login_attempts: { Args: { _user_id: string }; Returns: undefined }
      run_daily_backup: { Args: never; Returns: undefined }
      run_hourly_backup: { Args: never; Returns: undefined }
      run_monthly_backup: { Args: never; Returns: undefined }
      run_weekly_backup: { Args: never; Returns: undefined }
      soft_delete_user: {
        Args: { _admin_id: string; _reason?: string; _user_id: string }
        Returns: boolean
      }
      suspend_user: {
        Args: { _admin_id: string; _reason?: string; _user_id: string }
        Returns: boolean
      }
      trigger_scheduled_backup: { Args: never; Returns: undefined }
      verify_reactivation_otp: {
        Args: { _otp: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "super_admin" | "staff"
      staff_role:
        | "operations_manager"
        | "sales_manager"
        | "sales_rep"
        | "rental_manager"
        | "rental_staff"
        | "tradein_manager"
        | "tradein_staff"
        | "mechanic"
        | "marketing_manager"
        | "designer"
        | "support_agent"
        | "accounts_manager"
        | "finance_staff"
        | "driver"
        | "security_officer"
        | "system_admin"
        | "it_support"
        | "hr_manager"
        | "hr_staff"
        | "marketing_staff"
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
      app_role: ["admin", "customer", "super_admin", "staff"],
      staff_role: [
        "operations_manager",
        "sales_manager",
        "sales_rep",
        "rental_manager",
        "rental_staff",
        "tradein_manager",
        "tradein_staff",
        "mechanic",
        "marketing_manager",
        "designer",
        "support_agent",
        "accounts_manager",
        "finance_staff",
        "driver",
        "security_officer",
        "system_admin",
        "it_support",
        "hr_manager",
        "hr_staff",
        "marketing_staff",
      ],
    },
  },
} as const
