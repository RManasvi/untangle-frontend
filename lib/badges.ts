import { createServerClient } from '@/lib/supabaseServer';
import { BADGES, BadgeDef, UserStats } from './badgeDefinitions';

// Re-export types for compatibility where needed
export type { BadgeDef, UserStats };
export { BADGES };

/**
 * Server-only function to check conditions and award badges via Supabase service-role.
 * Safe to call from API routes. NEVER call from the browser.
 */
export async function checkAndAwardBadges(userId: string, stats: UserStats) {
    // ✅ FIX Issue 3: Use server client (service-role key) to bypass RLS
    const supabase = createServerClient();
    const earnedBadges: BadgeDef[] = [];

    // Check which badges user qualifies for
    for (const badge of BADGES) {
        if (badge.checkCondition(stats)) {
            earnedBadges.push(badge);
        }
    }

    const newlyEarned: string[] = [];

    if (earnedBadges.length > 0) {
        for (const badge of earnedBadges) {
            const { error } = await supabase.from('badges').insert({
                user_id: userId,
                badge_name: badge.name,
                badge_description: badge.description,
                icon_emoji: badge.icon
            });

            if (!error) {
                newlyEarned.push(badge.name);
                console.log(`[Badges] ✅ Awarded "${badge.name}" to user ${userId}`);
            } else if (error.code === '23505') {
                // Expected: unique constraint violation — badge already earned, silently skip
            } else {
                // ✅ FIX Issue 3: Properly destructure error object — plain `error` logs as {}
                console.error(
                    `[Badges] ❌ Insert failed for "${badge.name}":`,
                    error?.message, '| code:', error?.code, '| details:', error?.details
                );
            }
        }
    }

    return { badges_earned: newlyEarned };
}
