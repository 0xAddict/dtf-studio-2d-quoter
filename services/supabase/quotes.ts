import { supabase, withTimeout } from './client';
import { getCurrentUser } from './auth';

// Quote interface matching the quotes table schema
export interface Quote {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  model_id: string | null;
  model_file_name: string | null;
  model_file_url: string | null;
  model_data: any;
  material: string;
  quantity: number;
  timeline: string | null;
  finishing: string | null;
  scale: number;
  notes: string | null;
  vertices: number | null;
  triangles: number | null;
  dimensions: any;
  base_cost: number | null;
  material_cost: number | null;
  finishing_cost: number | null;
  quantity_discount: number | null;
  total_cost: number | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';
  admin_notes: string | null;
  quote_request_id: string | null;
}

// Data structure for submitting a new quote
export interface QuoteSubmission {
  quote_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  model_file_name: string;
  model_file_url?: string;
  model_data?: any;
  material: string;
  quantity: number;
  timeline?: string;
  finishing?: string;
  scale?: number;
  notes?: string;
  vertices?: number;
  triangles?: number;
  dimensions?: { x: string; y: string; z: string };
  base_cost?: number;
  material_cost?: number;
  finishing_cost?: number;
  quantity_discount?: number;
  total_cost?: number;
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
 * Inserts into quote_requests table - trigger will auto-copy to quotes table
 */
export async function saveQuote(quoteData: QuoteData) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  if (!user.emailVerified) {
    return { data: null, error: new Error('Email not verified. Please verify your email before submitting quotes.') };
  }

  // Map legacy QuoteData fields to quote_requests columns
  const insertData = {
    user_id: user.id,
    quote_id: quoteData.quote_id,
    name: quoteData.customer_name,
    email: quoteData.customer_email,
    phone: quoteData.customer_phone || null,
    company: quoteData.customer_company || null,
    model_file_name: quoteData.model_file_name,
    model_file_url: quoteData.model_file_url || null,
    material: quoteData.material,
    quantity: quoteData.quantity,
    timeline: quoteData.timeline || null,
    finishing: quoteData.finishing || null,
    scale: quoteData.scale || 100,
    notes: quoteData.message || null,
    vertices: quoteData.vertices || null,
    triangles: quoteData.triangles || null,
    dimensions: quoteData.dimensions || null,
    base_cost: quoteData.base_cost || null,
    material_cost: quoteData.material_cost || null,
    finishing_cost: quoteData.finishing_cost || null,
    quantity_discount: quoteData.quantity_discount || null,
    total_cost: quoteData.total_cost || null,
    status: 'pending',
  };

  // Insert into quote_requests - trigger will copy to quotes table
  const { data, error } = await supabase
    .from('quote_requests')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Save quote error:', error);
    return { data: null, error };
  }

  console.log('✅ Quote saved to quote_requests, trigger will sync to quotes table');
  return { data: data as Quote, error: null };
}

/**
 * Get all quotes for current user
 * Reads from quotes table (user-scoped RLS)
 */
export async function getUserQuotes() {
  console.log('📊 getUserQuotes: Starting...');

  try {
    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ getUserQuotes: No user authenticated');
      return { data: null, error: new Error('User not authenticated') };
    }

    console.log('📊 getUserQuotes: Fetching from quotes table...');

    // Read from quotes table - RLS ensures user only sees their own
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
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
 * Reads from quotes table (user-scoped RLS)
 */
export async function getQuoteByQuoteId(quoteId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_id', quoteId)
    .single();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

/**
 * Get single quote by id (UUID)
 * Reads from quotes table (user-scoped RLS)
 */
export async function getQuote(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

/**
 * Update quote status (user can cancel their own quotes)
 * Updates quotes table (user-scoped RLS)
 */
export async function updateQuoteStatus(quoteId: string, status: Quote['status']) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  // Users can only update to 'cancelled' status
  if (status !== 'cancelled') {
    return { data: null, error: new Error('Users can only cancel quotes') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('quote_id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Update quote status error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

/**
 * Get quotes by status
 * Reads from quotes table (user-scoped RLS)
 */
export async function getQuotesByStatus(status: Quote['status']) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
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
 * Reads from quotes table (user-scoped RLS)
 */
export async function getUserQuoteStats() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      data: null,
      error: new Error('User not authenticated')
    };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('status, total_cost');

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
 * Reads from quotes table (user-scoped RLS)
 */
export async function searchQuotes(searchTerm: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .or(`quote_id.ilike.%${searchTerm}%,model_file_name.ilike.%${searchTerm}%,material.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search quotes error:', error);
    return { data: null, error };
  }

  return { data: data as Quote[], error: null };
}
