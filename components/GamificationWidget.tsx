'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { getPointsToNextLevel } from '@/lib/gamification';
import { ShieldCheck, CalendarCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { isAbortError } from '@/utils/abortUtils';

export default function GamificationWidget() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ points: 0, streak: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ FIX Issue 2: Use AbortController to cancel Supabase query on unmount
        const controller = new AbortController();
        let isMounted = true;

        async function fetchStats() {
            if (!user) {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('users')
                    .select('wellness_points, current_streak')
                    .eq('id', user.id)
                    .abortSignal(controller.signal) // ✅ Actually cancel the in-flight query
                    .single();

                if (!isMounted) return;
                if (!error && data) {
                    setStats({
                        points: data.wellness_points || 0,
                        streak: data.current_streak || 0,
                    });
                }
            } catch (err) {
                if (isAbortError(err)) return; // ✅ Silent ignore on unmount abort
                console.error('[GamificationWidget] fetchStats error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchStats();

        return () => {
            isMounted = false;
            controller.abort('Component Unmount'); // ✅ Cancel the Supabase request
        };
    }, [user]);

    if (loading || !user) {
        return <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />;
    }

    const levelInfo = getPointsToNextLevel(stats.points);
    const progressPercent = (levelInfo.current / levelInfo.max) * 100;

    return (
        <div className="w-full bg-slate-900 rounded-xl shadow-md border border-slate-800 p-6 text-white mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Index & Tier */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3 bg-slate-800 rounded-lg shadow-inner border border-slate-700">
                        <ShieldCheck className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Wellness Tier {levelInfo.level}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-white">{stats.points}</span>
                            <span className="text-slate-400 text-sm">index</span>
                        </div>
                    </div>
                </div>

                {/* Tier Progress */}
                <div className="flex-1 w-full max-w-md">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-slate-300">Progress to Tier {levelInfo.level < 5 ? levelInfo.level + 1 : 'Max'}</span>
                        <span className="text-slate-400">{levelInfo.level < 5 ? `${levelInfo.max - levelInfo.current} index needed` : 'MAX TIER'}</span>
                    </div>
                    <Progress value={levelInfo.level < 5 ? progressPercent : 100} className="h-2 bg-slate-800 border-none" />
                </div>

                {/* Consistency Record */}
                <div className="flex items-center gap-3 bg-slate-800 px-4 py-3 rounded-lg border border-slate-700 w-full md:w-auto">
                    <CalendarCheck className={`h-6 w-6 ${stats.streak > 0 ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div>
                        <p className="text-slate-400 text-xs uppercase font-semibold">Consistency Record</p>
                        <p className="font-bold text-lg">{stats.streak} day{stats.streak !== 1 && 's'}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
