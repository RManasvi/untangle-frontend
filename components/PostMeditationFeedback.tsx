'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, CheckCircle2 } from 'lucide-react';
import { getFeedbackMessage } from '@/lib/adaptiveLogic';

interface PostMeditationFeedbackProps {
    stats: {
        reduction: number;
        classification: string;
        pointsEarned: number;
        totalPoints: number;
        newLevel: number;
        streak: number;
        badgesEarned: string[];
        sessionId?: string;
    };
    onClose: () => void;
    onContinue: () => void;
}

const BENEFIT_OPTIONS = ['Calm', 'Focused', 'Energized', 'Relieved', 'Peaceful'];

export default function PostMeditationFeedback({ stats, onClose, onContinue }: PostMeditationFeedbackProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [benefits, setBenefits] = useState<string[]>([]);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const feedbackData = getFeedbackMessage(stats.classification, stats.reduction);

    const toggleBenefit = (b: string) => {
        setBenefits(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setLoading(true);

        try {
            if (stats.sessionId) {
                await fetch('/api/meditation/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: stats.sessionId,
                        rating,
                        benefits,
                        feedback,
                        classification: stats.classification,
                    })
                });
            }
            setSubmitted(true);
            setTimeout(() => onContinue(), 2500); // Wait briefly then trigger router
        } catch (err) {
            console.error(err);
            onContinue();
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 px-6 animate-in fade-in duration-300">
                <Card className="max-w-md w-full border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-500 rounded-2xl text-center py-12">
                    <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6 drop-shadow-md animate-bounce" />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Got it!</h2>
                    <p className="text-slate-500 font-medium mt-2">Your feedback helps us personalize your journey.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
            <Card className="max-w-md w-full my-auto border-0 shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-500 rounded-2xl">
                <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

                <CardHeader className="text-center pt-8 pb-4 relative">
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">{feedbackData.title}</CardTitle>
                    <p className="text-slate-500 text-sm mt-2 font-medium bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100 mx-auto">
                        Stress reduced from pre-session → {stats.reduction}% reduction ✅
                    </p>
                    <p className="text-indigo-600 font-bold mt-4 text-sm px-4 py-2 bg-indigo-50 rounded-xl leading-snug mx-4 border border-indigo-100">
                        {feedbackData.suggestion}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 px-8 pb-8">

                    {/* Rating */}
                    <div className="text-center space-y-3">
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">How effective was this session?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="transition-transform duration-200 hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        className={`h-10 w-10 ${(hoverRating || rating) >= star
                                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                                : 'text-slate-200 fill-slate-100'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider text-center">What benefits do you feel?</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {BENEFIT_OPTIONS.map(b => (
                                <button
                                    key={b}
                                    onClick={() => toggleBenefit(b)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${benefits.includes(b)
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    {benefits.includes(b) ? '✓ ' : ''}{b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div>
                        <Input
                            placeholder="Any notes or thoughts? (Optional)"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 rounded-xl text-md font-semibold disabled:opacity-50 transition-all duration-300"
                        >
                            {loading ? "Saving..." : "Submit & Continue"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 font-medium"
                        >
                            Skip
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
