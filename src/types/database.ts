export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      allergens: {
        Row: {
          id: string;
          code: string;
          name: string;
          display_name: string;
          description: string | null;
          display_order: number | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          display_name: string;
          description?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
        };
        Update: Partial<Database['public']['Tables']['allergens']['Insert']>;
      };
      brands: {
        Row: {
          id: string;
          category_id: string | null;
          slug: string;
          name: string;
          logo_url: string | null;
          official_url: string | null;
          allergen_source_url: string | null;
          origin_source_url: string | null;
          data_status:
            | 'official_verified'
            | 'pdf_verified'
            | 'delivery_app_checked'
            | 'user_reported'
            | 'unverified'
            | 'no_data';
          last_checked_at: string | null;
          display_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          slug: string;
          name: string;
          logo_url?: string | null;
          official_url?: string | null;
          allergen_source_url?: string | null;
          origin_source_url?: string | null;
          data_status?: Database['public']['Tables']['brands']['Row']['data_status'];
          last_checked_at?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          display_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          display_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      data_sources: {
        Row: {
          id: string;
          brand_id: string | null;
          title: string;
          source_type: 'official_page' | 'pdf' | 'delivery_app' | 'manual_check';
          url: string | null;
          checked_at: string;
          captured_at: string | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          title: string;
          source_type: Database['public']['Tables']['data_sources']['Row']['source_type'];
          url?: string | null;
          checked_at: string;
          captured_at?: string | null;
          note?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['data_sources']['Insert']>;
      };
      menu_allergens: {
        Row: {
          id: string;
          menu_id: string | null;
          allergen_id: string | null;
          presence_type: 'contains' | 'may_contain' | 'unknown';
          note: string | null;
          source_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          menu_id?: string | null;
          allergen_id?: string | null;
          presence_type: Database['public']['Tables']['menu_allergens']['Row']['presence_type'];
          note?: string | null;
          source_id?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['menu_allergens']['Insert']>;
      };
      menus: {
        Row: {
          id: string;
          brand_id: string | null;
          category_id: string | null;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          menu_status: 'active' | 'seasonal' | 'discontinued' | 'unknown';
          source_url: string | null;
          last_checked_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          category_id?: string | null;
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          menu_status?: Database['public']['Tables']['menus']['Row']['menu_status'];
          source_url?: string | null;
          last_checked_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['menus']['Insert']>;
      };
    };
    Views: {
      menu_with_brand: {
        Row: {
          menu_id: string | null;
          menu_name: string | null;
          menu_slug: string | null;
          image_url: string | null;
          category_id: string | null;
          category_slug: string | null;
          category_name: string | null;
          brand_id: string | null;
          brand_name: string | null;
          brand_slug: string | null;
          logo_url: string | null;
          brand_data_status: Database['public']['Tables']['brands']['Row']['data_status'] | null;
          allergen_source_url: string | null;
          origin_source_url: string | null;
          last_checked_at: string | null;
        };
      };
    };
    Functions: Record<string, never>;
  };
}
