import { supabase, withTimeout } from './client';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

// Sign up new user
export async function signUp({ email, password, name }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name, // Store name in user metadata
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Sign in existing user
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }

  // Force refresh session to get latest user data
  const { data: { session: refreshedSession }, error: refreshError } =
    await supabase.auth.refreshSession();

  if (refreshError) {
    console.warn('⚠️ Could not refresh session:', refreshError.message);
    // Continue anyway with original data
  } else if (refreshedSession) {
    console.log('✅ Session refreshed with latest user data');
    return { data: { ...data, session: refreshedSession }, error: null };
  }

  return { data, error: null };
}

// Sign out with timeout to prevent stalling
export async function signOut() {
  console.log('🔄 Calling Supabase signOut...');

  // First, immediately clear local session for fast UI response
  try {
    console.log('🧹 Clearing local auth session first...');
    const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
    if (localError) {
      console.warn('⚠️ Local sign out warning:', localError.message);
    }
    console.log('✅ Local session cleared');
  } catch (err: any) {
    console.warn('⚠️ Local sign out error:', err.message);
  }

  // Then attempt global sign out with timeout (fire-and-forget style)
  // This invalidates tokens on the server but we don't wait forever for it
  try {
    const globalSignOutPromise = supabase.auth.signOut({ scope: 'global' });
    const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
      setTimeout(() => {
        resolve({ error: new Error('Global sign out timed out (this is OK, local session is cleared)') });
      }, 3000); // 3 second timeout for global sign out
    });

    const result = await Promise.race([globalSignOutPromise, timeoutPromise]);

    if (result.error) {
      console.warn('⚠️ Global sign out:', result.error.message);
    } else {
      console.log('✅ Global sign out completed');
    }
  } catch (err: any) {
    console.warn('⚠️ Global sign out failed (local session already cleared):', err.message);
  }

  // Verify local session is cleared
  try {
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    if (finalSession) {
      console.warn('⚠️ Session still present after sign out, forcing clear...');
      // Force clear by signing out locally again
      await supabase.auth.signOut({ scope: 'local' });
    }
  } catch (err: any) {
    console.warn('⚠️ Session verification error:', err.message);
  }

  console.log('✅ Sign out process completed');
  return { error: null };
}

// Get current user with formatted data
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const emailVerified = !!user.email_confirmed_at;

  console.log('📧 Email verification status:');
  console.log('   Email:', user.email);
  console.log('   email_confirmed_at:', user.email_confirmed_at);
  console.log('   emailVerified:', emailVerified);

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || 'User',
    emailVerified,
  };
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }

  return { session, error: null };
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession();
  return !!session;
}

// Check if user's email is verified
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.emailVerified ?? false;
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Resend verification error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Send password reset email
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  });

  if (error) {
    console.error('Password reset error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Update password (after reset)
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Update password error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
