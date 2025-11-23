import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
// Replace these with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  MODELS: 'models',
  THUMBNAILS: 'thumbnails',
  ATTACHMENTS: 'attachments',
} as const;

export default supabase;
