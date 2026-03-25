import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, SortDesc, SortAsc, MessageSquare } from 'lucide-react';
import ChatGroupByDate from './ChatGroupByDate';
import { useRouter } from 'next/navigation';

// Utility for fallback data if none is provided
const generateMockData = () => {
    const mock = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    mock.push({
        id: '1',
        created_at: today.toISOString(),
        emotion: 'happy',
        user_message: 'I won the hackathon today!',
        ai_response: 'That is incredible news! Congratulations on your hard work paying off. How are you celebrating?'
    });
    mock.push({
        id: '2',
        created_at: new Date(today.getTime() - 3600000).toISOString(),
        emotion: 'anxiety',
        user_message: 'I am so stressed about my upcoming presentation.',
        ai_response: 'It is completely normal to feel that way. Let us try a quick breathing exercise together. Breathe in for 4 seconds...'
    });
    mock.push({
        id: '3',
        created_at: yesterday.toISOString(),
        emotion: 'neutral',
        user_message: 'Just finishing some routine work.',
        ai_response: 'Got it. Remember to take screen breaks throughout the day!'
    });

    return mock;
};

export default function ChatDashboard({ logs = [], isLoading = false }) {
    const router = useRouter();
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first
    const [searchQuery, setSearchQuery] = useState('');
    const [emotionFilter, setEmotionFilter] = useState('all');

    const displayLogs = logs && logs.length > 0 ? logs : (isLoading ? [] : generateMockData());

    const filteredLogs = useMemo(() => {
        return displayLogs.filter((log) => {
            // Search text match
            const userMsg = log.user_message || '';
            const aiMsg = log.ai_response || '';
            const matchesSearch =
                userMsg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                aiMsg.toLowerCase().includes(searchQuery.toLowerCase());

            // Emotion match
            let emotionFound = log.emotion ? log.emotion.toLowerCase().replace('feeling ', '') : 'neutral';
            if (emotionFound.includes('joy') || emotionFound.includes('excited') || emotionFound.includes('wonderful')) emotionFound = 'happy';
            else if (emotionFound.includes('down') || emotionFound.includes('depressed')) emotionFound = 'sad';
            else if (emotionFound.includes('frustrated') || emotionFound.includes('mad')) emotionFound = 'angry';
            else if (emotionFound.includes('anxious') || emotionFound.includes('stress')) emotionFound = 'anxiety';
            else if (emotionFound === '') emotionFound = 'neutral';

            const matchesEmotion = emotionFilter === 'all' || emotionFound.includes(emotionFilter);

            return matchesSearch && matchesEmotion;
        });
    }, [displayLogs, searchQuery, emotionFilter]);

    const groupedAndSortedLogs = useMemo(() => {
        // 1. Sort
        const sorted = [...filteredLogs].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        // 2. Group by Date
        const groups = {};
        sorted.forEach(log => {
            const d = new Date(log.created_at);
            const dateLabel = d.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (!groups[dateLabel]) {
                groups[dateLabel] = [];
            }
            groups[dateLabel].push(log);
        });

        return groups;
    }, [filteredLogs, sortOrder]);

    const uniqueEmotions = useMemo(() => {
        const emotions = new Set(displayLogs.map(l => {
            if (!l.emotion) return 'neutral';
            let em = l.emotion.toLowerCase().replace('feeling ', '');
            if (em.includes('happy') || em.includes('joy') || em.includes('excited') || em.includes('wonderful')) return 'happy';
            if (em.includes('sad') || em.includes('down') || em.includes('depressed')) return 'sad';
            if (em.includes('anxiety') || em.includes('stress') || em.includes('anxious')) return 'anxiety';
            if (em.includes('angry') || em.includes('frustrated') || em.includes('mad')) return 'angry';
            return em || 'neutral';
        }));
        return Array.from(emotions);
    }, [displayLogs]);

    return (
        <Card className="border-blue-100 bg-white shadow-xl rounded-2xl overflow-hidden mt-8 transition-all hover:shadow-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5">
                <div>
                    <CardTitle className="text-slate-900 text-xl font-bold font-outfit flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        Detailed Chat History
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Your recent conversations and emotional insights grouped by date</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 border-slate-200 bg-white text-sm rounded-xl focus-visible:ring-blue-500 shadow-sm"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex-shrink-0 relative group">
                        <select
                            value={emotionFilter}
                            onChange={(e) => setEmotionFilter(e.target.value)}
                            className="h-9 w-36 appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl pl-3 pr-8 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm capitalize hover:bg-slate-50 transition-colors"
                        >
                            <option value="all">All Emotions</option>
                            {uniqueEmotions.map(em => (
                                <option key={em} value={em}>{em}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="h-9 px-3 border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-sm transition-colors"
                    >
                        {sortOrder === 'desc' ? <SortDesc className="h-4 w-4 mr-2 text-slate-400" /> : <SortAsc className="h-4 w-4 mr-2 text-slate-400" />}
                        {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </Button>

                    <Button
                        onClick={() => router.push('/chat')}
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm font-semibold transition-all ml-auto md:ml-0"
                    >
                        New Chat
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 bg-slate-50/30">
                <div className="max-h-[650px] overflow-y-auto pr-3 custom-scrollbar relative">
                    {isLoading ? (
                        <div className="space-y-8 p-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-slate-200 rounded-full w-32 animate-pulse" />
                                        <div className="h-px bg-slate-200 flex-1" />
                                    </div>
                                    {[1, 2].map(j => (
                                        <div key={j} className="h-[90px] bg-white rounded-[16px] shadow-sm border border-slate-100 animate-pulse ml-8" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : Object.keys(groupedAndSortedLogs).length > 0 ? (
                        <div className="p-2 pt-0">
                            {Object.keys(groupedAndSortedLogs).map(dateLabel => (
                                <ChatGroupByDate
                                    key={dateLabel}
                                    dateLabel={dateLabel}
                                    logs={groupedAndSortedLogs[dateLabel]}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 mx-2 mt-4">
                            <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-700 font-bold text-lg font-outfit">No conversations found</p>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                                {searchQuery || emotionFilter !== 'all'
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "You haven't had any conversations with the wellness assistant yet."}
                            </p>
                            {!(searchQuery || emotionFilter !== 'all') && (
                                <Button
                                    onClick={() => router.push('/chat')}
                                    variant="outline"
                                    className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                    Start a Conversation
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
