import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  SignUpData,
  SignInData,
  AuthUser
} from '../services/supabase/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signingOut: boolean;
  signUp: (data: SignUpData) => Promise<{ data: any; error: any }>;
  signIn: (data: SignInData) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const formatUser = (supabaseUser: User | null | undefined): AuthUser | null => {
    if (!supabaseUser) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'User',
      emailVerified: !!supabaseUser.email_confirmed_at,
    };
  };

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        const { session, error } = await getSession();

        if (error) {
          console.error('❌ Failed to get session:', error.message);
          console.error('   This usually means Supabase is not configured or unreachable.');
          console.error('   Check: Environment variables, Supabase URL, Network connection');
        }

        setSession(session);

        // Populate user immediately from persisted session to avoid UI flicker
        const initialUser = formatUser(session?.user);
        if (initialUser) {
          setUser(initialUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (err: any) {
        console.error('❌ Fatal error initializing auth:', err);
        console.error('   Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack?.split('\n')[0]
        });
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes - this is the source of truth
    const subscription = onAuthStateChange(async (event, session) => {
      console.log('✅ Auth state changed:', event, session?.user?.email);

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        // This is the definitive sign-out event from Supabase
        console.log('🚪 SIGNED_OUT event received - clearing state');
        setUser(null);
        setSession(null);
        setSigningOut(false);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('🔑 User authenticated, fetching user data...');
        setSession(session);

        // Set immediate user to avoid flicker
        const immediateUser = formatUser(session?.user);
        if (immediateUser) {
          setUser(immediateUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          console.log('🔍 Current user result:', currentUser);
          if (currentUser) {
            setUser(currentUser);
          }
        }
        setLoading(false);
      } else {
        // Handle other events (INITIAL_SESSION, etc.)
        setSession(session);

        const immediateUser = formatUser(session?.user);
        if (immediateUser) {
          setUser(immediateUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    // Refresh both session and user data
    const { session: currentSession } = await getSession();
    setSession(currentSession);

    if (currentSession) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('✅ User and session refreshed');
    } else {
      setUser(null);
      console.log('⚠️ No session found during refresh');
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      const result = await signUp(data);
      if (result.error) {
        console.error('❌ Sign up failed:', result.error.message);
        if (result.error.message?.includes('fetch')) {
          console.error('   Network error - check Supabase configuration');
          console.error('   Verify: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify');
        }
      }
      if (result.data && !result.error) {
        console.log('✅ Sign up successful - verification email sent');
        // User created, but email not verified yet
        // Session will be created after email verification
      }
      return result;
    } catch (err: any) {
      console.error('❌ Fatal sign up error:', err.message);
      return { data: null, error: err };
    }
  };

  const handleSignIn = async (data: SignInData) => {
    try {
      const result = await signIn(data);
      if (result.error) {
        console.error('❌ Sign in failed:', result.error.message);
      }
      if (result.data && !result.error) {
        console.log('✅ Sign in successful');
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setSession(result.data.session);
      }
      return result;
    } catch (err: any) {
      console.error('❌ Fatal sign in error:', err.message);
      return { data: null, error: err };
    }
  };

  const handleSignOut = async () => {
    console.log('🔄 Starting sign out...');

    // Immediately clear local state for responsive UI
    // Don't set loading=true - we want the welcome modal to show immediately
    setUser(null);
    setSession(null);

    // Call Supabase signOut - don't clear state yet
    const { error } = await signOut();

      if (error) {
        console.warn('⚠️ Sign out warning:', error.message);
      } else {
        console.log('✅ Signed out successfully from Supabase');
      }
    } ;catch (err: any) {
      console.error('❌ Sign out error:', err.message);
      // Even on error, keep local state cleared
    }
    // No need for finally block - state is already cleared
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signingOut,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
