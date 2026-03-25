import { createClient } from '@/lib/supabaseClient';

export function calculateEffectiveness(preStress: number | null, postStress: number | null): number {
    if (preStress === null || postStress === null || preStress === 0) return 0;

    // Formula: ((pre_stress - post_stress) / pre_stress) * 100
    const reduction = ((preStress - postStress) / preStress) * 100;
    return Math.max(0, parseFloat(reduction.toFixed(1)));
}

export function classifyEffectiveness(effectivenessScore: number): string {
    if (effectivenessScore > 25) return "highly_effective";
    if (effectivenessScore > 15) return "effective";
    if (effectivenessScore > 5) return "somewhat_effective";
    return "needs_improvement";
}

export function getFeedbackMessage(classification: string, stressReduction: number): {
    title: string;
    message: string;
    suggestion: string;
    bonusPoints: number;
} {
    switch (classification) {
        case "highly_effective":
            return {
                title: "Excellent work! 🎉",
                message: `You reduced stress by ${stressReduction}%.`,
                suggestion: "Your recent sessions are most effective. Keep it up! Go again or try a longer session for deeper relaxation?",
                bonusPoints: 10
            };
        case "effective":
            return {
                title: "Great session! 💪",
                message: `You reduced stress by ${stressReduction}%.`,
                suggestion: "You're making progress. Try tomorrow at the same time? Chat with me about what helped?",
                bonusPoints: 5
            };
        case "somewhat_effective":
            return {
                title: "Good effort! 👍",
                message: `You reduced stress by ${stressReduction}%.`,
                suggestion: "Small steps count. Keep practicing! Try a longer session next time (10+ minutes) or guided meditation might help.",
                bonusPoints: 3
            };
        case "needs_improvement":
        default:
            return {
                title: "Session complete.",
                message: "Let's find what works for you.",
                suggestion: "Sometimes meditation takes time to feel the effects. Try different styles: breathing, body scan, or guided. Let's adjust: try 10 minutes instead of 5?",
                bonusPoints: 1
            };
    }
}
