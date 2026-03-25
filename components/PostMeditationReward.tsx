'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Medal, CalendarCheck, Star, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostMeditationRewardProps {
    stats: {
        pointsEarned: number;
        totalPoints: number;
        newLevel: number;
        streak: number;
        badgesEarned: string[];
        stressReduction: number;
    };
    onClose: () => void;
}

export default function PostMeditationReward({ stats, onClose }: PostMeditationRewardProps) {
    const router = useRouter();

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-500 rounded-2xl">
                <div className="h-2 w-full bg-slate-900" />

                <CardHeader className="text-center pt-8 pb-4 relative">
                    <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-100">
                        <CheckCircle2 className="h-10 w-10 text-slate-900" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Session Complete</CardTitle>
                    <p className="text-slate-500 text-sm mt-2 font-medium px-6">Your personalized wellness protocol has been successfully logged.</p>
                </CardHeader>

                <CardContent className="space-y-6 px-8 pb-8">

                    {/* Index & Tier */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index Increase</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900">+{stats.pointsEarned}</span>
                                    <span className="text-xs font-semibold text-slate-500">index</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Tier</p>
                            <p className="text-xl font-black text-slate-800">Tier {stats.newLevel}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Stress Reduction */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Stress Reduction</p>
                                <p className="font-bold text-slate-800">-{stats.stressReduction}%</p>
                            </div>
                        </div>

                        {/* Consistency */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                            <div className="bg-emerald-50 p-2 rounded-lg">
                                <CalendarCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Consistency</p>
                                <p className="font-bold text-slate-800">{stats.streak} Days</p>
                            </div>
                        </div>
                    </div>

                    {/* Milestones Earned */}
                    {stats.badgesEarned && stats.badgesEarned.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">New Professional Milestones</p>
                            <div className="flex flex-col gap-2">
                                {stats.badgesEarned.map((badge, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100 animate-in slide-in-from-left-4 duration-500">
                                        <Medal className="h-5 w-5 text-blue-700" />
                                        <span className="font-bold text-blue-900 text-sm">{badge}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 rounded-xl text-md font-semibold transition-all"
                        >
                            Return to Portfolio
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 font-medium"
                        >
                            Dismiss
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
