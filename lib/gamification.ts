import { createClient } from '@/lib/supabaseClient';
import { checkAndAwardBadges, UserStats } from './badges';

export function getLevel(wellnessPoints: number): number {
    if (wellnessPoints < 100) return 1;
    if (wellnessPoints < 250) return 2;
    if (wellnessPoints < 500) return 3;
    if (wellnessPoints < 1000) return 4;
    return 5;
}

export function getPointsToNextLevel(points: number): { current: number, max: number, level: number } {
    if (points < 100) return { current: points, max: 100, level: 1 };
    if (points < 250) return { current: points - 100, max: 150, level: 2 };
    if (points < 500) return { current: points - 250, max: 250, level: 3 };
    if (points < 1000) return { current: points - 500, max: 500, level: 4 };
    return { current: points - 1000, max: points - 1000, level: 5 }; // Max level
}

async function fetchUserStats(userId: string): Promise<UserStats> {
    const supabase = createClient();

    // Need to gather data from multiple tables to build UserStats
    const { data: userData } = await supabase
        .from('users')
        .select('wellness_points, current_streak')
        .eq('id', userId)
        .single();

    const { data: sessionData } = await supabase
        .from('meditation_sessions')
        .select('id, effectiveness_score')
        .eq('user_id', userId);

    const { data: chatData } = await supabase
        .from('chat_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

    const totalMeditations = sessionData ? sessionData.length : 0;
    const maxStressReduction = sessionData
        ? Math.max(...sessionData.map(s => s.effectiveness_score || 0), 0)
        : 0;

    // Assume this month's stats can be roughly gathered or just placeholder if complex query omitted
    // For simplicity:
    return {
        totalMeditations,
        currentStreak: userData?.current_streak || 0,
        maxStressReduction,
        totalChatMessages: chatData?.length || 0,
        wellnessPoints: userData?.wellness_points || 0,
        meditationsThisMonth: totalMeditations, // Simplified without date grouping for now
        level: getLevel(userData?.wellness_points || 0)
    };
}

export async function updateMeditationStreak(userId: string) {
    const supabase = createClient();

    const { data: user } = await supabase
        .from('users')
        .select('current_streak, max_streak, last_meditation_date')
        .eq('id', userId)
        .single();

    if (!user) return { current_streak: 0, badge_earned: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = user.current_streak || 0;
    let lastDate = user.last_meditation_date ? new Date(user.last_meditation_date) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
        // First meditation ever
        newStreak = 1;
    } else if (lastDate.getTime() === yesterday.getTime()) {
        // Meditated yesterday, increment
        newStreak += 1;
    } else if (lastDate.getTime() === today.getTime()) {
        // Already meditated today, streak remains same
    } else {
        // Missed a day
        newStreak = 1;
    }

    const maxStreak = Math.max(newStreak, user.max_streak || 0);

    await supabase
        .from('users')
        .update({
            current_streak: newStreak,
            max_streak: maxStreak,
            last_meditation_date: new Date().toISOString()
        })
        .eq('id', userId);

    // Re-fetch stats to check badges
    const stats = await fetchUserStats(userId);
    stats.currentStreak = newStreak; // ensure latest streak is tested
    const { badges_earned } = await checkAndAwardBadges(userId, stats);

    return {
        current_streak: newStreak,
        badge_earned: badges_earned.length > 0 ? badges_earned[0] : null
    };
}

export async function awardMeditationPoints(
    userId: string,
    durationMinutes: number,
    preStress: number | null,
    postStress: number | null
) {
    const supabase = createClient();

    // 1. Calculate Base Points
    let pointsForDuration = Math.floor(durationMinutes / 2);
    let basePoints = Math.max(5, pointsForDuration); // min 5 pts

    // 2. Add Streak Bonus
    const { data: user } = await supabase
        .from('users')
        .select('current_streak, wellness_points')
        .eq('id', userId)
        .single();

    let currentStreak = user?.current_streak || 0;
    let streakBonus = Math.min(currentStreak * 2, 20); // max 20

    // 3. Effectiveness Bonus
    let effectivenessBonus = 0;
    let stressReduction = 0;
    if (preStress !== null && postStress !== null) {
        stressReduction = preStress - postStress;
        if (stressReduction >= 10) effectivenessBonus = 5;
    }

    let totalPointsEarned = basePoints + streakBonus + effectivenessBonus;

    // 4. Update total wellness points
    let newWellnessPoints = (user?.wellness_points || 0) + totalPointsEarned;

    await supabase
        .from('users')
        .update({ wellness_points: newWellnessPoints })
        .eq('id', userId);

    // 5. Update streak logic (will also insert new last_meditation_date)
    const streakRes = await updateMeditationStreak(userId);

    // 6. Check and award all possible badges
    const stats = await fetchUserStats(userId);
    stats.wellnessPoints = newWellnessPoints;
    stats.currentStreak = streakRes.current_streak;
    if (stressReduction > stats.maxStressReduction) stats.maxStressReduction = stressReduction;

    const { badges_earned } = await checkAndAwardBadges(userId, stats);

    return {
        points_earned: totalPointsEarned,
        total_points: newWellnessPoints,
        new_level: getLevel(newWellnessPoints),
        streak: streakRes.current_streak,
        badges_earned
    };
}
