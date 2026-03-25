import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevents Next.js from statically caching this route

const STRESS_URL = process.env.STRESS_SERVICE_URL || 'http://127.0.0.1:8000';
const POSTURE_URL = process.env.POSTURE_SERVICE_URL || 'http://127.0.0.1:8001';

// ── Server-side module-level cache ──────────────────────────────────────────
let cachedResult: Record<string, unknown> | null = null;
let cacheUpdatedAt = 0;
let refreshInFlight = false;

const CACHE_TTL_MS = 1200;

// ── Circuit breaker state ───────────────────────────────────────────────────
// ✅ FIX Issue 7: Stop hammering dead Python backends every 1.2s.
// After CIRCUIT_OPEN_THRESHOLD consecutive failures, we stop retrying for 30s.
let consecutiveFailures = 0;
let lastFailureTime = 0;
const CIRCUIT_OPEN_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 30_000;

// ── Upstream fetch (fire-and-forget, never throws) ─────────────────────────
async function safeFetch(url: string): Promise<any | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort('Timeout'), 1100);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        return await res.json();
    } catch (err: any) {
        clearTimeout(timer);
        if (err?.name !== 'AbortError') {
            console.error(`[Analysis API] safeFetch error for ${url}:`, err?.message);
        }
        return null;
    }
}

// ── Build transformed payload from raw backend data ─────────────────────────
function buildPayload(stressData: any, postureData: any): Record<string, unknown> {
    const stressScore: number = stressData?.stress_score ?? 0;
    const isSessionActive: boolean = stressData?.is_active === true;

    const eyebrow = Math.round((stressData?.eyebrow_raise ?? 0) * 100);
    const lipTension = Math.round((stressData?.lip_tension ?? 0) * 100);
    const blink = Math.round((stressData?.blink_rate ?? 0) * 10) / 10;
    const voiceStressRaw: number = stressData?.voice_stress ?? 0;
    const smileValue = Math.max(0, Math.min(100, 100 - lipTension));

    const rawHistory: number[] = Array.isArray(stressData?.stress_history)
        ? (stressData.stress_history as unknown[]).filter((v): v is number => typeof v === 'number')
        : [];

    const rawVoiceHistory: number[] = Array.isArray(stressData?.voice_history)
        ? (stressData.voice_history as unknown[]).filter((v): v is number => typeof v === 'number')
        : [];

    const postureStatusStr: string =
        typeof postureData?.recommendation === 'string'
            ? postureData.recommendation
            : 'Awaiting posture data...';

    return {
        currentState: isSessionActive
            ? String(stressData?.stress_level ?? 'idle').toUpperCase()
            : 'IDLE',
        combinedStress: Math.round(stressScore * 100),
        faceVoiceStressIndex: Math.round(stressScore * 100),
        faceDetection: isSessionActive ? 'Active' : 'Searching',
        dataStream: '1.0 FPS',
        biometricScore: postureData?.posture_score ?? 0,
        biometricStatus: (postureData?.posture_score ?? 0) > 80 ? 'STABLE' : 'MONITORING',
        postureStatus: postureStatusStr,
        // ✅ FIX Issue 7: Expose whether Python backends are reachable
        pythonServicesOnline: stressData !== null || postureData !== null,
        stressHistory: rawHistory.map((v, i) => ({
            time: String(i),
            value: Math.round(v * 100),
        })),
        facialExpressions: [
            { expression: 'Smile', value: smileValue },
            { expression: 'Brow Furrow', value: eyebrow },
            { expression: 'Jaw Tension', value: lipTension },
            { expression: 'Blink Rate', value: blink },
            { expression: 'Voice Stress', value: Math.round(voiceStressRaw * 100) },
        ],
        voiceStress: Math.round(voiceStressRaw * 100),
        isMicActive: !!stressData?.is_mic_active,
        voiceHistory: rawVoiceHistory.map((v, i) => ({
            time: String(i),
            value: Math.round(v * 100),
        })),
        trends: rawHistory.map((_, i) => ({
            time: String(i),
            smile: smileValue,
            brow: eyebrow,
            jaw: lipTension,
            blink,
        })),
        raw: {
            stress: stressData ?? null,
            posture: postureData ?? null,
        },
        timestamp: Date.now(),
    };
}

// ── Background refresh with circuit breaker ────────────────────────────────
function triggerBackgroundRefresh() {
    if (refreshInFlight) return;

    // ✅ FIX Issue 7: Circuit breaker — stop hammering dead endpoints
    const isCircuitOpen =
        consecutiveFailures >= CIRCUIT_OPEN_THRESHOLD &&
        Date.now() - lastFailureTime < CIRCUIT_RESET_MS;

    if (isCircuitOpen) return;
    if (Date.now() - cacheUpdatedAt < CACHE_TTL_MS) return;

    refreshInFlight = true;
    Promise.all([
        safeFetch(`${STRESS_URL}/analyze`),
        safeFetch(`${POSTURE_URL}/latest_posture`),
    ])
        .then(([stressData, postureData]) => {
            if (stressData !== null || postureData !== null) {
                // At least one service responded — reset circuit
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
                lastFailureTime = Date.now();

                if (consecutiveFailures === CIRCUIT_OPEN_THRESHOLD) {
                    console.warn(
                        '[Analysis API] ⚡ Circuit opened — Python backends unreachable.' +
                        ` Pausing retries for ${CIRCUIT_RESET_MS / 1000}s.`
                    );
                }
            }
            cachedResult = buildPayload(stressData, postureData);
            cacheUpdatedAt = Date.now();
        })
        .catch(() => {
            consecutiveFailures++;
            lastFailureTime = Date.now();
        })
        .finally(() => {
            refreshInFlight = false;
        });
}

// ── Default empty payload ──────────────────────────────────────────────────
function emptyPayload(): Record<string, unknown> {
    return buildPayload(null, null);
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
    triggerBackgroundRefresh();
    const payload = cachedResult ?? emptyPayload();

    return NextResponse.json(payload, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
    });
}
