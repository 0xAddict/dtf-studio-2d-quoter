// Database types for Supabase
// These types should match your Supabase database schema

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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      models: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_path: string;
          file_size: number;
          format: string;
          vertices: number;
          triangles: number;
          dimensions: Json;
          thumbnail_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          file_path: string;
          file_size: number;
          format: string;
          vertices: number;
          triangles: number;
          dimensions: Json;
          thumbnail_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          file_path?: string;
          thumbnail_url?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      saved_views: {
        Row: {
          id: string;
          model_id: string;
          user_id: string;
          name: string;
          camera_position: Json;
          camera_target: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          user_id: string;
          name: string;
          camera_position: Json;
          camera_target: Json;
          created_at?: string;
        };
        Update: {
          name?: string;
          camera_position?: Json;
          camera_target?: Json;
        };
      };
      quote_request: {
        Row: {
          id: string;
          quote_id: string;
          created_at: string | null;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          customer_company: string | null;
          model_file_name: string;
          model_file_url: string | null;
          material: string;
          quantity: number;
          timeline: string;
          finishing: string;
          scale: number | null;
          message: string | null;
          vertices: number | null;
          triangles: number | null;
          dimensions: Json | null;
          base_cost: number | null;
          material_cost: number | null;
          finishing_cost: number | null;
          quantity_discount: number | null;
          total_cost: number | null;
          status: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          quote_id: string;
          created_at?: string | null;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          customer_company?: string | null;
          model_file_name: string;
          model_file_url?: string | null;
          material: string;
          quantity: number;
          timeline: string;
          finishing: string;
          scale?: number | null;
          message?: string | null;
          vertices?: number | null;
          triangles?: number | null;
          dimensions?: Json | null;
          base_cost?: number | null;
          material_cost?: number | null;
          finishing_cost?: number | null;
          quantity_discount?: number | null;
          total_cost?: number | null;
          status?: string | null;
          admin_notes?: string | null;
        };
        Update: {
          status?: string;
          admin_notes?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          customer_company?: string | null;
          message?: string | null;
          total_cost?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Model = Database['public']['Tables']['models']['Row'];
export type SavedView = Database['public']['Tables']['saved_views']['Row'];
export type QuoteRequest = Database['public']['Tables']['quote_request']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ModelInsert = Database['public']['Tables']['models']['Insert'];
export type SavedViewInsert = Database['public']['Tables']['saved_views']['Insert'];
export type QuoteRequestInsert = Database['public']['Tables']['quote_request']['Insert'];
