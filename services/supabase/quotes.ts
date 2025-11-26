import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create isolated client for quotes - bypasses any deadlocked main client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const quotesClient = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Quote interface matching the quote_request table schema
export interface Quote {
  id: string;
  user_id: string; // Required - authenticated users only
  quote_id: string;
  created_at: string;
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
  scale: number;
  message: string | null;
  vertices: number | null;
  triangles: number | null;
  dimensions: any;
  base_cost: number | null;
  material_cost: number | null;
  finishing_cost: number | null;
  quantity_discount: number | null;
  total_cost: number | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled' | 'archived';
  admin_notes: string | null;
}

// Legacy interface for backward compatibility
export interface QuoteData {
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  model_file_name: string;
  model_file_url?: string;
  material: string;
  quantity: number;
  timeline: string;
  finishing: string;
  scale: number;
  vertices: number;
  triangles: number;
  dimensions: { x: string; y: string; z: string };
  base_cost: number;
  material_cost: number;
  finishing_cost: number;
  quantity_discount: number;
  total_cost: number;
  message?: string;
}

/**
 * Save quote to database
 * REQUIRES authentication - userId must be provided by caller
 * Saves to quote_request table (WordPress plugin compatibility)
 */
export async function saveQuote(quoteData: QuoteData, userId: string) {
  console.log('💾 Inside saveQuote, userId:', userId);

  try {
    // User is already authenticated - userId provided by caller
    // REMOVED: getUser() call to prevent auth lock

    if (!userId) {
      console.error('❌ No user ID provided');
      return {
        data: null,
        error: new Error('User ID is required')
      };
    }

    // Prepare insert data
    const insertData = {
      user_id: userId, // Use passed userId instead of calling getUser()
      quote_id: quoteData.quote_id,
      customer_name: quoteData.customer_name,
      customer_email: quoteData.customer_email,
      customer_phone: quoteData.customer_phone || null,
      customer_company: quoteData.customer_company || null,
      model_file_name: quoteData.model_file_name,
      model_file_url: quoteData.model_file_url || null,
      material: quoteData.material,
      quantity: quoteData.quantity,
      timeline: quoteData.timeline,
      finishing: quoteData.finishing,
      scale: quoteData.scale || 100,
      message: quoteData.message || null,
      vertices: quoteData.vertices || null,
      triangles: quoteData.triangles || null,
      dimensions: quoteData.dimensions || null,
      base_cost: quoteData.base_cost || null,
      material_cost: quoteData.material_cost || null,
      finishing_cost: quoteData.finishing_cost || null,
      quantity_discount: quoteData.quantity_discount || null,
      total_cost: quoteData.total_cost || null,
      status: 'pending' as const,
    };

    console.log('💾 Inserting into quote_request...', { quote_id: insertData.quote_id, user_id: insertData.user_id });

    // Insert into quote_request table
    const { data, error } = await quotesClient
      .from('quote_request')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return { data: null, error };
    }

    console.log('✅ Quote saved:', data.quote_id);
    return { data: data as Quote, error: null };
  } catch (err: any) {
    console.error('❌ Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all quotes for current user from quote_request table
 * Requires authentication
 */
export async function getUserQuotes() {
  console.log('📊 getUserQuotes: Starting...');

  try {
    // Get current user
    const { data: { user } } = await quotesClient.auth.getUser();

    if (!user) {
      console.log('❌ getUserQuotes: No user authenticated');
      return { data: [], error: null }; // Return empty array instead of error
    }

    console.log('📊 getUserQuotes: Fetching quotes for user:', user.id);

    // Fetch quotes from quote_request table for this user
    const { data, error } = await quotesClient
      .from('quote_request')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get user quotes error:', error);
      return { data: null, error };
    }

    console.log('✅ getUserQuotes: Success, got', data?.length || 0, 'quotes');
    return { data: data as Quote[], error: null };
  } catch (err: any) {
    console.error('❌ getUserQuotes error:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Get single quote by quote_id
 */
export async function getQuoteByQuoteId(quoteId: string) {
  const { data, error } = await quotesClient
    .from('quote_request')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote | null, error: null };
}

/**
 * Get single quote by id (UUID)
 */
export async function getQuote(id: string) {
  const { data, error } = await quotesClient
    .from('quote_request')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote | null, error: null };
}

/**
 * Update quote status (user can cancel or archive their own quotes)
 */
export async function updateQuoteStatus(quoteId: string, status: Quote['status']) {
  const { data: { user } } = await quotesClient.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // Users can only update to 'cancelled' or 'archived' status
  if (status !== 'cancelled' && status !== 'archived') {
    return { data: null, error: new Error('Users can only cancel or archive quotes') };
  }

  const { data, error } = await quotesClient
    .from('quote_request')
    .update({ status })
    .eq('quote_id', quoteId)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Update quote status error:', error);
    return { data: null, error };
  }

  return { data: data as Quote | null, error: null };
}

/**
 * Delete quote permanently (only for cancelled quotes)
 */
export async function deleteQuote(quoteId: string) {
  const { data: { user } } = await quotesClient.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // First check if quote is cancelled
  const { data: quote, error: fetchError } = await quotesClient
    .from('quote_request')
    .select('status')
    .eq('quote_id', quoteId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Fetch quote error:', fetchError);
    return { data: null, error: fetchError };
  }

  if (!quote) {
    return { data: null, error: new Error('Quote not found') };
  }

  if (quote.status !== 'cancelled') {
    return { data: null, error: new Error('Only cancelled quotes can be deleted') };
  }

  const { error } = await quotesClient
    .from('quote_request')
    .delete()
    .eq('quote_id', quoteId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete quote error:', error);
    return { data: null, error };
  }

  return { data: true, error: null };
}

/**
 * Get quotes by status
 */
export async function getQuotesByStatus(status: Quote['status']) {
  const { data: { user } } = await quotesClient.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await quotesClient
    .from('quote_request')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get quotes by status error:', error);
    return { data: null, error };
  }

  return { data: data as Quote[], error: null };
}

