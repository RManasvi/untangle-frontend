import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, ArrowRight, ArrowDownRight, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function RiskMeter({ riskData, loading }) {
    if (loading) {
        return (
            <Card className="border-slate-100 bg-white shadow-sm h-full">
                <CardContent className="pt-6 animate-pulse">
                    <div className="h-6 w-1/3 bg-slate-100 rounded mb-4" />
                    <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                </CardContent>
            </Card>
        );
    }

    if (!riskData) return null;

    const score = riskData.risk_score_internal;
    let category = riskData.category_level || 'Low';
    const slope = riskData.metrics_snapshot?.stressTrendSlope || 0;

    // Visuals computation
    let colorClass = 'bg-emerald-500';
    let textClass = 'text-emerald-700';
    let bgClass = 'bg-emerald-50';
    let Icon = ShieldCheck;
    let explanation = 'Your wellness metrics are balanced and stable. Keep up the good work!';

    if (riskData.metrics_snapshot?.count < 1) {
        colorClass = 'bg-slate-200';
        textClass = 'text-slate-400';
        bgClass = 'bg-slate-50';
        Icon = Activity;
        explanation = 'No biometric telemetry detected. Complete your first stress analysis scan to activate risk monitoring.';
        category = 'Offline';
    } else if (riskData.metrics_snapshot?.count < 3) {
        colorClass = 'bg-blue-400';
        textClass = 'text-blue-700';
        bgClass = 'bg-blue-50';
        Icon = Activity;
        explanation = 'Biometric baseline in progress. Monitoring active but accuracy will increase after 3+ sessions.';
        category = 'Establishing';
    } else if (category === 'High' || score >= 71) {
        colorClass = 'bg-red-500';
        textClass = 'text-red-700';
        bgClass = 'bg-red-50';
        Icon = AlertTriangle;
        explanation = 'Critical burnout indicators detected. Prioritize rest and seek support immediately.';
    } else if (category === 'Elevated' || score >= 51) {
        colorClass = 'bg-orange-500';
        textClass = 'text-orange-700';
        bgClass = 'bg-orange-50';
        Icon = Activity;
        explanation = 'Elevated stress markers detected. You are approaching burnout thresholds.';
    } else if (category === 'Moderate' || score >= 31) {
        colorClass = 'bg-yellow-500';
        textClass = 'text-yellow-700';
        bgClass = 'bg-yellow-50';
        Icon = Activity;
        explanation = 'Moderate stress accumulation. Small interventions now will prevent escalation.';
    }

    // Momentum Visuals
    // Slope: Positive means mood is improving (half2 - half1 > 0)
    // Which actually means risk is decreasing.
    let MomentumIcon = ArrowRight;
    let momentumText = 'Flat';
    let momentumColor = 'text-slate-500';

    if (slope > 0.5) {
        MomentumIcon = ArrowUpRight;
        momentumText = 'Improving';
        momentumColor = 'text-emerald-600';
    } else if (slope < -0.5) {
        MomentumIcon = ArrowDownRight;
        momentumText = 'Declining';
        momentumColor = 'text-red-500';
    }

    return (
        <Card className={`border-slate-100 bg-white shadow-md relative overflow-hidden`}>
            <div className={`absolute left-0 top-0 w-1.5 h-full ${colorClass}`}></div>
            <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        Burnout Risk Assessment
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${bgClass} ${textClass}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {category}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 mb-4">{explanation}</p>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1 flex">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</span>
                        <span className={`text-xs font-bold ${textClass}`}>{riskData.metrics_snapshot?.count >= 1 ? `${Math.round(score)}%` : '—'}</span>
                    </div>
                    {/* Progress bar mapping directly to score (0-1) => 0-100% */}
                    <Progress value={score} className={`h-2`} indicatorClassName={colorClass} />
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Recent Momentum</span>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${momentumColor}`}>
                        <MomentumIcon className="w-4 h-4" />
                        {momentumText}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
