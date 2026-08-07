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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          password: string
          role?: string
          updated_at: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      batch_uploads: {
        Row: {
          auto_publish: boolean
          completed_at: string | null
          created_at: string
          defaults: Json | null
          failed_items: number
          id: string
          items: Json
          started_at: string
          status: string
          successful_items: number
          total_items: number
          user_id: string
        }
        Insert: {
          auto_publish?: boolean
          completed_at?: string | null
          created_at?: string
          defaults?: Json | null
          failed_items?: number
          id?: string
          items?: Json
          started_at?: string
          status?: string
          successful_items?: number
          total_items: number
          user_id: string
        }
        Update: {
          auto_publish?: boolean
          completed_at?: string | null
          created_at?: string
          defaults?: Json | null
          failed_items?: number
          id?: string
          items?: Json
          started_at?: string
          status?: string
          successful_items?: number
          total_items?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          app_version: string | null
          created_at: string | null
          description: string
          device_info: string | null
          id: string
          status: string | null
          steps_to_reproduce: string | null
          title: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          description: string
          device_info?: string | null
          id?: string
          status?: string | null
          steps_to_reproduce?: string | null
          title: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          description?: string
          device_info?: string | null
          id?: string
          status?: string | null
          steps_to_reproduce?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          order: number
          thumbnail_image: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id: string
          order: number
          thumbnail_image: string
          title: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          order?: number
          thumbnail_image?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_category_subcategory_mapping: {
        Row: {
          category_id: string
          created_at: string
          id: string
          subcategory_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id: string
          subcategory_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_category_subcategory_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_category_subcategory_mapping_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_field_option_visibility: {
        Row: {
          created_at: string
          hidden_for: string[] | null
          id: string
          option_id: string
          updated_at: string
          visible_for: string[] | null
        }
        Insert: {
          created_at?: string
          hidden_for?: string[] | null
          id: string
          option_id: string
          updated_at: string
          visible_for?: string[] | null
        }
        Update: {
          created_at?: string
          hidden_for?: string[] | null
          id?: string
          option_id?: string
          updated_at?: string
          visible_for?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "category_field_option_visibility_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "category_field_options"
            referencedColumns: ["id"]
          },
        ]
      }
      category_field_options: {
        Row: {
          created_at: string
          field_id: string
          id: string
          option_label: string
          option_order: number
          option_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id: string
          id: string
          option_label: string
          option_order: number
          option_value: string
          updated_at: string
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          option_label?: string
          option_order?: number
          option_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_field_options_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      category_field_slider_config: {
        Row: {
          created_at: string
          field_id: string
          id: string
          max_value: number
          min_value: number
          step: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id: string
          id: string
          max_value: number
          min_value: number
          step: number
          unit?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          max_value?: number
          min_value?: number
          step?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_field_slider_config_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      category_field_visibility: {
        Row: {
          created_at: string
          field_id: string
          hidden_for: string[] | null
          id: string
          updated_at: string
          visible_for: string[] | null
        }
        Insert: {
          created_at?: string
          field_id: string
          hidden_for?: string[] | null
          id: string
          updated_at: string
          visible_for?: string[] | null
        }
        Update: {
          created_at?: string
          field_id?: string
          hidden_for?: string[] | null
          id?: string
          updated_at?: string
          visible_for?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "category_field_visibility_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      category_subcategories: {
        Row: {
          code: string
          created_at: string
          id: string
          order: number
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id: string
          order: number
          title: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_type_category_mapping: {
        Row: {
          category_id: string
          created_at: string
          id: string
          type_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id: string
          type_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_type_category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_type_category_mapping_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "category_types"
            referencedColumns: ["id"]
          },
        ]
      }
      category_types: {
        Row: {
          code: string
          created_at: string
          id: string
          order: number
          thumbnail_image: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id: string
          order: number
          thumbnail_image: string
          title: string
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          order?: number
          thumbnail_image?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collectible_change_log: {
        Row: {
          change_type: string
          collectible_id: string
          created_at: string
          id: string
          new_value: Json
          prev_value: Json | null
          user_id: string
        }
        Insert: {
          change_type: string
          collectible_id: string
          created_at?: string
          id?: string
          new_value: Json
          prev_value?: Json | null
          user_id: string
        }
        Update: {
          change_type?: string
          collectible_id?: string
          created_at?: string
          id?: string
          new_value?: Json
          prev_value?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collectible_change_log_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collectible_change_log_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collectible_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collectible_field_values: {
        Row: {
          collectible_id: string
          created_at: string
          field_id: string
          field_level: Database["public"]["Enums"]["FieldLevel"]
          field_type: Database["public"]["Enums"]["FieldType"]
          id: string
          updated_at: string
          value: Json
        }
        Insert: {
          collectible_id: string
          created_at?: string
          field_id: string
          field_level: Database["public"]["Enums"]["FieldLevel"]
          field_type: Database["public"]["Enums"]["FieldType"]
          id: string
          updated_at: string
          value: Json
        }
        Update: {
          collectible_id?: string
          created_at?: string
          field_id?: string
          field_level?: Database["public"]["Enums"]["FieldLevel"]
          field_type?: Database["public"]["Enums"]["FieldType"]
          id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "collectible_field_values_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collectible_field_values_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      collectibles: {
        Row: {
          ai_metadata: Json | null
          autograph_assessment: Json | null
          available_for_sale: boolean
          available_for_trade: boolean
          batch_id: string | null
          category: string
          classification: string | null
          collectible_type: string
          confidence: string | null
          created_at: string
          custom_fields: Json
          description: string | null
          extraction_acknowledged_at: string | null
          extraction_failed_at: string | null
          extraction_failure_reason: string | null
          extraction_job_id: string | null
          extraction_retry_count: number
          extraction_status: string | null
          field_schema: Json | null
          filter_traits: Json | null
          firebase_id: string | null
          id: string
          listing_description: string | null
          listing_title: string | null
          metadata_provenance: Json
          photos: string[] | null
          privacy: string
          published_at: string | null
          reextraction_of: string | null
          saves_count: number
          schema_mode: string | null
          share_token: string | null
          subcategory: string | null
          tags: string[] | null
          title: string
          trait_metadata: Json | null
          traits: string[] | null
          updated_at: string
          user_id: string
          value: number | null
          verification_url: string | null
          visibility: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          autograph_assessment?: Json | null
          available_for_sale?: boolean
          available_for_trade?: boolean
          batch_id?: string | null
          category: string
          classification?: string | null
          collectible_type?: string
          confidence?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          extraction_acknowledged_at?: string | null
          extraction_failed_at?: string | null
          extraction_failure_reason?: string | null
          extraction_job_id?: string | null
          extraction_retry_count?: number
          extraction_status?: string | null
          field_schema?: Json | null
          filter_traits?: Json | null
          firebase_id?: string | null
          id: string
          listing_description?: string | null
          listing_title?: string | null
          metadata_provenance?: Json
          photos?: string[] | null
          privacy?: string
          published_at?: string | null
          reextraction_of?: string | null
          saves_count?: number
          schema_mode?: string | null
          share_token?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          trait_metadata?: Json | null
          traits?: string[] | null
          updated_at: string
          user_id: string
          value?: number | null
          verification_url?: string | null
          visibility?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          autograph_assessment?: Json | null
          available_for_sale?: boolean
          available_for_trade?: boolean
          batch_id?: string | null
          category?: string
          classification?: string | null
          collectible_type?: string
          confidence?: string | null
          created_at?: string
          custom_fields?: Json
          description?: string | null
          extraction_acknowledged_at?: string | null
          extraction_failed_at?: string | null
          extraction_failure_reason?: string | null
          extraction_job_id?: string | null
          extraction_retry_count?: number
          extraction_status?: string | null
          field_schema?: Json | null
          filter_traits?: Json | null
          firebase_id?: string | null
          id?: string
          listing_description?: string | null
          listing_title?: string | null
          metadata_provenance?: Json
          photos?: string[] | null
          privacy?: string
          published_at?: string | null
          reextraction_of?: string | null
          saves_count?: number
          schema_mode?: string | null
          share_token?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          trait_metadata?: Json | null
          traits?: string[] | null
          updated_at?: string
          user_id?: string
          value?: number | null
          verification_url?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collectibles_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collectibles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comp_alert_state: {
        Row: {
          first_surfaced_at: string
          surfaced_comp_id: string
          tracked_collectible_id: string
        }
        Insert: {
          first_surfaced_at?: string
          surfaced_comp_id: string
          tracked_collectible_id: string
        }
        Update: {
          first_surfaced_at?: string
          surfaced_comp_id?: string
          tracked_collectible_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comp_alert_state_surfaced_comp_id_fkey"
            columns: ["surfaced_comp_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_alert_state_surfaced_comp_id_fkey"
            columns: ["surfaced_comp_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_alert_state_tracked_collectible_id_fkey"
            columns: ["tracked_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_alert_state_tracked_collectible_id_fkey"
            columns: ["tracked_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          is_accepted: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_accepted?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_accepted?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          category_code: string | null
          category_type: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_official: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          member_count: number | null
          name: string | null
          origin_collectible_id: string | null
          origin_type:
            | Database["public"]["Enums"]["conversation_origin_type"]
            | null
          tier: Database["public"]["Enums"]["group_tier"] | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string | null
          visibility: Database["public"]["Enums"]["group_visibility"] | null
        }
        Insert: {
          category_code?: string | null
          category_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_official?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          member_count?: number | null
          name?: string | null
          origin_collectible_id?: string | null
          origin_type?:
            | Database["public"]["Enums"]["conversation_origin_type"]
            | null
          tier?: Database["public"]["Enums"]["group_tier"] | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["group_visibility"] | null
        }
        Update: {
          category_code?: string | null
          category_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_official?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          member_count?: number | null
          name?: string | null
          origin_collectible_id?: string | null
          origin_type?:
            | Database["public"]["Enums"]["conversation_origin_type"]
            | null
          tier?: Database["public"]["Enums"]["group_tier"] | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["group_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_origin_collectible_id_fkey"
            columns: ["origin_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_origin_collectible_id_fkey"
            columns: ["origin_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      field_category_mappings: {
        Row: {
          category_id: string
          created_at: string
          field_id: string
          field_order: number
          id: string
          is_required: boolean
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          field_id: string
          field_order: number
          id: string
          is_required?: boolean
          updated_at: string
        }
        Update: {
          category_id?: string
          created_at?: string
          field_id?: string
          field_order?: number
          id?: string
          is_required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_category_mappings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      field_subcategory_mappings: {
        Row: {
          created_at: string
          field_id: string
          field_order: number
          id: string
          is_required: boolean
          subcategory_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id: string
          field_order: number
          id: string
          is_required?: boolean
          subcategory_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          field_id?: string
          field_order?: number
          id?: string
          is_required?: boolean
          subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_subcategory_mappings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_subcategory_mappings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      field_type_mappings: {
        Row: {
          created_at: string
          field_id: string
          field_order: number
          id: string
          is_required: boolean
          type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id: string
          field_order: number
          id: string
          is_required?: boolean
          type_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          field_id?: string
          field_order?: number
          id?: string
          is_required?: boolean
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_type_mappings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_type_mappings_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "category_types"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string
          field_label: string
          field_type: Database["public"]["Enums"]["FieldType"]
          id: string
          placeholder: string | null
          section_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_label: string
          field_type: Database["public"]["Enums"]["FieldType"]
          id: string
          placeholder?: string | null
          section_title?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          field_label?: string
          field_type?: Database["public"]["Enums"]["FieldType"]
          id?: string
          placeholder?: string | null
          section_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attached_collectible_id: string | null
          attached_media_urls: string[] | null
          attached_showcase_id: string | null
          content: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          moderation_flags: Json | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_title: string | null
          reply_to_message_id: string | null
          sender_id: string | null
          system_event_data: Json | null
          system_event_type: string | null
        }
        Insert: {
          attached_collectible_id?: string | null
          attached_media_urls?: string[] | null
          attached_showcase_id?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          moderation_flags?: Json | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_title?: string | null
          reply_to_message_id?: string | null
          sender_id?: string | null
          system_event_data?: Json | null
          system_event_type?: string | null
        }
        Update: {
          attached_collectible_id?: string | null
          attached_media_urls?: string[] | null
          attached_showcase_id?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          moderation_flags?: Json | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          post_title?: string | null
          reply_to_message_id?: string | null
          sender_id?: string | null
          system_event_data?: Json | null
          system_event_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_attached_collectible_id_fkey"
            columns: ["attached_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_attached_collectible_id_fkey"
            columns: ["attached_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_attached_showcase_id_fkey"
            columns: ["attached_showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          disabled_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          disabled_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          disabled_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_votes: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "post_votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_sync_log: {
        Row: {
          cards_checked: number | null
          cards_updated: number | null
          completed_at: string | null
          error_message: string | null
          errors: number | null
          history_records_created: number | null
          id: string
          last_sync_timestamp: string | null
          started_at: string
          status: string | null
        }
        Insert: {
          cards_checked?: number | null
          cards_updated?: number | null
          completed_at?: string | null
          error_message?: string | null
          errors?: number | null
          history_records_created?: number | null
          id?: string
          last_sync_timestamp?: string | null
          started_at?: string
          status?: string | null
        }
        Update: {
          cards_checked?: number | null
          cards_updated?: number | null
          completed_at?: string | null
          error_message?: string | null
          errors?: number | null
          history_records_created?: number | null
          id?: string
          last_sync_timestamp?: string | null
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      recent_views: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          viewed_on: string
          viewer_anon_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          viewed_on?: string
          viewer_anon_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          viewed_on?: string
          viewer_anon_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          action_taken: string | null
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          reason: string
          report_type: Database["public"]["Enums"]["report_type"]
          reported_conversation_id: string | null
          reported_message_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          action_taken?: string | null
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          report_type: Database["public"]["Enums"]["report_type"]
          reported_conversation_id?: string | null
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          action_taken?: string | null
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          reported_conversation_id?: string | null
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_conversation_id_fkey"
            columns: ["reported_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_message_id_fkey"
            columns: ["reported_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_collectibles: {
        Row: {
          added_at: string | null
          collectible_id: string
          display_order: number | null
          id: string
          showcase_id: string
        }
        Insert: {
          added_at?: string | null
          collectible_id: string
          display_order?: number | null
          id: string
          showcase_id: string
        }
        Update: {
          added_at?: string | null
          collectible_id?: string
          display_order?: number | null
          id?: string
          showcase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_collectibles_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_collectibles_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_collectibles_showcase_id_fkey"
            columns: ["showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
        ]
      }
      showcases: {
        Row: {
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          rules: Json | null
          rules_last_evaluated_at: string | null
          rules_last_evaluation_status: string | null
          rules_match: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id: string
          rules?: Json | null
          rules_last_evaluated_at?: string | null
          rules_last_evaluation_status?: string | null
          rules_match?: string | null
          title: string
          type?: string
          updated_at: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          rules?: Json | null
          rules_last_evaluated_at?: string | null
          rules_last_evaluation_status?: string | null
          rules_match?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategory_retag_proposals: {
        Row: {
          category: string
          collectible_id: string
          created_at: string
          current_subcategory: string
          is_valid_mapping: boolean
          matched_rule: string | null
          note: string | null
          proposed_subcategory: string
          title: string
        }
        Insert: {
          category: string
          collectible_id: string
          created_at?: string
          current_subcategory: string
          is_valid_mapping: boolean
          matched_rule?: string | null
          note?: string | null
          proposed_subcategory: string
          title: string
        }
        Update: {
          category?: string
          collectible_id?: string
          created_at?: string
          current_subcategory?: string
          is_valid_mapping?: boolean
          matched_rule?: string | null
          note?: string | null
          proposed_subcategory?: string
          title?: string
        }
        Relationships: []
      }
      suggested_collectors_cache: {
        Row: {
          candidate_id: string
          computed_at: string
          expires_at: string
          match_score: number
          reason_code: string
          reason_meta: Json | null
          viewer_id: string
        }
        Insert: {
          candidate_id: string
          computed_at?: string
          expires_at: string
          match_score: number
          reason_code: string
          reason_meta?: Json | null
          viewer_id: string
        }
        Update: {
          candidate_id?: string
          computed_at?: string
          expires_at?: string
          match_score?: number
          reason_code?: string
          reason_meta?: Json | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggested_collectors_cache_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggested_collectors_cache_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          message: string
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          message: string
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string
          status?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_items: {
        Row: {
          collectible_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          collectible_id: string
          created_at?: string
          id: string
          user_id: string
        }
        Update: {
          collectible_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_items_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_items_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_category_interests: {
        Row: {
          category_code: string
          created_at: string
          id: string
          type_code: string
          user_id: string
        }
        Insert: {
          category_code: string
          created_at?: string
          id: string
          type_code: string
          user_id: string
        }
        Update: {
          category_code?: string
          created_at?: string
          id?: string
          type_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messaging_settings: {
        Row: {
          dm_privacy: Database["public"]["Enums"]["dm_privacy"] | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          dm_privacy?: Database["public"]["Enums"]["dm_privacy"] | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          dm_privacy?: Database["public"]["Enums"]["dm_privacy"] | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messaging_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          collectibles_count: number
          collectibles_last_changed_at: string | null
          collector_profile: string | null
          created_at: string
          crown_jewel_collectible_id: string | null
          display_name: string | null
          email: string
          featured_showcase_id: string | null
          firebase_uid: string | null
          follow_lists_visibility: string
          followers_count: number
          following_count: number
          id: string
          last_seen_at: string | null
          messaging_permission: string | null
          onboarding_completed_at: string | null
          phone_number: string | null
          primary_type: string | null
          settings: Json | null
          sharing_permission: string
          showcases_count: number
          supabase_auth_id: string | null
          tags: string[] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          collectibles_count?: number
          collectibles_last_changed_at?: string | null
          collector_profile?: string | null
          created_at?: string
          crown_jewel_collectible_id?: string | null
          display_name?: string | null
          email: string
          featured_showcase_id?: string | null
          firebase_uid?: string | null
          follow_lists_visibility?: string
          followers_count?: number
          following_count?: number
          id: string
          last_seen_at?: string | null
          messaging_permission?: string | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          primary_type?: string | null
          settings?: Json | null
          sharing_permission?: string
          showcases_count?: number
          supabase_auth_id?: string | null
          tags?: string[] | null
          updated_at: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          collectibles_count?: number
          collectibles_last_changed_at?: string | null
          collector_profile?: string | null
          created_at?: string
          crown_jewel_collectible_id?: string | null
          display_name?: string | null
          email?: string
          featured_showcase_id?: string | null
          firebase_uid?: string | null
          follow_lists_visibility?: string
          followers_count?: number
          following_count?: number
          id?: string
          last_seen_at?: string | null
          messaging_permission?: string | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          primary_type?: string | null
          settings?: Json | null
          sharing_permission?: string
          showcases_count?: number
          supabase_auth_id?: string | null
          tags?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_crown_jewel_collectible_id_fkey"
            columns: ["crown_jewel_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_crown_jewel_collectible_id_fkey"
            columns: ["crown_jewel_collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_featured_showcase_id_fkey"
            columns: ["featured_showcase_id"]
            isOneToOne: false
            referencedRelation: "showcases"
            referencedColumns: ["id"]
          },
        ]
      }
      view_counters: {
        Row: {
          last_milestone: number
          target_id: string
          target_type: string
          total_views: number
          unique_viewers: number
          unique_viewers_7d: number
          updated_at: string
          views_7d: number
        }
        Insert: {
          last_milestone?: number
          target_id: string
          target_type: string
          total_views?: number
          unique_viewers?: number
          unique_viewers_7d?: number
          updated_at?: string
          views_7d?: number
        }
        Update: {
          last_milestone?: number
          target_id?: string
          target_type?: string
          total_views?: number
          unique_viewers?: number
          unique_viewers_7d?: number
          updated_at?: string
          views_7d?: number
        }
        Relationships: []
      }
    }
    Views: {
      collectibles_unified: {
        Row: {
          ai_metadata: Json | null
          api_price: number | null
          api_price_available: boolean | null
          api_price_updated_at: string | null
          autograph_assessment: Json | null
          available_for_sale: boolean | null
          available_for_trade: boolean | null
          card_catalog_id: string | null
          card_hedge_category: string | null
          card_hedge_id: string | null
          card_image_url: string | null
          card_name: string | null
          card_number: string | null
          card_year: number | null
          category_group: string | null
          certificate_number: string | null
          classification: string | null
          collectible_type: string | null
          confidence: string | null
          created_at: string | null
          description: string | null
          display_price: number | null
          extraction_status: string | null
          gain_30day: number | null
          gain_7day: number | null
          grade: string | null
          grading_company: string | null
          id: string | null
          is_rookie: boolean | null
          listing_description: string | null
          listing_title: string | null
          manual_price: number | null
          margin_percentage: number | null
          memorabilia_category: string | null
          memorabilia_subcategory: string | null
          photos: string[] | null
          player_name: string | null
          pricing_mode: Database["public"]["Enums"]["pricing_mode"] | null
          privacy: string | null
          published_at: string | null
          sales_30day: number | null
          sales_7day: number | null
          saves_count: number | null
          search_text: string | null
          set_name: string | null
          tags: string[] | null
          title: string | null
          trading_card_details_id: string | null
          trait_metadata: Json | null
          traits: string[] | null
          unified_category: string | null
          updated_at: string | null
          user_id: string | null
          variant: string | null
          visibility: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          api_price?: never
          api_price_available?: never
          api_price_updated_at?: never
          autograph_assessment?: Json | null
          available_for_sale?: boolean | null
          available_for_trade?: boolean | null
          card_catalog_id?: never
          card_hedge_category?: never
          card_hedge_id?: never
          card_image_url?: never
          card_name?: never
          card_number?: never
          card_year?: never
          category_group?: never
          certificate_number?: never
          classification?: string | null
          collectible_type?: string | null
          confidence?: string | null
          created_at?: string | null
          description?: string | null
          display_price?: number | null
          extraction_status?: string | null
          gain_30day?: never
          gain_7day?: never
          grade?: never
          grading_company?: never
          id?: string | null
          is_rookie?: never
          listing_description?: string | null
          listing_title?: string | null
          manual_price?: never
          margin_percentage?: never
          memorabilia_category?: never
          memorabilia_subcategory?: never
          photos?: string[] | null
          player_name?: never
          pricing_mode?: never
          privacy?: string | null
          published_at?: string | null
          sales_30day?: never
          sales_7day?: never
          saves_count?: number | null
          search_text?: never
          set_name?: never
          tags?: string[] | null
          title?: string | null
          trading_card_details_id?: never
          trait_metadata?: Json | null
          traits?: string[] | null
          unified_category?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant?: never
          visibility?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          api_price?: never
          api_price_available?: never
          api_price_updated_at?: never
          autograph_assessment?: Json | null
          available_for_sale?: boolean | null
          available_for_trade?: boolean | null
          card_catalog_id?: never
          card_hedge_category?: never
          card_hedge_id?: never
          card_image_url?: never
          card_name?: never
          card_number?: never
          card_year?: never
          category_group?: never
          certificate_number?: never
          classification?: string | null
          collectible_type?: string | null
          confidence?: string | null
          created_at?: string | null
          description?: string | null
          display_price?: number | null
          extraction_status?: string | null
          gain_30day?: never
          gain_7day?: never
          grade?: never
          grading_company?: never
          id?: string | null
          is_rookie?: never
          listing_description?: string | null
          listing_title?: string | null
          manual_price?: never
          margin_percentage?: never
          memorabilia_category?: never
          memorabilia_subcategory?: never
          photos?: string[] | null
          player_name?: never
          pricing_mode?: never
          privacy?: string | null
          published_at?: string | null
          sales_30day?: never
          sales_7day?: never
          saves_count?: number | null
          search_text?: never
          set_name?: never
          tags?: string[] | null
          title?: string | null
          trading_card_details_id?: never
          trait_metadata?: Json | null
          traits?: string[] | null
          unified_category?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant?: never
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collectibles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _comps_v2_legacy: {
        Args: { p_limit?: number; p_source_id: string }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          category: string
          id: string
          image: string
          matched_signals: number
          owner_avatar: string
          owner_id: string
          owner_name: string
          owner_username: string
          saves_count: number
          score_fraction: number
          subcategory: string
          title: string
          total_signals: number
          value: number
          value_fallback: boolean
        }[]
      }
      browse_collectibles: {
        Args: {
          p_exclude_user_id?: string
          p_limit?: number
          p_offset?: number
          p_owner_ids?: string[]
          p_search?: string
          p_sort?: string
          p_statuses?: string[]
          p_types?: string[]
          p_value_max?: number
          p_value_min?: number
        }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          category: string
          created_at: string
          id: string
          image: string
          item_value: number
          owner_avatar: string
          owner_id: string
          owner_name: string
          owner_username: string
          subcategory: string
          title: string
          track_count: number
        }[]
      }
      browse_market_stats: {
        Args: { p_exclude_user_id?: string }
        Returns: {
          active_listings: number
          added_last_24h: number
          total_items: number
          total_value: number
        }[]
      }
      browse_market_v2: {
        Args: {
          p_exclude_user_id?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_search_person?: string
          p_search_team?: string
          p_sort?: string
          p_statuses?: string[]
          p_traits?: string[]
          p_types?: string[]
          p_value_max?: number
          p_value_min?: number
        }
        Returns: {
          ai_metadata: Json
          available_for_sale: boolean
          available_for_trade: boolean
          category: string
          classification: string
          collectible_type: string
          created_at: string
          filter_traits: Json
          id: string
          image: string
          owner_avatar: string
          owner_display_name: string
          owner_id: string
          owner_username: string
          subcategory: string
          title: string
          track_count: number
          trait_metadata: Json
          traits: string[]
          value: number
          view_count: number
        }[]
      }
      calculate_effective_price: {
        Args: {
          p_api_price: number
          p_manual_price: number
          p_margin_percentage: number
          p_pricing_mode: Database["public"]["Enums"]["pricing_mode"]
        }
        Returns: number
      }
      can_send_dm: {
        Args: { p_recipient_id: string; p_sender_id: string }
        Returns: {
          allowed: boolean
          reason: string
        }[]
      }
      get_category_counts: {
        Args: never
        Returns: {
          cnt: number
          unified_category: string
        }[]
      }
      get_collectible_comps: {
        Args: { p_limit?: number; p_source_id: string }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          category: string
          id: string
          image: string
          matched_signals: number
          owner_avatar: string
          owner_id: string
          owner_name: string
          owner_username: string
          saves_count: number
          score_fraction: number
          subcategory: string
          title: string
          total_signals: number
          value: number
          value_fallback: boolean
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      get_firebase_image_collectibles: {
        Args: { batch_limit?: number }
        Returns: {
          id: string
          photos: string[]
          user_id: string
        }[]
      }
      get_group_member_limit: {
        Args: { p_tier: Database["public"]["Enums"]["group_tier"] }
        Returns: number
      }
      get_hot_items: {
        Args: { p_exclude_user_id?: string; p_limit?: number }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          display_name: string
          id: string
          photos: string[]
          title: string
          track_count: number
          username: string
          value: number
        }[]
      }
      get_mutual_follows: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_profile_id: string
          p_viewer_id: string
        }
        Returns: {
          avatar: string
          bio: string
          display_name: string
          followed_at: string
          id: string
          username: string
        }[]
      }
      get_or_create_dm: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: {
          conversation_id: string
          is_new: boolean
        }[]
      }
      get_track_counts: {
        Args: { p_collectible_ids: string[] }
        Returns: {
          cnt: number
          collectible_id: string
        }[]
      }
      get_tracked_category_counts: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          cnt: number
        }[]
      }
      get_tracked_comps: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          category: string
          id: string
          image: string
          matched_signals: number
          owner_avatar: string
          owner_id: string
          owner_name: string
          owner_username: string
          saves_count: number
          score_fraction: number
          source_collectible_id: string
          source_title: string
          subcategory: string
          title: string
          total_signals: number
          value: number
          value_fallback: boolean
        }[]
      }
      get_unread_count: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: number
      }
      get_user_id_from_auth: { Args: never; Returns: string }
      get_user_track_count: {
        Args: { profile_user_id: string }
        Returns: number
      }
      get_view_counts: {
        Args: { p_target_ids: string[]; p_target_type: string }
        Returns: {
          target_id: string
          total_views: number
          unique_viewers_7d: number
          views_7d: number
        }[]
      }
      record_view: {
        Args: {
          p_target_id: string
          p_target_type: string
          p_viewer_anon_id: string
        }
        Returns: undefined
      }
      search_collectibles: {
        Args: {
          p_available_for_sale?: boolean
          p_available_for_trade?: boolean
          p_category?: string
          p_collectible_type?: string
          p_exclude_user_id?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          available_for_sale: boolean
          available_for_trade: boolean
          card_name: string
          collectible_type: string
          created_at: string
          display_price: number
          grade: string
          id: string
          photos: string[]
          player_name: string
          title: string
          unified_category: string
          user_id: string
          visibility: string
        }[]
      }
      search_collectors_tiered: {
        Args: {
          p_exclude_user_id?: string
          p_limit?: number
          p_query: string
          p_statuses?: string[]
          p_traits?: string[]
          p_types?: string[]
        }
        Returns: {
          avatar: string
          collectibles_count: number
          display_name: string
          match_count: number
          match_tier: number
          preview_thumbs: string[]
          user_id: string
          username: string
        }[]
      }
      search_showcases_tiered: {
        Args: {
          p_exclude_user_id?: string
          p_limit?: number
          p_query: string
          p_statuses?: string[]
          p_traits?: string[]
          p_types?: string[]
        }
        Returns: {
          description: string
          item_count: number
          match_count: number
          match_tier: number
          owner_avatar: string
          owner_display_name: string
          owner_id: string
          owner_username: string
          preview_thumbs: string[]
          showcase_id: string
          title: string
        }[]
      }
      suggest_collectors_for: {
        Args: {
          p_force_recompute?: boolean
          p_limit?: number
          p_viewer_id: string
        }
        Returns: {
          avatar: string
          candidate_id: string
          collectibles_count: number
          display_name: string
          followers_count: number
          match_score: number
          preview_items: string[]
          reason_code: string
          reason_meta: Json
          username: string
        }[]
      }
      unschedule_if_exists: { Args: { p_name: string }; Returns: undefined }
      update_collectible_photos: {
        Args: { p_id: string; p_photos: string[] }
        Returns: undefined
      }
    }
    Enums: {
      conversation_origin_type: "listing" | "profile" | "group" | "search"
      conversation_type: "direct" | "group"
      dm_privacy: "everyone" | "followers" | "nobody"
      FieldLevel: "type" | "category" | "subcategory"
      FieldType:
        | "text"
        | "textarea"
        | "number"
        | "textList"
        | "toggle"
        | "radio"
        | "multiselect"
        | "slider"
        | "dropdown"
        | "section"
      group_tier: "private_user" | "public_user" | "public_official"
      group_visibility: "public" | "private"
      member_role: "owner" | "admin" | "member"
      message_type:
        | "text"
        | "system"
        | "discussion"
        | "collection_share"
        | "showcase_share"
        | "legit_check"
      moderation_status: "clean" | "flagged" | "removed"
      pricing_mode: "dynamic" | "dynamic_margin" | "manual"
      report_status: "pending" | "reviewed" | "actioned" | "dismissed"
      report_type: "message" | "user" | "group"
      vote_type: "legit" | "suspect"
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
      conversation_origin_type: ["listing", "profile", "group", "search"],
      conversation_type: ["direct", "group"],
      dm_privacy: ["everyone", "followers", "nobody"],
      FieldLevel: ["type", "category", "subcategory"],
      FieldType: [
        "text",
        "textarea",
        "number",
        "textList",
        "toggle",
        "radio",
        "multiselect",
        "slider",
        "dropdown",
        "section",
      ],
      group_tier: ["private_user", "public_user", "public_official"],
      group_visibility: ["public", "private"],
      member_role: ["owner", "admin", "member"],
      message_type: [
        "text",
        "system",
        "discussion",
        "collection_share",
        "showcase_share",
        "legit_check",
      ],
      moderation_status: ["clean", "flagged", "removed"],
      pricing_mode: ["dynamic", "dynamic_margin", "manual"],
      report_status: ["pending", "reviewed", "actioned", "dismissed"],
      report_type: ["message", "user", "group"],
      vote_type: ["legit", "suspect"],
    },
  },
} as const
