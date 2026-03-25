'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabaseClient';

export type BotStyle = 'professional' | 'minimalist' | 'corporate' | 'advisor' | 'wellness_coach';

interface BotContextType {
    botStyle: BotStyle;
    setBotStyle: (style: BotStyle) => Promise<void>;
    isLoading: boolean;
}

const BotContext = createContext<BotContextType | undefined>(undefined);

const supabase = createClient();

export function BotProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [botStyle, setBotStyleState] = useState<BotStyle>('professional');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        
        async function fetchBotStyle() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            // Try to load from localStorage first for immediate UI update
            const cachedStyle = localStorage.getItem(`bot_style_${user.id}`);
            if (cachedStyle) {
                setBotStyleState(cachedStyle as BotStyle);
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('bot_style')
                    .eq('id', user.id)
                    .maybeSingle();

                if (controller.signal.aborted) return;

                if (error) {
                    if (error.message?.includes('AbortError')) return;
                    // 42P01 means table does not exist
                    if (error.code === '42P01') {
                        console.warn('Supabase: "users" table not found.');
                    } else {
                        console.error('Error fetching bot style:', error.message || error);
                    }
                } else if (data && data.bot_style) {
                    setBotStyleState(data.bot_style as BotStyle);
                    localStorage.setItem(`bot_style_${user.id}`, data.bot_style);
                }
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
                console.error('Unexpected error fetching bot style:', err.message || err);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        fetchBotStyle();

        return () => {
            controller.abort("cleanup");
        };
    }, [user]);

    const setBotStyle = async (newStyle: BotStyle) => {
        // Optimistic update
        setBotStyleState(newStyle);
        if (user) {
            localStorage.setItem(`bot_style_${user.id}`, newStyle);

            try {
                // Use upsert to handle case where user record might not exist yet
                const { error } = await supabase
                    .from('users')
                    .upsert({
                        id: user.id,
                        bot_style: newStyle,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (error) {
                    if (error.code === '42P01') {
                        console.warn('Supabase: "users" table not found. Persistence restricted to localStorage.');
                    } else {
                        console.error('Error persisting bot style:', error.message || error);
                    }
                }
            } catch (err: any) {
                console.error('Unexpected error updating bot style:', err.message || err);
            }
        }
    };

    return (
        <BotContext.Provider value={{ botStyle, setBotStyle, isLoading }}>
            {children}
        </BotContext.Provider>
    );
}

export function useBot() {
    const context = useContext(BotContext);
    if (context === undefined) {
        throw new Error('useBot must be used within a BotProvider');
    }
    return context;
}
