import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { BADGES, UserStats } from '@/lib/badges';
import { getLevel } from '@/lib/gamification';

/**
 * POST /api/gamification/award
 *
 * Handles the full server-side gamification flow after a meditation session:
 *   1. Calculate and award wellness points
 *   2. Update streak
 *   3. Insert earned badges (needs service-role key to bypass RLS)
 *
 * Called from app/meditation/page.jsx instead of the client-side awardMeditationPoints().
 * Body: { userId, durationMinutes, preStress, postStress }
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, durationMinutes, preStress, postStress } = await req.json();

        if (!userId || !durationMinutes) {
            return NextResponse.json({ error: 'userId and durationMinutes are required' }, { status: 400 });
        }

        // ✅ Service-role client is safe here — this is a server-side API route
        const supabase = createServerClient();

        // ── 1. Fetch current user state ────────────────────────────────────────
        const { data: user } = await supabase
            .from('users')
            .select('current_streak, max_streak, last_meditation_date, wellness_points')
            .eq('id', userId)
            .single();

        // ── 2. Calculate points ───────────────────────────────────────────────
        const basePoints = Math.max(5, Math.floor(durationMinutes / 2));
        const currentStreak = user?.current_streak || 0;
        const streakBonus = Math.min(currentStreak * 2, 20);

        let effectivenessBonus = 0;
        let stressReduction = 0;
        if (preStress != null && postStress != null) {
            stressReduction = preStress - postStress;
            if (stressReduction >= 10) effectivenessBonus = 5;
        }
        const totalPointsEarned = basePoints + streakBonus + effectivenessBonus;
        const newWellnessPoints = (user?.wellness_points || 0) + totalPointsEarned;

        // ── 3. Calculate new streak ───────────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = user?.current_streak || 0;
        let lastDate = user?.last_meditation_date ? new Date(user.last_meditation_date) : null;
        if (lastDate) lastDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
            newStreak = 1;
        } else if (lastDate.getTime() === yesterday.getTime()) {
            newStreak += 1;
        } else if (lastDate.getTime() === today.getTime()) {
            // Already meditated today — keep streak
        } else {
            newStreak = 1; // Missed a day
        }
        const maxStreak = Math.max(newStreak, user?.max_streak || 0);

        // ── 4. Persist points + streak ────────────────────────────────────────
        await supabase
            .from('users')
            .update({
                wellness_points: newWellnessPoints,
                current_streak: newStreak,
                max_streak: maxStreak,
                last_meditation_date: new Date().toISOString(),
            })
            .eq('id', userId);

        // ── 5. Gather stats for badge evaluation ──────────────────────────────
        const { data: sessionData } = await supabase
            .from('meditation_sessions')
            .select('id, effectiveness_score')
            .eq('user_id', userId);

        const { data: chatData } = await supabase
            .from('chat_logs')
            .select('id')
            .eq('user_id', userId);

        const totalMeditations = sessionData?.length || 0;
        const maxStressReduction = sessionData
            ? Math.max(...sessionData.map(s => s.effectiveness_score || 0), stressReduction)
            : stressReduction;

        const stats: UserStats = {
            totalMeditations,
            currentStreak: newStreak,
            maxStressReduction,
            totalChatMessages: chatData?.length || 0,
            wellnessPoints: newWellnessPoints,
            meditationsThisMonth: totalMeditations,
            level: getLevel(newWellnessPoints),
        };

        // ── 6. Check & insert earned badges (service-role bypasses RLS) ───────
        const newlyEarned: string[] = [];
        for (const badge of BADGES) {
            if (!badge.checkCondition(stats)) continue;

            const { error } = await supabase.from('badges').insert({
                user_id: userId,
                badge_name: badge.name,
                badge_description: badge.description,
                icon_emoji: badge.icon,
            });

            if (!error) {
                newlyEarned.push(badge.name);
                console.log(`[Gamification] ✅ Awarded "${badge.name}" to ${userId}`);
            } else if (error.code !== '23505') {
                // 23505 = unique violation (already earned) — expected, not an error
                console.error(
                    `[Gamification] Badge insert failed for "${badge.name}":`,
                    error.message, '| code:', error.code
                );
            }
        }

        return NextResponse.json({
            points_earned: totalPointsEarned,
            total_points: newWellnessPoints,
            new_level: getLevel(newWellnessPoints),
            streak: newStreak,
            badges_earned: newlyEarned,
        });

    } catch (error: any) {
        console.error('[Gamification Award] Error:', error?.message ?? error);
        return NextResponse.json({ error: 'Failed to process gamification award' }, { status: 500 });
    }
}
