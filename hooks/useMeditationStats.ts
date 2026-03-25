import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface SessionStats {
    day: string;
    sessions: number;
    date: string;
}

export function useMeditationStats() {
    const { user } = useAuth();
    const [weeklySessions, setWeeklySessions] = useState<SessionStats[]>([]);
    const [totalSessions, setTotalSessions] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [avgEfficacy, setAvgEfficacy] = useState(0);
    const [lastEfficacy, setLastEfficacy] = useState(0);
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

                // 1. Fetch sessions for the last 7 days
                const { data, error } = await supabase
                    .from('meditation_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', sevenDaysAgo.toISOString().split('T')[0])
                    .order('created_at', { ascending: false });

                if (!isMounted) return;
                if (error) throw error;

                // 2. Fetch total count (lifetime)
                const { count, error: countError } = await supabase
                    .from('meditation_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!isMounted) return;
                if (countError) throw countError;

                setTotalSessions(count || 0);

                // 3. Process efficacy metrics
                if (data && data.length > 0) {
                    const validEfficacySessions = data.filter(s => s.effectiveness_score !== null);
                    if (validEfficacySessions.length > 0) {
                        const totalEff = validEfficacySessions.reduce((sum, s) => sum + Number(s.effectiveness_score), 0);
                        setAvgEfficacy(totalEff / validEfficacySessions.length);
                        setLastEfficacy(Number(validEfficacySessions[0].effectiveness_score));
                    }
                }

                // 4. Fetch today's meditation minutes
                const todayStr = today.toISOString().split('T')[0];
                const totalMinutesToday = (data || [])
                    .filter(s => s.created_at.startsWith(todayStr))
                    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

                setTodayMinutes(totalMinutesToday);

                // 5. Process weekly data
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const processedData = [];

                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    const dateStr = d.toISOString().split('T')[0];

                    const countForDay = data.filter(session =>
                        session.created_at.startsWith(dateStr)
                    ).length;

                    processedData.push({
                        day: dayName,
                        sessions: countForDay,
                        date: dateStr
                    });
                }

                setWeeklySessions(processedData);

            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching meditation stats:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStats();

        // Realtime subscription
        const channel = supabase
            .channel('meditation_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'meditation_sessions',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    if (isMounted) fetchStats();
                }
            )
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { weeklySessions, totalSessions, todayMinutes, avgEfficacy, lastEfficacy, loading };
}
