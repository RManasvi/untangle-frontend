import { createClient } from '@supabase/supabase-js';

/**
 * Normalizes metrics into a 0.0 - 1.0 Burnout Risk Score
 * Recruiter-level design: Uses a strict mathematical weighting mechanism 
 * avoiding LLM hallucination for risk evaluation. 
 */
/**
 * Normalizes metrics into a 0 - 100 Burnout Risk Score
 */
function calculateBurnoutRisk(metrics) {
    const {
        avgStress7d,
        stressTrendSlope,
        stressVariance,
        meditationFrequency,
        lateNightRatio
    } = metrics;

    // Normalization to 0-100 scale
    // 1. Avg Stress: Already 0.0-1.0 from DB -> 0-100
    const stressNorm = (avgStress7d || 0) * 100;

    // 2. Stress Trend Slope: Linear regression slope
    // A slope of 0.05 per day (35% increase per week) is significant.
    const slopeNorm = Math.min(Math.max((stressTrendSlope || 0) / 0.05 * 100, 0), 100);

    // 3. Stress Variance: Volatility
    // Standard deviation of 0.2 (20% fluctuations) is high.
    const varianceNorm = Math.min((stressVariance || 0) / 0.2 * 100, 100);

    // 4. Meditation Frequency: 7 sessions/week = 100%
    const meditationNorm = Math.min((meditationFrequency || 0) / 7 * 100, 100);

    // 5. Late Night Ratio: Percentage (0-100)
    const lateNightNorm = lateNightRatio || 0;

    // Final Weighted Formula
    let burnoutScore =
        (0.4 * stressNorm) +
        (0.2 * slopeNorm) +
        (0.15 * varianceNorm) -
        (0.15 * meditationNorm) +
        (0.1 * lateNightNorm);

    return Math.max(burnoutScore, 0);
}

function getRiskCategory(score) {
    if (score >= 71) return { level: 'High', label: 'High' };
    if (score >= 51) return { level: 'Elevated', label: 'Elevated' };
    if (score >= 31) return { level: 'Moderate', label: 'Moderate' };
    return { level: 'Low', label: 'Low' };
}

