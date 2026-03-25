import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Supabase configuration missing' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from auth header
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;

        // Handle mock auth (for development/preview)
        if (token === 'mock-token') {
            // For mock auth, just return success without saving
            const body = await request.json();
            const { type, duration } = body;

            if (!type || !duration) {
                return NextResponse.json(
                    { error: 'Session type and duration are required' },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Meditation session logged successfully (demo mode)',
                session: { type, duration },
                timestamp: new Date().toISOString(),
            });
        }

        // Verify real JWT token with Supabase
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        userId = user.id;

        // Get request body
        const body = await request.json();
        const { type, duration } = body;

        // Validate input
        if (!type || !duration) {
            return NextResponse.json(
                { error: 'Session type and duration are required' },
                { status: 400 }
            );
        }

        if (duration <= 0) {
            return NextResponse.json(
                { error: 'Duration must be greater than 0' },
                { status: 400 }
            );
        }

        // Valid session types
        const validTypes = ['deep_breathing', 'mindfulness', 'body_scan'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid session type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Insert meditation session
        const { data, error: insertError } = await supabase
            .from('meditation_sessions')
            .insert({
                user_id: userId,
                session_type: type,
                duration_minutes: duration,
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({
            success: true,
            message: 'Meditation session logged successfully',
            session: {
                id: data.id,
                type: data.session_type,
                duration: data.duration_minutes,
                timestamp: data.created_at,
            },
        });
    } catch (error) {
        console.error('[v0] Meditation API error:', error);
        return NextResponse.json(
            { error: 'Failed to log meditation session', details: (error as any).message },
            { status: 500 }
        );
    }
}
