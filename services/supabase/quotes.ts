import { supabase } from './client';

// Quote interface matching the simplified quotes table schema
export interface Quote {
  id: string;
  user_id: string | null;
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
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';
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
 * Save quote to database - SIMPLIFIED
 * No auth required - anyone can submit
 * If user is logged in, we'll store their user_id for "My Quotes" view
 */
export async function saveQuote(quoteData: QuoteData) {
  try {
    // Get current user (if logged in)
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare insert data
    const insertData = {
      user_id: user?.id || null, // Optional - null for anonymous
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

    console.log('💾 Saving quote to database...', { quote_id: insertData.quote_id, user_id: insertData.user_id });

    // Insert directly into quotes table
    const { data, error } = await supabase
      .from('quotes')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Save quote error:', error);
      return { data: null, error };
    }

    console.log('✅ Quote saved successfully:', data.quote_id);
    return { data: data as Quote, error: null };
  } catch (err: any) {
    console.error('❌ Exception saving quote:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all quotes for current user
 * Works for both authenticated and anonymous users
 */
export async function getUserQuotes() {
  console.log('📊 getUserQuotes: Starting...');

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ getUserQuotes: No user authenticated');
      return { data: [], error: null }; // Return empty array instead of error
    }

    console.log('📊 getUserQuotes: Fetching quotes for user:', user.id);

    // Fetch quotes for this user
    const { data, error } = await supabase
      .from('quotes')
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
 */
export async function getQuote(id: string) {
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
 */
export async function updateQuoteStatus(quoteId: string, status: Quote['status']) {
  const { data: { user } } = await supabase.auth.getUser();

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
    .eq('user_id', user.id)
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
 */
export async function getQuotesByStatus(status: Quote['status']) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: new Error('User not authenticated')
    };
  }

  const { data, error } = await supabase
    .from('quotes')
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
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
