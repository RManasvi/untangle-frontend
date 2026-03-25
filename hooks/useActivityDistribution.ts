import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface DayDistribution {
    day: string;
    sessions: number;
    date: string;
}

export function useActivityDistribution() {
    const { user } = useAuth();
    const [weeklySessions, setWeeklySessions] = useState<DayDistribution[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // ✅ FIX Issue 2: isMounted guard prevents AbortError from stale state updates
        let isMounted = true;

        const fetchStats = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);
                const startDate = sevenDaysAgo.toISOString().split('T')[0];

                // Fetch counts from all activity tables
                const [medRes, chatRes, moodRes, stressRes] = await Promise.all([
                    supabase.from('meditation_sessions').select('created_at').eq('user_id', user.id).gte('created_at', startDate),
                    supabase.from('chat_logs').select('created_at').eq('user_id', user.id).gte('created_at', startDate),
                    supabase.from('mood_entries').select('created_at').eq('user_id', user.id).gte('created_at', startDate),
                    supabase.from('stress_logs').select('created_at').eq('user_id', user.id).gte('created_at', startDate)
                ]);

                if (!isMounted) return; // ✅ Guard against unmounted updates

                const allEvents = [
                    ...(medRes.data || []),
                    ...(chatRes.data || []),
                    ...(moodRes.data || []),
                    ...(stressRes.data || [])
                ];

                const getLocalDateStr = (date: Date) => {
                    return [
                        date.getFullYear(),
                        (date.getMonth() + 1).toString().padStart(2, '0'),
                        date.getDate().toString().padStart(2, '0')
                    ].join('-');
                };

                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const processedData = [];

                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    const dateStr = getLocalDateStr(d);

                    const countForDay = allEvents.filter(e => {
                        if (!e.created_at) return false;
                        const eventDate = new Date(e.created_at);
                        return getLocalDateStr(eventDate) === dateStr;
                    }).length;

                    processedData.push({
                        day: dayName,
                        sessions: countForDay,
                        date: dateStr
                    });
                }

                setWeeklySessions(processedData);
                setTotalSessions(allEvents.length);

            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching activity distribution:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStats();

        // Subscribe to all relevant tables
        const channel = supabase
            .channel('wellness_activity_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meditation_sessions', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchStats(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_logs', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchStats(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_entries', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchStats(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stress_logs', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchStats(); })
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { weeklySessions, totalSessions, loading };
}
