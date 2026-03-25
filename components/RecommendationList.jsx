import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RecommendationList({ recommendations, loading }) {
    if (loading) {
        return (
            <Card className="border-indigo-100 bg-white shadow-sm h-full w-full">
                <CardContent className="pt-6 animate-pulse space-y-4">
                    <div className="h-6 w-1/4 bg-slate-100 rounded mb-4" />
                    <div className="h-20 w-full bg-slate-100 rounded" />
                    <div className="h-20 w-full bg-slate-100 rounded" />
                </CardContent>
            </Card>
        );
    }

    if (!recommendations || recommendations.length === 0) return null;

    return (
        <Card className="border-indigo-100 bg-white shadow-md h-full w-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <CardTitle className="text-slate-900 text-lg">Actionable Steps</CardTitle>
                        <CardDescription>Generated specifically for your current metrics & memory profile.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                        <div
                            key={idx}
                            className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="flex flex-col gap-2 relative z-10">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {rec.title}
                                    </h4>
                                    {rec.difficulty && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rec.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                                                rec.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {rec.difficulty} // Quick
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm font-medium text-slate-700 leading-relaxed mt-1">
                                    {rec.description}
                                </p>

                                {rec.why_it_works && (
                                    <div className="mt-3 p-3 bg-white/60 border border-slate-100/60 rounded-lg text-xs text-slate-600 italic leading-relaxed flex gap-2 w-full">
                                        <span className="font-bold whitespace-nowrap not-italic text-indigo-500">Why this matters:</span>
                                        {rec.why_it_works}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
