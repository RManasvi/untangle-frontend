import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
    try {
        const { sessionId, rating, benefits, feedback, classification } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the user_id from the session to link it properly
        const { data: sessionData } = await supabase
            .from('meditation_sessions')
            .select('user_id')
            .eq('id', sessionId)
            .single();

        if (!sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const userId = sessionData.user_id;

        // 1. Insert Feedback
        const { error: feedbackError } = await supabase.from('meditation_feedback').insert({
            user_id: userId,
            meditation_id: sessionId,
            effectiveness_rating: rating,
            benefits_felt: benefits,
            user_feedback: feedback,
            was_effective: classification === 'highly_effective' || classification === 'effective'
        });

        if (feedbackError) throw feedbackError;

        // 2. Update Session with explicit classification & user_rating
        const { error: sessionError } = await supabase
            .from('meditation_sessions')
            .update({
                user_rating: rating,
                effectiveness_classification: classification
            })
            .eq('id', sessionId);

        if (sessionError) throw sessionError;

        // We could add bonus points here as per spec or we can handle it earlier during session complete.
        // For simplicity, we assume base points and streak were handled by `awardMeditationPoints`,
        // and bonus was handled if effectiveness > 15 using `calculateEffectiveness`.

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Feedback API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
