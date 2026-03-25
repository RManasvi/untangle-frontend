import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface StressLog {
    id: string;
    stress_score: number;
    created_at: string;
    stopped_at: string;
}

export function useStressLogs() {
    const { user } = useAuth();
    const [stressLogs, setStressLogs] = useState<StressLog[]>([]);
    const [averageStress, setAverageStress] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // ✅ FIX Issue 2: isMounted guard prevents AbortError from stale state updates
        let isMounted = true;

        const fetchStressLogs = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('stress_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!isMounted) return; // ✅ Guard against unmounted updates
                if (error) throw error;

                const logs = data || [];
                setStressLogs(logs);

                if (logs.length > 0) {
                    const total = logs.reduce((sum, log) => sum + Number(log.stress_score), 0);
                    setAverageStress(total / logs.length);
                } else {
                    setAverageStress(0);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching stress logs:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStressLogs();

        const channel = supabase
            .channel('stress_log_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'stress_logs',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    if (isMounted) fetchStressLogs();
                }
            )
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { stressLogs, averageStress, loading };
}
