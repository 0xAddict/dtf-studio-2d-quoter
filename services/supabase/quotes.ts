import { supabase } from './client';
import { getCurrentUser } from './auth';

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

export interface Quote extends QuoteData {
  id: string;
  user_id: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';
  admin_notes?: string;
}

// Save quote to database
export async function saveQuote(quoteData: QuoteData) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  if (!user.emailVerified) {
    return { data: null, error: new Error('Email not verified. Please verify your email before submitting quotes.') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert([
      {
        user_id: user.id,
        ...quoteData,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Save quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

// Get all quotes for current user
export async function getUserQuotes() {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get user quotes error:', error);
    return { data: null, error };
  }

  return { data: data as Quote[], error: null };
}

// Get single quote by quote_id
export async function getQuoteByQuoteId(quoteId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_id', quoteId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

// Get single quote by id (UUID)
export async function getQuote(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Get quote error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

// Update quote status (user can cancel their own quotes)
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
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Update quote status error:', error);
    return { data: null, error };
  }

  return { data: data as Quote, error: null };
}

// Get quotes by status
export async function getQuotesByStatus(status: Quote['status']) {
  const user = await getCurrentUser();

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

// Get quote statistics for user
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

// Search quotes by text
export async function searchQuotes(searchTerm: string) {
  const user = await getCurrentUser();

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
