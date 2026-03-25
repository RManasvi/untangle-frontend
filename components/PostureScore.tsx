'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert, Shield, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface PostureScoreProps {
    score: number;
    alerts: string[];
    recommendation: string;
}

export default function PostureScore({ score, alerts, recommendation }: PostureScoreProps) {
    // Determine colors based on score
    const isGood = score >= 75;
    const isOk = score >= 50 && score < 75;
    const isPoor = score < 50;

    const accentColor = isGood ? 'text-emerald-400' : isOk ? 'text-amber-400' : 'text-rose-400';
    const strokeColor = isGood ? '#10b981' : isOk ? '#f59e0b' : '#f43f5e';
    const glowColor = isGood ? 'shadow-emerald-500/20' : isOk ? 'shadow-amber-500/20' : 'shadow-rose-500/20';

    // SVG Circle properties
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Filter out contradicting recommendations if alerts are present
    const cleanRecommendation = alerts.length > 0 && recommendation.includes("Good posture")
        ? "Address the posture alerts below to reach peak performance."
        : recommendation;

    return (
        <Card className={`relative overflow-hidden bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-slate-700`}>
            {/* Background Glow Overlay */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 blur-3xl ${isGood ? 'bg-emerald-500' : isOk ? 'bg-amber-500' : 'bg-rose-500'}`} />

            <div className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Radial Score Gauge */}
                    <div className="relative flex-shrink-0">
                        <svg className="h-32 w-32 rotate-[-90deg]">
                            {/* Background Track */}
                            <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-800"
                            />
                            {/* Progress Ring */}
                            <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                stroke={strokeColor}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-1">
                            <span className="text-3xl font-black text-white leading-none">{score}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">/ 100</span>
                        </div>
                    </div>

                    {/* Stats & Info */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="space-y-1">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Biometric Alignment</h3>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className={`text-xl font-bold ${accentColor}`}>
                                    {isGood ? 'Optimal Posture' : isOk ? 'Sub-Optimal Alignment' : 'Critical Correction Required'}
                                </span>
                                {isGood ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className={`h-5 w-5 ${accentColor}`} />}
                            </div>
                        </div>

                        <p className="text-sm font-medium text-slate-300 leading-relaxed bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3">
                            {cleanRecommendation || "Scanning skeletal structure..."}
                        </p>
                    </div>
                </div>

                {/* Detailed Alerts Section */}
                {alerts.length > 0 && (
                    <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-[1px] flex-1 bg-slate-800" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Correction Protocols</span>
                            <div className="h-[1px] flex-1 bg-slate-800" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className="group relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600 transition-all duration-300"
                                >
                                    <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-700 group-hover:scale-110 transition-transform ${isPoor ? 'text-rose-400' : 'text-amber-400'}`}>
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{alert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Indicator Bar */}
            <div className={`h-1 w-full bg-slate-800`}>
                <div
                    className={`h-full transition-all duration-1000 ${isGood ? 'bg-emerald-500' : isOk ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </Card>
    );
}
