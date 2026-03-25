import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface MoodEntry {
    id: string;
    mood_value: number;
    created_at: string;
}

export function useMoodData() {
    const { user } = useAuth();
    const [moodData, setMoodData] = useState<MoodEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // ✅ FIX Issue 2: Use a mounted flag to prevent state updates after unmount.
        // Supabase uses its own internal fetch; we can't pass an AbortSignal,
        // but we can safely ignore the result if the component unmounted.
        let isMounted = true;

        const fetchMoods = async () => {
            try {
                setLoading(true);
                setError(null);
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);

                const { data, error } = await supabase
                    .from('mood_entries')
                    .select('mood_value, created_at, id')
                    .eq('user_id', user.id)
                    .gte('created_at', sevenDaysAgo.toISOString().split('T')[0])
                    .order('created_at', { ascending: true });

                if (!isMounted) return; // ✅ Guard against unmounted updates

                if (error) throw error;
                setMoodData(data || []);
            } catch (err: any) {
                if (!isMounted) return;
                console.error('Error fetching mood data:', err);
                setError(err.message || 'Failed to fetch mood data');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMoods();

        // Realtime subscription
        const channel = supabase
            .channel('mood_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mood_entries',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    if (isMounted) fetchMoods();
                }
            )
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    const logMood = async (value: number) => {
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Check if entry exists for today
            const { data: existing } = await supabase
                .from('mood_entries')
                .select('id')
                .eq('user_id', user.id)
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59`)
                .maybeSingle();

            let error;

            if (existing) {
                const { error: updateError } = await supabase
                    .from('mood_entries')
                    .update({ mood_value: value })
                    .eq('id', existing.id);
                error = updateError;
                if (!error) toast.info("Mood updated for today! 🌟");
            } else {
                const { error: insertError } = await supabase
                    .from('mood_entries')
                    .insert({ user_id: user.id, mood_value: value });
                error = insertError;
                if (!error) toast.success("Mood logged successfully! 🎉");
            }

            if (error) throw error;

        } catch (err) {
            console.error('Error logging mood:', err);
            toast.error("Failed to log mood. Please try again.");
        }
    };

    return { moodData, loading, error, logMood };
}
