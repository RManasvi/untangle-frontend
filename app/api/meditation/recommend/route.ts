import { NextResponse } from 'next/server';
import { getAdaptedRecommendations } from '@/lib/meditationAnalytics';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        // ✅ FIX Issue 1A: Read env vars INSIDE the handler — module-scope reads
        // cause Next.js to crash the entire route and return an HTML 500 page,
        // which the client then fails to .json() parse → "Unexpected token '<'".
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[Recommend] Missing Supabase env vars');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if user meditated today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: todaySessions, error } = await supabase
            .from('meditation_sessions')
            .select('id')
            .eq('user_id', userId)
            .gte('session_date', startOfDay.toISOString());

        if (error) throw error;

        const hasMeditatedToday = Boolean(todaySessions && todaySessions.length > 0);
        const recommendation = await getAdaptedRecommendations(userId, supabase);

        return NextResponse.json({
            hasMeditatedToday,
            recommendation
        });
    } catch (error: any) {
        console.error('[Recommend API Error]:', error?.message ?? error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
