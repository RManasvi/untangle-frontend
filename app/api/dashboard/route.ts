import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
      userId = 'demo-user-123';
      // check if it is demo user return mock data immediately to avoid errors
      return NextResponse.json({
        totalSessions: 15,
        averageMood: 6.7,
        wellnessScore: 78,
        streak: 5,
        weeklyMood: [
          { day: 'Sun', mood: 6, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Mon', mood: 7, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Tue', mood: 5, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Wed', mood: 8, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Thu', mood: 7, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Fri', mood: 8, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Sat', mood: 6, date: new Date().toISOString().split('T')[0] },
        ],
        weeklySessions: [
          { day: 'Sun', sessions: 2, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Mon', sessions: 1, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Tue', sessions: 3, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Wed', sessions: 2, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Thu', sessions: 4, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Fri', sessions: 2, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          { day: 'Sat', sessions: 1, date: new Date().toISOString().split('T')[0] },
        ],
        recentActivity: [
          { title: 'Chat Conversation', message: 'Check-in conversation about wellness', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), duration: '8 min', type: 'chat' },
          { title: 'Chat Conversation', message: 'Stress relief session', time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), duration: '10 min', type: 'chat' },
        ],
      });
    } else {
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
    }

    const today = new Date(); // Current date/time

    // --- 1. Fetch Mood Entries (last 7 days) ---
    const { data: moodEntries, error: moodError } = await supabase
      .from('mood_entries')
      .select('mood_value, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Get all for stats

    // --- 2. Fetch Meditation Sessions (last 7 days) ---
    const { data: meditationSessions, error: medError } = await supabase
      .from('meditation_sessions')
      .select('session_type, duration_minutes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // --- 3. Fetch Chat Logs (Recently) ---
    const { data: chatLogs, error: chatError } = await supabase
      .from('chat_logs')
      .select('user_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });


    // --- Calculate Helper Functions ---

    // Calculate Average Mood (Overall)
    const averageMood = moodEntries && moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + entry.mood_value, 0) / moodEntries.length
      : 0;

    // Calculate Wellness Score: Simple Algo based on mood & activity consistency
    // Max 100. Boost for high mood avg, boost for frequent activity.
    let score = 0;
    if (averageMood > 0) score += (averageMood * 5); // Max 50 points from mood (avg 10 * 5)

    // Add points for recent activity (last 7 days)
    const recentActivityCount = (meditationSessions?.length || 0) + (chatLogs?.length || 0);
    score += Math.min(recentActivityCount * 5, 50); // Max 50 points from activity (10 activities)

    const wellnessScore = Math.round(score) || 0; // Default to 0 if no data

    // Calculate Streak
    // Count consecutive days with ANY activity (mood, meditation, or chat)
    let streak = 0;
    // Combine all dates
    const allDates = [
      ...(moodEntries || []).map(e => e.created_at.split('T')[0]),
      ...(meditationSessions || []).map(e => e.created_at.split('T')[0]),
      ...(chatLogs || []).map(e => e.created_at.split('T')[0]),
    ].sort().reverse();

    // Use Set to get unique activity dates
    const uniqueDates = [...new Set(allDates)];

    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if active today or yesterday to start streak
      let currentStreakDate = uniqueDates.includes(todayStr) ? todayStr : (uniqueDates.includes(yesterdayStr) ? yesterdayStr : null);

      if (currentStreakDate) {
        streak = 1;
        let checkDate = new Date(currentStreakDate);

        // Look back for consecutive days
        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const expectedDateStr = checkDate.toISOString().split('T')[0];
          if (uniqueDates.includes(expectedDateStr)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }


    // --- Format Weekly Data (Last 7 Days) ---
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMood = [];
    const weeklySessions = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      // Mood for this day
      const daysMoods = moodEntries?.filter(e => e.created_at.startsWith(dateStr));
      let avgDayMood = 0;
      if (daysMoods && daysMoods.length > 0) {
        avgDayMood = daysMoods.reduce((sum, e) => sum + e.mood_value, 0) / daysMoods.length;
      }

      weeklyMood.push({
        day: dayName,
        mood: Math.round(avgDayMood * 10) / 10,
        date: dateStr
      });

      // Sessions for this day (Meditation counts as session)
      // We can also count chat interactions as 'sessions' if we want, or separate them.
      // Let's count meditation sessions + chat conversations (unique chat days if dense?) 
      // Plan: Count distinct interactions.
      const daysMeditations = meditationSessions?.filter(e => e.created_at.startsWith(dateStr));
      const daysChats = chatLogs?.filter(e => e.created_at.startsWith(dateStr));

      weeklySessions.push({
        day: dayName,
        sessions: (daysMeditations?.length || 0) + (daysChats?.length || 0),
        date: dateStr
      });
    }

    // --- Recent Activity List ---
    const allActivities: any[] = [];

    // Add Moods
    moodEntries?.forEach(e => {
      allActivities.push({
        type: 'mood',
        title: 'Mood Logged',
        message: `You felt ${e.mood_value}/10`,
        time: e.created_at,
        duration: '-'
      });
    });

    // Add Meditations
    meditationSessions?.forEach(e => {
      allActivities.push({
        type: 'meditation',
        title: 'Meditation Session',
        message: `${e.session_type.replace('_', ' ')}`,
        time: e.created_at,
        duration: `${e.duration_minutes} min`
      });
    });

    // Add Chats
    chatLogs?.forEach(e => {
      allActivities.push({
        type: 'chat',
        title: 'Chat Conversation',
        message: e.user_message.substring(0, 40) + (e.user_message.length > 40 ? '...' : ''),
        time: e.created_at,
        duration: 'Active'
      });
    });

    // Sort by time desc and take top 5
    const recentActivity = allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    return NextResponse.json({
      totalSessions: (meditationSessions?.length || 0) + (chatLogs?.length || 0),
      averageMood: Math.round(averageMood * 10) / 10,
      wellnessScore,
      streak,
      weeklyMood,
      weeklySessions,
      recentActivity,
    });

  } catch (error) {
    console.error('[v0] Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

