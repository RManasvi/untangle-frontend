import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface Activity {
    type: string;
    title: string;
    message: string;
    time: string;
    duration: string;
}

export function useRecentActivity() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // ✅ FIX Issue 2: isMounted guard prevents AbortError from stale state updates
        let isMounted = true;

        const fetchActivities = async () => {
            try {
                setLoading(true);

                // Only fetch activities from the last 24 hours
                const oneDayAgo = new Date();
                oneDayAgo.setHours(oneDayAgo.getHours() - 24);
                const oneDayAgoStr = oneDayAgo.toISOString();

                // 1. Fetch Chat Logs (last 24 hours)
                const { data: chats } = await supabase
                    .from('chat_logs')
                    .select('created_at, user_message')
                    .eq('user_id', user.id)
                    .gte('created_at', oneDayAgoStr)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 2. Fetch Meditation Sessions (last 24 hours)
                const { data: meditations } = await supabase
                    .from('meditation_sessions')
                    .select('created_at, session_type, duration_minutes')
                    .eq('user_id', user.id)
                    .gte('created_at', oneDayAgoStr)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 3. Fetch Mood Entries (last 24 hours)
                const { data: moods } = await supabase
                    .from('mood_entries')
                    .select('created_at, mood_value')
                    .eq('user_id', user.id)
                    .gte('created_at', oneDayAgoStr)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!isMounted) return; // ✅ Guard against unmounted updates

                // Combine and Normalize
                const combined = [
                    ...(chats || []).map(c => ({
                        type: 'chat',
                        title: 'Chat Conversation',
                        message: c.user_message.substring(0, 50) + (c.user_message.length > 50 ? '...' : ''),
                        time: c.created_at,
                        duration: 'Active'
                    })),
                    ...(meditations || []).map(m => ({
                        type: 'meditation',
                        title: 'Meditation Session',
                        message: `${m.session_type.replace('_', ' ')}`,
                        time: m.created_at,
                        duration: `${m.duration_minutes} min`
                    })),
                    ...(moods || []).map(m => ({
                        type: 'mood',
                        title: 'Mood Logged',
                        message: `You felt ${m.mood_value}/10`,
                        time: m.created_at,
                        duration: '-'
                    }))
                ];

                // Sort by Time DESC
                const sorted = combined
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 10);

                setActivities(sorted);

            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching activities:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchActivities();

        // Subscribe to all 3 tables
        const channel = supabase
            .channel('activity_stream')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_logs', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchActivities(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meditation_sessions', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchActivities(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_entries', filter: `user_id=eq.${user.id}` }, () => { if (isMounted) fetchActivities(); })
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { activities, loading };
}
