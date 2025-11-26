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
          user_id: string | null;
          model_id: string | null;
          quote_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          quantity: number;
          material: string;
          timeline: string | null;
          finishing: string | null;
          scale: number;
          notes: string | null;
          model_data: Json | null;
          // Model file info
          model_file_name: string | null;
          model_file_url: string | null;
          // Model stats
          vertices: number | null;
          triangles: number | null;
          dimensions: Json | null;
          // Pricing breakdown
          base_cost: number | null;
          material_cost: number | null;
          finishing_cost: number | null;
          quantity_discount: number | null;
          total_cost: number | null;
          // Status and notes
          status: string;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          model_id?: string | null;
          quote_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          quantity: number;
          material: string;
          timeline?: string | null;
          finishing?: string | null;
          scale?: number;
          notes?: string | null;
          model_data?: Json | null;
          // Model file info
          model_file_name?: string | null;
          model_file_url?: string | null;
          // Model stats
          vertices?: number | null;
          triangles?: number | null;
          dimensions?: Json | null;
          // Pricing breakdown
          base_cost?: number | null;
          material_cost?: number | null;
          finishing_cost?: number | null;
          quantity_discount?: number | null;
          total_cost?: number | null;
          // Status and notes
          status?: string;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          notes?: string | null;
          admin_notes?: string | null;
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
