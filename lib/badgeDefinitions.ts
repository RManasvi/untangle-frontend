export interface UserStats {
    totalMeditations: number;
    currentStreak: number;
    maxStressReduction: number;
    totalChatMessages: number;
    wellnessPoints: number;
    meditationsThisMonth: number;
    level: number;
}

export interface BadgeDef {
    id: string;
    name: string;
    icon: string;
    description: string;
    checkCondition: (stats: UserStats) => boolean;
}

export const BADGES: BadgeDef[] = [
    {
        id: 'badge_1_first_breath',
        name: 'Baseline Established',
        icon: '📋',
        description: 'Completed your first meditation session',
        checkCondition: (stats) => stats.totalMeditations >= 1,
    },
    {
        id: 'badge_2_week_warrior',
        name: 'Consistent Practice (7 days)',
        icon: '📊',
        description: 'Maintained 7-day adherence record',
        checkCondition: (stats) => stats.currentStreak >= 7,
    },
    {
        id: 'badge_3_month_master',
        name: 'Sustained Commitment (30 days)',
        icon: '📈',
        description: 'Maintained 30-day adherence record',
        checkCondition: (stats) => stats.currentStreak >= 30,
    },
    {
        id: 'badge_4_stress_slayer',
        name: 'Stress Reduction Mastery',
        icon: '🛡️',
        description: 'Achieved 30+ point stress reduction in one session',
        checkCondition: (stats) => stats.maxStressReduction >= 30,
    },
    {
        id: 'badge_5_chat_champion',
        name: 'Active Engagement',
        icon: '⚙️',
        description: 'Exceeded 50 interactions with expert companion',
        checkCondition: (stats) => stats.totalChatMessages >= 50,
    },
    {
        id: 'badge_6_century_club',
        name: 'Milestone: 100 Index Points',
        icon: '💯',
        description: 'Accumulated 100 Wellness Index points',
        checkCondition: (stats) => stats.wellnessPoints >= 100,
    },
    {
        id: 'badge_7_consistency_king',
        name: 'Adherence Excellence',
        icon: '🏆',
        description: 'Completed 10 sessions in one month',
        checkCondition: (stats) => stats.meditationsThisMonth >= 10,
    },
    {
        id: 'badge_8_wellness_guru',
        name: 'Advanced Wellness Practitioner',
        icon: '🎓',
        description: 'Reached Tier 5 wellness status',
        checkCondition: (stats) => stats.level >= 5,
    }
];
