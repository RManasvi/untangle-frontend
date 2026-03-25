"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Activity, CheckCircle, User, Zap, Brain, Shield, Mic, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import BrandLogo from "@/components/BrandLogo"

interface AnalysisData {
    currentState: string
    combinedStress: number
    faceVoiceStressIndex: number
    faceDetection: string
    dataStream: string
    biometricScore: number
    biometricStatus: string
    postureStatus: string
    stressHistory: { time: string; value: number }[]
    facialExpressions: { expression: string; value: number }[]
    trends: { time: string; smile: number; brow: number; jaw: number; blink: number }[]
    voiceStress: number
    isMicActive: boolean
    voiceHistory: { time: string; value: number }[]
    raw?: {
        stress?: {
            landmarks?: number[][]
            eyebrow_raise: number
            lip_tension: number
            head_nod_intensity: number
            symmetry_delta: number
            blink_rate: number
        }
    }
}

const DEFAULT_DATA: AnalysisData = {
    currentState: "INITIALIZING",
    combinedStress: 0,
    faceVoiceStressIndex: 0,
    faceDetection: "Inactive",
    dataStream: "0.0 FPS",
    biometricScore: 0,
    biometricStatus: "Offline",
    postureStatus: "Awaiting biometric stream...",
    stressHistory: [],
    facialExpressions: [],
    trends: [],
    voiceStress: 0,
    isMicActive: false,
    voiceHistory: []
};

const fetcher = async (url: string) => {
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return DEFAULT_DATA;
        return await res.json();
    } catch (err: any) {
        // Log non-abort errors for debugging, but always return default data to prevent UI crashes
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
            console.warn('[Report] fetcher error:', err?.message);
        }
        return DEFAULT_DATA;
    }
}

