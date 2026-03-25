import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface ChatLog {
    id: string;
    user_message: string;
    ai_response: string;
    emotion: string;
    created_at: string;
}

export function useChatLogs() {
    const { user } = useAuth();
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // ✅ FIX Issue 2: isMounted guard prevents AbortError from stale state updates
        let isMounted = true;

        const fetchChatLogs = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('chat_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!isMounted) return; // ✅ Guard against unmounted updates
                if (error) throw error;
                setChatLogs(data || []);
            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching chat logs:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchChatLogs();

        const channel = supabase
            .channel('chat_log_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_logs',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    if (isMounted) fetchChatLogs();
                }
            )
            .subscribe();

        return () => {
            isMounted = false; // ✅ Prevent stale state updates on unmount
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { chatLogs, loading };
}