/**
 * Get quote statistics for user
 */
export async function getUserQuoteStats() {
  const { data: { user } } = await quotesClient.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error('User not authenticated')
    };
  }

  const { data, error } = await quotesClient
    .from('quote_request')
    .select('status, total_cost')
    .eq('user_id', user.id);

  if (error) {
    console.error('Get quote stats error:', error);
    return { data: null, error };
  }

  const quotes = data as Quote[];

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    reviewed: quotes.filter(q => q.status === 'reviewed').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    cancelled: quotes.filter(q => q.status === 'cancelled').length,
    totalValue: quotes.reduce((sum, q) => sum + (Number(q.total_cost) || 0), 0),
  };

  return { data: stats, error: null };
}

/**
 * Search quotes by text
 */
export async function searchQuotes(searchTerm: string) {
  const { data: { user } } = await quotesClient.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await quotesClient
    .from('quote_request')
    .select('*')
    .eq('user_id', user.id)
    .or(`quote_id.ilike.%${searchTerm}%,model_file_name.ilike.%${searchTerm}%,material.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search quotes error:', error);
    return { data: null, error };
  }

  return { data: data as Quote[], error: null };
}

/**
 * Update quote attachment URL after file upload
 * Used when attachment is uploaded after initial quote submission
 */
export async function updateQuoteAttachment(quoteId: string, fileUrl: string, userId: string) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }

  console.log('📎 Updating quote attachment:', { quoteId, fileUrl, userId });

  const { data, error } = await quotesClient
    .from('quote_request')
    .update({ model_file_url: fileUrl })
    .eq('quote_id', quoteId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Update quote attachment error:', error);
    return { data: null, error };
  }

  console.log('✅ Quote attachment updated successfully');
  return { data: data as Quote | null, error: null };
}
