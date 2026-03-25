'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async (userId, authUser) => {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log(`Profile not found for user ${userId}. Creating new profile.`);
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.email,
                onboarding_step: 1,
                has_onboarded: false, // ✅ FIX: Track onboarding completion server-side
                bot_style: 'professional', // Default value
                wellness_points: 0, // Default value
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile in Supabase:', createError.message, createError);
              throw createError;
            }
            return newProfile;
          }

          if (error.message?.includes('AbortError')) return null;

          console.error('Supabase query error (Profile):', error.message, error.code, error);
          throw error;
        }

        return profile;
      } catch (err) {
        if (err.name === 'AbortError' || (err instanceof Error && err.message?.includes('abort'))) {
          // Silent return for standard aborts
          return null;
        }
        console.error('Critical failure in fetchProfile:', err instanceof Error ? err.message : JSON.stringify(err), err);
        return null;
      }
    };

    const syncUser = async (authUser) => {
      setLoading(true); // Explicitly lock loading while sync runs
      try {
        if (!authUser) {
          setUser(null);
          setSession(null);
          return;
        }

        const fetchProfilePromise = fetchProfile(authUser.id, authUser);
        // ✅ FIX: Use resolve(null) not reject — a slow Supabase response should
        // degrade gracefully (user stays unauthenticated) instead of throwing
        // 'fetchProfile timeout' which appears as a critical error in the console.
        const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => {
                console.warn('[AuthContext] fetchProfile slow — Supabase taking >8s, retrying on next auth event');
                resolve(null);
            }, 8000)
        );

        const profile = await Promise.race([fetchProfilePromise, timeoutPromise]);
        
        if (!profile) return; // Wait for retry/re-render if profile fetch aborted

        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          phone: authUser.phone,
          onboarding_step: profile?.onboarding_step || 1,
          has_onboarded: profile?.has_onboarded ?? false,
          bot_style: profile?.bot_style || 'professional',
          wellness_points: profile?.wellness_points || 0,
          age: profile?.age,
          job: profile?.job_title,
          reason: profile?.health_reason,
          restrictions: profile?.health_restrictions,
        });
      } catch (err) {
        console.error('Critical failure in syncUser:', err);
      } finally {
        setLoading(false);
      }
    };

    // Use a single listener that handles initial session + changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, activeSession) => {
      // ✅ FIX Issue 4: Clear the timeout as soon as auth responds.
      // Without this, a 3s timeout fires before onAuthStateChange on slow networks,
      // sets loading=false with user=null, and pages redirect logged-in users to login.
      clearTimeout(timeout);

      if (activeSession) {
        setSession(activeSession);
        await syncUser(activeSession.user);
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    // ✅ FIX Issue 4: Increased from 3s → 8s (matches fetchProfile timeout).
    // Only fires if Supabase never responds at all — not as a "fast path".
    const timeout = setTimeout(() => {
      console.warn('[AuthContext] Auth safety timeout — Supabase did not respond in 8s');
      setLoading(false);
    }, 8000);

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, name, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ FIX Issue 3: Redirect to root — page.jsx checks onboarding_step
          // and routes to /onboarding ONLY if user hasn't completed it.
          // Previously hardcoded to /onboarding, causing it to show on every login.
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const updateUser = async (userData) => {
    setUser(userData);
    try {
      // ✅ FIX Issue 3: Persist has_onboarded to DB when onboarding_step reaches 4
      const hasOnboarded = userData.has_onboarded ?? (userData.onboarding_step >= 4);
      await supabase
        .from('users')
        .update({
          bot_style: userData.bot_style,
          onboarding_step: userData.onboarding_step,
          has_onboarded: hasOnboarded,
          age: userData.age,
          job_title: userData.job,
          health_reason: userData.reason,
          health_restrictions: userData.restrictions,
          wellness_points: userData.wellness_points
        })
        .eq('id', userData.id);
    } catch (e) {
      console.error("Failed to sync profile update to DB:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}