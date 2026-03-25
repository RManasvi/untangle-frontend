'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { CalendarCheck } from 'lucide-react';

export default function StreakIndicator({ className = '' }: { className?: string }) {
    const { user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStreak() {
            if (!user) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('users')
                .select('current_streak')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setStreak(data.current_streak || 0);
            }
            setLoading(false);
        }
        fetchStreak();
    }, [user]);

    if (loading || !user) return null;

    let colorClass = 'text-slate-500 bg-slate-50 border-slate-200';
    if (streak >= 10) {
        colorClass = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (streak >= 3) {
        colorClass = 'text-slate-700 bg-slate-100 border-slate-300';
    }

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold ${colorClass} ${className} transition-colors duration-300 hover:shadow-sm cursor-pointer`}>
            <CalendarCheck className="h-4 w-4" />
            <span>{streak} Day Consistency Record</span>
        </div>
    );
}
