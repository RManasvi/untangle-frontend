import React from 'react';

export default function FriendlyAvatar({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={`w-full h-full ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="friendlyGrad" x1="0" y1="0" x2="80" y2="80">
                    <stop stopColor="#FFB347" />
                    <stop offset="1" stopColor="#90EE90" />
                </linearGradient>
            </defs>
            <rect x="5" y="5" width="70" height="70" rx="35" fill="url(#friendlyGrad)" />
            {/* Eyes */}
            <path d="M 25 35 Q 30 30 35 35" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 45 35 Q 50 30 55 35" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Friendly Smile */}
            <path d="M 30 45 Q 40 55 50 45" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="25" cy="42" r="3" fill="#FF8C00" opacity="0.4" />
            <circle cx="55" cy="42" r="3" fill="#FF8C00" opacity="0.4" />
        </svg>
    );
}
