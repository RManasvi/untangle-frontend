import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatCard({ log }) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    const getEmotionBadge = (emotion) => {
        if (!emotion) return (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200 capitalize shadow-sm">
                Neutral
            </span>
        );

        const lowerEmotion = emotion.toLowerCase();

        // Emotion background map
        // Happy → light green
        // Sad → light blue
        // Angry → soft red
        // Anxiety → lavender
        // Neutral → grey
        let colorClass = "bg-gray-100 text-gray-700 border-gray-200";

        if (lowerEmotion.includes('happy') || lowerEmotion.includes('joy') || lowerEmotion.includes('excited') || lowerEmotion.includes('wonderful')) {
            colorClass = "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]"; // green-100, green-800, green-200
        } else if (lowerEmotion.includes('sad') || lowerEmotion.includes('down') || lowerEmotion.includes('depressed')) {
            colorClass = "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]"; // blue-100, blue-800, blue-200
        } else if (lowerEmotion.includes('angry') || lowerEmotion.includes('frustrated') || lowerEmotion.includes('mad')) {
            colorClass = "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"; // red-100, red-800, red-200
        } else if (lowerEmotion.includes('anxiety') || lowerEmotion.includes('anxious') || lowerEmotion.includes('stress')) {
            colorClass = "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]"; // purple-100, purple-800, purple-200
        }

        return (
            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${colorClass} capitalize tracking-wide shadow-sm`}>
                {emotion.replace('feeling ', '').replace('Feeling ', '')}
            </span>
        );
    };

    const formattedTime = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Card
            onClick={() => setExpanded(!expanded)}
            className={`border-slate-200 bg-white/90 hover:bg-white backdrop-blur shadow-sm hover:shadow-md transition-all duration-300 rounded-[16px] overflow-hidden cursor-pointer group ${expanded ? 'ring-2 ring-blue-100 shadow-md transform-none' : 'hover:-translate-y-[2px]'}`}
        >
            <CardContent className="p-4 sm:p-5 relative">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Header: Time and Emotion */}
                        <div className="flex items-center gap-3 mb-3 shrink-0">
                            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                {formattedTime}
                            </span>
                            {getEmotionBadge(log.emotion)}
                        </div>

                        {/* Message Preview */}
                        <div className={`space-y-1.5 transition-all duration-300 ${expanded ? 'opacity-0 h-0 hidden' : 'opacity-100 block'}`}>
                            <div className="flex gap-2">
                                <p className="text-[15px] font-bold text-slate-800 line-clamp-1 flex-1 font-outfit">
                                    <span className="text-slate-400 mr-1.5 font-medium select-none">You:</span>
                                    {log.user_message}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">
                                    <span className="font-semibold text-blue-500 mr-1.5 select-none">AI:</span>
                                    {log.ai_response}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action icon */}
                    <div className="shrink-0 pt-1 flex flex-col items-center">
                        <div className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${expanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                <div
                    className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`}
                >
                    <div className="overflow-hidden">
                        {/* Full Conversation View */}
                        <div className="space-y-4 pt-2">
                            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 shadow-sm relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 rounded-l-xl"></div>
                                <p className="text-[11px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    Your Message
                                </p>
                                <p className="text-[15px] text-slate-800 font-medium leading-relaxed font-outfit">"{log.user_message}"</p>
                            </div>

                            <div className="bg-[#f0f9ff]/80 p-4 rounded-xl border border-blue-100 shadow-sm relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 rounded-l-xl"></div>
                                <p className="text-[11px] text-blue-600 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                    Untangle Assistant
                                </p>
                                <p className="text-[14px] text-slate-700 leading-relaxed max-w-none prose prose-slate">
                                    {log.ai_response}
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[13px] font-bold transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/chat?resume_date=${encodeURIComponent(log.created_at)}`);
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Continue this Conversation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
