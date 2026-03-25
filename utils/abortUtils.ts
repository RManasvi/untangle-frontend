'use client';

/**
 * Centralised AbortError detector.
 * Handles: DOMException AbortError, Supabase abort signals,
 *           Turbopack HMR cancels, and manual 'Component Unmount' reasons.
 * Import this everywhere instead of duplicating inline checks.
 */
export const isAbortError = (err: unknown): boolean => {
    if (!err) return false;

    // String reason (e.g. controller.abort('Component Unmount'))
    if (typeof err === 'string') {
        return (
            err === 'Component Unmount' ||
            err.toLowerCase().includes('abort')
        );
    }

    const e = err as any;

    // Standard DOMException
    if (e?.name === 'AbortError') return true;

    // Message-based detection
    const msg: string = e?.message ?? '';
    if (
        msg.includes('aborted') ||
        msg.includes('abort') ||
        msg.includes('signal is aborted') ||
        msg.includes('signal was aborted') ||
        msg.includes('Component Unmount')
    ) {
        return true;
    }

    // Rejection reason (unhandledrejection event)
    const reason = e?.reason ?? '';
    if (
        reason === 'Component Unmount' ||
        (typeof reason === 'string' && reason.toLowerCase().includes('abort'))
    ) {
        return true;
    }

    return false;
};
