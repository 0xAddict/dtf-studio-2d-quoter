import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug: Log configuration status (remove in production)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Configuration:');
  console.log('  URL:', supabaseUrl === 'https://your-project.supabase.co' ? '❌ NOT CONFIGURED' : '✅ ' + supabaseUrl);
  console.log('  Anon Key:', supabaseAnonKey === 'your-anon-key' ? '❌ NOT CONFIGURED' : '✅ Configured');
  console.log('  Ready:', isSupabaseConfigured() ? '✅ Yes' : '❌ No - Please configure .env and restart dev server');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured() {
  return (
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  MODELS: 'models',
  THUMBNAILS: 'thumbnails',
  ATTACHMENTS: 'attachments',
} as const;

export default supabase;
