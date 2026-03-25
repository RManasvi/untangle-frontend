'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { BADGES } from '@/lib/badgeDefinitions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Medal, Lock } from 'lucide-react';
import { isAbortError } from '@/utils/abortUtils';

export default function BadgesDisplay() {
    const { user } = useAuth();
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ FIX Issue 2: AbortController cancels in-flight Supabase query on unmount
        const controller = new AbortController();
        let isMounted = true;

        async function fetchBadges() {
            if (!user) {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('badges')
                    .select('badge_name')
                    .eq('user_id', user.id)
                    .abortSignal(controller.signal); // ✅ Cancel on unmount

                if (!isMounted) return;
                if (!error && data) {
                    setEarnedBadges(data.map(b => b.badge_name));
                }
            } catch (err) {
                if (isAbortError(err)) return; // ✅ Silent ignore
                console.error('[BadgesDisplay] fetchBadges error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchBadges();

        return () => {
            isMounted = false;
            controller.abort('Component Unmount');
        };
    }, [user]);

    if (loading) {
        return <div className="h-64 rounded-xl bg-slate-50 animate-pulse" />;
    }

    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-slate-800 text-lg flex items-center gap-2">
                    <Medal className="h-5 w-5 text-blue-600" />
                    Professional Milestones
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {BADGES.map((badge) => {
                        const isEarned = earnedBadges.includes(badge.name);

                        return (
                            <div
                                key={badge.id}
                                className={`relative group flex flex-col items-center p-4 rounded-xl text-center transition-all ${isEarned
                                    ? 'bg-blue-50 border border-blue-200 shadow-sm hover:shadow-md'
                                    : 'bg-slate-50 border border-slate-200 opacity-60 grayscale'
                                    }`}
                            >
                                {!isEarned && (
                                    <div className="absolute top-2 right-2 flex bg-slate-200 rounded-full p-1 opacity-70">
                                        <Lock className="h-3 w-3 text-slate-500" />
                                    </div>
                                )}
                                <div className={`text-4xl mb-3 ${isEarned ? 'drop-shadow-sm text-blue-700' : 'text-slate-400'}`}>
                                    {badge.icon}
                                </div>
                                <h4 className={`text-sm font-semibold ${isEarned ? 'text-blue-900' : 'text-slate-500'}`}>
                                    {badge.name}
                                </h4>

                                {/* Tooltip on hover */}
                                <div className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg border border-slate-700">
                                    {badge.description}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