export async function POST(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = request.headers.get('authorization');
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Fetch logs for the last 14 days
        const { data: allStressLogs, error: stressError } = await supabase
            .from('stress_logs')
            .select('stress_score, created_at')
            .eq('user_id', user.id)
            .gte('created_at', fourteenDaysAgo.toISOString())
            .order('created_at', { ascending: true });

        if (stressError) throw stressError;

        const { data: allMoodLogs, error: moodError } = await supabase
            .from('mood_entries')
            .select('mood_value, created_at')
            .eq('user_id', user.id)
            .gte('created_at', fourteenDaysAgo.toISOString());

        if (moodError) throw moodError;

        const { data: medSessions, error: medError } = await supabase
            .from('meditation_sessions')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', fourteenDaysAgo.toISOString());

        if (medError) throw medError;

        // Split into Current Week (0-7d) and Previous Week (7-14d)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const currentStress = allStressLogs.filter(l => new Date(l.created_at) >= sevenDaysAgo);
        const previousStress = allStressLogs.filter(l => new Date(l.created_at) < sevenDaysAgo);

        const currentMood = allMoodLogs.filter(l => new Date(l.created_at) >= sevenDaysAgo);
        const previousMood = allMoodLogs.filter(l => new Date(l.created_at) < sevenDaysAgo);

        const hasHistoricalData = previousStress.length > 0 || previousMood.length > 0;

        // --- STATISTICAL CALCULATIONS ---

        const scores = currentStress.map(l => parseFloat(l.stress_score));
        const count = scores.length;

        // 1. Avg Stress & Trend
        const avgStress7d = count > 0 ? scores.reduce((a, b) => a + b, 0) / count : 0;

        let stressTrendPercentage = null;
        if (previousStress.length > 0 && avgStress7d > 0) {
            const prevAvgVal = previousStress.reduce((a, b) => parseFloat(a) + parseFloat(b.stress_score), 0) / previousStress.length;
            stressTrendPercentage = ((avgStress7d - prevAvgVal) / prevAvgVal) * 100;
        }

        // 2. Stress Variance
        const variance = count > 1
            ? Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - avgStress7d, 2), 0) / (count - 1))
            : 0;

        // 3. Stress Trend Slope (Regression)
        let slope = 0;
        if (count > 1) {
            const sumX = currentStress.reduce((acc, l, i) => acc + i, 0);
            const sumY = scores.reduce((acc, s) => acc + s, 0);
            const sumXY = currentStress.reduce((acc, l, i) => acc + (i * scores[i]), 0);
            const sumXX = currentStress.reduce((acc, l, i) => acc + (i * i), 0);
            slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
        }

        // 4. Late Night Ratio & Peak Hour
        const lateNightCount = currentStress.filter(l => {
            const hour = new Date(l.created_at).getHours();
            return hour >= 22;
        }).length;
        const lateNightRatio = count > 0 ? (lateNightCount / count) * 100 : 0;

        // Group by hour for peak analysis
        const hourBins = new Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));
        currentStress.forEach(l => {
            const h = new Date(l.created_at).getHours();
            hourBins[h].sum += parseFloat(l.stress_score);
            hourBins[h].count++;
        });

        let peakStressHour = 0;
        let maxAvg = 0;
        hourBins.forEach((bin, h) => {
            const avg = bin.count > 0 ? bin.sum / bin.count : 0;
            if (avg > maxAvg) {
                maxAvg = avg;
                peakStressHour = h;
            }
        });

        // 5. Mood Trend
        let moodTrend = null;
        if (currentMood.length > 0 && previousMood.length > 0) {
            const avgMood7d = currentMood.reduce((a, b) => a + b.mood_value, 0) / currentMood.length;
            const prevAvgMood = previousMood.reduce((a, b) => a + b.mood_value, 0) / previousMood.length;
            moodTrend = avgMood7d - prevAvgMood;
        }

        // 6. Meditation Frequency & Recovery Efficiency Calculation
        const currentMedSessions = medSessions.filter(s => new Date(s.created_at) >= sevenDaysAgo);
        const meditationFrequency = currentMedSessions.length;

        let recoveryEfficiency = 0;
        let recoveryDataPoints = 0;

        if (meditationFrequency > 0) {
            let totalPostStress = 0;
            let postStressCount = 0;

            currentMedSessions.forEach(session => {
                const sessionTime = new Date(session.created_at).getTime();
                const oneHourLater = sessionTime + (60 * 60 * 1000);

                // Find stress logs within 60 mins AFTER session
                const postLogs = currentStress.filter(l => {
                    const logTime = new Date(l.created_at).getTime();
                    return logTime > sessionTime && logTime <= oneHourLater;
                });

                if (postLogs.length > 0) {
                    const avgPost = postLogs.reduce((a, b) => a + parseFloat(b.stress_score), 0) / postLogs.length;
                    totalPostStress += avgPost;
                    postStressCount++;
                }
            });

            if (postStressCount > 0) {
                const avgPostRecoveryStress = totalPostStress / postStressCount;
                // Efficiency is % reduction compared to baseline
                if (avgStress7d > 0) {
                    recoveryEfficiency = ((avgStress7d - avgPostRecoveryStress) / avgStress7d) * 100;
                }
                recoveryDataPoints = postStressCount;
            }
        }

        // 7. Generate Senior-Level Weekly Analytical Summary
        let weeklySummary = "Establishing biometric baseline. Complete 3+ sessions to activate predictive trend analysis.";

        if (count >= 1) {
            const stressStatus = avgStress7d > 0.65 ? "High-Load" : avgStress7d > 0.45 ? "Optimal-Active" : "Stable";
            const moodScore = currentMood.length > 0 ? (currentMood.reduce((a, b) => a + b.mood_value, 0) / currentMood.length) : 0;
            const moodStatus = moodScore > 8.0 ? "Optimized" : moodScore > 6.0 ? "Productive" : "Sub-Optimal";
            const volatility = variance > 0.15 ? "High Volatility" : "Regulated";

            weeklySummary = `Performance Assessment: [Stress: ${stressStatus}] | [Cognitive Mood: ${moodStatus}] | [Stability: ${volatility}]. `;

            if (count >= 3 && stressTrendPercentage !== null) {
                const direction = stressTrendPercentage > 0 ? "ascension" : "stabilization";
                weeklySummary += `Detected ${Math.abs(Math.round(stressTrendPercentage))}% ${direction} in biometric load relative to previous baseline. `;
            }

            if (recoveryDataPoints > 0) {
                weeklySummary += `Recovery efficiency verified at ${Math.round(recoveryEfficiency)}% post-meditation.`;
            } else if (meditationFrequency > 0) {
                weeklySummary += "Awaiting post-meditation biometric scan to verify recovery efficacy.";
            }
        }

        const metrics = {
            avgStress7d,
            stressTrendPercentage,
            stressTrendSlope: slope,
            stressVariance: variance,
            meditationFrequency,
            recoveryEfficiency,
            recoveryDataPoints,
            lateNightRatio,
            peakStressHour,
            peakStressValue: maxAvg,
            moodTrend,
            hasHistoricalData,
            count: count
        };

        const burnoutScore = calculateBurnoutRisk(metrics);
        const category = getRiskCategory(burnoutScore);

        return Response.json({
            success: true,
            risk_score_internal: burnoutScore,
            category_label: category.label,
            category_level: category.level,
            weekly_summary: weeklySummary,
            metrics_snapshot: metrics
        });

    } catch (error) {
        console.error("[Untangle] Risk Score API Error:", error);
        return Response.json({ error: 'Failed to calculate risk score' }, { status: 500 });
    }
}
