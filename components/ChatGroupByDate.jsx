import React from 'react';
import ChatCard from './ChatCard';

export default function ChatGroupByDate({ dateLabel, logs }) {
    // dateLabel ex: '28 February 2026'

    return (
        <div className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-4 sticky top-0 bg-slate-50/90 z-10 py-2 backdrop-blur-sm -mx-2 px-2">
                <span className="bg-white text-slate-700 px-4 py-1.5 rounded-full text-xs font-outfit uppercase tracking-widest shadow-sm border border-slate-200">
                    {dateLabel}
                </span>
                <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1"></div>
            </h2>

            {/* Timeline view */}
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 ml-2 pl-8">
                {logs.map((log) => (
                    <div key={log.id || log.created_at} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute top-[26px] -left-[37px] w-3.5 h-3.5 bg-white border-[3px] border-blue-400 rounded-full z-auto shadow-sm transition-transform hover:scale-110"></div>

                        {/* Card */}
                        <ChatCard log={log} />
                    </div>
                ))}
            </div>
        </div>
    );
}
