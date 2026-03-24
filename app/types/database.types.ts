export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actions: {
        Row: {
          created_at: string | null
          id: string
          name: Json
          slug: string
          sort_order: number | null
          status: string | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: Json
          slug: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: Json
          slug?: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      active_landings: {
        Row: {
          breadcrumb: Json | null
          created_at: string | null
          dimension_values: string[]
          filters_json: Json | null
          id: string
          intro_text_en: string | null
          intro_text_es: string | null
          is_active: boolean
          last_calculated: string | null
          meta_description_en: string | null
          meta_description_es: string | null
          meta_title_en: string | null
          meta_title_es: string | null
          overlap_percentage: number | null
          overlap_threshold: number | null
          parent_slug: string | null
          parent_vehicle_count: number | null
          schema_data: Json | null
          slug: string
          vehicle_count: number
          vertical: string
        }
        Insert: {
          breadcrumb?: Json | null
          created_at?: string | null
          dimension_values: string[]
          filters_json?: Json | null
          id?: string
          intro_text_en?: string | null
          intro_text_es?: string | null
          is_active?: boolean
          last_calculated?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          meta_title_en?: string | null
          meta_title_es?: string | null
          overlap_percentage?: number | null
          overlap_threshold?: number | null
          parent_slug?: string | null
          parent_vehicle_count?: number | null
          schema_data?: Json | null
          slug: string
          vehicle_count?: number
          vertical?: string
        }
        Update: {
          breadcrumb?: Json | null
          created_at?: string | null
          dimension_values?: string[]
          filters_json?: Json | null
          id?: string
          intro_text_en?: string | null
          intro_text_es?: string | null
          is_active?: boolean
          last_calculated?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          meta_title_en?: string | null
          meta_title_es?: string | null
          overlap_percentage?: number | null
          overlap_threshold?: number | null
          parent_slug?: string | null
          parent_vehicle_count?: number | null
          schema_data?: Json | null
          slug?: string
          vehicle_count?: number
          vertical?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          actor_type: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          user_id: string | null
          vertical: string
        }
        Insert: {
          action: string
          actor_type: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
          vertical: string
        }
        Update: {
          action?: string
          actor_type?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_id?: string | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      ad_events: {
        Row: {
          ad_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          source: string | null
          user_country: string | null
          user_id: string | null
          user_province: string | null
          user_region: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          source?: string | null
          user_country?: string | null
          user_id?: string | null
          user_province?: string | null
          user_region?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          source?: string | null
          user_country?: string | null
          user_id?: string | null
          user_province?: string | null
          user_region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ad_events_ad_id_fkey'
            columns: ['ad_id']
            isOneToOne: false
            referencedRelation: 'ads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ad_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      ad_floor_prices: {
        Row: {
          created_at: string | null
          currency: string | null
          floor_cpm_cents: number
          id: string
          position: string
          updated_at: string | null
          vertical: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          floor_cpm_cents?: number
          id?: string
          position: string
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          floor_cpm_cents?: number
          id?: string
          position?: string
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      ad_revenue_log: {
        Row: {
          ad_id: string | null
          bidder: string | null
          cpm_cents: number
          created_at: string | null
          currency: string | null
          id: string
          page_path: string | null
          position: string
          source: string
          user_country: string | null
        }
        Insert: {
          ad_id?: string | null
          bidder?: string | null
          cpm_cents?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          page_path?: string | null
          position: string
          source: string
          user_country?: string | null
        }
        Update: {
          ad_id?: string | null
          bidder?: string | null
          cpm_cents?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          page_path?: string | null
          position?: string
          source?: string
          user_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ad_revenue_log_ad_id_fkey'
            columns: ['ad_id']
            isOneToOne: false
            referencedRelation: 'ads'
            referencedColumns: ['id']
          },
        ]
      }
      ads: {
        Row: {
          action_slugs: string[] | null
          advertiser_id: string
          category_slugs: string[] | null
          clicks: number | null
          countries: string[] | null
          created_at: string | null
          cta_text: Json | null
          description: string | null
          email: string | null
          ends_at: string | null
          format: string | null
          id: string
          image_url: string | null
          impressions: number | null
          include_in_email: boolean | null
          include_in_pdf: boolean | null
          link_url: string | null
          logo_url: string | null
          phone: string | null
          positions: string[] | null
          price_monthly_cents: number | null
          provinces: string[] | null
          regions: string[] | null
          starts_at: string | null
          status: string | null
          target_segments: string[] | null
          title: string | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          action_slugs?: string[] | null
          advertiser_id: string
          category_slugs?: string[] | null
          clicks?: number | null
          countries?: string[] | null
          created_at?: string | null
          cta_text?: Json | null
          description?: string | null
          email?: string | null
          ends_at?: string | null
          format?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          include_in_email?: boolean | null
          include_in_pdf?: boolean | null
          link_url?: string | null
          logo_url?: string | null
          phone?: string | null
          positions?: string[] | null
          price_monthly_cents?: number | null
          provinces?: string[] | null
          regions?: string[] | null
          starts_at?: string | null
          status?: string | null
          target_segments?: string[] | null
          title?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          action_slugs?: string[] | null
          advertiser_id?: string
          category_slugs?: string[] | null
          clicks?: number | null
          countries?: string[] | null
          created_at?: string | null
          cta_text?: Json | null
          description?: string | null
          email?: string | null
          ends_at?: string | null
          format?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          include_in_email?: boolean | null
          include_in_pdf?: boolean | null
          link_url?: string | null
          logo_url?: string | null
          phone?: string | null
          positions?: string[] | null
          price_monthly_cents?: number | null
          provinces?: string[] | null
          regions?: string[] | null
          starts_at?: string | null
          status?: string | null
          target_segments?: string[] | null
          title?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ads_advertiser_id_fkey'
            columns: ['advertiser_id']
            isOneToOne: false
            referencedRelation: 'advertisers'
            referencedColumns: ['id']
          },
        ]
      }
      advertisements: {
        Row: {
          admin_notes: string | null
          attributes_json: Json | null
          brand: string | null
          category_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_preference: string | null
          created_at: string | null
          description: string | null
          id: string
          kilometers: number | null
          location: string | null
          match_vehicle_id: string | null
          model: string | null
          photos: Json | null
          price: number | null
          status: string | null
          subcategory_id: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
          vertical: string
          year: number | null
        }
        Insert: {
          admin_notes?: string | null
          attributes_json?: Json | null
          brand?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          kilometers?: number | null
          location?: string | null
          match_vehicle_id?: string | null
          model?: string | null
          photos?: Json | null
          price?: number | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          vertical?: string
          year?: number | null
        }
        Update: {
          admin_notes?: string | null
          attributes_json?: Json | null
          brand?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          kilometers?: number | null
          location?: string | null
          match_vehicle_id?: string | null
          model?: string | null
          photos?: Json | null
          price?: number | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          vertical?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'advertisements_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'advertisements_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'advertisements_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'advertisements_subcategory_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'advertisements_type_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'advertisements_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      advertisers: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          buyer_country: string | null
          created_at: string | null
          device_type: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          platform: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_id: string | null
          version: number | null
          vertical: string | null
        }
        Insert: {
          buyer_country?: string | null
          created_at?: string | null
          device_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
          version?: number | null
          vertical?: string | null
        }
        Update: {
          buyer_country?: string | null
          created_at?: string | null
          device_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_id?: string | null
          version?: number | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'analytics_events_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'analytics_events_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'analytics_events_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      api_usage: {
        Row: {
          api_key: string | null
          created_at: string | null
          endpoint: string | null
          id: string
          params: Json | null
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          params?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          endpoint?: string | null
          id?: string
          params?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: Json | null
          expires_at: string | null
          faq_schema: Json | null
          id: string
          meta_description: Json | null
          pending_translations: boolean | null
          published_at: string | null
          reading_time_minutes: number | null
          related_categories: string[] | null
          scheduled_at: string | null
          section: string
          seo_score: number | null
          slug: string
          social_post_text: Json | null
          social_posted: boolean | null
          social_scheduled_at: string | null
          status: string | null
          tags: string[] | null
          target_markets: string[] | null
          title: Json
          updated_at: string | null
          vertical: string
          views: number | null
        }
        Insert: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: Json | null
          expires_at?: string | null
          faq_schema?: Json | null
          id?: string
          meta_description?: Json | null
          pending_translations?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_categories?: string[] | null
          scheduled_at?: string | null
          section: string
          seo_score?: number | null
          slug: string
          social_post_text?: Json | null
          social_posted?: boolean | null
          social_scheduled_at?: string | null
          status?: string | null
          tags?: string[] | null
          target_markets?: string[] | null
          title: Json
          updated_at?: string | null
          vertical?: string
          views?: number | null
        }
        Update: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: Json | null
          expires_at?: string | null
          faq_schema?: Json | null
          id?: string
          meta_description?: Json | null
          pending_translations?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_categories?: string[] | null
          scheduled_at?: string | null
          section?: string
          seo_score?: number | null
          slug?: string
          social_post_text?: Json | null
          social_posted?: boolean | null
          social_scheduled_at?: string | null
          status?: string | null
          tags?: string[] | null
          target_markets?: string[] | null
          title?: Json
          updated_at?: string | null
          vertical?: string
          views?: number | null
        }
        Relationships: []
      }
      attributes: {
        Row: {
          created_at: string | null
          id: string
          is_extra: boolean | null
          is_hidden: boolean | null
          label: Json | null
          label_en: string | null
          label_es: string | null
          name: string
          options: Json | null
          sort_order: number | null
          status: Database['public']['Enums']['vehicle_status'] | null
          subcategory_id: string | null
          type: Database['public']['Enums']['filter_type']
          unit: string | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_extra?: boolean | null
          is_hidden?: boolean | null
          label?: Json | null
          label_en?: string | null
          label_es?: string | null
          name: string
          options?: Json | null
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          subcategory_id?: string | null
          type: Database['public']['Enums']['filter_type']
          unit?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_extra?: boolean | null
          is_hidden?: boolean | null
          label?: Json | null
          label_en?: string | null
          label_es?: string | null
          name?: string
          options?: Json | null
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          subcategory_id?: string | null
          type?: Database['public']['Enums']['filter_type']
          unit?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'filter_definitions_subcategory_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
        ]
      }
      auction_bids: {
        Row: {
          amount_cents: number
          auction_id: string
          created_at: string | null
          id: string
          is_winning: boolean | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          auction_id: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          auction_id?: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'auction_bids_auction_id_fkey'
            columns: ['auction_id']
            isOneToOne: false
            referencedRelation: 'auctions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auction_bids_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      auction_registrations: {
        Row: {
          additional_docs: Json | null
          approved_at: string | null
          approved_by: string | null
          auction_id: string
          company_name: string | null
          deposit_cents: number | null
          deposit_paid: boolean | null
          deposit_status: string | null
          id: string | null
          id_document_url: string | null
          id_number: string | null
          id_type: string | null
          registered_at: string | null
          rejection_reason: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          transport_license_url: string | null
          user_id: string
        }
        Insert: {
          additional_docs?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          auction_id: string
          company_name?: string | null
          deposit_cents?: number | null
          deposit_paid?: boolean | null
          deposit_status?: string | null
          id?: string | null
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          registered_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transport_license_url?: string | null
          user_id: string
        }
        Update: {
          additional_docs?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          auction_id?: string
          company_name?: string | null
          deposit_cents?: number | null
          deposit_paid?: boolean | null
          deposit_status?: string | null
          id?: string | null
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          registered_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          transport_license_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'auction_registrations_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auction_registrations_auction_id_fkey'
            columns: ['auction_id']
            isOneToOne: false
            referencedRelation: 'auctions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auction_registrations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      auctions: {
        Row: {
          anti_snipe_seconds: number | null
          anti_sniping_minutes: number | null
          bid_count: number | null
          bid_increment_cents: number
          buyer_premium_pct: number | null
          created_at: string | null
          current_bid_cents: number | null
          deposit_cents: number
          description: string | null
          ends_at: string
          extended_until: string | null
          id: string
          reserve_price_cents: number | null
          start_price_cents: number
          starts_at: string
          status: Database['public']['Enums']['auction_status'] | null
          title: string | null
          vehicle_id: string
          vertical: string
          winner_id: string | null
          winning_bid_cents: number | null
        }
        Insert: {
          anti_snipe_seconds?: number | null
          anti_sniping_minutes?: number | null
          bid_count?: number | null
          bid_increment_cents?: number
          buyer_premium_pct?: number | null
          created_at?: string | null
          current_bid_cents?: number | null
          deposit_cents?: number
          description?: string | null
          ends_at: string
          extended_until?: string | null
          id?: string
          reserve_price_cents?: number | null
          start_price_cents: number
          starts_at: string
          status?: Database['public']['Enums']['auction_status'] | null
          title?: string | null
          vehicle_id: string
          vertical?: string
          winner_id?: string | null
          winning_bid_cents?: number | null
        }
        Update: {
          anti_snipe_seconds?: number | null
          anti_sniping_minutes?: number | null
          bid_count?: number | null
          bid_increment_cents?: number
          buyer_premium_pct?: number | null
          created_at?: string | null
          current_bid_cents?: number | null
          deposit_cents?: number
          description?: string | null
          ends_at?: string
          extended_until?: string | null
          id?: string
          reserve_price_cents?: number | null
          start_price_cents?: number
          starts_at?: string
          status?: Database['public']['Enums']['auction_status'] | null
          title?: string | null
          vehicle_id?: string
          vertical?: string
          winner_id?: string | null
          winning_bid_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'auctions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'auctions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'auctions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auctions_winner_id_fkey'
            columns: ['winner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      balance: {
        Row: {
          coste_asociado: number | null
          created_at: string | null
          created_by: string | null
          detalle: string | null
          estado: Database['public']['Enums']['balance_status']
          factura_url: string | null
          fecha: string
          id: string
          importe: number
          notas: string | null
          razon: Database['public']['Enums']['balance_reason']
          subcategory_id: string | null
          tipo: Database['public']['Enums']['balance_type']
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          coste_asociado?: number | null
          created_at?: string | null
          created_by?: string | null
          detalle?: string | null
          estado?: Database['public']['Enums']['balance_status']
          factura_url?: string | null
          fecha?: string
          id?: string
          importe?: number
          notas?: string | null
          razon?: Database['public']['Enums']['balance_reason']
          subcategory_id?: string | null
          tipo?: Database['public']['Enums']['balance_type']
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          coste_asociado?: number | null
          created_at?: string | null
          created_by?: string | null
          detalle?: string | null
          estado?: Database['public']['Enums']['balance_status']
          factura_url?: string | null
          fecha?: string
          id?: string
          importe?: number
          notas?: string | null
          razon?: Database['public']['Enums']['balance_reason']
          subcategory_id?: string | null
          tipo?: Database['public']['Enums']['balance_type']
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'balance_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'balance_subcategory_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'balance_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'balance_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'balance_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          vertical: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          vertical?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          vertical?: string
        }
        Relationships: []
      }
      brokerage_audit_log: {
        Row: {
          action: string
          actor: string
          created_at: string | null
          deal_id: string | null
          details: Json | null
          human_override: boolean | null
          id: string
          ip_address: unknown
          legal_basis: string | null
          model_version: string | null
          override_reason: string | null
          prompt_version: string | null
        }
        Insert: {
          action: string
          actor: string
          created_at?: string | null
          deal_id?: string | null
          details?: Json | null
          human_override?: boolean | null
          id?: string
          ip_address?: unknown
          legal_basis?: string | null
          model_version?: string | null
          override_reason?: string | null
          prompt_version?: string | null
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string | null
          deal_id?: string | null
          details?: Json | null
          human_override?: boolean | null
          id?: string
          ip_address?: unknown
          legal_basis?: string | null
          model_version?: string | null
          override_reason?: string | null
          prompt_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_audit_log_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'brokerage_deals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_audit_log_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tank'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_audit_log_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tracciona'
            referencedColumns: ['id']
          },
        ]
      }
      brokerage_consent_log: {
        Row: {
          channel: string
          consent_text_hash: string | null
          consent_type: string
          consent_version: string
          created_at: string | null
          evidence: Json | null
          granted: boolean
          id: string
          ip_address: unknown
          legal_basis: string
          user_id: string
        }
        Insert: {
          channel: string
          consent_text_hash?: string | null
          consent_type: string
          consent_version?: string
          created_at?: string | null
          evidence?: Json | null
          granted: boolean
          id?: string
          ip_address?: unknown
          legal_basis: string
          user_id: string
        }
        Update: {
          channel?: string
          consent_text_hash?: string | null
          consent_type?: string
          consent_version?: string
          created_at?: string | null
          evidence?: Json | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          legal_basis?: string
          user_id?: string
        }
        Relationships: []
      }
      brokerage_deals: {
        Row: {
          agreed_buy_price: number | null
          agreed_deal_price: number | null
          asking_price: number | null
          broker_commission: number | null
          broker_commission_pct: number | null
          broker_contacted_at: string | null
          broker_failed_at: string | null
          broker_lock_until: string | null
          buyer_budget_max: number | null
          buyer_budget_min: number | null
          buyer_financing: boolean | null
          buyer_id: string | null
          buyer_needs: Json | null
          buyer_phone: string | null
          buyer_score: number | null
          closed_at: string | null
          created_at: string | null
          deal_mode: string
          escalated_at: string | null
          escalation_reason: string | null
          expires_at: string | null
          human_assignee: string | null
          id: string
          legal_basis_buyer: string | null
          legal_basis_seller: string | null
          margin_amount: number | null
          margin_pct: number | null
          min_margin_threshold: number | null
          offer_price: number | null
          qualified_at: string | null
          seller_dealer_id: string | null
          seller_id: string | null
          seller_phone: string | null
          seller_responded_at: string | null
          status: string
          tank_contacted_at: string | null
          target_sell_price: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          agreed_buy_price?: number | null
          agreed_deal_price?: number | null
          asking_price?: number | null
          broker_commission?: number | null
          broker_commission_pct?: number | null
          broker_contacted_at?: string | null
          broker_failed_at?: string | null
          broker_lock_until?: string | null
          buyer_budget_max?: number | null
          buyer_budget_min?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          human_assignee?: string | null
          id?: string
          legal_basis_buyer?: string | null
          legal_basis_seller?: string | null
          margin_amount?: number | null
          margin_pct?: number | null
          min_margin_threshold?: number | null
          offer_price?: number | null
          qualified_at?: string | null
          seller_dealer_id?: string | null
          seller_id?: string | null
          seller_phone?: string | null
          seller_responded_at?: string | null
          status?: string
          tank_contacted_at?: string | null
          target_sell_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          agreed_buy_price?: number | null
          agreed_deal_price?: number | null
          asking_price?: number | null
          broker_commission?: number | null
          broker_commission_pct?: number | null
          broker_contacted_at?: string | null
          broker_failed_at?: string | null
          broker_lock_until?: string | null
          buyer_budget_max?: number | null
          buyer_budget_min?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          human_assignee?: string | null
          id?: string
          legal_basis_buyer?: string | null
          legal_basis_seller?: string | null
          margin_amount?: number | null
          margin_pct?: number | null
          min_margin_threshold?: number | null
          offer_price?: number | null
          qualified_at?: string | null
          seller_dealer_id?: string | null
          seller_id?: string | null
          seller_phone?: string | null
          seller_responded_at?: string | null
          status?: string
          tank_contacted_at?: string | null
          target_sell_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_deals_seller_dealer_id_fkey'
            columns: ['seller_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      brokerage_messages: {
        Row: {
          channel: string
          content: string
          content_hash: string | null
          created_at: string | null
          deal_id: string
          direction: string
          id: string
          metadata: Json | null
          recipient_entity: string
          sender_entity: string
        }
        Insert: {
          channel: string
          content: string
          content_hash?: string | null
          created_at?: string | null
          deal_id: string
          direction: string
          id?: string
          metadata?: Json | null
          recipient_entity: string
          sender_entity: string
        }
        Update: {
          channel?: string
          content?: string
          content_hash?: string | null
          created_at?: string | null
          deal_id?: string
          direction?: string
          id?: string
          metadata?: Json | null
          recipient_entity?: string
          sender_entity?: string
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'brokerage_deals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tank'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tracciona'
            referencedColumns: ['id']
          },
        ]
      }
      brokerage_operational_flags: {
        Row: {
          auto_contact_paused: boolean | null
          created_at: string | null
          id: string
          lifted_at: string | null
          lifted_by: string | null
          pause_reason: string | null
          paused_at: string | null
          paused_by: string | null
          scoring_threshold_override: number | null
          updated_at: string | null
        }
        Insert: {
          auto_contact_paused?: boolean | null
          created_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          scoring_threshold_override?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_contact_paused?: boolean | null
          created_at?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          paused_by?: string | null
          scoring_threshold_override?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brokerage_suppression_list: {
        Row: {
          channel: string
          contacts_this_quarter: number | null
          cooldown_until: string | null
          created_at: string | null
          id: string
          last_contacted_at: string | null
          quarter_reset_at: string | null
          seller_id: string
          suppressed: boolean | null
          suppressed_at: string | null
          suppression_reason: string | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          contacts_this_quarter?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          id?: string
          last_contacted_at?: string | null
          quarter_reset_at?: string | null
          seller_id: string
          suppressed?: boolean | null
          suppressed_at?: string | null
          suppression_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          contacts_this_quarter?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          id?: string
          last_contacted_at?: string | null
          quarter_reset_at?: string | null
          seller_id?: string
          suppressed?: boolean | null
          suppressed_at?: string | null
          suppression_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          applicable_actions: string[] | null
          applicable_filters: string[] | null
          created_at: string | null
          id: string
          name: Json | null
          name_en: string | null
          name_es: string
          name_singular: Json | null
          name_singular_en: string | null
          name_singular_es: string | null
          slug: string
          sort_order: number | null
          status: Database['public']['Enums']['vehicle_status'] | null
          stock_count: number | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          applicable_actions?: string[] | null
          applicable_filters?: string[] | null
          created_at?: string | null
          id?: string
          name?: Json | null
          name_en?: string | null
          name_es: string
          name_singular?: Json | null
          name_singular_en?: string | null
          name_singular_es?: string | null
          slug: string
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          stock_count?: number | null
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          applicable_actions?: string[] | null
          applicable_filters?: string[] | null
          created_at?: string | null
          id?: string
          name?: Json | null
          name_en?: string | null
          name_es?: string
          name_singular?: Json | null
          name_singular_en?: string | null
          name_singular_es?: string | null
          slug?: string
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          stock_count?: number | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          direction: Database['public']['Enums']['msg_direction']
          id: string
          is_read: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          direction: Database['public']['Enums']['msg_direction']
          id?: string
          is_read?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          direction?: Database['public']['Enums']['msg_direction']
          id?: string
          is_read?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          author_email: string | null
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          status: Database['public']['Enums']['comment_status']
          updated_at: string | null
          user_id: string | null
          vertical: string
        }
        Insert: {
          article_id: string
          author_email?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          status?: Database['public']['Enums']['comment_status']
          updated_at?: string | null
          user_id?: string | null
          vertical?: string
        }
        Update: {
          article_id?: string
          author_email?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          status?: Database['public']['Enums']['comment_status']
          updated_at?: string | null
          user_id?: string | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'news'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
        ]
      }
      comparison_notes: {
        Row: {
          comparison_id: string | null
          created_at: string | null
          id: string
          note: string
          rating: number | null
          updated_at: string | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          comparison_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          rating?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          comparison_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
          rating?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comparison_notes_comparison_id_fkey'
            columns: ['comparison_id']
            isOneToOne: false
            referencedRelation: 'vehicle_comparisons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comparison_notes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comparison_notes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'comparison_notes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'comparison_notes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      competitor_vehicles: {
        Row: {
          brand: string | null
          created_at: string | null
          dealer_id: string | null
          hours: number | null
          id: string
          km: number | null
          model: string | null
          platform: string | null
          platform_id: string | null
          price: number | null
          scraped_at: string | null
          source: string | null
          url: string | null
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          dealer_id?: string | null
          hours?: number | null
          id?: string
          km?: number | null
          model?: string | null
          platform?: string | null
          platform_id?: string | null
          price?: number | null
          scraped_at?: string | null
          source?: string | null
          url?: string | null
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          dealer_id?: string | null
          hours?: number | null
          id?: string
          km?: number | null
          model?: string | null
          platform?: string | null
          platform_id?: string | null
          price?: number | null
          scraped_at?: string | null
          source?: string | null
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted: boolean
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          contact_name: string
          contact_type: string
          created_at: string | null
          email: string | null
          id: string
          location: string | null
          notes: string | null
          phone: string | null
          products: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          contact_name: string
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          products?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          contact_name?: string
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          products?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_translations: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          field: string
          id: string
          locale: string
          source: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          field: string
          id?: string
          locale: string
          source?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          field?: string
          id?: string
          locale?: string
          source?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          is_system: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_system?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_system?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversation_messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      conversations: {
        Row: {
          buyer_accepted_share: boolean | null
          buyer_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          seller_accepted_share: boolean | null
          seller_id: string
          status: string | null
          vehicle_id: string
        }
        Insert: {
          buyer_accepted_share?: boolean | null
          buyer_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          seller_accepted_share?: boolean | null
          seller_id: string
          status?: string | null
          vehicle_id: string
        }
        Update: {
          buyer_accepted_share?: boolean | null
          buyer_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          seller_accepted_share?: boolean | null
          seller_id?: string
          status?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'conversations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'conversations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      credit_packs: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name_en: string
          name_es: string
          price_cents: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          name_en: string
          name_es: string
          price_cents: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string
          price_cents?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          balance_after: number
          created_at: string
          credits: number
          id: string
          metadata: Json
          pack_id: string | null
          reference: string | null
          type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          credits: number
          id?: string
          metadata?: Json
          pack_id?: string | null
          reference?: string | null
          type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          credits?: number
          id?: string
          metadata?: Json
          pack_id?: string | null
          reference?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'credit_transactions_pack_id_fkey'
            columns: ['pack_id']
            isOneToOne: false
            referencedRelation: 'credit_packs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'credit_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      crm_pipeline: {
        Row: {
          assigned_to: string | null
          created_at: string
          dealer_id: string
          entered_stage_at: string
          id: string
          metadata: Json | null
          next_action_date: string | null
          next_action_desc: string | null
          notes: string | null
          stage: Database['public']['Enums']['crm_pipeline_stage']
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          dealer_id: string
          entered_stage_at?: string
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          next_action_desc?: string | null
          notes?: string | null
          stage?: Database['public']['Enums']['crm_pipeline_stage']
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          dealer_id?: string
          entered_stage_at?: string
          id?: string
          metadata?: Json | null
          next_action_date?: string | null
          next_action_desc?: string | null
          notes?: string | null
          stage?: Database['public']['Enums']['crm_pipeline_stage']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'crm_pipeline_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'crm_pipeline_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: true
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      crm_pipeline_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_stage: Database['public']['Enums']['crm_pipeline_stage'] | null
          id: string
          notes: string | null
          pipeline_id: string
          to_stage: Database['public']['Enums']['crm_pipeline_stage']
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_stage?: Database['public']['Enums']['crm_pipeline_stage'] | null
          id?: string
          notes?: string | null
          pipeline_id: string
          to_stage: Database['public']['Enums']['crm_pipeline_stage']
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_stage?: Database['public']['Enums']['crm_pipeline_stage'] | null
          id?: string
          notes?: string | null
          pipeline_id?: string
          to_stage?: Database['public']['Enums']['crm_pipeline_stage']
        }
        Relationships: [
          {
            foreignKeyName: 'crm_pipeline_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'crm_pipeline_history_pipeline_id_fkey'
            columns: ['pipeline_id']
            isOneToOne: false
            referencedRelation: 'crm_pipeline'
            referencedColumns: ['id']
          },
        ]
      }
      data_export_log: {
        Row: {
          client_id: string
          created_at: string | null
          endpoint: string
          filters: Json | null
          id: string
          ip_address: unknown
          rows_returned: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          endpoint: string
          filters?: Json | null
          id?: string
          ip_address?: unknown
          rows_returned?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          endpoint?: string
          filters?: Json | null
          id?: string
          ip_address?: unknown
          rows_returned?: number | null
        }
        Relationships: []
      }
      data_subscriptions: {
        Row: {
          active: boolean | null
          api_key: string | null
          company_name: string | null
          contact_email: string | null
          created_at: string | null
          id: string
          plan: string | null
          rate_limit_daily: number | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          api_key?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          plan?: string | null
          rate_limit_daily?: number | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          api_key?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          plan?: string | null
          rate_limit_daily?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      dealer_contracts: {
        Row: {
          buyer_name: string | null
          buyer_nif: string | null
          created_at: string | null
          dealer_id: string
          id: string
          pdf_url: string | null
          signed_at: string | null
          status: string | null
          template: string | null
          terms: Json | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          buyer_name?: string | null
          buyer_nif?: string | null
          created_at?: string | null
          dealer_id: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: string | null
          template?: string | null
          terms?: Json | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          buyer_name?: string | null
          buyer_nif?: string | null
          created_at?: string | null
          dealer_id?: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: string | null
          template?: string | null
          terms?: Json | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_contracts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'dealer_contracts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'dealer_contracts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_documents: {
        Row: {
          created_at: string
          dealer_id: string
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          notes: string | null
          status: Database['public']['Enums']['dealer_document_status']
          title: string
          type: Database['public']['Enums']['dealer_document_type']
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['dealer_document_status']
          title: string
          type?: Database['public']['Enums']['dealer_document_type']
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['dealer_document_status']
          title?: string
          type?: Database['public']['Enums']['dealer_document_type']
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_documents_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dealer_documents_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_events: {
        Row: {
          created_at: string | null
          dealer_id: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_events_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_fiscal_data: {
        Row: {
          created_at: string | null
          dealer_id: string
          id: string
          tax_address: string | null
          tax_country: string | null
          tax_id: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          id?: string
          tax_address?: string | null
          tax_country?: string | null
          tax_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          id?: string
          tax_address?: string | null
          tax_country?: string | null
          tax_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_fiscal_data_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: true
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_invoices: {
        Row: {
          amount_cents: number
          buyer_name: string | null
          buyer_tax_id: string | null
          created_at: string | null
          currency: string | null
          dealer_id: string
          id: string
          invoice_number: string | null
          pdf_url: string | null
          status: string | null
          tax_cents: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount_cents: number
          buyer_name?: string | null
          buyer_tax_id?: string | null
          created_at?: string | null
          currency?: string | null
          dealer_id: string
          id?: string
          invoice_number?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_cents?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_name?: string | null
          buyer_tax_id?: string | null
          created_at?: string | null
          currency?: string | null
          dealer_id?: string
          id?: string
          invoice_number?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_cents?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_invoices_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dealer_invoices_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'dealer_invoices_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'dealer_invoices_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_leads: {
        Row: {
          active_listings: number | null
          assigned_to: string | null
          company_name: string
          contact_name: string | null
          contact_notes: string | null
          contacted_at: string | null
          created_at: string | null
          email: string | null
          fleet_size: number | null
          id: string
          location: string | null
          notes: string | null
          phone: string | null
          source: string
          source_url: string | null
          status: string | null
          updated_at: string | null
          vehicle_types: string[] | null
          vertical: string | null
          website: string | null
        }
        Insert: {
          active_listings?: number | null
          assigned_to?: string | null
          company_name: string
          contact_name?: string | null
          contact_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          fleet_size?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          source: string
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
          vertical?: string | null
          website?: string | null
        }
        Update: {
          active_listings?: number | null
          assigned_to?: string | null
          company_name?: string
          contact_name?: string | null
          contact_notes?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string | null
          fleet_size?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_types?: string[] | null
          vertical?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_leads_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_onboarding_emails: {
        Row: {
          dealer_id: string
          id: string
          sent_at: string
          step: number
        }
        Insert: {
          dealer_id: string
          id?: string
          sent_at?: string
          step: number
        }
        Update: {
          dealer_id?: string
          id?: string
          sent_at?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_onboarding_emails_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_platforms: {
        Row: {
          created_at: string | null
          dealer_id: string
          id: string
          platform: string | null
          platform_id: string | null
          status: string | null
          synced_at: string | null
          url: string | null
          vehicle_count: number | null
        }
        Insert: {
          created_at?: string | null
          dealer_id: string
          id?: string
          platform?: string | null
          platform_id?: string | null
          status?: string | null
          synced_at?: string | null
          url?: string | null
          vehicle_count?: number | null
        }
        Update: {
          created_at?: string | null
          dealer_id?: string
          id?: string
          platform?: string | null
          platform_id?: string | null
          status?: string | null
          synced_at?: string | null
          url?: string | null
          vehicle_count?: number | null
        }
        Relationships: []
      }
      dealer_quotes: {
        Row: {
          amount: number | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          dealer_id: string
          discount_percent: number | null
          id: string
          notes: string | null
          optional_services: Json | null
          pdf_url: string | null
          status: string | null
          tax_percent: number | null
          total: number | null
          valid_until: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          dealer_id: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          optional_services?: Json | null
          pdf_url?: string | null
          status?: string | null
          tax_percent?: number | null
          total?: number | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          dealer_id?: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          optional_services?: Json | null
          pdf_url?: string | null
          status?: string | null
          tax_percent?: number | null
          total?: number | null
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_quotes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'dealer_quotes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'dealer_quotes_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_reviews: {
        Row: {
          comment: string | null
          created_at: string
          dealer_id: string
          id: string
          rating: number
          reviewer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dealer_id: string
          id?: string
          rating: number
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          dealer_id?: string
          id?: string
          rating?: number
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_reviews_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_stats: {
        Row: {
          avg_response_minutes: number | null
          conversion_rate: number | null
          created_at: string | null
          dealer_id: string
          favorites_added: number | null
          id: string
          leads_received: number | null
          leads_responded: number | null
          period_date: string
          profile_views: number | null
          vehicle_views: number | null
        }
        Insert: {
          avg_response_minutes?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          dealer_id: string
          favorites_added?: number | null
          id?: string
          leads_received?: number | null
          leads_responded?: number | null
          period_date: string
          profile_views?: number | null
          vehicle_views?: number | null
        }
        Update: {
          avg_response_minutes?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          dealer_id?: string
          favorites_added?: number | null
          id?: string
          leads_received?: number | null
          leads_responded?: number | null
          period_date?: string
          profile_views?: number | null
          vehicle_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_stats_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_stripe_accounts: {
        Row: {
          charges_enabled: boolean | null
          created_at: string | null
          dealer_id: string
          id: string
          onboarding_completed: boolean | null
          stripe_account_id: string
          updated_at: string | null
        }
        Insert: {
          charges_enabled?: boolean | null
          created_at?: string | null
          dealer_id: string
          id?: string
          onboarding_completed?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
        }
        Update: {
          charges_enabled?: boolean | null
          created_at?: string | null
          dealer_id?: string
          id?: string
          onboarding_completed?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_stripe_accounts_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: true
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealer_team_members: {
        Row: {
          accepted_at: string | null
          dealer_id: string
          email: string
          id: number
          invite_token: string | null
          invited_at: string
          invited_by: string | null
          revoked_at: string | null
          role: Database['public']['Enums']['dealer_team_role']
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          dealer_id: string
          email: string
          id?: never
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: Database['public']['Enums']['dealer_team_role']
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          dealer_id?: string
          email?: string
          id?: never
          invite_token?: string | null
          invited_at?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: Database['public']['Enums']['dealer_team_role']
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealer_team_members_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      dealers: {
        Row: {
          active_listings: number | null
          address: Json | null
          auto_featured: boolean
          auto_renew: boolean
          auto_reply_message: Json | null
          avg_response_minutes: number | null
          avg_response_time_hours: number | null
          badge: string | null
          bio: Json | null
          brokerage_opt_out: boolean | null
          brokerage_opt_out_at: string | null
          catalog_sort: string | null
          certifications: Json | null
          cif_nif: string | null
          company_name: Json
          contact_config: Json | null
          cover_image_url: string | null
          created_at: string | null
          email: string | null
          favicon_url: string | null
          featured: boolean | null
          id: string
          legal_name: string | null
          locale: string | null
          location_data: Json | null
          logo_text_config: Json | null
          logo_url: string | null
          notification_config: Json | null
          notification_preferences: Json | null
          phone: string | null
          pinned_vehicles: string[] | null
          rating: number | null
          referral_code: string | null
          referred_by: string | null
          response_count: number | null
          response_rate_pct: number | null
          slug: string
          social_links: Json | null
          sort_boost: number | null
          status: Database['public']['Enums']['dealer_status'] | null
          subscription_type: string | null
          subscription_valid_until: string | null
          theme: Json | null
          total_leads: number | null
          total_listings: number | null
          total_reviews: number | null
          trust_score: number | null
          trust_score_at: string | null
          trust_score_breakdown: Json | null
          trust_score_data: Json | null
          trust_score_updated_at: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          vertical: string
          visits_enabled: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          active_listings?: number | null
          address?: Json | null
          auto_featured?: boolean
          auto_renew?: boolean
          auto_reply_message?: Json | null
          avg_response_minutes?: number | null
          avg_response_time_hours?: number | null
          badge?: string | null
          bio?: Json | null
          brokerage_opt_out?: boolean | null
          brokerage_opt_out_at?: string | null
          catalog_sort?: string | null
          certifications?: Json | null
          cif_nif?: string | null
          company_name: Json
          contact_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          featured?: boolean | null
          id?: string
          legal_name?: string | null
          locale?: string | null
          location_data?: Json | null
          logo_text_config?: Json | null
          logo_url?: string | null
          notification_config?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          pinned_vehicles?: string[] | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          response_count?: number | null
          response_rate_pct?: number | null
          slug: string
          social_links?: Json | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['dealer_status'] | null
          subscription_type?: string | null
          subscription_valid_until?: string | null
          theme?: Json | null
          total_leads?: number | null
          total_listings?: number | null
          total_reviews?: number | null
          trust_score?: number | null
          trust_score_at?: string | null
          trust_score_breakdown?: Json | null
          trust_score_data?: Json | null
          trust_score_updated_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          vertical?: string
          visits_enabled?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          active_listings?: number | null
          address?: Json | null
          auto_featured?: boolean
          auto_renew?: boolean
          auto_reply_message?: Json | null
          avg_response_minutes?: number | null
          avg_response_time_hours?: number | null
          badge?: string | null
          bio?: Json | null
          brokerage_opt_out?: boolean | null
          brokerage_opt_out_at?: string | null
          catalog_sort?: string | null
          certifications?: Json | null
          cif_nif?: string | null
          company_name?: Json
          contact_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          featured?: boolean | null
          id?: string
          legal_name?: string | null
          locale?: string | null
          location_data?: Json | null
          logo_text_config?: Json | null
          logo_url?: string | null
          notification_config?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          pinned_vehicles?: string[] | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          response_count?: number | null
          response_rate_pct?: number | null
          slug?: string
          social_links?: Json | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['dealer_status'] | null
          subscription_type?: string | null
          subscription_valid_until?: string | null
          theme?: Json | null
          total_leads?: number | null
          total_listings?: number | null
          total_reviews?: number | null
          trust_score?: number | null
          trust_score_at?: string | null
          trust_score_breakdown?: Json | null
          trust_score_data?: Json | null
          trust_score_updated_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          vertical?: string
          visits_enabled?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealers_referred_by_fkey'
            columns: ['referred_by']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dealers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      demand_data: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          demand_score: number | null
          id: string
          period: string | null
          region: string | null
          search_volume: number | null
          trend: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          period?: string | null
          region?: string | null
          search_volume?: number | null
          trend?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          period?: string | null
          region?: string | null
          search_volume?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      demands: {
        Row: {
          admin_notes: string | null
          attributes_json: Json | null
          brand_preference: string | null
          category_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_preference: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          match_vehicle_id: string | null
          price_max: number | null
          price_min: number | null
          specs: Json | null
          status: string | null
          subcategory_id: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
          year_max: number | null
          year_min: number | null
        }
        Insert: {
          admin_notes?: string | null
          attributes_json?: Json | null
          brand_preference?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_vehicle_id?: string | null
          price_max?: number | null
          price_min?: number | null
          specs?: Json | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          year_max?: number | null
          year_min?: number | null
        }
        Update: {
          admin_notes?: string | null
          attributes_json?: Json | null
          brand_preference?: string | null
          category_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          match_vehicle_id?: string | null
          price_max?: number | null
          price_min?: number | null
          specs?: Json | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          year_max?: number | null
          year_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'demands_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'demands_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'demands_match_vehicle_id_fkey'
            columns: ['match_vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'demands_subcategory_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'demands_type_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'demands_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      device_fingerprints: {
        Row: {
          fingerprint_hash: string
          first_seen: string
          id: string
          ip_hash: string | null
          last_seen: string
          seen_count: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          fingerprint_hash: string
          first_seen?: string
          id?: string
          ip_hash?: string | null
          last_seen?: string
          seen_count?: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          fingerprint_hash?: string
          first_seen?: string
          id?: string
          ip_hash?: string | null
          last_seen?: string
          seen_count?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          error: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          recipient_user_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_key: string
          variables: Json | null
          vertical: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key: string
          variables?: Json | null
          vertical?: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string
          variables?: Json | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_logs_recipient_user_id_fkey'
            columns: ['recipient_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string | null
          email_type: string
          enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_type: string
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_type?: string
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      error_events: {
        Row: {
          created_at: string
          endpoint: string | null
          error_message: string | null
          id: string
          stack_trace: string | null
          status_code: number | null
          user_id: string | null
          vertical: string | null
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          stack_trace?: string | null
          status_code?: number | null
          user_id?: string | null
          vertical?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          id?: string
          stack_trace?: string | null
          status_code?: number | null
          user_id?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      experiment_assignments: {
        Row: {
          anonymous_id: string | null
          assigned_at: string
          experiment_id: string
          id: number
          user_id: string | null
          variant_id: string
        }
        Insert: {
          anonymous_id?: string | null
          assigned_at?: string
          experiment_id: string
          id?: never
          user_id?: string | null
          variant_id: string
        }
        Update: {
          anonymous_id?: string | null
          assigned_at?: string
          experiment_id?: string
          id?: never
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'experiment_assignments_experiment_id_fkey'
            columns: ['experiment_id']
            isOneToOne: false
            referencedRelation: 'experiments'
            referencedColumns: ['id']
          },
        ]
      }
      experiment_events: {
        Row: {
          anonymous_id: string | null
          created_at: string
          event_type: string
          experiment_id: string
          id: number
          metadata: Json | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          event_type: string
          experiment_id: string
          id?: never
          metadata?: Json | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          event_type?: string
          experiment_id?: string
          id?: never
          metadata?: Json | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'experiment_events_experiment_id_fkey'
            columns: ['experiment_id']
            isOneToOne: false
            referencedRelation: 'experiments'
            referencedColumns: ['id']
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          key: string
          name: string
          status: string
          target_sample_size: number | null
          updated_at: string
          variants: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          key: string
          name: string
          status?: string
          target_sample_size?: number | null
          updated_at?: string
          variants?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          key?: string
          name?: string
          status?: string
          target_sample_size?: number | null
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      faq_entries: {
        Row: {
          answer: Json
          category: string
          created_at: string
          id: string
          metadata: Json | null
          published: boolean
          question: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer?: Json
          category: string
          created_at?: string
          id?: string
          metadata?: Json | null
          published?: boolean
          question?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: Json
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          published?: boolean
          question?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          price_threshold: number | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_threshold?: number | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price_threshold?: number | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'favorites_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'favorites_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      feature_flags: {
        Row: {
          allowed_dealers: string[] | null
          created_at: string | null
          description: string | null
          enabled: boolean
          key: string
          percentage: number | null
          updated_at: string | null
          vertical: string | null
        }
        Insert: {
          allowed_dealers?: string[] | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key: string
          percentage?: number | null
          updated_at?: string | null
          vertical?: string | null
        }
        Update: {
          allowed_dealers?: string[] | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key?: string
          percentage?: number | null
          updated_at?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      feature_unlocks: {
        Row: {
          created_at: string
          credits_spent: number
          feature: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent?: number
          feature: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          feature?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      geo_regions: {
        Row: {
          country_code: string
          id: string
          lat: number | null
          lng: number | null
          parent_slug: string | null
          postal_code_pattern: string | null
          region_level: string
          region_name: Json
          region_slug: string
          sort_order: number | null
        }
        Insert: {
          country_code: string
          id?: string
          lat?: number | null
          lng?: number | null
          parent_slug?: string | null
          postal_code_pattern?: string | null
          region_level: string
          region_name: Json
          region_slug: string
          sort_order?: number | null
        }
        Update: {
          country_code?: string
          id?: string
          lat?: number | null
          lng?: number | null
          parent_slug?: string | null
          postal_code_pattern?: string | null
          region_level?: string
          region_name?: Json
          region_slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      geocoding_cache: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          id: string
          lat_rounded: number
          lng_rounded: number
          province: string | null
          raw_response: Json | null
          region: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          lat_rounded: number
          lng_rounded: number
          province?: string | null
          raw_response?: Json | null
          region?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          lat_rounded?: number
          lng_rounded?: number
          province?: string | null
          raw_response?: Json | null
          region?: string | null
        }
        Relationships: []
      }
      glossary: {
        Row: {
          category: string | null
          created_at: string
          definition: Json
          id: string
          related_terms: string[] | null
          slug: string
          status: string
          term: Json
          updated_at: string
          vertical: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition?: Json
          id?: string
          related_terms?: string[] | null
          slug: string
          status?: string
          term?: Json
          updated_at?: string
          vertical?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: Json
          id?: string
          related_terms?: string[] | null
          slug?: string
          status?: string
          term?: Json
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      historico: {
        Row: {
          action: string | null
          brand: string | null
          buyer_country: string | null
          buyer_type: string | null
          category_id: string | null
          created_at: string | null
          dealer_id: string
          hours: number | null
          id: string
          km: number | null
          maintenance_history: Json | null
          model: string | null
          notes: string | null
          original_price: number | null
          original_vehicle_id: string | null
          payment_method: string | null
          rental_history: Json | null
          sale_date: string | null
          sale_price: number | null
          transport_included: boolean | null
          vehicle_data: Json | null
          vehicle_id: string | null
          year: number | null
        }
        Insert: {
          action?: string | null
          brand?: string | null
          buyer_country?: string | null
          buyer_type?: string | null
          category_id?: string | null
          created_at?: string | null
          dealer_id: string
          hours?: number | null
          id?: string
          km?: number | null
          maintenance_history?: Json | null
          model?: string | null
          notes?: string | null
          original_price?: number | null
          original_vehicle_id?: string | null
          payment_method?: string | null
          rental_history?: Json | null
          sale_date?: string | null
          sale_price?: number | null
          transport_included?: boolean | null
          vehicle_data?: Json | null
          vehicle_id?: string | null
          year?: number | null
        }
        Update: {
          action?: string | null
          brand?: string | null
          buyer_country?: string | null
          buyer_type?: string | null
          category_id?: string | null
          created_at?: string | null
          dealer_id?: string
          hours?: number | null
          id?: string
          km?: number | null
          maintenance_history?: Json | null
          model?: string | null
          notes?: string | null
          original_price?: number | null
          original_vehicle_id?: string | null
          payment_method?: string | null
          rental_history?: Json | null
          sale_date?: string | null
          sale_price?: number | null
          transport_included?: boolean | null
          vehicle_data?: Json | null
          vehicle_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'historico_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_original_vehicle_id_fkey'
            columns: ['original_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'historico_original_vehicle_id_fkey'
            columns: ['original_vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'historico_original_vehicle_id_fkey'
            columns: ['original_vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'historico_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'historico_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          endpoint: string
          expires_at: string | null
          key: string
          response: Json | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          expires_at?: string | null
          key: string
          response?: Json | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          expires_at?: string | null
          key?: string
          response?: Json | null
        }
        Relationships: []
      }
      infra_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_level: string | null
          cluster_id: string | null
          component: string | null
          created_at: string | null
          id: string
          message: string | null
          metric_name: string | null
          resolved: boolean | null
          resolved_at: string | null
          sent_at: string | null
          severity: string | null
          type: string
          usage_percent: number | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          cluster_id?: string | null
          component?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metric_name?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          sent_at?: string | null
          severity?: string | null
          type: string
          usage_percent?: number | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_level?: string | null
          cluster_id?: string | null
          component?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metric_name?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          sent_at?: string | null
          severity?: string | null
          type?: string
          usage_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'infra_alerts_cluster_id_fkey'
            columns: ['cluster_id']
            isOneToOne: false
            referencedRelation: 'infra_clusters'
            referencedColumns: ['id']
          },
        ]
      }
      infra_clusters: {
        Row: {
          connection_string_encrypted: string | null
          created_at: string | null
          database: string | null
          host: string | null
          id: string
          is_primary: boolean | null
          max_connections: number | null
          metadata: Json | null
          name: string
          port: number | null
          provider: string | null
          region: string | null
          status: string | null
          storage_gb: number | null
          supabase_anon_key: string | null
          supabase_service_role_key: string | null
          supabase_url: string | null
          updated_at: string | null
          version: string | null
          vertical: string | null
        }
        Insert: {
          connection_string_encrypted?: string | null
          created_at?: string | null
          database?: string | null
          host?: string | null
          id?: string
          is_primary?: boolean | null
          max_connections?: number | null
          metadata?: Json | null
          name: string
          port?: number | null
          provider?: string | null
          region?: string | null
          status?: string | null
          storage_gb?: number | null
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string | null
          version?: string | null
          vertical?: string | null
        }
        Update: {
          connection_string_encrypted?: string | null
          created_at?: string | null
          database?: string | null
          host?: string | null
          id?: string
          is_primary?: boolean | null
          max_connections?: number | null
          metadata?: Json | null
          name?: string
          port?: number | null
          provider?: string | null
          region?: string | null
          status?: string | null
          storage_gb?: number | null
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string | null
          version?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      infra_metrics: {
        Row: {
          cache_hit_ratio: number | null
          cluster_id: string | null
          component: string | null
          connections_active: number | null
          connections_idle: number | null
          cpu_percent: number | null
          created_at: string | null
          db_size_mb: number | null
          disk_percent: number | null
          id: string
          memory_percent: number | null
          metadata: Json | null
          metric_limit: number | null
          metric_name: string | null
          metric_value: number | null
          recorded_at: string | null
          replication_lag_ms: number | null
          transactions_per_sec: number | null
          usage_percent: number | null
          vertical: string | null
        }
        Insert: {
          cache_hit_ratio?: number | null
          cluster_id?: string | null
          component?: string | null
          connections_active?: number | null
          connections_idle?: number | null
          cpu_percent?: number | null
          created_at?: string | null
          db_size_mb?: number | null
          disk_percent?: number | null
          id?: string
          memory_percent?: number | null
          metadata?: Json | null
          metric_limit?: number | null
          metric_name?: string | null
          metric_value?: number | null
          recorded_at?: string | null
          replication_lag_ms?: number | null
          transactions_per_sec?: number | null
          usage_percent?: number | null
          vertical?: string | null
        }
        Update: {
          cache_hit_ratio?: number | null
          cluster_id?: string | null
          component?: string | null
          connections_active?: number | null
          connections_idle?: number | null
          cpu_percent?: number | null
          created_at?: string | null
          db_size_mb?: number | null
          disk_percent?: number | null
          id?: string
          memory_percent?: number | null
          metadata?: Json | null
          metric_limit?: number | null
          metric_name?: string | null
          metric_value?: number | null
          recorded_at?: string | null
          replication_lag_ms?: number | null
          transactions_per_sec?: number | null
          usage_percent?: number | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'infra_metrics_cluster_id_fkey'
            columns: ['cluster_id']
            isOneToOne: false
            referencedRelation: 'infra_clusters'
            referencedColumns: ['id']
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          dealer_id: string | null
          id: string
          pdf_url: string | null
          service_type: string
          status: string | null
          stripe_invoice_id: string | null
          tax_cents: number | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          dealer_id?: string | null
          id?: string
          pdf_url?: string | null
          service_type: string
          status?: string | null
          stripe_invoice_id?: string | null
          tax_cents?: number | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          dealer_id?: string | null
          id?: string
          pdf_url?: string | null
          service_type?: string
          status?: string | null
          stripe_invoice_id?: string | null
          tax_cents?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      job_queue: {
        Row: {
          backoff_seconds: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          max_retries: number
          payload: Json
          result: Json | null
          retries: number
          scheduled_at: string
          started_at: string | null
          status: string
        }
        Insert: {
          backoff_seconds?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          max_retries?: number
          payload?: Json
          result?: Json | null
          retries?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          backoff_seconds?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          max_retries?: number
          payload?: Json
          result?: Json | null
          retries?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          buyer_email: string | null
          buyer_location: string | null
          buyer_name: string | null
          buyer_phone: string | null
          buyer_user_id: string | null
          close_reason: string | null
          closed_at: string | null
          created_at: string | null
          dealer_id: string
          dealer_notes: string | null
          first_responded_at: string | null
          first_viewed_at: string | null
          id: string
          message: string | null
          negotiated_price_cents: number | null
          post_sale_outreach_sent_at: string | null
          sale_price_cents: number | null
          source: string | null
          source_vertical: string | null
          status: Database['public']['Enums']['lead_status'] | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_location?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string | null
          dealer_id: string
          dealer_notes?: string | null
          first_responded_at?: string | null
          first_viewed_at?: string | null
          id?: string
          message?: string | null
          negotiated_price_cents?: number | null
          post_sale_outreach_sent_at?: string | null
          sale_price_cents?: number | null
          source?: string | null
          source_vertical?: string | null
          status?: Database['public']['Enums']['lead_status'] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          buyer_email?: string | null
          buyer_location?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string | null
          dealer_id?: string
          dealer_notes?: string | null
          first_responded_at?: string | null
          first_viewed_at?: string | null
          id?: string
          message?: string | null
          negotiated_price_cents?: number | null
          post_sale_outreach_sent_at?: string | null
          sale_price_cents?: number | null
          source?: string | null
          source_vertical?: string | null
          status?: Database['public']['Enums']['lead_status'] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_buyer_user_id_fkey'
            columns: ['buyer_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'leads_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'leads_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      listing_certificates: {
        Row: {
          certificate_code: string
          created_at: string
          credits_spent: number
          id: string
          issued_at: string
          metadata: Json | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          certificate_code?: string
          created_at?: string
          credits_spent?: number
          id?: string
          issued_at?: string
          metadata?: Json | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          certificate_code?: string
          created_at?: string
          credits_spent?: number
          id?: string
          issued_at?: string
          metadata?: Json | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'listing_certificates_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'listing_certificates_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'listing_certificates_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          name_en: string | null
          name_es: string
          parent_id: string | null
          slug: string
          vertical: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          name_en?: string | null
          name_es: string
          parent_id?: string | null
          slug: string
          vertical?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          name_en?: string | null
          name_es?: string
          parent_id?: string | null
          slug?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'locations_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string | null
          date: string | null
          dealer_id: string
          description: string | null
          id: string
          invoice_url: string | null
          km_at_maintenance: number | null
          provider_name: string | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          date?: string | null
          dealer_id: string
          description?: string | null
          id?: string
          invoice_url?: string | null
          km_at_maintenance?: number | null
          provider_name?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          date?: string | null
          dealer_id?: string
          description?: string | null
          id?: string
          invoice_url?: string | null
          km_at_maintenance?: number | null
          provider_name?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'maintenance_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'maintenance_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      market_brokerage_stats: {
        Row: {
          avg_days_to_close: number | null
          avg_discount_pct: number | null
          category_id: string | null
          created_at: string | null
          deal_mode_split: string | null
          deals_count: number | null
          id: string
          liquidity_ratio: number | null
          median_asking_price: number | null
          median_close_price: number | null
          period: string
          region: string | null
          seller_response_rate: number | null
          suppressed: boolean | null
        }
        Insert: {
          avg_days_to_close?: number | null
          avg_discount_pct?: number | null
          category_id?: string | null
          created_at?: string | null
          deal_mode_split?: string | null
          deals_count?: number | null
          id?: string
          liquidity_ratio?: number | null
          median_asking_price?: number | null
          median_close_price?: number | null
          period: string
          region?: string | null
          seller_response_rate?: number | null
          suppressed?: boolean | null
        }
        Update: {
          avg_days_to_close?: number | null
          avg_discount_pct?: number | null
          category_id?: string | null
          created_at?: string | null
          deal_mode_split?: string | null
          deals_count?: number | null
          id?: string
          liquidity_ratio?: number | null
          median_asking_price?: number | null
          median_close_price?: number | null
          period?: string
          region?: string | null
          seller_response_rate?: number | null
          suppressed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'market_brokerage_stats_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      market_data: {
        Row: {
          action: string | null
          avg_days_to_sell: number | null
          avg_price: number | null
          brand: string | null
          category: string | null
          created_at: string | null
          id: string
          listings: number | null
          location_province: string | null
          max_price: number | null
          min_price: number | null
          model: string | null
          period: string | null
          sample_size: number | null
          subcategory: string | null
          vertical: string | null
        }
        Insert: {
          action?: string | null
          avg_days_to_sell?: number | null
          avg_price?: number | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          listings?: number | null
          location_province?: string | null
          max_price?: number | null
          min_price?: number | null
          model?: string | null
          period?: string | null
          sample_size?: number | null
          subcategory?: string | null
          vertical?: string | null
        }
        Update: {
          action?: string | null
          avg_days_to_sell?: number | null
          avg_price?: number | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          listings?: number | null
          location_province?: string | null
          max_price?: number | null
          min_price?: number | null
          model?: string | null
          period?: string | null
          sample_size?: number | null
          subcategory?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      market_report_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          locale: string
          quarter: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          locale?: string
          quarter: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          locale?: string
          quarter?: string
        }
        Relationships: []
      }
      market_reports: {
        Row: {
          generated_at: string
          id: string
          locale: string
          quarter: string
          report_data: Json
          storage_path: string | null
        }
        Insert: {
          generated_at?: string
          id?: string
          locale?: string
          quarter: string
          report_data?: Json
          storage_path?: string | null
        }
        Update: {
          generated_at?: string
          id?: string
          locale?: string
          quarter?: string
          report_data?: Json
          storage_path?: string | null
        }
        Relationships: []
      }
      merch_orders: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          dealer_id: string | null
          design_pdf_url: string | null
          id: string
          product_type: string
          quantity: number | null
          shipping_address: string | null
          status: string | null
          stripe_payment_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          dealer_id?: string | null
          design_pdf_url?: string | null
          id?: string
          product_type: string
          quantity?: number | null
          shipping_address?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          dealer_id?: string | null
          design_pdf_url?: string | null
          id?: string
          product_type?: string
          quantity?: number | null
          shipping_address?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'merch_orders_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      negotiation_offers: {
        Row: {
          amount_cents: number
          conversation_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          message: string | null
          parent_offer_id: string | null
          responded_at: string | null
          sender_id: string
          status: string
          vehicle_id: string
        }
        Insert: {
          amount_cents: number
          conversation_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          responded_at?: string | null
          sender_id: string
          status?: string
          vehicle_id: string
        }
        Update: {
          amount_cents?: number
          conversation_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          parent_offer_id?: string | null
          responded_at?: string | null
          sender_id?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'negotiation_offers_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'negotiation_offers_parent_offer_id_fkey'
            columns: ['parent_offer_id']
            isOneToOne: false
            referencedRelation: 'negotiation_offers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'negotiation_offers_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'negotiation_offers_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'negotiation_offers_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      news: {
        Row: {
          category: string
          content_en: string | null
          content_es: string
          created_at: string | null
          description: Json | null
          description_en: string | null
          description_es: string | null
          excerpt_en: string | null
          excerpt_es: string | null
          expires_at: string | null
          faq_schema: Json | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          pending_translations: boolean | null
          published_at: string | null
          reading_time_minutes: number | null
          related_categories: string[] | null
          scheduled_at: string | null
          section: string | null
          seo_score: number | null
          slug: string
          social_post_text: Json | null
          social_posted: boolean | null
          social_scheduled_at: string | null
          status: string
          target_markets: string[] | null
          title: Json | null
          title_en: string | null
          title_es: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category?: string
          content_en?: string | null
          content_es: string
          created_at?: string | null
          description?: Json | null
          description_en?: string | null
          description_es?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          expires_at?: string | null
          faq_schema?: Json | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          pending_translations?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_categories?: string[] | null
          scheduled_at?: string | null
          section?: string | null
          seo_score?: number | null
          slug: string
          social_post_text?: Json | null
          social_posted?: boolean | null
          social_scheduled_at?: string | null
          status?: string
          target_markets?: string[] | null
          title?: Json | null
          title_en?: string | null
          title_es: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category?: string
          content_en?: string | null
          content_es?: string
          created_at?: string | null
          description?: Json | null
          description_en?: string | null
          description_es?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          expires_at?: string | null
          faq_schema?: Json | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          pending_translations?: boolean | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_categories?: string[] | null
          scheduled_at?: string | null
          section?: string | null
          seo_score?: number | null
          slug?: string
          social_post_text?: Json | null
          social_posted?: boolean | null
          social_scheduled_at?: string | null
          status?: string
          target_markets?: string[] | null
          title?: Json | null
          title_en?: string | null
          title_es?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          pref_csr: boolean | null
          pref_events: boolean | null
          pref_featured: boolean | null
          pref_newsletter: boolean | null
          pref_press: boolean | null
          pref_web: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          pref_csr?: boolean | null
          pref_events?: boolean | null
          pref_featured?: boolean | null
          pref_newsletter?: boolean | null
          pref_press?: boolean | null
          pref_web?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          pref_csr?: boolean | null
          pref_events?: boolean | null
          pref_featured?: boolean | null
          pref_newsletter?: boolean | null
          pref_press?: boolean | null
          pref_web?: boolean | null
        }
        Relationships: []
      }
      onboarding_metrics: {
        Row: {
          completed_at: string | null
          created_at: string | null
          dealer_id: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          started_at: string
          step_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          dealer_id: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string
          step_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          dealer_id?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          started_at?: string
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'onboarding_metrics_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      operation_timeline: {
        Row: {
          buyer_id: string | null
          created_at: string
          created_by: string
          dealer_id: string
          id: string
          metadata: Json | null
          notes: string | null
          stage: string
          vehicle_id: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          created_by: string
          dealer_id: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          stage: string
          vehicle_id: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string
          dealer_id?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          stage?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'operation_timeline_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'operation_timeline_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'operation_timeline_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: Database['public']['Enums']['payment_status'] | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          type: Database['public']['Enums']['payment_type']
          updated_at: string | null
          user_id: string | null
          vertical: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['payment_status'] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type: Database['public']['Enums']['payment_type']
          updated_at?: string | null
          user_id?: string | null
          vertical?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['payment_status'] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: Database['public']['Enums']['payment_type']
          updated_at?: string | null
          user_id?: string | null
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      pipeline_items: {
        Row: {
          amount: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          dealer_id: string
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          source: string | null
          stage: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          dealer_id: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          dealer_id?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'pipeline_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'pipeline_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      platforms: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          change_type: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          previous_price_cents: number | null
          price_cents: number
          vehicle_id: string
        }
        Insert: {
          change_type?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          previous_price_cents?: number | null
          price_cents: number
          vehicle_id: string
        }
        Update: {
          change_type?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          previous_price_cents?: number | null
          price_cents?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'price_history_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'price_history_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'price_history_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      priority_reservations: {
        Row: {
          buyer_id: string
          created_at: string | null
          credits_spent: number
          expires_at: string
          id: string
          refunded_at: string | null
          seller_id: string
          seller_responded_at: string | null
          status: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          credits_spent?: number
          expires_at?: string
          id?: string
          refunded_at?: string | null
          seller_id: string
          seller_responded_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          credits_spent?: number
          expires_at?: string
          id?: string
          refunded_at?: string | null
          seller_id?: string
          seller_responded_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'priority_reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'priority_reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'priority_reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          phone: string | null
          preferred_location_level: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          phone?: string | null
          preferred_location_level?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          phone?: string | null
          preferred_location_level?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_entries: {
        Row: {
          created_at: string
          id: number
          key: string
        }
        Insert: {
          created_at?: string
          id?: never
          key: string
        }
        Update: {
          created_at?: string
          id?: never
          key?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          awarded_at: string | null
          created_at: string
          id: string
          invitee_credits_awarded: number
          invitee_dealer_id: string
          inviter_credits_awarded: number
          inviter_dealer_id: string
          status: string
        }
        Insert: {
          awarded_at?: string | null
          created_at?: string
          id?: string
          invitee_credits_awarded?: number
          invitee_dealer_id: string
          inviter_credits_awarded?: number
          inviter_dealer_id: string
          status?: string
        }
        Update: {
          awarded_at?: string | null
          created_at?: string
          id?: string
          invitee_credits_awarded?: number
          invitee_dealer_id?: string
          inviter_credits_awarded?: number
          inviter_dealer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referral_rewards_invitee_dealer_id_fkey'
            columns: ['invitee_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referral_rewards_inviter_dealer_id_fkey'
            columns: ['inviter_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      rental_records: {
        Row: {
          contract_url: string | null
          created_at: string | null
          dealer_id: string
          deposit: number | null
          end_date: string | null
          id: string
          monthly_price: number | null
          notes: string | null
          start_date: string | null
          status: string | null
          tenant_email: string | null
          tenant_name: string | null
          tenant_nif: string | null
          tenant_phone: string | null
          vehicle_id: string | null
        }
        Insert: {
          contract_url?: string | null
          created_at?: string | null
          dealer_id: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          monthly_price?: number | null
          notes?: string | null
          start_date?: string | null
          status?: string | null
          tenant_email?: string | null
          tenant_name?: string | null
          tenant_nif?: string | null
          tenant_phone?: string | null
          vehicle_id?: string | null
        }
        Update: {
          contract_url?: string | null
          created_at?: string | null
          dealer_id?: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          monthly_price?: number | null
          notes?: string | null
          start_date?: string | null
          status?: string | null
          tenant_email?: string | null
          tenant_name?: string | null
          tenant_nif?: string | null
          tenant_phone?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'rental_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'rental_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'rental_records_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_email: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_email: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_email?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          buyer_confirmed_at: string | null
          buyer_id: string
          created_at: string | null
          deposit_cents: number
          expires_at: string
          id: string
          is_priority: boolean
          priority_credits_spent: number
          seller_id: string
          seller_responded_at: string | null
          seller_response: string | null
          status: Database['public']['Enums']['reservation_status'] | null
          stripe_payment_intent_id: string | null
          subscription_freebie: boolean | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          buyer_confirmed_at?: string | null
          buyer_id: string
          created_at?: string | null
          deposit_cents?: number
          expires_at: string
          id?: string
          is_priority?: boolean
          priority_credits_spent?: number
          seller_id: string
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: Database['public']['Enums']['reservation_status'] | null
          stripe_payment_intent_id?: string | null
          subscription_freebie?: boolean | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          buyer_confirmed_at?: string | null
          buyer_id?: string
          created_at?: string | null
          deposit_cents?: number
          expires_at?: string
          id?: string
          is_priority?: boolean
          priority_credits_spent?: number
          seller_id?: string
          seller_responded_at?: string | null
          seller_response?: string | null
          status?: Database['public']['Enums']['reservation_status'] | null
          stripe_payment_intent_id?: string | null
          subscription_freebie?: boolean | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'reservations_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          allowed: boolean
          created_at: string
          id: string
          resource: string
          role: string
        }
        Insert: {
          action: string
          allowed?: boolean
          created_at?: string
          id?: string
          resource: string
          role: string
        }
        Update: {
          action?: string
          allowed?: boolean
          created_at?: string
          id?: string
          resource?: string
          role?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_favorite: boolean
          last_used_at: string | null
          location_level: string | null
          name: string
          search_query: string | null
          updated_at: string
          use_count: number
          user_id: string
          vertical: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          location_level?: string | null
          name: string
          search_query?: string | null
          updated_at?: string
          use_count?: number
          user_id: string
          vertical?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_favorite?: boolean
          last_used_at?: string | null
          location_level?: string | null
          name?: string
          search_query?: string | null
          updated_at?: string
          use_count?: number
          user_id?: string
          vertical?: string
        }
        Relationships: []
      }
      search_alerts: {
        Row: {
          active: boolean | null
          channels: Json | null
          created_at: string | null
          filters: Json
          frequency: string | null
          id: string
          last_sent_at: string | null
          updated_at: string | null
          user_id: string
          vertical: string
        }
        Insert: {
          active?: boolean | null
          channels?: Json | null
          created_at?: string | null
          filters?: Json
          frequency?: string | null
          id?: string
          last_sent_at?: string | null
          updated_at?: string | null
          user_id: string
          vertical?: string
        }
        Update: {
          active?: boolean | null
          channels?: Json | null
          created_at?: string | null
          filters?: Json
          frequency?: string | null
          id?: string
          last_sent_at?: string | null
          updated_at?: string | null
          user_id?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'search_alerts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          query: string | null
          results_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_reviews: {
        Row: {
          content: string | null
          created_at: string | null
          dimensions: Json | null
          id: string
          nps_score: number | null
          rating: number
          reviewer_id: string
          seller_id: string
          status: string | null
          title: string | null
          updated_at: string | null
          vehicle_id: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          nps_score?: number | null
          rating: number
          reviewer_id: string
          seller_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          nps_score?: number | null
          rating?: number
          reviewer_id?: string
          seller_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'seller_reviews_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seller_reviews_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seller_reviews_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'seller_reviews_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'seller_reviews_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          partner_notified_at: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          partner_notified_at?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          partner_notified_at?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'service_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'service_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'service_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'service_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      social_oauth_states: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          platform: string
          redirect_to: string | null
          state: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          id?: string
          platform: string
          redirect_to?: string | null
          state: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          platform?: string
          redirect_to?: string | null
          state?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          article_id: string | null
          clicks: number | null
          content: Json | null
          created_at: string | null
          external_post_id: string | null
          id: string
          image_url: string | null
          impressions: number | null
          platform: string
          posted_at: string | null
          rejection_reason: string | null
          scheduled_at: string | null
          status: Database['public']['Enums']['social_post_status'] | null
          vehicle_id: string | null
          vertical: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          article_id?: string | null
          clicks?: number | null
          content?: Json | null
          created_at?: string | null
          external_post_id?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          platform: string
          posted_at?: string | null
          rejection_reason?: string | null
          scheduled_at?: string | null
          status?: Database['public']['Enums']['social_post_status'] | null
          vehicle_id?: string | null
          vertical?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          article_id?: string | null
          clicks?: number | null
          content?: Json | null
          created_at?: string | null
          external_post_id?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          platform?: string
          posted_at?: string | null
          rejection_reason?: string | null
          scheduled_at?: string | null
          status?: Database['public']['Enums']['social_post_status'] | null
          vehicle_id?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fk_social_posts_article'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'social_posts_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'social_posts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'social_posts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'social_posts_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      subcategories: {
        Row: {
          applicable_actions: string[] | null
          applicable_filters: string[] | null
          created_at: string | null
          id: string
          name: Json | null
          name_en: string | null
          name_es: string
          name_singular: Json | null
          name_singular_en: string | null
          name_singular_es: string | null
          slug: string
          sort_order: number | null
          status: Database['public']['Enums']['vehicle_status'] | null
          stock_count: number | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          applicable_actions?: string[] | null
          applicable_filters?: string[] | null
          created_at?: string | null
          id?: string
          name?: Json | null
          name_en?: string | null
          name_es: string
          name_singular?: Json | null
          name_singular_en?: string | null
          name_singular_es?: string | null
          slug: string
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          stock_count?: number | null
          updated_at?: string | null
          vertical?: string
        }
        Update: {
          applicable_actions?: string[] | null
          applicable_filters?: string[] | null
          created_at?: string | null
          id?: string
          name?: Json | null
          name_en?: string | null
          name_es?: string
          name_singular?: Json | null
          name_singular_en?: string | null
          name_singular_es?: string | null
          slug?: string
          sort_order?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          stock_count?: number | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      subcategory_categories: {
        Row: {
          category_id: string
          created_at: string | null
          subcategory_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          subcategory_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'type_subcategories_subcategory_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'type_subcategories_type_id_fkey'
            columns: ['subcategory_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean
          max_featured_per_month: number
          max_vehicles: number | null
          name_en: string
          name_es: string
          price_cents_monthly: number
          price_cents_yearly: number
          slug: string
          sort_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_featured_per_month?: number
          max_vehicles?: number | null
          name_en: string
          name_es: string
          price_cents_monthly?: number
          price_cents_yearly?: number
          slug: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_featured_per_month?: number
          max_vehicles?: number | null
          name_en?: string
          name_es?: string
          price_cents_monthly?: number
          price_cents_yearly?: number
          slug?: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          email: string | null
          expires_at: string | null
          founding_badge_permanent: boolean | null
          founding_started_at: string | null
          has_had_trial: boolean | null
          id: string
          plan: string
          pref_csr: boolean | null
          pref_events: boolean | null
          pref_featured: boolean | null
          pref_newsletter: boolean | null
          pref_press: boolean | null
          pref_web: boolean | null
          price_cents: number | null
          started_at: string | null
          status: Database['public']['Enums']['subscription_status'] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
          vertical: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          founding_badge_permanent?: boolean | null
          founding_started_at?: string | null
          has_had_trial?: boolean | null
          id?: string
          plan?: string
          pref_csr?: boolean | null
          pref_events?: boolean | null
          pref_featured?: boolean | null
          pref_newsletter?: boolean | null
          pref_press?: boolean | null
          pref_web?: boolean | null
          price_cents?: number | null
          started_at?: string | null
          status?: Database['public']['Enums']['subscription_status'] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
          vertical?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          founding_badge_permanent?: boolean | null
          founding_started_at?: string | null
          has_had_trial?: boolean | null
          id?: string
          plan?: string
          pref_csr?: boolean | null
          pref_events?: boolean | null
          pref_featured?: boolean | null
          pref_newsletter?: boolean | null
          pref_press?: boolean | null
          pref_web?: boolean | null
          price_cents?: number | null
          started_at?: string | null
          status?: Database['public']['Enums']['subscription_status'] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      transaction_graph: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          metadata: Json | null
          price_range: string | null
          seller_id: string
          transaction_date: string
          vehicle_category: string | null
          vehicle_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          price_range?: string | null
          seller_id: string
          transaction_date?: string
          vehicle_category?: string | null
          vehicle_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          price_range?: string | null
          seller_id?: string
          transaction_date?: string
          vehicle_category?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transaction_graph_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transaction_graph_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transaction_graph_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'transaction_graph_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'transaction_graph_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      transport_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          destination_country: string | null
          destination_postal_code: string | null
          destination_province: string | null
          destination_zone: string | null
          distance_km: number | null
          estimated_price_cents: number | null
          id: string
          notes: string | null
          origin_country: string | null
          origin_province: string | null
          origin_zone: string | null
          partner_notified_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          destination_country?: string | null
          destination_postal_code?: string | null
          destination_province?: string | null
          destination_zone?: string | null
          distance_km?: number | null
          estimated_price_cents?: number | null
          id?: string
          notes?: string | null
          origin_country?: string | null
          origin_province?: string | null
          origin_zone?: string | null
          partner_notified_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          destination_country?: string | null
          destination_postal_code?: string | null
          destination_province?: string | null
          destination_zone?: string | null
          distance_km?: number | null
          estimated_price_cents?: number | null
          id?: string
          notes?: string | null
          origin_country?: string | null
          origin_province?: string | null
          origin_zone?: string | null
          partner_notified_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transport_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transport_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'transport_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'transport_requests_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      transport_zones: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          destination_country: string | null
          destination_region: string | null
          estimated_days: number | null
          id: string
          origin_country: string | null
          origin_region: string | null
          partner_contact: string | null
          partner_name: string | null
          price_cents: number | null
          price_per_km_cents: number | null
          regions: string[] | null
          sort_order: number | null
          status: string | null
          vertical: string | null
          zone_name: string | null
          zone_slug: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          destination_country?: string | null
          destination_region?: string | null
          estimated_days?: number | null
          id?: string
          origin_country?: string | null
          origin_region?: string | null
          partner_contact?: string | null
          partner_name?: string | null
          price_cents?: number | null
          price_per_km_cents?: number | null
          regions?: string[] | null
          sort_order?: number | null
          status?: string | null
          vertical?: string | null
          zone_name?: string | null
          zone_slug?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          destination_country?: string | null
          destination_region?: string | null
          estimated_days?: number | null
          id?: string
          origin_country?: string | null
          origin_region?: string | null
          partner_contact?: string | null
          partner_name?: string | null
          price_cents?: number | null
          price_per_km_cents?: number | null
          regions?: string[] | null
          sort_order?: number | null
          status?: string | null
          vertical?: string | null
          zone_name?: string | null
          zone_slug?: string | null
        }
        Relationships: []
      }
      user_ad_profiles: {
        Row: {
          brands_searched: string[] | null
          categories_viewed: string[] | null
          created_at: string | null
          geo_country: string | null
          geo_region: string | null
          id: string
          last_active_at: string | null
          page_views: number | null
          price_range_max: number | null
          price_range_min: number | null
          segments: string[] | null
          session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brands_searched?: string[] | null
          categories_viewed?: string[] | null
          created_at?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          last_active_at?: string | null
          page_views?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          segments?: string[] | null
          session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brands_searched?: string[] | null
          categories_viewed?: string[] | null
          created_at?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          last_active_at?: string | null
          page_views?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          segments?: string[] | null
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          total_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          total_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          total_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_credits_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_fingerprints: {
        Row: {
          first_seen: string
          fp_hash: string
          id: string
          ip_hint: string | null
          last_seen: string
          request_count: number
          ua_hint: string | null
          user_id: string
        }
        Insert: {
          first_seen?: string
          fp_hash: string
          id?: string
          ip_hint?: string | null
          last_seen?: string
          request_count?: number
          ua_hint?: string | null
          user_id: string
        }
        Update: {
          first_seen?: string
          fp_hash?: string
          id?: string
          ip_hint?: string | null
          last_seen?: string
          request_count?: number
          ua_hint?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_fingerprints_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
          vertical: string | null
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
          vertical?: string | null
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
          vertical?: string | null
        }
        Relationships: []
      }
      user_vehicle_views: {
        Row: {
          user_id: string
          vehicle_id: string
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          user_id: string
          vehicle_id: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          user_id?: string
          vehicle_id?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_vehicle_views_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_vehicle_views_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'user_vehicle_views_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'user_vehicle_views_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          apellidos: string | null
          avatar_url: string | null
          brokerage_blocked_until: string | null
          brokerage_last_strike_reason: string | null
          brokerage_reliability: number | null
          brokerage_strikes: number | null
          brokerage_vip: boolean | null
          brokerage_vip_reason: string
          brokerage_vip_set_by: string | null
          company_name: string | null
          company_type: Database['public']['Enums']['buyer_company_type'] | null
          created_at: string | null
          digest_frequency: string | null
          email: string
          id: string
          lang: string | null
          last_login_at: string | null
          login_count: number | null
          name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean | null
          preferred_country: string | null
          preferred_location_level: string | null
          provider: string | null
          pseudonimo: string | null
          role: Database['public']['Enums']['user_role'] | null
          unsubscribe_token: string | null
          user_type: string | null
        }
        Insert: {
          apellidos?: string | null
          avatar_url?: string | null
          brokerage_blocked_until?: string | null
          brokerage_last_strike_reason?: string | null
          brokerage_reliability?: number | null
          brokerage_strikes?: number | null
          brokerage_vip?: boolean | null
          brokerage_vip_reason?: string
          brokerage_vip_set_by?: string | null
          company_name?: string | null
          company_type?: Database['public']['Enums']['buyer_company_type'] | null
          created_at?: string | null
          digest_frequency?: string | null
          email: string
          id: string
          lang?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_country?: string | null
          preferred_location_level?: string | null
          provider?: string | null
          pseudonimo?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          unsubscribe_token?: string | null
          user_type?: string | null
        }
        Update: {
          apellidos?: string | null
          avatar_url?: string | null
          brokerage_blocked_until?: string | null
          brokerage_last_strike_reason?: string | null
          brokerage_reliability?: number | null
          brokerage_strikes?: number | null
          brokerage_vip?: boolean | null
          brokerage_vip_reason?: string
          brokerage_vip_set_by?: string | null
          company_name?: string | null
          company_type?: Database['public']['Enums']['buyer_company_type'] | null
          created_at?: string | null
          digest_frequency?: string | null
          email?: string
          id?: string
          lang?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          preferred_country?: string | null
          preferred_location_level?: string | null
          provider?: string | null
          pseudonimo?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          unsubscribe_token?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      vehicle_comparisons: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
          user_id: string
          vehicle_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_comparisons_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_duplicate_flags: {
        Row: {
          created_at: string
          id: string
          match_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity_pct: number
          status: string
          vehicle_id_a: string
          vehicle_id_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_pct?: number
          status?: string
          vehicle_id_a: string
          vehicle_id_b: string
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity_pct?: number
          status?: string
          vehicle_id_a?: string
          vehicle_id_b?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_a_fkey'
            columns: ['vehicle_id_a']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_a_fkey'
            columns: ['vehicle_id_a']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_a_fkey'
            columns: ['vehicle_id_a']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_b_fkey'
            columns: ['vehicle_id_b']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_b_fkey'
            columns: ['vehicle_id_b']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'vehicle_duplicate_flags_vehicle_id_b_fkey'
            columns: ['vehicle_id_b']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_group_items: {
        Row: {
          added_at: string
          group_id: string
          sort_order: number
          vehicle_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          sort_order?: number
          vehicle_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          sort_order?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_group_items_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'vehicle_groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicle_group_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'vehicle_group_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'vehicle_group_items_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_groups: {
        Row: {
          cover_image: string | null
          created_at: string
          dealer_id: string | null
          description: Json | null
          group_type: string
          icon_url: string | null
          id: string
          metadata: Json | null
          name: Json
          slug: string
          sort_order: number
          status: string
          updated_at: string
          vertical: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          dealer_id?: string | null
          description?: Json | null
          group_type?: string
          icon_url?: string | null
          id?: string
          metadata?: Json | null
          name?: Json
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
          vertical?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          dealer_id?: string | null
          description?: Json | null
          group_type?: string
          icon_url?: string | null
          id?: string
          metadata?: Json | null
          name?: Json
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_groups_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_images: {
        Row: {
          alt_text: string | null
          cloudinary_public_id: string | null
          created_at: string | null
          id: string
          position: number | null
          thumbnail_url: string | null
          url: string
          vehicle_id: string
        }
        Insert: {
          alt_text?: string | null
          cloudinary_public_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          thumbnail_url?: string | null
          url: string
          vehicle_id: string
        }
        Update: {
          alt_text?: string | null
          cloudinary_public_id?: string | null
          created_at?: string | null
          id?: string
          position?: number | null
          thumbnail_url?: string | null
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_images_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'vehicle_images_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'vehicle_images_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicle_unlocks: {
        Row: {
          credits_spent: number
          id: string
          unlocked_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          credits_spent?: number
          id?: string
          unlocked_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          credits_spent?: number
          id?: string
          unlocked_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vehicle_unlocks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicle_unlocks_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'vehicle_unlocks_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'vehicle_unlocks_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_cost: number | null
          acquisition_date: string | null
          action_id: string | null
          ai_generated: boolean | null
          attributes_json: Json | null
          auto_auction_after_days: number | null
          auto_auction_starting_pct: number | null
          auto_feature: boolean
          auto_renew: boolean
          brand: string
          brand_id: string | null
          categories: string[] | null
          category: Database['public']['Enums']['vehicle_category']
          category_id: string | null
          created_at: string | null
          custom_data: Json | null
          dealer_id: string | null
          description_en: string | null
          description_es: string | null
          documents_json: Json | null
          fair_price_cents: number | null
          featured: boolean | null
          freshness_reminded_at: string | null
          freshness_reminder_count: number | null
          highlight_expires_at: string | null
          highlight_style: string | null
          id: string
          internal_id: number
          is_online: boolean | null
          is_protected: boolean
          listing_type: string | null
          location: string | null
          location_country: string | null
          location_data: Json | null
          location_en: string | null
          location_id: string | null
          location_province: string | null
          location_region: string | null
          maintenance_records: Json | null
          min_price: number | null
          model: string
          owner_contact: string | null
          owner_name: string | null
          owner_notes: string | null
          pending_translations: boolean | null
          plate: string | null
          price: number | null
          price_trend: string | null
          priority_reserved_until: string | null
          ref_code: string | null
          rental_price: number | null
          rental_records: Json | null
          scheduled_publish_at: string | null
          search_vector: unknown
          slug: string
          sold_at: string | null
          sold_price_cents: number | null
          sold_via_tracciona: boolean | null
          sort_boost: number | null
          status: Database['public']['Enums']['vehicle_status'] | null
          title_en: string | null
          title_es: string | null
          title_hash: string | null
          updated_at: string | null
          verification_level: string | null
          vertical: string
          visible_from: string | null
          withdrawal_reason: string | null
          withdrawn_at: string | null
          year: number | null
        }
        Insert: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          action_id?: string | null
          ai_generated?: boolean | null
          attributes_json?: Json | null
          auto_auction_after_days?: number | null
          auto_auction_starting_pct?: number | null
          auto_feature?: boolean
          auto_renew?: boolean
          brand: string
          brand_id?: string | null
          categories?: string[] | null
          category: Database['public']['Enums']['vehicle_category']
          category_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          dealer_id?: string | null
          description_en?: string | null
          description_es?: string | null
          documents_json?: Json | null
          fair_price_cents?: number | null
          featured?: boolean | null
          freshness_reminded_at?: string | null
          freshness_reminder_count?: number | null
          highlight_expires_at?: string | null
          highlight_style?: string | null
          id?: string
          internal_id?: number
          is_online?: boolean | null
          is_protected?: boolean
          listing_type?: string | null
          location?: string | null
          location_country?: string | null
          location_data?: Json | null
          location_en?: string | null
          location_id?: string | null
          location_province?: string | null
          location_region?: string | null
          maintenance_records?: Json | null
          min_price?: number | null
          model: string
          owner_contact?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          pending_translations?: boolean | null
          plate?: string | null
          price?: number | null
          price_trend?: string | null
          priority_reserved_until?: string | null
          ref_code?: string | null
          rental_price?: number | null
          rental_records?: Json | null
          scheduled_publish_at?: string | null
          search_vector?: unknown
          slug: string
          sold_at?: string | null
          sold_price_cents?: number | null
          sold_via_tracciona?: boolean | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          title_en?: string | null
          title_es?: string | null
          title_hash?: string | null
          updated_at?: string | null
          verification_level?: string | null
          vertical?: string
          visible_from?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          year?: number | null
        }
        Update: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          action_id?: string | null
          ai_generated?: boolean | null
          attributes_json?: Json | null
          auto_auction_after_days?: number | null
          auto_auction_starting_pct?: number | null
          auto_feature?: boolean
          auto_renew?: boolean
          brand?: string
          brand_id?: string | null
          categories?: string[] | null
          category?: Database['public']['Enums']['vehicle_category']
          category_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          dealer_id?: string | null
          description_en?: string | null
          description_es?: string | null
          documents_json?: Json | null
          fair_price_cents?: number | null
          featured?: boolean | null
          freshness_reminded_at?: string | null
          freshness_reminder_count?: number | null
          highlight_expires_at?: string | null
          highlight_style?: string | null
          id?: string
          internal_id?: number
          is_online?: boolean | null
          is_protected?: boolean
          listing_type?: string | null
          location?: string | null
          location_country?: string | null
          location_data?: Json | null
          location_en?: string | null
          location_id?: string | null
          location_province?: string | null
          location_region?: string | null
          maintenance_records?: Json | null
          min_price?: number | null
          model?: string
          owner_contact?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          pending_translations?: boolean | null
          plate?: string | null
          price?: number | null
          price_trend?: string | null
          priority_reserved_until?: string | null
          ref_code?: string | null
          rental_price?: number | null
          rental_records?: Json | null
          scheduled_publish_at?: string | null
          search_vector?: unknown
          slug?: string
          sold_at?: string | null
          sold_price_cents?: number | null
          sold_via_tracciona?: boolean | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          title_en?: string | null
          title_es?: string | null
          title_hash?: string | null
          updated_at?: string | null
          verification_level?: string | null
          vertical?: string
          visible_from?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicles_action_id_fkey'
            columns: ['action_id']
            isOneToOne: false
            referencedRelation: 'actions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_brand_id_fkey'
            columns: ['brand_id']
            isOneToOne: false
            referencedRelation: 'brands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_subcategory_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
        ]
      }
      verification_documents: {
        Row: {
          data: Json | null
          doc_type: string
          expires_at: string | null
          file_url: string | null
          generated_at: string | null
          id: string
          level: number
          notes: string | null
          price_cents: number | null
          rejection_reason: string | null
          status: Database['public']['Enums']['verification_status'] | null
          submitted_by: string | null
          vehicle_id: string
          verified_by: string | null
        }
        Insert: {
          data?: Json | null
          doc_type: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          level?: number
          notes?: string | null
          price_cents?: number | null
          rejection_reason?: string | null
          status?: Database['public']['Enums']['verification_status'] | null
          submitted_by?: string | null
          vehicle_id: string
          verified_by?: string | null
        }
        Update: {
          data?: Json | null
          doc_type?: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string | null
          id?: string
          level?: number
          notes?: string | null
          price_cents?: number | null
          rejection_reason?: string | null
          status?: Database['public']['Enums']['verification_status'] | null
          submitted_by?: string | null
          vehicle_id?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'verification_documents_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'verification_documents_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'verification_documents_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'verification_documents_verified_by_fkey'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      vertical_config: {
        Row: {
          active_actions: string[] | null
          active_locales: string[] | null
          auction_defaults: Json | null
          auto_publish_social: boolean | null
          auto_translate_on_publish: boolean | null
          banners: Json | null
          cloudinary_cloud_name: string | null
          commission_rates: Json | null
          compliance_rules: Json | null
          created_at: string | null
          default_currency: string | null
          default_locale: string | null
          email_templates: Json | null
          favicon_url: string | null
          feature_flags: Json | null
          font_preset: string | null
          footer_links: Json | null
          footer_text: Json | null
          google_adsense_id: string | null
          google_analytics_id: string | null
          google_search_console: string | null
          header_links: Json | null
          hero_cta_text: Json | null
          hero_cta_url: string | null
          hero_image_url: string | null
          hero_subtitle: Json | null
          hero_title: Json | null
          homepage_sections: Json | null
          id: string
          logo_dark_url: string | null
          logo_text_config: Json | null
          logo_url: string | null
          meta_description: Json | null
          name: Json
          og_image_url: string | null
          require_article_approval: boolean | null
          require_vehicle_approval: boolean | null
          social_links: Json | null
          stock_limits: Json | null
          subscription_prices: Json | null
          tagline: Json | null
          theme: Json
          translation_api_key_encrypted: string | null
          translation_engine: string | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          active_actions?: string[] | null
          active_locales?: string[] | null
          auction_defaults?: Json | null
          auto_publish_social?: boolean | null
          auto_translate_on_publish?: boolean | null
          banners?: Json | null
          cloudinary_cloud_name?: string | null
          commission_rates?: Json | null
          compliance_rules?: Json | null
          created_at?: string | null
          default_currency?: string | null
          default_locale?: string | null
          email_templates?: Json | null
          favicon_url?: string | null
          feature_flags?: Json | null
          font_preset?: string | null
          footer_links?: Json | null
          footer_text?: Json | null
          google_adsense_id?: string | null
          google_analytics_id?: string | null
          google_search_console?: string | null
          header_links?: Json | null
          hero_cta_text?: Json | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: Json | null
          hero_title?: Json | null
          homepage_sections?: Json | null
          id?: string
          logo_dark_url?: string | null
          logo_text_config?: Json | null
          logo_url?: string | null
          meta_description?: Json | null
          name: Json
          og_image_url?: string | null
          require_article_approval?: boolean | null
          require_vehicle_approval?: boolean | null
          social_links?: Json | null
          stock_limits?: Json | null
          subscription_prices?: Json | null
          tagline?: Json | null
          theme?: Json
          translation_api_key_encrypted?: string | null
          translation_engine?: string | null
          updated_at?: string | null
          vertical: string
        }
        Update: {
          active_actions?: string[] | null
          active_locales?: string[] | null
          auction_defaults?: Json | null
          auto_publish_social?: boolean | null
          auto_translate_on_publish?: boolean | null
          banners?: Json | null
          cloudinary_cloud_name?: string | null
          commission_rates?: Json | null
          compliance_rules?: Json | null
          created_at?: string | null
          default_currency?: string | null
          default_locale?: string | null
          email_templates?: Json | null
          favicon_url?: string | null
          feature_flags?: Json | null
          font_preset?: string | null
          footer_links?: Json | null
          footer_text?: Json | null
          google_adsense_id?: string | null
          google_analytics_id?: string | null
          google_search_console?: string | null
          header_links?: Json | null
          hero_cta_text?: Json | null
          hero_cta_url?: string | null
          hero_image_url?: string | null
          hero_subtitle?: Json | null
          hero_title?: Json | null
          homepage_sections?: Json | null
          id?: string
          logo_dark_url?: string | null
          logo_text_config?: Json | null
          logo_url?: string | null
          meta_description?: Json | null
          name?: Json
          og_image_url?: string | null
          require_article_approval?: boolean | null
          require_vehicle_approval?: boolean | null
          social_links?: Json | null
          stock_limits?: Json | null
          subscription_prices?: Json | null
          tagline?: Json | null
          theme?: Json
          translation_api_key_encrypted?: string | null
          translation_engine?: string | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      vertical_custom_fields: {
        Row: {
          active: boolean
          created_at: string
          entity_type: Database['public']['Enums']['custom_field_entity']
          field_name: string
          field_type: Database['public']['Enums']['custom_field_type']
          id: string
          label: Json
          options: Json | null
          placeholder: Json | null
          required: boolean
          sort_order: number
          updated_at: string
          validation: Json | null
          vertical: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          entity_type?: Database['public']['Enums']['custom_field_entity']
          field_name: string
          field_type?: Database['public']['Enums']['custom_field_type']
          id?: string
          label?: Json
          options?: Json | null
          placeholder?: Json | null
          required?: boolean
          sort_order?: number
          updated_at?: string
          validation?: Json | null
          vertical: string
        }
        Update: {
          active?: boolean
          created_at?: string
          entity_type?: Database['public']['Enums']['custom_field_entity']
          field_name?: string
          field_type?: Database['public']['Enums']['custom_field_type']
          id?: string
          label?: Json
          options?: Json | null
          placeholder?: Json | null
          required?: boolean
          sort_order?: number
          updated_at?: string
          validation?: Json | null
          vertical?: string
        }
        Relationships: []
      }
      visit_bookings: {
        Row: {
          buyer_id: string
          created_at: string | null
          dealer_id: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string | null
          updated_at: string | null
          vehicle_id: string
          visit_date: string
          visit_slot_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          dealer_id: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
          visit_date: string
          visit_slot_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          dealer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
          visit_date?: string
          visit_slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'visit_bookings_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visit_bookings_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visit_bookings_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'visit_bookings_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'visit_bookings_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visit_bookings_visit_slot_id_fkey'
            columns: ['visit_slot_id']
            isOneToOne: false
            referencedRelation: 'visit_slots'
            referencedColumns: ['id']
          },
        ]
      }
      visit_slots: {
        Row: {
          active: boolean | null
          created_at: string | null
          day_of_week: number
          dealer_id: string
          end_time: string
          id: string
          max_visitors: number | null
          start_time: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          day_of_week: number
          dealer_id: string
          end_time: string
          id?: string
          max_visitors?: number | null
          start_time: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          day_of_week?: number
          dealer_id?: string
          end_time?: string
          id?: string
          max_visitors?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'visit_slots_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
      whatsapp_submissions: {
        Row: {
          claude_response: Json | null
          created_at: string | null
          dealer_id: string | null
          error_message: string | null
          id: string
          last_error: string | null
          media_ids: string[] | null
          phone_number: string
          retry_count: number | null
          status: string | null
          text_content: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          claude_response?: Json | null
          created_at?: string | null
          dealer_id?: string | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          media_ids?: string[] | null
          phone_number: string
          retry_count?: number | null
          status?: string | null
          text_content?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          claude_response?: Json | null
          created_at?: string | null
          dealer_id?: string | null
          error_message?: string | null
          id?: string
          last_error?: string | null
          media_ids?: string[] | null
          phone_number?: string
          retry_count?: number | null
          status?: string | null
          text_content?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'whatsapp_submissions_dealer_id_fkey'
            columns: ['dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'whatsapp_submissions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'whatsapp_submissions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'whatsapp_submissions_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      duplicate_device_users: {
        Row: {
          account_count: number | null
          first_seen: string | null
          fp_hash: string | null
          last_seen: string | null
          ua_hint: string | null
          user_ids: string[] | null
        }
        Relationships: []
      }
      founding_expiry_check: {
        Row: {
          company_name: Json | null
          dealer_email: string | null
          expires_at: string | null
          expiry_status: string | null
          founding_badge_permanent: boolean | null
          founding_started_at: string | null
          plan: string | null
          subscription_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      price_history_trends: {
        Row: {
          avg_price_cents: number | null
          brand: string | null
          category_id: string | null
          max_price_cents: number | null
          median_price_cents: number | null
          min_price_cents: number | null
          sample_size: number | null
          subcategory_name: string | null
          subcategory_slug: string | null
          vertical: string | null
          week: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicles_subcategory_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'subcategories'
            referencedColumns: ['id']
          },
        ]
      }
      v_brokerage_messages_tank: {
        Row: {
          channel: string | null
          content: string | null
          content_hash: string | null
          created_at: string | null
          deal_id: string | null
          direction: string | null
          id: string | null
          metadata: Json | null
          recipient_entity: string | null
          sender_entity: string | null
        }
        Insert: {
          channel?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          id?: string | null
          metadata?: Json | null
          recipient_entity?: string | null
          sender_entity?: string | null
        }
        Update: {
          channel?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          id?: string | null
          metadata?: Json | null
          recipient_entity?: string | null
          sender_entity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'brokerage_deals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tank'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tracciona'
            referencedColumns: ['id']
          },
        ]
      }
      v_brokerage_messages_tracciona: {
        Row: {
          channel: string | null
          content: string | null
          created_at: string | null
          deal_id: string | null
          direction: string | null
          id: string | null
          metadata: Json | null
          recipient_entity: string | null
          sender_entity: string | null
        }
        Insert: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          id?: string | null
          metadata?: Json | null
          recipient_entity?: string | null
          sender_entity?: string | null
        }
        Update: {
          channel?: string | null
          content?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          id?: string | null
          metadata?: Json | null
          recipient_entity?: string | null
          sender_entity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'brokerage_deals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tank'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_messages_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'v_brokerage_tracciona'
            referencedColumns: ['id']
          },
        ]
      }
      v_brokerage_tank: {
        Row: {
          agreed_buy_price: number | null
          agreed_deal_price: number | null
          asking_price: number | null
          broker_commission: number | null
          broker_commission_pct: number | null
          broker_contacted_at: string | null
          broker_failed_at: string | null
          broker_lock_until: string | null
          buyer_budget_max: number | null
          buyer_budget_min: number | null
          buyer_financing: boolean | null
          buyer_id: string | null
          buyer_needs: Json | null
          buyer_phone: string | null
          buyer_score: number | null
          closed_at: string | null
          created_at: string | null
          deal_mode: string | null
          escalated_at: string | null
          escalation_reason: string | null
          expires_at: string | null
          human_assignee: string | null
          id: string | null
          legal_basis_buyer: string | null
          legal_basis_seller: string | null
          margin_amount: number | null
          margin_pct: number | null
          min_margin_threshold: number | null
          offer_price: number | null
          qualified_at: string | null
          seller_dealer_id: string | null
          seller_id: string | null
          seller_phone: string | null
          seller_responded_at: string | null
          status: string | null
          tank_contacted_at: string | null
          target_sell_price: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          agreed_buy_price?: number | null
          agreed_deal_price?: number | null
          asking_price?: number | null
          broker_commission?: number | null
          broker_commission_pct?: number | null
          broker_contacted_at?: string | null
          broker_failed_at?: string | null
          broker_lock_until?: string | null
          buyer_budget_max?: number | null
          buyer_budget_min?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          human_assignee?: string | null
          id?: string | null
          legal_basis_buyer?: string | null
          legal_basis_seller?: string | null
          margin_amount?: number | null
          margin_pct?: number | null
          min_margin_threshold?: number | null
          offer_price?: number | null
          qualified_at?: string | null
          seller_dealer_id?: string | null
          seller_id?: string | null
          seller_phone?: string | null
          seller_responded_at?: string | null
          status?: string | null
          tank_contacted_at?: string | null
          target_sell_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          agreed_buy_price?: number | null
          agreed_deal_price?: number | null
          asking_price?: number | null
          broker_commission?: number | null
          broker_commission_pct?: number | null
          broker_contacted_at?: string | null
          broker_failed_at?: string | null
          broker_lock_until?: string | null
          buyer_budget_max?: number | null
          buyer_budget_min?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          human_assignee?: string | null
          id?: string | null
          legal_basis_buyer?: string | null
          legal_basis_seller?: string | null
          margin_amount?: number | null
          margin_pct?: number | null
          min_margin_threshold?: number | null
          offer_price?: number | null
          qualified_at?: string | null
          seller_dealer_id?: string | null
          seller_id?: string | null
          seller_phone?: string | null
          seller_responded_at?: string | null
          status?: string | null
          tank_contacted_at?: string | null
          target_sell_price?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_deals_seller_dealer_id_fkey'
            columns: ['seller_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      v_brokerage_tracciona: {
        Row: {
          broker_commission: number | null
          broker_commission_pct: number | null
          buyer_financing: boolean | null
          buyer_id: string | null
          buyer_needs: Json | null
          buyer_phone: string | null
          buyer_score: number | null
          closed_at: string | null
          created_at: string | null
          deal_mode: string | null
          expires_at: string | null
          id: string | null
          legal_basis_buyer: string | null
          qualified_at: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          broker_commission?: number | null
          broker_commission_pct?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string | null
          expires_at?: string | null
          id?: string | null
          legal_basis_buyer?: string | null
          qualified_at?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          broker_commission?: number | null
          broker_commission_pct?: number | null
          buyer_financing?: boolean | null
          buyer_id?: string | null
          buyer_needs?: Json | null
          buyer_phone?: string | null
          buyer_score?: number | null
          closed_at?: string | null
          created_at?: string | null
          deal_mode?: string | null
          expires_at?: string | null
          id?: string | null
          legal_basis_buyer?: string | null
          qualified_at?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_a_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'v_pending_duplicates'
            referencedColumns: ['vehicle_b_id']
          },
          {
            foreignKeyName: 'brokerage_deals_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      v_multi_account_fingerprints: {
        Row: {
          fingerprint_hash: string | null
          last_seen: string | null
          sample_ua: string | null
          total_seen: number | null
          user_count: number | null
          user_ids: string[] | null
        }
        Relationships: []
      }
      v_pending_duplicates: {
        Row: {
          created_at: string | null
          id: string | null
          match_type: string | null
          similarity_pct: number | null
          status: string | null
          vehicle_a_brand: string | null
          vehicle_a_dealer_id: string | null
          vehicle_a_id: string | null
          vehicle_a_model: string | null
          vehicle_a_slug: string | null
          vehicle_a_year: number | null
          vehicle_b_brand: string | null
          vehicle_b_dealer_id: string | null
          vehicle_b_id: string | null
          vehicle_b_model: string | null
          vehicle_b_slug: string | null
          vehicle_b_year: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'vehicles_dealer_id_fkey'
            columns: ['vehicle_b_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_dealer_id_fkey'
            columns: ['vehicle_a_dealer_id']
            isOneToOne: false
            referencedRelation: 'dealers'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      accept_dealer_invite: { Args: { p_invite_token: string }; Returns: Json }
      assign_experiment: {
        Args: {
          p_anonymous_id?: string
          p_experiment_key: string
          p_user_id?: string
        }
        Returns: string
      }
      calculate_balance_profit: {
        Args: { p_coste: number; p_importe: number }
        Returns: number
      }
      calculate_dynamic_threshold: {
        Args: { parent_count: number }
        Returns: number
      }
      calculate_verification_level: { Args: { v_id: string }; Returns: string }
      check_dealer_permission: {
        Args: {
          p_dealer_id: string
          p_required_role?: Database['public']['Enums']['dealer_team_role']
          p_user_id: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      claim_pending_jobs: {
        Args: { batch_size?: number }
        Returns: {
          backoff_seconds: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          max_retries: number
          payload: Json
          result: Json | null
          retries: number
          scheduled_at: string
          started_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'job_queue'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      classify_price_range: { Args: { price: number }; Returns: string }
      cleanup_rate_limit_entries: {
        Args: { p_max_age_seconds?: number }
        Returns: number
      }
      count_orphan_leads: { Args: never; Returns: number }
      count_orphan_vehicles: { Args: never; Returns: number }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_user_id: string
          p_vehicle_id?: string
        }
        Returns: {
          new_balance: number
          reason: string
          success: boolean
        }[]
      }
      generate_landing_intro: {
        Args: { p_landing_id: string; p_locale?: string }
        Returns: string
      }
      get_dealer_dashboard_stats: {
        Args: {
          p_dealer_id: string
          p_month_start?: string
          p_vertical?: string
        }
        Returns: {
          active_listings: number
          contacts_this_month: number
          conversion_rate: number
          ficha_views_this_month: number
          leads_this_month: number
          response_rate: number
          total_leads: number
          total_views: number
        }[]
      }
      get_dealer_rating_summary: {
        Args: { p_dealer_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
      get_dealer_top_vehicles: {
        Args: { p_dealer_id: string; p_limit?: number; p_vertical?: string }
        Returns: {
          brand: string
          favorites: number
          id: string
          leads: number
          model: string
          price: number
          status: string
          views: number
          year: number
        }[]
      }
      get_dealer_vertical: { Args: never; Returns: string }
      get_seller_rating_summary: {
        Args: { p_seller_id: string }
        Returns: {
          average_rating: number
          avg_accuracy: number
          avg_communication: number
          avg_condition: number
          avg_logistics: number
          avg_nps: number
          nps_detractors: number
          nps_promoters: number
          nps_score_net: number
          review_count: number
        }[]
      }
      has_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
      immutable_unaccent: { Args: { '': string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_feature_enabled: {
        Args: { p_key: string; p_vertical?: string }
        Returns: boolean
      }
      refresh_all_materialized_views: { Args: never; Returns: undefined }
      search_content_translations: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_entity_type?: string
          search_locale?: string
          search_query: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          field: string
          locale: string
          rank: number
          value: string
        }[]
      }
      search_vehicles: {
        Args: {
          cursor_id?: string
          cursor_rank?: number
          filter_category_id?: string
          filter_country?: string
          filter_price_max?: number
          filter_price_min?: number
          filter_province?: string
          filter_year_max?: number
          filter_year_min?: number
          page_limit?: number
          search_query?: string
        }
        Returns: {
          brand: string
          category_id: string
          created_at: string
          dealer_id: string
          id: string
          location: string
          location_country: string
          location_province: string
          model: string
          price: number
          rank: number
          slug: string
          status: string
          total_estimate: number
          year: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
      unaccent: { Args: { '': string }; Returns: string }
      upsert_user_fingerprint: {
        Args: {
          p_fp_hash: string
          p_ip_hint?: string
          p_ua_hint?: string
          p_user_id: string
        }
        Returns: undefined
      }
      user_entity: { Args: never; Returns: string }
    }
    Enums: {
      auction_status: 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled'
      balance_reason:
        | 'venta'
        | 'alquiler'
        | 'exportacion'
        | 'compra'
        | 'taller'
        | 'documentacion'
        | 'servicios'
        | 'salario'
        | 'seguro'
        | 'dividendos'
        | 'almacenamiento'
        | 'bancario'
        | 'efectivo'
        | 'otros'
      balance_status: 'pendiente' | 'pagado' | 'cobrado'
      balance_type: 'ingreso' | 'gasto'
      buyer_company_type: 'dealer' | 'fleet' | 'rental' | 'leasing' | 'export' | 'end_user'
      comment_status: 'pending' | 'approved' | 'spam' | 'rejected'
      crm_pipeline_stage: 'contacted' | 'demo' | 'negotiating' | 'closed' | 'lost'
      custom_field_entity: 'vehicle' | 'dealer' | 'article'
      custom_field_type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'url'
      dealer_document_status: 'pending' | 'approved' | 'rejected' | 'expired'
      dealer_document_type:
        | 'invoice'
        | 'contract'
        | 'certificate'
        | 'insurance'
        | 'license'
        | 'other'
      dealer_status: 'active' | 'inactive' | 'suspended' | 'banned'
      dealer_team_role: 'owner' | 'manager' | 'viewer'
      filter_type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
      lead_status: 'new' | 'viewed' | 'contacted' | 'negotiating' | 'won' | 'lost'
      msg_direction: 'user_to_admin' | 'admin_to_user'
      payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'
      payment_type:
        | 'subscription'
        | 'auction_deposit'
        | 'auction_premium'
        | 'verification'
        | 'transport'
        | 'transfer'
        | 'ad'
        | 'one_time'
      reservation_status:
        | 'pending'
        | 'active'
        | 'seller_responded'
        | 'completed'
        | 'expired'
        | 'refunded'
        | 'forfeited'
      social_post_status: 'draft' | 'scheduled' | 'posted' | 'failed'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
      user_role: 'visitor' | 'user' | 'admin'
      vehicle_category: 'alquiler' | 'venta' | 'terceros'
      vehicle_status:
        | 'draft'
        | 'published'
        | 'sold'
        | 'archived'
        | 'rented'
        | 'maintenance'
        | 'paused'
        | 'expired'
        | 'pending'
        | 'rejected'
        | 'withdrawn'
      verification_status: 'pending' | 'verified' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      auction_status: ['draft', 'scheduled', 'active', 'ended', 'cancelled'],
      balance_reason: [
        'venta',
        'alquiler',
        'exportacion',
        'compra',
        'taller',
        'documentacion',
        'servicios',
        'salario',
        'seguro',
        'dividendos',
        'almacenamiento',
        'bancario',
        'efectivo',
        'otros',
      ],
      balance_status: ['pendiente', 'pagado', 'cobrado'],
      balance_type: ['ingreso', 'gasto'],
      buyer_company_type: ['dealer', 'fleet', 'rental', 'leasing', 'export', 'end_user'],
      comment_status: ['pending', 'approved', 'spam', 'rejected'],
      crm_pipeline_stage: ['contacted', 'demo', 'negotiating', 'closed', 'lost'],
      custom_field_entity: ['vehicle', 'dealer', 'article'],
      custom_field_type: ['text', 'number', 'boolean', 'select', 'date', 'url'],
      dealer_document_status: ['pending', 'approved', 'rejected', 'expired'],
      dealer_document_type: ['invoice', 'contract', 'certificate', 'insurance', 'license', 'other'],
      dealer_status: ['active', 'inactive', 'suspended', 'banned'],
      dealer_team_role: ['owner', 'manager', 'viewer'],
      filter_type: ['caja', 'desplegable', 'desplegable_tick', 'tick', 'slider', 'calc'],
      lead_status: ['new', 'viewed', 'contacted', 'negotiating', 'won', 'lost'],
      msg_direction: ['user_to_admin', 'admin_to_user'],
      payment_status: ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'],
      payment_type: [
        'subscription',
        'auction_deposit',
        'auction_premium',
        'verification',
        'transport',
        'transfer',
        'ad',
        'one_time',
      ],
      reservation_status: [
        'pending',
        'active',
        'seller_responded',
        'completed',
        'expired',
        'refunded',
        'forfeited',
      ],
      social_post_status: ['draft', 'scheduled', 'posted', 'failed'],
      subscription_status: ['active', 'canceled', 'past_due', 'trialing'],
      user_role: ['visitor', 'user', 'admin'],
      vehicle_category: ['alquiler', 'venta', 'terceros'],
      vehicle_status: [
        'draft',
        'published',
        'sold',
        'archived',
        'rented',
        'maintenance',
        'paused',
        'expired',
        'pending',
        'rejected',
        'withdrawn',
      ],
      verification_status: ['pending', 'verified', 'rejected'],
    },
  },
} as const
