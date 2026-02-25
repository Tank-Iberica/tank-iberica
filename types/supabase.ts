export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
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
          page_path: string | null
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
          page_path?: string | null
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
          page_path?: string | null
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
          year?: number | null
        }
        Relationships: [
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
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
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
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
          status: string
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
          status?: string
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
          status?: string
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
      dealers: {
        Row: {
          active_listings: number | null
          auto_reply_message: Json | null
          avg_response_time_hours: number | null
          badge: string | null
          bio: Json | null
          catalog_sort: string | null
          certifications: Json | null
          cif_nif: string | null
          company_name: Json
          contact_config: Json | null
          cover_image_url: string | null
          created_at: string | null
          email: string | null
          featured: boolean | null
          id: string
          legal_name: string | null
          locale: string | null
          location_data: Json | null
          logo_url: string | null
          notification_config: Json | null
          notification_preferences: Json | null
          phone: string | null
          pinned_vehicles: string[] | null
          rating: number | null
          slug: string
          social_links: Json | null
          sort_boost: number | null
          status: string | null
          subscription_type: string | null
          subscription_valid_until: string | null
          theme: Json | null
          total_leads: number | null
          total_listings: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          vertical: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          active_listings?: number | null
          auto_reply_message?: Json | null
          avg_response_time_hours?: number | null
          badge?: string | null
          bio?: Json | null
          catalog_sort?: string | null
          certifications?: Json | null
          cif_nif?: string | null
          company_name: Json
          contact_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          legal_name?: string | null
          locale?: string | null
          location_data?: Json | null
          logo_url?: string | null
          notification_config?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          pinned_vehicles?: string[] | null
          rating?: number | null
          slug: string
          social_links?: Json | null
          sort_boost?: number | null
          status?: string | null
          subscription_type?: string | null
          subscription_valid_until?: string | null
          theme?: Json | null
          total_leads?: number | null
          total_listings?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          vertical?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          active_listings?: number | null
          auto_reply_message?: Json | null
          avg_response_time_hours?: number | null
          badge?: string | null
          bio?: Json | null
          catalog_sort?: string | null
          certifications?: Json | null
          cif_nif?: string | null
          company_name?: Json
          contact_config?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          legal_name?: string | null
          locale?: string | null
          location_data?: Json | null
          logo_url?: string | null
          notification_config?: Json | null
          notification_preferences?: Json | null
          phone?: string | null
          pinned_vehicles?: string[] | null
          rating?: number | null
          slug?: string
          social_links?: Json | null
          sort_boost?: number | null
          status?: string | null
          subscription_type?: string | null
          subscription_valid_until?: string | null
          theme?: Json | null
          total_leads?: number | null
          total_listings?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          vertical?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'dealers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
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
          email_type: string
          enabled: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_type: string
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
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
      favorites: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
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
          sale_price_cents: number | null
          source: string | null
          status: string | null
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
          sale_price_cents?: number | null
          source?: string | null
          status?: string | null
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
          sale_price_cents?: number | null
          source?: string | null
          status?: string | null
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
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          type: string
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
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
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
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
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
      search_alerts: {
        Row: {
          active: boolean | null
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
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan: string
          price_cents: number | null
          started_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
          vertical: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price_cents?: number | null
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
          vertical?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price_cents?: number | null
          started_at?: string | null
          status?: string | null
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
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          apellidos: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          lang: string | null
          last_login_at: string | null
          login_count: number | null
          name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean | null
          provider: string | null
          pseudonimo: string | null
          role: Database['public']['Enums']['user_role'] | null
          unsubscribe_token: string | null
          user_type: string | null
        }
        Insert: {
          apellidos?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          id: string
          lang?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          provider?: string | null
          pseudonimo?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          unsubscribe_token?: string | null
          user_type?: string | null
        }
        Update: {
          apellidos?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          lang?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          provider?: string | null
          pseudonimo?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          unsubscribe_token?: string | null
          user_type?: string | null
        }
        Relationships: []
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
          brand: string
          brand_id: string | null
          categories: string[] | null
          category: Database['public']['Enums']['vehicle_category']
          category_id: string | null
          created_at: string | null
          dealer_id: string | null
          description_en: string | null
          description_es: string | null
          documents_json: Json | null
          featured: boolean | null
          freshness_reminded_at: string | null
          freshness_reminder_count: number | null
          id: string
          internal_id: number
          is_online: boolean | null
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
          rental_price: number | null
          rental_records: Json | null
          slug: string
          sold_at: string | null
          sold_price_cents: number | null
          sold_via_tracciona: boolean | null
          sort_boost: number | null
          status: Database['public']['Enums']['vehicle_status'] | null
          updated_at: string | null
          verification_level: string | null
          visible_from: string | null
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
          brand: string
          brand_id?: string | null
          categories?: string[] | null
          category: Database['public']['Enums']['vehicle_category']
          category_id?: string | null
          created_at?: string | null
          dealer_id?: string | null
          description_en?: string | null
          description_es?: string | null
          documents_json?: Json | null
          featured?: boolean | null
          freshness_reminded_at?: string | null
          freshness_reminder_count?: number | null
          id?: string
          internal_id?: number
          is_online?: boolean | null
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
          rental_price?: number | null
          rental_records?: Json | null
          slug: string
          sold_at?: string | null
          sold_price_cents?: number | null
          sold_via_tracciona?: boolean | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          updated_at?: string | null
          verification_level?: string | null
          visible_from?: string | null
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
          brand?: string
          brand_id?: string | null
          categories?: string[] | null
          category?: Database['public']['Enums']['vehicle_category']
          category_id?: string | null
          created_at?: string | null
          dealer_id?: string | null
          description_en?: string | null
          description_es?: string | null
          documents_json?: Json | null
          featured?: boolean | null
          freshness_reminded_at?: string | null
          freshness_reminder_count?: number | null
          id?: string
          internal_id?: number
          is_online?: boolean | null
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
          rental_price?: number | null
          rental_records?: Json | null
          slug?: string
          sold_at?: string | null
          sold_price_cents?: number | null
          sold_via_tracciona?: boolean | null
          sort_boost?: number | null
          status?: Database['public']['Enums']['vehicle_status'] | null
          updated_at?: string | null
          verification_level?: string | null
          visible_from?: string | null
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
          submitted_by?: string | null
          vehicle_id?: string
          verified_by?: string | null
        }
        Relationships: [
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
          auto_publish_social: boolean | null
          auto_translate_on_publish: boolean | null
          banners: Json | null
          cloudinary_cloud_name: string | null
          commission_rates: Json | null
          created_at: string | null
          default_locale: string | null
          email_templates: Json | null
          favicon_url: string | null
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
          logo_url: string | null
          meta_description: Json | null
          name: Json
          og_image_url: string | null
          require_article_approval: boolean | null
          require_vehicle_approval: boolean | null
          social_links: Json | null
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
          auto_publish_social?: boolean | null
          auto_translate_on_publish?: boolean | null
          banners?: Json | null
          cloudinary_cloud_name?: string | null
          commission_rates?: Json | null
          created_at?: string | null
          default_locale?: string | null
          email_templates?: Json | null
          favicon_url?: string | null
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
          logo_url?: string | null
          meta_description?: Json | null
          name: Json
          og_image_url?: string | null
          require_article_approval?: boolean | null
          require_vehicle_approval?: boolean | null
          social_links?: Json | null
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
          auto_publish_social?: boolean | null
          auto_translate_on_publish?: boolean | null
          banners?: Json | null
          cloudinary_cloud_name?: string | null
          commission_rates?: Json | null
          created_at?: string | null
          default_locale?: string | null
          email_templates?: Json | null
          favicon_url?: string | null
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
          logo_url?: string | null
          meta_description?: Json | null
          name?: Json
          og_image_url?: string | null
          require_article_approval?: boolean | null
          require_vehicle_approval?: boolean | null
          social_links?: Json | null
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
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_balance_profit: {
        Args: { p_coste: number; p_importe: number }
        Returns: number
      }
      calculate_dynamic_threshold: {
        Args: { parent_count: number }
        Returns: number
      }
      calculate_verification_level: { Args: { v_id: string }; Returns: string }
      generate_landing_intro: {
        Args: { p_landing_id: string; p_locale?: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
    }
    Enums: {
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
      filter_type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
      msg_direction: 'user_to_admin' | 'admin_to_user'
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
  public: {
    Enums: {
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
      filter_type: ['caja', 'desplegable', 'desplegable_tick', 'tick', 'slider', 'calc'],
      msg_direction: ['user_to_admin', 'admin_to_user'],
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
      ],
    },
  },
} as const
