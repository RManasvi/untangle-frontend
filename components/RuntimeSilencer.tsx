'use client';

import { useEffect } from 'react';

export default function RuntimeSilencer() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason as any;
      if (
        reason?.name === 'AbortError' ||
        reason?.message?.includes('aborted') ||
        (typeof reason === 'string' && reason.includes('aborted'))
      ) {
        // Suppress harmless Turbopack/Next.js/Supabase HMR AbortErrors from crashing the dev overlay
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null;
}
