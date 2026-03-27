"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Camera,
  CameraOff,
  Activity,
  AlertCircle,
  Brain,
  CheckCircle2,
  Clock,
  Zap,
  Mic,
  MicOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

// ✅ Stability Fix: Ignore Turbopack HMR aborts — not a real error
const isAbortError = (err: any) =>
  err === 'Component Unmount' ||
  err?.name === 'AbortError' ||
  err?.message?.includes('aborted') ||
  err?.message?.includes('signal is aborted') ||
  err?.message?.includes('Component Unmount') ||
  err?.reason?.includes?.('Component Unmount') ||
  err?.reason === 'Component Unmount';

const BACKEND_URL = "/api/v1/stress";
const POSTURE_URL = "/api/v1/posture";

export default function StressAnalysisPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"Online" | "Offline">("Offline");
  const [postureStatus, setPostureStatus] = useState<"Online" | "Offline">("Offline");

  // Real-time analysis data
  const [analysis, setAnalysis] = useState<{
    emotion: string;
    stress_score: number;
    timestamp: number;
  } | null>(null);

  const consecutiveHighStressCount = useRef(0);

  // Voice stress analysis state
  const [voiceStress, setVoiceStress] = useState<number>(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Persistence Refs
  const sessionScores = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const voiceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for background analysis interval
  const isMicActiveRef = useRef(isMicActive);
  const voiceStressRef = useRef(voiceStress);
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);
  useEffect(() => { voiceStressRef.current = voiceStress; }, [voiceStress]);

  // Move all hooks to the top (before conditional returns)
  
  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`);
        setBackendStatus(res.ok ? "Online" : "Offline");
      } catch (err: any) {
        if (isAbortError(err)) return; // ✅ ignore HMR abort
        setBackendStatus("Offline");
      }
      try {
        const res = await fetch(`${POSTURE_URL}/health`);
        setPostureStatus(res.ok ? "Online" : "Offline");
      } catch (err: any) {
        if (isAbortError(err)) return; // ✅ ignore HMR abort
        setPostureStatus("Offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Frame capture and analysis loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const controller = new AbortController();

    if (isAnalyzing && backendStatus === "Online") {
      interval = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          // Capture frame
          canvas.width = 640;
          canvas.height = 480;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64Image = canvas.toDataURL("image/jpeg", 0.7);

          try {
            const response = await fetch(`${BACKEND_URL}/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                image: base64Image,
                voice_stress: voiceStressRef.current,
                is_mic_active: isMicActiveRef.current
              }),
            });

            if (!response.ok) throw new Error("Backend error");

            const data = await response.json();

            if (data.error) {
              setAnalysis(prev => prev ? { ...prev, emotion: "No Face Detected" } : null);
            } else {
              const score = data.stress_score ?? 0;
              const emotionLabel = data.emotion || data.stress_label || "Analyzing...";

              setAnalysis({
                emotion: emotionLabel,
                stress_score: score,
                timestamp: Date.now()
              });

              // Track score for session summary
              sessionScores.current.push(score);

              // Broadcast to other windows
              try {
                const bc = new BroadcastChannel('stress_channel');
                bc.postMessage({ stress_score: score, emotion: emotionLabel });
                bc.close();
              } catch (e) {
                console.error("Broadcast failed", e);
              }

              // NEW: Send to Posture Backend in background (Reliable conversion)
              if (postureStatus === "Online") {
                const byteString = atob(base64Image.split(',')[1]);
                const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });

                const formData = new FormData();
                formData.append('image', blob, 'frame.jpg');
                fetch(`${POSTURE_URL}/analyze_posture`, {
                  method: 'POST',
                  signal: controller.signal,
                  body: formData
                }).catch(err => {
                   if (isAbortError(err)) return;
                   console.error("Posture update failed:", err);
                });
              }
            }
          } catch (err: any) {
            if (isAbortError(err)) return; // ✅ ignore Turbopack HMR abort
            console.error("Analysis failed:", err?.message || err);
            setBackendStatus("Offline");
          }
        }
      }, 1000); // 1 second interval
    }

    return () => {
      if (interval) clearInterval(interval);
      controller.abort('Component Unmount');
    };
  }, [isAnalyzing, backendStatus, postureStatus]);

  // Listen for remote stop commands (e.g. from the report page)
  useEffect(() => {
    const bc = new BroadcastChannel('stress_channel');
    bc.onmessage = (event) => {
      if (event.data.action === 'stop-camera') {
        console.log("Remote stop-camera command received.");
        stopCamera();
        if (event.data.redirect) {
          window.location.href = "/chat";
        }
      }
    };
    return () => bc.close();
  }, [isAnalyzing, stream]);

  // Ensure camera and mic are stopped when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopMic();
    };
  }, [stream]);

  // Stress Threshold Check
  useEffect(() => {
    if (!analysis || hasRedirected || !isAnalyzing) return; // ✅ Only redirect if ACTIVELY analyzing

    const percentage = analysis.stress_score * 100;

    if (percentage >= 50) {
      consecutiveHighStressCount.current += 1;
    } else {
      consecutiveHighStressCount.current = 0;
    }

    if (consecutiveHighStressCount.current >= 5) {
      setHasRedirected(true);

      // ✅ Set localStorage FIRST before anything else
      localStorage.setItem("stress_detected", JSON.stringify({
        score: percentage,
        emotion: analysis.emotion,
        timestamp: Date.now()
      }));

      // ✅ Stop camera in background, don't await — navigate immediately
      stopCamera();

      // ✅ Small delay ensures auth context is stable before chat page loads
      setTimeout(() => {
        window.location.href = "/chat";
      }, 300);
    }
  }, [analysis, hasRedirected, isAnalyzing]);

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

  // Voice Analysis
  const startMic = async () => {
    try {
      setMicError(null);
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = micStream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      voiceIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // RMS volume
        const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length) / 128;

        // HF ratio
        const midBand = dataArray.slice(Math.floor(dataArray.length * 0.3), Math.floor(dataArray.length * 0.7));
        const highBand = dataArray.slice(Math.floor(dataArray.length * 0.7));
        const midAvg = midBand.reduce((s, v) => s + v, 0) / (midBand.length || 1);
        const highAvg = highBand.reduce((s, v) => s + v, 0) / (highBand.length || 1);
        const freqRatio = Math.min((highAvg / (midAvg + 1)) * 1.5, 1);

        const voiceScore = Math.min(rms * 0.7 + freqRatio * 0.3, 1);
        setVoiceStress(voiceScore);
      }, 500);

      setIsMicActive(true);
    } catch (err: any) {
      if (isAbortError(err)) return;
      setMicError("Microphone access denied. Voice analysis disabled.");
      console.error(err);
    }
  };

  function stopMic() {
    if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    setIsMicActive(false);
    setVoiceStress(0);
  };

  const startCamera = async () => {
    try {
      setError(null);
      setHasRedirected(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setIsAnalyzing(true);
      consecutiveHighStressCount.current = 0;

      // Auto start mic
      await startMic();
    } catch (err: any) {
      if (isAbortError(err)) return;
      setError("Camera permission denied or not found.");
      console.error(err);
    }
  };

  async function stopCamera() {
    // Calculate and Save Session Stats before stopping
    if (isAnalyzing && user && sessionScores.current.length > 0) {
      const avgScore = sessionScores.current.reduce((a, b) => a + b, 0) / sessionScores.current.length;

      try {
        // 1. Log to stress_logs
        await supabase.from('stress_logs').insert({
          user_id: user.id,
          stress_score: avgScore,
          created_at: new Date().toISOString()
        });

        // 2. Award points (Gamification)
        const { data: userData } = await supabase
          .from('users')
          .select('wellness_points')
          .eq('id', user.id)
          .single();

        const currentPoints = userData?.wellness_points || 0;
        await supabase
          .from('users')
          .update({ wellness_points: currentPoints + 15 })
          .eq('id', user.id);

      } catch (err: any) {
        if (isAbortError(err)) return;
        console.error("Failed to persist stress session:", err);
      }
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsAnalyzing(false);
    setAnalysis(null);
    sessionScores.current = []; // Reset for next session
    stopMic();
  };

  // Final helper methods continue...

  const getStressColor = (score: number) => {
    if (score < 0.3) return "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]";
    if (score < 0.6) return "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
    return "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]";
  };

  const getTextColor = (score: number) => {
    if (score < 0.3) return "text-emerald-400";
    if (score < 0.6) return "text-amber-400";
    return "text-rose-400";
  };
  // End of logic section


  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0c] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
                <Brain className="w-10 h-10 text-indigo-500" />
                AI Stress Analyzer
              </h1>
              <p className="text-slate-500 text-lg font-medium">Professional micro-expression biometric analysis</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${backendStatus === "Online"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                <div className={`w-2 h-2 rounded-full ${backendStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  Stress: {backendStatus}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${postureStatus === "Online"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                <div className={`w-2 h-2 rounded-full ${postureStatus === "Online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  Posture: {postureStatus}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/stress/report', '_blank')}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs h-9 transition-colors"
              >
                Live Analysis Report
              </Button>
            </div>
          </header>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {backendStatus === "Offline" && (
            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5" />
              <AlertDescription className="font-medium">
                Backend is unreachable. The stress analysis server may be starting up — please wait a moment and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">

            {/* Left: Camera Feed */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-slate-900/40 border-slate-800 overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />

                <CardContent className="p-0 relative aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isAnalyzing ? 'opacity-100' : 'opacity-20 blur-sm'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {!isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                      <div className="p-6 rounded-full bg-slate-800/50 border border-slate-700">
                        <Camera className="w-12 h-12 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">Camera Feed Inactive</p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Monitoring</span>
                    </div>
                  )}
                </CardContent>

                <div className="p-6 bg-slate-900/60 border-t border-slate-800 backdrop-blur-sm">
                  {!isAnalyzing ? (
                    <Button
                      onClick={startCamera}
                      disabled={backendStatus === "Offline"}
                      className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Camera className="mr-3 h-6 w-6" />
                      Initialize AI Scan
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="w-full h-14 text-lg font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <CameraOff className="mr-3 h-6 w-6" />
                      Terminate Session
                    </Button>
                  )}
                </div>
              </Card>

              {/* Resolution & Voice Stress Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isMicActive ? "bg-purple-500/10 text-purple-400" : "bg-slate-800/50 text-slate-500"}`}>
                      {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Voice Stress</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm sm:text-lg font-bold transition-colors ${isMicActive ? "text-emerald-400" : "text-white/40"}`}>
                          {isMicActive ? `${Math.round(voiceStress * 100)}%` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isMicActive ? stopMic : startMic}
                    className="h-8 text-[10px] uppercase font-bold tracking-widest bg-transparent border-slate-700 hover:bg-white/5 active:bg-white/10"
                  >
                    {isMicActive ? "Disable" : "Enable"}
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Resolution</p>
                    <p className="text-sm sm:text-lg font-bold text-white">640 x 480</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Results Panel */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-slate-900/40 border-slate-800 shadow-2xl h-full flex flex-col">
                <CardHeader className="border-b border-slate-800 pb-6 bg-slate-900/20">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Live Biometrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-8 flex flex-col justify-center space-y-10">
                  {analysis ? (
                    <>
                      <div className="space-y-4 text-center">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Current State</p>
                        <div className={`text-6xl font-black transition-all duration-500 ${getTextColor(analysis.stress_score)}`}>
                          {analysis.emotion}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1">
                            <p className="text-[10px] sm:text-sm font-black text-slate-500 uppercase tracking-[0.15em]">Combined</p>
                            <p className="text-[10px] sm:text-sm font-black text-slate-600 uppercase tracking-[0.15em] whitespace-nowrap">Face+Voice</p>
                          </div>
                          <div className="space-y-1 text-center">
                            <div className={`text-4xl sm:text-5xl font-mono font-black ${getTextColor(analysis.stress_score)}`}>
                              {Math.round(analysis.stress_score * 100)}%
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-[10px] sm:text-sm font-black text-slate-500 uppercase tracking-[0.15em]">Index</p>
                            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${analysis.stress_score < 0.3 ? "bg-emerald-500/20 text-emerald-400" :
                              analysis.stress_score < 0.6 ? "bg-amber-500/20 text-amber-400" :
                                "bg-rose-500/20 text-rose-400"
                              }`}>
                              {analysis.stress_score < 0.3 ? "Stable" : analysis.stress_score < 0.6 ? "Mild Tension" : "Warning: High"}
                            </p>
                          </div>
                        </div>

                        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner border border-slate-700">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getStressColor(analysis.stress_score)}`}
                            style={{ width: `${Math.max(5, analysis.stress_score * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-2xl bg-black/20 border border-slate-800/50">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Face Analysis</p>
                          <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5 whitespace-nowrap text-sm sm:text-base">
                            <CheckCircle2 className="w-4 h-4" /> Active
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-2xl bg-black/20 border border-slate-800/50">
                          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Data Stream</p>
                          <p className="text-indigo-400 font-bold flex items-center justify-center gap-1.5 font-mono text-sm sm:text-base">
                            1.0 FPS
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-20 space-y-6 opacity-40 grayscale">
                      <div className="relative">
                        <Activity className="w-20 h-20 text-slate-600 animate-pulse" />
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Awaiting Scan</p>
                        <p className="text-sm text-slate-500">Initialize camera to start analysis</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <footer className="pt-2 pb-6 text-center">
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">
              AI Processor v2.4 • Non-invasive Mode • Local Compute
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}