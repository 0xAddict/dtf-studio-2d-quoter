import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from './client';
import type { Model, ModelInsert, SavedView, SavedViewInsert, QuoteRequest, QuoteRequestInsert } from './types';

// Auth hooks
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isConfigured: isSupabaseConfigured(),
  };
}

// Models hooks
export function useModels(userId?: string) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) {
      setLoading(false);
      return;
    }

    fetchModels();
  }, [userId]);

  const fetchModels = async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setModels(data || []);
    }
    setLoading(false);
  };

  const uploadModel = async (file: File, metadata: Omit<ModelInsert, 'id' | 'user_id' | 'file_path' | 'created_at' | 'updated_at'>) => {
    if (!userId) return { data: null, error: new Error('User not authenticated') };

    // Upload file to storage
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.MODELS)
      .upload(fileName, file);

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Create database record
    const { data, error } = await supabase
      .from('models')
      .insert({
        user_id: userId,
        file_path: fileName,
        ...metadata,
      })
      .select()
      .single();

    if (!error) {
      setModels(prev => [data, ...prev]);
    }

    return { data, error };
  };

  const deleteModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return { error: new Error('Model not found') };

    // Delete from storage
    await supabase.storage
      .from(STORAGE_BUCKETS.MODELS)
      .remove([model.file_path]);

    // Delete from database
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', modelId);

    if (!error) {
      setModels(prev => prev.filter(m => m.id !== modelId));
    }

    return { error };
  };

  return {
    models,
    loading,
    error,
    uploadModel,
    deleteModel,
    refresh: fetchModels,
  };
}

// Saved views hooks
export function useSavedViews(modelId?: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !modelId) {
      setLoading(false);
      return;
    }

    fetchViews();
  }, [modelId]);

  const fetchViews = async () => {
    if (!modelId) return;

    const { data, error } = await supabase
      .from('saved_views')
      .select('*')
      .eq('model_id', modelId)
      .order('created_at', { ascending: true });

    if (!error) {
      setViews(data || []);
    }
    setLoading(false);
  };

  const saveView = async (view: Omit<SavedViewInsert, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('saved_views')
      .insert(view)
      .select()
      .single();

    if (!error) {
      setViews(prev => [...prev, data]);
    }

    return { data, error };
  };

  const deleteView = async (viewId: string) => {
    const { error } = await supabase
      .from('saved_views')
      .delete()
      .eq('id', viewId);

    if (!error) {
      setViews(prev => prev.filter(v => v.id !== viewId));
    }

    return { error };
  };

  return {
    views,
    loading,
    saveView,
    deleteView,
    refresh: fetchViews,
  };
}

// Quote requests hooks
export function useQuoteRequests() {
  const submitQuote = async (quote: Omit<QuoteRequestInsert, 'id' | 'created_at' | 'status'>) => {
    if (!isSupabaseConfigured()) {
      // Return mock success when not configured
      console.log('Supabase not configured. Mock quote submission:', quote);
      return {
        data: { id: 'mock-' + Date.now(), ...quote, status: 'pending', created_at: new Date().toISOString() },
        error: null
      };
    }

    const { data, error } = await supabase
      .from('quote_request')
      .insert(quote)
      .select()
      .single();

    return { data, error };
  };

  return {
    submitQuote,
  };
}

// Export a combined hook for convenience
export function useSupabase() {
  const auth = useAuth();

  return {
    ...auth,
    isConfigured: isSupabaseConfigured(),
  };
}
