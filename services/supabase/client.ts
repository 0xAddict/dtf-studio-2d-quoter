import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug: Log configuration status
console.log('🔧 Supabase Configuration:');
console.log('  URL:', supabaseUrl === 'https://your-project.supabase.co' ? '❌ NOT CONFIGURED' : '✅ ' + supabaseUrl);
console.log('  Anon Key:', supabaseAnonKey === 'your-anon-key' ? '❌ NOT CONFIGURED' : '✅ Configured');
console.log('  Ready:', isSupabaseConfigured() ? '✅ Yes' : '❌ No - Please configure .env');

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'hexea-forge',
    },
  },
});

// Helper to check if Supabase is configured
export function isSupabaseConfigured() {
  return (
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
}

/**
 * @deprecated Do not use with Supabase operations - causes deadlocks.
 * Promise.race leaves original promise hanging. Use direct calls instead.
 *
 * Timeout wrapper for async operations
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  operationName: string = 'Operation'
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms. Check network connection and Supabase status.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  MODELS: 'models',
  THUMBNAILS: 'thumbnails',
  ATTACHMENTS: 'attachments',
} as const;

export default supabase;
