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
      const { mood } = body;

      if (!mood || mood < 1 || mood > 10) {
        return NextResponse.json(
          { error: 'Invalid mood value. Must be between 1 and 10.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mood logged successfully (demo mode)',
        mood,
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
    const { mood } = body;

    // Validate mood value
    if (!mood || mood < 1 || mood > 10) {
      return NextResponse.json(
        { error: 'Invalid mood value. Must be between 1 and 10.' },
        { status: 400 }
      );
    }

    // Check if mood entry already exists for today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingEntry } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .single();

    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('mood_entries')
        .update({ mood_value: mood })
        .eq('id', existingEntry.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Mood updated successfully',
        mood,
        timestamp: new Date().toISOString(),
      });
    }

    // Insert new mood entry
    const { data, error: insertError } = await supabase
      .from('mood_entries')
      .insert({
        user_id: userId,
        mood_value: mood,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Mood logged successfully',
      mood,
      timestamp: data.created_at,
    });
  } catch (error: any) {
    console.error('[v0] Mood API error:', error);
    return NextResponse.json(
      { error: 'Failed to log mood', details: error.message },
      { status: 500 }
    );
  }
}
