'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
} from 'recharts';
import { ArrowLeft, TrendingUp, Heart, Zap, Activity, LogOut, MessageCircle, Smile, Brain, Sparkles, AlertTriangle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

// Phase 4 Components
import RiskMeter from '@/components/RiskMeter';
import RecommendationList from '@/components/RecommendationList';
import ExecutiveHeatmap from '@/components/ExecutiveHeatmap';
import ChatDashboard from '@/components/ChatDashboard';
import BotAvatar from '@/components/BotAvatar';
import GamificationWidget from '@/components/GamificationWidget';
import BadgesDisplay from '@/components/BadgesDisplay';

// Custom Hooks
import { useMoodData } from '@/hooks/useMoodData';
import { useMeditationStats } from '@/hooks/useMeditationStats';
import { useActivityDistribution } from '@/hooks/useActivityDistribution';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useChatLogs } from '@/hooks/useChatLogs';
import { useStressLogs } from '@/hooks/useStressLogs';
import { useLiveStress } from '@/hooks/useLiveStress';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, session, loading } = useAuth();

  // Phase 4 Predictive Intelligence State
  const [riskData, setRiskData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Data Hooks
  const { moodData, loading: moodLoading, error: moodError, logMood } = useMoodData();
  const { totalSessions, weeklySessions, loading: activityDistLoading } = useActivityDistribution();
  const { todayMinutes, avgEfficacy, lastEfficacy, loading: medLoading } = useMeditationStats();
  const { activities, loading: activityLoading } = useRecentActivity();
  const { chatLogs, loading: chatLoading } = useChatLogs();
  const { stressLogs, averageStress, loading: stressLoading } = useStressLogs();
  const liveStress = useLiveStress();

  const [selectedMood, setSelectedMood] = useState(null);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleLogClick = async (value) => {
    setSelectedMood(value);
    await logMood(value);
    setTimeout(() => setSelectedMood(null), 2000); // Reset selection visual
  };

  // Fetch AI Weekly Insights & Predictive Intelligence (Phase 3 & 4)
  useEffect(() => {
    if (!session?.access_token) return;

    // ✅ FIX Issue 2: AbortController cancels in-flight fetches on unmount/session change
    const controller = new AbortController();
    const { signal } = controller;

    const fetchDashboardData = async () => {
      setLoadingRisk(true);

      try {
        // Fetch 1: Target Risk Score First
        const riskRes = await fetch('/api/risk-score', {
          method: 'POST',
          signal,
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (signal.aborted) return;

        if (riskRes.ok) {
          const riskResult = await riskRes.json();
          if (riskResult.success) {
            setRiskData(riskResult);

            // Fetch 2: Call AI Recommendations sequentially only AFTER Risk is mapped
            fetch('/api/recommendations', {
              method: 'POST',
              signal,
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                metrics_snapshot: riskResult.metrics_snapshot,
                risk_score_internal: riskResult.risk_score_internal
              })
            }).then(async recRes => {
              if (signal.aborted) return; // ✅ Guard nested fetch on abort
              if (recRes.ok) {
                const recData = await recRes.json();
                if (recData.success) setRecommendations(recData.recommendations);
              }
            }).catch(err => {
              if (err.name === 'AbortError') return; // ✅ Intentional abort, ignore silently
              console.error('[Dashboard] Recommendations fetch failed:', err);
            });
          }
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          return; // ✅ Intentional abort on cleanup, do not log as error
        }
        console.error("Failed to fetch predictive dashboard data", err);
      } finally {
        if (!signal.aborted) setLoadingRisk(false);
      }
    };

    // Trigger sequential fetches
    fetchDashboardData();

    return () => {
      controller.abort(); // ✅ Cancel all in-flight requests on unmount/dependency change
    };
  }, [session?.access_token]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Derive Stats from Real Data
  const averageMood = moodData.length > 0
    ? (moodData.reduce((acc, curr) => acc + curr.mood_value, 0) / moodData.length).toFixed(1)
    : '0';

  // Simple streak calculation (consecutive days with mood entries)
  const calculateStreak = () => {
    // Combine all activity keys for streak
    const activityDates = [
      ...new Set([
        ...moodData.map(m => m.created_at.split('T')[0]),
        ...activities.map(a => a.time.split('T')[0]),
        ...(stressLogs || []).map(s => s.created_at.split('T')[0])
      ])
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (activityDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak is active (today or yesterday has entry)
    let currentStreak = 0;
    if (activityDates[0] === today || activityDates[0] === yesterday) {
      currentStreak = 1;
      let checkDate = new Date(activityDates[0]);

      for (let i = 1; i < activityDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expectedDateStr = checkDate.toISOString().split('T')[0];
        if (activityDates[i] === expectedDateStr) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    return currentStreak;
  };

  const streak = calculateStreak();

  // Prepare Mood Chart Data (Last 7 Days)
  const chartData = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = days[d.getDay()];

    // Find mood for this day
    const entries = moodData.filter(m => m.created_at.startsWith(dateStr));
    const dayAvg = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood_value, 0) / entries.length
      : null; // Null for gaps

    chartData.push({
      day: dayName,
      mood: dayAvg !== null ? Number(dayAvg.toFixed(1)) : null,
      date: dateStr
    });
  }

  const isLoading = moodLoading || medLoading || activityLoading || chatLoading || stressLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/chat')}
              variant="ghost"
              size="icon"
              className="text-slate-700 hover:bg-blue-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <BotAvatar className="w-12 h-12 shadow-sm border border-slate-200" />
              <div className="flex flex-col gap-0">
                <BrandLogo className="h-6 -ml-2" />
                <p className="text-slate-600 text-sm">Welcome back, {user.name}! 🌟</p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {moodError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <div className="p-2 bg-red-100 rounded-full">
              <LogOut className="h-4 w-4 rotate-180" /> {/* Using LogOut as generic alert icon for now */}
            </div>
            <div>
              <p className="font-semibold">Connection Error</p>
              <p className="text-sm">{moodError}. Please check your internet or credentials.</p>
            </div>
          </div>
        )}

        {/* Weekly Analysis Banner (NEW) */}
        {!isLoading && riskData?.weekly_summary && (
          <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 tracking-tight">Weekly Performance Analysis</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{riskData.weekly_summary}</p>
            </div>
          </div>
        )}


        {/* Phase 3: Gamification Components */}
        {!isLoading && !moodData.some(m => m.created_at.startsWith(new Date().toISOString().split('T')[0])) && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-indigo-100 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Smile className="h-4 w-4 text-indigo-500" /> Daily Resonance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">How is your internal focus today?</h3>
                    <p className="text-sm text-slate-500">Log your current state to calibrate predictive intelligence.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleLogClick(num)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all duration-300 border ${selectedMood === num
                          ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-lg'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <GamificationWidget />

        {/* Phase 4: Predictive Intelligence Block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <RiskMeter riskData={riskData} loading={loadingRisk} />
          </div>
          <div className="lg:col-span-2">
            <RecommendationList recommendations={recommendations} loading={loadingRisk} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-blue-100 bg-white shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recovery ROI</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {avgEfficacy > 0 ? `${Math.round(avgEfficacy)}%` : '—'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">
                    Avg Impact Efficacy (Last 7D)
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">Avg Mood</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {moodData.length > 0 ? `${Math.min(parseFloat(averageMood), 9.8).toFixed(1)}/10` : 'No Data'}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${riskData?.metrics_snapshot?.moodTrend > 0 ? 'text-emerald-600' :
                    riskData?.metrics_snapshot?.moodTrend < 0 ? 'text-red-600' : 'text-slate-400'
                    }`}>
                    {riskData?.metrics_snapshot?.moodTrend !== null && riskData?.metrics_snapshot?.moodTrend !== undefined
                      ? `${riskData.metrics_snapshot.moodTrend > 0 ? '+' : ''}${riskData.metrics_snapshot.moodTrend.toFixed(1)} vs last week`
                      : 'Calculating trend...'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                  <Heart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">Burnout Risk</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {riskData?.metrics_snapshot?.count >= 1 ? Math.round(riskData.risk_score_internal) : '—'}
                  </p>
                  <p className={`text-xs mt-1 font-bold ${riskData?.metrics_snapshot?.count < 3 ? 'text-slate-400' :
                    riskData?.risk_score_internal > 70 ? 'text-red-600' :
                      riskData?.risk_score_internal > 50 ? 'text-orange-600' :
                        'text-emerald-600'
                    }`}>
                    {riskData?.metrics_snapshot?.count >= 1
                      ? `${riskData.category_level} Risk ${riskData.metrics_snapshot.stressTrendSlope > 0 ? '↑' : '↓'}`
                      : 'Establishing baseline...'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <Brain className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">Avg Stress</p>
                  <p className="text-2xl font-bold text-slate-900">{(averageStress * 100).toFixed(1)}%</p>
                  <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${riskData?.metrics_snapshot?.stressTrendPercentage !== null ? (riskData?.metrics_snapshot?.stressTrendPercentage > 0 ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-400'
                    }`}>
                    {riskData?.metrics_snapshot?.stressTrendPercentage !== null && riskData?.metrics_snapshot?.stressTrendPercentage !== undefined ? (
                      <>
                        {riskData.metrics_snapshot.stressTrendPercentage > 0 ? '↑' : '↓'} {Math.abs(Math.round(riskData.metrics_snapshot.stressTrendPercentage))}% vs last week
                      </>
                    ) : 'Evaluating trend...'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-rose-50 bg-gradient-to-br from-white to-rose-50/30 shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer border ${liveStress ? 'ring-2 ring-rose-500 ring-offset-2 scale-[1.02]' : ''}`}
            onClick={() => router.push('/stress')}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-medium">Biometric Scan</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {liveStress ? `${liveStress.score}%` : 'Live'}
                    </p>
                    {liveStress && (
                      <span className="text-[10px] font-black uppercase text-rose-500 animate-pulse tracking-widest">
                        {liveStress.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {liveStress ? 'Receiving terminal broadcast...' : 'Real-time facial stress detection'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg transition-colors duration-500 ${liveStress ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-50 text-rose-600'}`}>
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Analysis Section (NEW) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8">
            <ExecutiveHeatmap logs={stressLogs} loading={stressLoading} />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="border-indigo-100 bg-slate-900 text-white shadow-xl flex-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-32 h-32" />
              </div>
              <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Predictive Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporal Pattern</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {riskData?.metrics_snapshot?.peakStressHour !== undefined && riskData.metrics_snapshot.count > 0 ? (
                      <>A recurring biometric spike is detected around <b>{riskData.metrics_snapshot.peakStressHour % 12 || 12} {riskData.metrics_snapshot.peakStressHour >= 12 ? 'PM' : 'AM'}</b>. We suggest a 5-minute Autonomic Reset at <b>{(riskData.metrics_snapshot.peakStressHour - 1 + 24) % 12 || 12} {(riskData.metrics_snapshot.peakStressHour - 1) >= 12 ? 'PM' : 'AM'}</b>.</>
                    ) : "Calibrating behavioral patterns..."}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance Guard</p>
                  <p className="text-sm font-medium leading-relaxed">
                    {riskData?.metrics_snapshot?.stressTrendPercentage > 15 ? (
                      <span className="text-rose-400 font-bold flex items-center gap-2 italic">
                        <AlertTriangle className="h-4 w-4" />
                        Critical Velocity detected: Stress load is ascending rapidly.
                      </span>
                    ) : "Biometric velocity is within nominal governance limits."}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Button
                    onClick={() => router.push('/meditation')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest h-10 shadow-lg shadow-indigo-500/20"
                  >
                    Initialize Recovery ROI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Consistency Trend */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900 text-lg flex items-center justify-between font-bold">
                Consistency Trend
                <div className="flex items-center gap-1 text-xs font-normal text-slate-400 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-slate-900"></span> Wellness Index
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 bg-slate-50 rounded animate-pulse" />
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                      />
                      <YAxis hide domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#1e293b"
                        strokeWidth={3}
                        connectNulls
                        dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#1e293b' }}
                      >
                        <LabelList
                          dataKey="mood"
                          position="top"
                          offset={12}
                          formatter={(v) => v !== null ? v : ""}
                          style={{ fill: '#475569', fontSize: '10px', fontWeight: '800', fontFamily: 'monospace' }}
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex gap-1.5 mt-4 justify-between border-t border-slate-50 pt-4">
                <p className="text-xs text-slate-500 font-medium italic">Establishing performance baseline based on trailing activity data.</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Distribution */}
          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900 text-lg flex items-center justify-between font-bold">
                Activity Distribution
                <div className="flex items-center gap-1 text-xs font-normal text-slate-400 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-slate-800"></span> Sessions
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 bg-slate-50 rounded animate-pulse" />
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklySessions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Bar dataKey="sessions" fill="#1e293b" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="sessions"
                          position="top"
                          style={{ fill: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex justify-between mt-4 border-t border-slate-50 pt-4 px-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Temporal distribution of wellness sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Panel (NEW) */}
        <Card className="border-indigo-100 bg-slate-900 text-white shadow-2xl mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10">
            <Brain className="w-48 h-48 text-indigo-400" />
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-400">
              <Sparkles className="h-5 w-5" />
              AI Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Stress Velocity</p>
                <p className="text-sm font-medium">
                  {riskData?.metrics_snapshot?.stressTrendPercentage !== null && riskData?.metrics_snapshot?.stressTrendPercentage !== undefined
                    ? `7-day stress trend: ${riskData.metrics_snapshot.stressTrendPercentage > 0 ? '+' : ''}${Math.round(riskData.metrics_snapshot.stressTrendPercentage)}% vs previous week.`
                    : "Establishing historical baseline (requires 7 days of logs)."}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Peak Load</p>
                <div className="text-sm font-medium">
                  {riskData?.metrics_snapshot?.peakStressHour !== undefined && riskData?.metrics_snapshot?.count > 0
                    ? <>Peak biometric load hour: {riskData.metrics_snapshot.peakStressHour % 12 || 12} {riskData.metrics_snapshot.peakStressHour >= 12 ? 'PM' : 'AM'} (Avg {Math.round(riskData.metrics_snapshot.peakStressValue * 100)}%).</>
                    : 'Awaiting first biometric telemetry scan...'}
                  <br />
                  Late-night activity ratio: {Math.round(riskData?.metrics_snapshot?.lateNightRatio || 0)}%.
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Recovery Efficacy</p>
                <p className="text-sm font-medium">
                  {riskData?.metrics_snapshot?.recoveryDataPoints > 0
                    ? `Average post-meditation stress reduction: ${Math.abs(Math.round(riskData.metrics_snapshot.recoveryEfficiency))}%`
                    : riskData?.metrics_snapshot?.meditationFrequency > 0
                      ? "Awaiting post-meditation biometric scan to verify recovery impact."
                      : "No meditation activity detected in trailing 7-day period."}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">System Assessment</p>
                <p className="text-sm font-medium">
                  {riskData?.risk_score_internal > 70 ? 'High burnout risk detected. Immediate workload adjustment required.' :
                    riskData?.risk_score_internal > 50 ? 'Upward stress trend detected. Consider scheduling structured recovery sessions.' :
                      riskData?.metrics_snapshot?.lateNightRatio > 35 ? 'High proportion of late-night activity detected. Cognitive load may accumulate.' :
                        'Stress volatility within acceptable range. No intervention required.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Milestones */}
        <div className="mb-8">
          <BadgesDisplay />
        </div>

        {/* Recent Activity & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-blue-100 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 text-lg font-bold">Recent Activity Logs</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Audit trail of trailing 24-hour cycle</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="p-4 bg-slate-100 rounded-lg animate-pulse h-16" />
                    ))
                  ) : activities.length > 0 ? (
                    activities.map((activity, idx) => {
                      const getActivityIcon = (type) => {
                        switch (type) {
                          case 'chat':
                            return <MessageCircle className="h-5 w-5 text-slate-700" />;
                          case 'meditation':
                            return <Brain className="h-5 w-5 text-slate-700" />;
                          case 'mood':
                            return <Smile className="h-5 w-5 text-slate-700" />;
                          default:
                            return <Activity className="h-5 w-5 text-slate-700" />;
                        }
                      };

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-white rounded-full shadow-sm">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 heading-font">{activity.title}</h4>
                              <p className="text-sm text-slate-600">
                                {activity.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 font-medium">
                                {new Date(activity.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          {activity.duration !== '-' && (
                            <div className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">
                              {activity.duration}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                        <Activity className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No activity records found</p>
                      <p className="text-sm text-slate-400">Activity telemetry will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Focus Areas */}
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 text-lg font-bold">Weekly Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 uppercase tracking-widest text-[10px]">Mindfulness Protocol</label>
                  <span className="text-sm text-slate-500 font-mono text-xs">15m target</span>
                </div>
                <Progress value={Math.min((todayMinutes / 15) * 100, 100)} className="h-2 bg-slate-100" />
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{todayMinutes} minutes recorded today</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 uppercase tracking-widest text-[10px]">Adherence Rate</label>
                  <span className="text-sm text-slate-500 font-mono text-xs">{streak}/7 days</span>
                </div>
                <Progress value={(streak / 7) * 100} className="h-2 bg-slate-100" />
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Consistent engagement verified</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all hover:shadow-lg"
                  onClick={() => router.push('/chat')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Request Professional Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modular Chat History Dashboard */}
        <ChatDashboard logs={chatLogs} isLoading={chatLoading} />
      </div>
    </div >
  );
}

