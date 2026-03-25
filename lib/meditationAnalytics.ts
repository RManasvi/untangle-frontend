export interface MeditationRecommendation {
    recommended_duration: number;
    recommended_time: 'morning' | 'afternoon' | 'evening';
    recommended_style: string;
    message: string;
    success_rate: number;
}

export async function getAdaptedRecommendations(userId: string, supabase: any): Promise<MeditationRecommendation> {

    // Fetch last 10 sessions with feedback
    const { data: sessions, error } = await supabase
        .from('meditation_sessions')
        .select(`
      id, 
      session_type, 
      duration_minutes, 
      session_date, 
      effectiveness_score, 
      effectiveness_classification,
      meditation_feedback ( benefits_felt )
    `)
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .limit(10);

    if (error || !sessions || sessions.length === 0) {
        // Default fallback
        return {
            recommended_duration: 5,
            recommended_time: 'morning',
            recommended_style: 'breathing',
            message: 'Start with 5-minute breathing exercises to build a habit.',
            success_rate: 0
        };
    }

    const durationEffectiveness: Record<number, number[]> = {};
    const timeEffectiveness: Record<string, number[]> = { morning: [], afternoon: [], evening: [] };
    const styleEffectiveness: Record<string, number[]> = {};
    const benefitCounts: Record<string, number> = {};

    let effectiveCount = 0;

    for (const session of sessions) {
        const score = session.effectiveness_score || 0;
        const dur = session.duration_minutes;
        const style = session.session_type || 'mindfulness';

        // Classify time of day
        const hour = new Date(session.session_date).getHours();
        let timeOfDay = 'evening';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';

        if (!durationEffectiveness[dur]) durationEffectiveness[dur] = [];
        durationEffectiveness[dur].push(score);

        timeEffectiveness[timeOfDay].push(score);

        if (!styleEffectiveness[style]) styleEffectiveness[style] = [];
        styleEffectiveness[style].push(score);

        // Track benefits
        if (session.meditation_feedback && session.meditation_feedback.length > 0) {
            const benefits = session.meditation_feedback[0].benefits_felt || [];
            benefits.forEach((b: string) => {
                benefitCounts[b] = (benefitCounts[b] || 0) + 1;
            });
        }

        if (session.effectiveness_classification === 'effective' || session.effectiveness_classification === 'highly_effective') {
            effectiveCount++;
        }
    }

    const successRate = (effectiveCount / sessions.length) * 100;

    // Find best duration
    let bestDuration = 5;
    let maxDurScore = -1;
    for (const [dur, scores] of Object.entries(durationEffectiveness)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > maxDurScore) {
            maxDurScore = avg;
            bestDuration = parseInt(dur, 10);
        }
    }

    // Find best time
    let bestTime: 'morning' | 'afternoon' | 'evening' = 'morning';
    let maxTimeScore = -1;
    for (const [t, scores] of Object.entries(timeEffectiveness)) {
        if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > maxTimeScore) {
                maxTimeScore = avg;
                bestTime = t as 'morning' | 'afternoon' | 'evening';
            }
        }
    }

    // Find best style
    let bestStyle = 'breathing';
    let maxStyleScore = -1;
    for (const [s, scores] of Object.entries(styleEffectiveness)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > maxStyleScore) {
            maxStyleScore = avg;
            bestStyle = s;
        }
    }

    // Find top benefit
    let topBenefit = '';
    let maxCount = 0;
    for (const [b, count] of Object.entries(benefitCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topBenefit = b;
        }
    }

    // Generate Message
    let message = "";
    if (successRate > 80) {
        message = `Amazing consistency! Keep up your ${bestDuration}-min sessions in the ${bestTime}.`;
    } else if (successRate >= 50) {
        message = `You're making progress. Based on your history, ${bestDuration}-min ${bestStyle} exercises work best in the ${bestTime}!`;
    } else {
        message = `We are still learning to find your rhythm. Try returning to a short 5-min guided session today.`;
    }

    if (topBenefit === "Calm" || topBenefit === "Peaceful") {
        bestStyle = "breathing";
    } else if (topBenefit === "Focused") {
        bestStyle = "body_scan";
    }

    return {
        recommended_duration: bestDuration,
        recommended_time: bestTime,
        recommended_style: bestStyle,
        message,
        success_rate: Math.round(successRate)
    };
}
