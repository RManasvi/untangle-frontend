'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];

export default function ExecutiveHeatmap({ logs, loading }) {
    if (loading) {
        return (
            <Card className="border-slate-100 bg-white shadow-sm overflow-hidden h-[300px]">
                <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center">
                    <Activity className="h-8 w-8 text-slate-200" />
                </div>
            </Card>
        );
    }

    // Aggregate data: Group by Day and 3-hour chunks (to keep grid clean)
    const grid = Array(7).fill(0).map(() => Array(8).fill(null).map(() => ({ sum: 0, count: 0 })));

    if (logs && logs.length > 0) {
        logs.forEach(log => {
            const date = new Date(log.created_at);
            const day = date.getDay();
            const hour = date.getHours();
            const chunk = Math.floor(hour / 3);

            if (grid[day] && grid[day][chunk]) {
                grid[day][chunk].sum += Number(log.stress_score);
                grid[day][chunk].count += 1;
            }
        });
    }

    const getIntensityColor = (score) => {
        if (score === 0) return 'bg-slate-50';
        if (score < 0.2) return 'bg-emerald-100/60 dark:bg-emerald-900/10';
        if (score < 0.4) return 'bg-emerald-200 dark:bg-emerald-800/20';
        if (score < 0.6) return 'bg-amber-100 dark:bg-amber-900/30';
        if (score < 0.8) return 'bg-orange-200 dark:bg-orange-800/40';
        return 'bg-rose-500/80 dark:bg-rose-900/60';
    };

    return (
        <Card className="border-slate-100 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-slate-900 text-lg font-bold flex items-center justify-between">
                    Operational Stress Heatmap
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7-Day Biometric Load</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-9 gap-1.5">
                        {/* Hour Labels */}
                        <div className="col-span-1"></div>
                        {HOURS.map(h => (
                            <div key={h} className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tighter">{h}</div>
                        ))}

                        {/* Grid Rows */}
                        {DAYS.map((dayName, dayIdx) => (
                            <React.Fragment key={dayName}>
                                <div className="text-[9px] font-black text-slate-500 uppercase flex items-center h-8 leading-none">{dayName}</div>
                                {grid[dayIdx].map((cell, hourIdx) => {
                                    const avg = cell.count > 0 ? cell.sum / cell.count : 0;
                                    return (
                                        <div
                                            key={hourIdx}
                                            className={`h-8 rounded-[2px] ${getIntensityColor(avg)} transition-all duration-500 relative group border border-white/5`}
                                        >
                                            {avg > 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <span className="text-[8px] font-mono font-black text-slate-900/40">
                                                        {Math.round(avg * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-100"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Stable</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-orange-200"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Active</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-rose-500/80"></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Peak</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Biometric pattern detection active</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