export default function AnalysisReportPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const consecutiveHighStressCount = useRef(0);
    const [hasRedirected, setHasRedirected] = useState(false);

    const { data, isLoading, error: swrError } = useSWR<AnalysisData>('/api/analysis', fetcher, {
        refreshInterval: 1200,       
        fallbackData: DEFAULT_DATA,
        shouldRetryOnError: false,
        keepPreviousData: true,      
        revalidateOnFocus: false,    
        revalidateOnReconnect: false,
        dedupingInterval: 1000,
        errorRetryCount: 0,
    })

    // Redirect logic for high stress
    useEffect(() => {
        if (!data || hasRedirected) return;

        const percentage = data.combinedStress;
        console.log(`[Report] Current Stress: ${percentage}%. Consecutive High: ${consecutiveHighStressCount.current}`);

        if (percentage >= 50) {
            consecutiveHighStressCount.current += 1;
        } else {
            consecutiveHighStressCount.current = 0;
        }

        if (consecutiveHighStressCount.current >= 5) {
            console.log("[Report] High stress threshold met. Triggering redirect and shutdown.");
            setHasRedirected(true);

            // Signal any active analyzer tabs to stop their camera and redirect
            try {
                const bc = new BroadcastChannel('stress_channel');
                bc.postMessage({ action: 'stop-camera', redirect: true });
                console.log("[Report] Broadcast stop-camera sent.");
                bc.close();
            } catch (e) {
                console.error("Failed to broadcast stop-camera", e);
            }

            // Store data for chat context
            localStorage.setItem(
                "stress_detected",
                JSON.stringify({
                    score: percentage,
                    emotion: data.currentState,
                    timestamp: Date.now()
                })
            );

            // Use router.push for smoother transition, or window.location.href for hard reset
            // If the user preferred window.location.href, we should at least wrap it in a microtask
            // to allow current execution to finish without aborting fetches immediately.
            console.log("[Report] Redirecting to /chat...");
            setTimeout(() => {
                window.location.href = "/chat";
            }, 100);
        }
    }, [data, hasRedirected]);

    // Draw Landmarks
    useEffect(() => {
        if (!canvasRef.current || !data?.raw?.stress?.landmarks) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const landmarks = data.raw.stress.landmarks;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections or just points
        ctx.fillStyle = '#14b8a6';
        ctx.strokeStyle = '#14b8a644';
        ctx.lineWidth = 0.5;

        landmarks.forEach(([x, y]: number[]) => {
            const px = x * canvas.width;
            const py = y * canvas.height;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Simple mesh effect
        for (let i = 0; i < landmarks.length; i += 10) {
            ctx.beginPath();
            ctx.moveTo(landmarks[i][0] * canvas.width, landmarks[i][1] * canvas.height);
            if (landmarks[i + 1]) {
                ctx.lineTo(landmarks[i + 1][0] * canvas.width, landmarks[i + 1][1] * canvas.height);
            }
            ctx.stroke();
        }
    }, [data]);

    const [isStale, setIsStale] = useState(false);

    useEffect(() => {
        if (!data) return;
        // (data as any).timestamp is set server-side in Date.now() ms
        const ts = typeof (data as any).timestamp === 'number' ? (data as any).timestamp : 0;
        const diff = Date.now() - ts;
        setIsStale(diff > 5000);
    }, [data]);

    const analysisData = data || DEFAULT_DATA;
    if (loading) {
        return (
            <div className="min-h-screen bg-[#06080c] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }
    if (!user) {
        return (
            <div className="min-h-screen bg-[#06080c] flex items-center justify-center text-white">
                Redirecting to login...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06080c] text-white flex flex-col font-sans selection:bg-teal-500/30 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#0d1419]/30 backdrop-blur-2xl sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10 p-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <BrandLogo className="h-7" textColor="text-white" />
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    {isStale && (
                        <div className="flex items-center gap-2 bg-rose-500/20 px-3 py-1.5 rounded-full border border-rose-500/30 animate-pulse">
                            <AlertCircle className="h-3 w-3 text-rose-500" />
                            <span className="text-[8px] font-black text-rose-500 tracking-widest uppercase">Throttled: Keep Analyzer Window Active</span>
                        </div>
                    )}
                    <StatusIndicator label="CORE: ONLINE" active={true} color="green" />
                    <StatusIndicator label="BIO: ACTIVE" active={analysisData.faceDetection === "Active"} color="teal" />
                    <StatusIndicator label="SECURE: AES-256" active={true} color="yellow" />
                </div>
            </header>

            <main className="px-6 py-4 flex-1 h-[calc(100vh-140px)] overflow-hidden">
                <div className="max-w-7xl mx-auto h-full grid gap-4 lg:grid-cols-12 auto-rows-min">

                    {/* Left: Monitoring & Graph (Lg: 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 max-h-full">
                        <Card className="border-white/5 bg-white/5 shadow-xl relative overflow-hidden group border-t-teal-500/20 flex-shrink-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-teal-400" />
                                        <span className="text-[9px] font-black text-teal-400 tracking-[0.2em] uppercase">Neural Graph</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping" />
                                        <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                                <div className="aspect-square max-h-[220px] bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center mx-auto">
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={400}
                                        className="w-full h-full object-contain opacity-80"
                                    />
                                    {(!data?.raw?.stress?.landmarks) && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-20">
                                            <Brain className="h-8 w-8 text-teal-400 animate-pulse" />
                                            <span className="text-[8px] font-bold tracking-[0.2em] uppercase">Searching...</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-white/5 shadow-xl flex-1 min-h-0">
                            <CardContent className="p-4 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="h-3 w-3 text-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-400 tracking-[0.2em] uppercase">Temporal Trend</span>
                                </div>
                                <div className="flex-1 w-full min-h-[100px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analysisData.stressHistory}>
                                            <defs>
                                                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#818cf8"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#stressGradient)"
                                                animationDuration={500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Center: Core Metrics (Lg: 4) */}
                    <div className="lg:col-span-4 h-full flex flex-col">
                        <Card className="border-white/5 bg-white/5 shadow-2xl relative overflow-hidden flex-1 flex flex-col items-center justify-center">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
                            <CardContent className="p-4 w-full flex flex-col items-center justify-center h-full">
                                <span className="text-[9px] font-black text-gray-500 tracking-[0.4em] uppercase mb-4 block text-center">Biometric Processor</span>

                                <div className="relative inline-flex items-center justify-center flex-1">
                                    <svg className="w-56 h-56 -rotate-90 transform" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="46"
                                            fill="none"
                                            stroke="#14b8a6"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={`${analysisData.combinedStress * 2.89} 289`}
                                            className="transition-all duration-1000 ease-in-out shadow-[0_0_20px_#14b8a6]"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[8px] font-black text-gray-500 tracking-[0.3em] uppercase mb-1">SYSTEM.STATE</span>
                                        <span className={`text-2xl font-black tracking-tighter ${analysisData.currentState === 'PEAK' ? 'text-rose-500' : 'text-teal-400'}`}>
                                            {analysisData.currentState}
                                        </span>
                                        <div className="h-[1px] w-8 bg-white/10 my-2" />
                                        <span className="text-5xl font-black text-white font-mono tracking-tighter">
                                            {analysisData.combinedStress}<span className="text-lg text-gray-600">%</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 w-full px-6 py-4 border-t border-white/5 flex-shrink-0">
                                    <div className="text-left">
                                        <span className="text-[7px] font-black text-gray-500 tracking-[0.2em] uppercase block mb-1 text-center">Combined Stress</span>
                                        <span className="text-2xl font-black font-mono text-white text-center block whitespace-nowrap">{analysisData.faceVoiceStressIndex}%</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[7px] font-black text-gray-500 tracking-[0.2em] uppercase block mb-1 text-center font-mono">Real-time Rank</span>
                                        <span className={`text-xs font-black px-2 py-1 rounded inline-block w-full text-center tracking-widest ${analysisData.combinedStress < 30 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {analysisData.combinedStress < 30 ? 'OPTIMAL' : 'CRITICAL'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Detailed Biometrics (Lg: 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                        <Card className="border-white/5 bg-white/5 shadow-xl flex-1 min-h-0">
                            <CardContent className="p-4 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="h-3 w-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 tracking-[0.2em] uppercase">Neural Micro-expressions</span>
                                </div>
                                <div className="flex-1 w-full min-h-[140px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analysisData.trends || []}>
                                            <defs>
                                                <linearGradient id="smileGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="browGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="smile" stroke="#10b981" strokeWidth={2} fill="url(#smileGrad)" />
                                            <Area type="monotone" dataKey="brow" stroke="#3b82f6" strokeWidth={2} fill="url(#browGrad)" />
                                            <Area type="monotone" dataKey="jaw" stroke="#f59e0b" strokeWidth={1} fill="transparent" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 flex-shrink-0">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">SMILE / BROW</span>
                                        <span className="text-[10px] font-bold text-white font-mono uppercase tracking-tighter">
                                            {analysisData.facialExpressions[0]?.value || 0}% / {analysisData.facialExpressions[1]?.value || 0}%
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">JAW / BLINK</span>
                                        <span className="text-[10px] font-bold text-white font-mono uppercase tracking-tighter">
                                            {analysisData.facialExpressions[2]?.value || 0}% / {analysisData.facialExpressions[3]?.value || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/5 bg-white/5 shadow-xl relative overflow-hidden group flex-shrink-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-emerald-400" />
                                        <span className="text-[9px] font-black text-emerald-400 tracking-[0.2em] uppercase">Skeletal Integrity</span>
                                    </div>
                                    <div className="px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                        <span className="text-[9px] font-mono font-black text-emerald-400">{analysisData.biometricScore}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-start gap-3 mb-4">
                                    <div className={`p-1.5 rounded-lg ${analysisData.biometricScore > 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 leading-tight font-mono uppercase">
                                        {(analysisData.postureStatus ?? '').length > 60
                                            ? (analysisData.postureStatus ?? '').substring(0, 60) + '...'
                                            : (analysisData.postureStatus ?? 'Awaiting posture data...')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <StatusBlock label="Alignment" active={analysisData.biometricScore >= 80} />
                                    <StatusBlock label="Thermal" active={true} />
                                    <StatusBlock label="Secure" active={true} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Full Width: Voice Analysis (Lg: 12) */}
                    <div className="lg:col-span-12 h-min">
                        <Card className="border-white/5 bg-white/5 shadow-2xl overflow-hidden group border-t-violet-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Mic className="h-3 w-3 text-violet-400" />
                                        <span className="text-[9px] font-black text-violet-400 tracking-[0.2em] uppercase">Acoustic Signal Analysis</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {analysisData.isMicActive && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[7px] font-black text-gray-500 uppercase">Live Index</span>
                                                <span className="text-xs font-mono font-bold text-violet-400">{analysisData.voiceStress}%</span>
                                            </div>
                                        )}
                                        <StatusIndicator label={analysisData.isMicActive ? "MIC ACCESS: ON" : "MIC ACCESS: OFF"} active={analysisData.isMicActive} color="purple" />
                                    </div>
                                </div>

                                {analysisData.isMicActive ? (
                                    <div className="flex items-center gap-6 h-16">
                                        <div className="flex-1 h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analysisData.voiceHistory}>
                                                    <Area
                                                        type="stepAfter"
                                                        dataKey="value"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={1.5}
                                                        fill="#8b5cf6"
                                                        fillOpacity={0.1}
                                                        animationDuration={300}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex gap-4 text-[7px] font-black text-gray-600 uppercase tracking-widest border-l border-white/5 pl-6">
                                            <div className="flex flex-col gap-1">
                                                <span>Acquisition: Stable</span>
                                                <span>Jitter: &lt; 0.4ms</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span>Tension: {analysisData.voiceStress > 60 ? 'High' : 'Low'}</span>
                                                <span>Frequency: Unified</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-16 flex items-center justify-center gap-4 bg-black/20 rounded-xl border border-white/5 border-dashed border-violet-500/20">
                                        <Mic className="h-4 w-4 text-gray-700 animate-pulse" />
                                        <span className="text-[8px] font-black text-gray-600 tracking-[0.2em] uppercase">Hardware Inactive - Enable microphone in primary control terminal</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6 px-12 flex items-center justify-between bg-black/40">
                <span className="text-[9px] font-bold text-gray-600 tracking-[0.4em] uppercase">
                    AI-CORE.V2.4 • LATENCY: 12ms • PURE_LOGIC_ENABLED
                </span>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Backend Stream: Connected</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
    const colorMap: any = {
        teal: "bg-teal-400",
        amber: "bg-amber-400",
        indigo: "bg-indigo-400",
        emerald: "bg-emerald-400",
    }
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-[9px] font-mono font-bold text-white/60">{value}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorMap[color]} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    )
}

function StatusBlock({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {active ? <CheckCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            </div>
            <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase">{label}</span>
        </div>
    )
}

function StatusIndicator({ label, active, color }: { label: string; active: boolean; color: string }) {
    const colorClasses = {
        teal: "bg-teal-400",
        yellow: "bg-yellow-400",
        green: "bg-emerald-400",
        purple: "bg-violet-400",
    }

    return (
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span className={`h-1 w-1 rounded-full ${active ? colorClasses[color as keyof typeof colorClasses] : 'bg-gray-600'} ${active && 'animate-pulse shadow-[0_0_6px_currentColor]'}`} />
            <span className="text-[8px] font-black text-white/50 tracking-widest uppercase">{label}</span>
        </div>
    )
}

function PostureIndicator({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="group flex flex-col items-center gap-3 p-3 rounded-xl bg-black/20 border border-transparent hover:border-amber-500/20 transition-all cursor-default">
            <div className="w-10 h-10 rounded-lg bg-[#1a2634] flex items-center justify-center text-gray-500 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                {icon}
            </div>
            <span className="text-[9px] font-black text-gray-500 tracking-[0.1em] uppercase group-hover:text-gray-300 transition-colors">{label}</span>
        </div>
    )
}
