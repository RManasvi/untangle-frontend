'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/auth/LoginPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // ✅ FIX Issue 3: Check has_onboarded flag (server-side DB) as primary gate.
      // Falls back to onboarding_step for backward compatibility with existing users.
      if (user.has_onboarded || user.onboarding_step >= 4) {
        router.push('/chat');
      } else if (user.onboarding_step === 3) {
        router.push('/customize');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? null : <LoginPage />;
}
