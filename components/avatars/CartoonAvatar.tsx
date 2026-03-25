import React from 'react';

export default function CartoonAvatar({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={`w-full h-full ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="cartoonGrad" cx="0.5" cy="0.5" r="0.5" fx="0.25" fy="0.25">
                    <stop offset="0%" stopColor="#FF4500" />
                    <stop offset="100%" stopColor="#00CED1" />
                </radialGradient>
            </defs>
            <path d="M 40 10 Q 70 10 70 40 Q 70 70 40 70 Q 10 70 10 40 Q 10 10 40 10 Z" fill="url(#cartoonGrad)" />
            {/* Big cartoon eye left */}
            <circle cx="25" cy="35" r="10" fill="white" stroke="#333" strokeWidth="2" />
            <circle cx="27" cy="35" r="4" fill="#333" />
            {/* Big cartoon eye right */}
            <circle cx="55" cy="35" r="10" fill="white" stroke="#333" strokeWidth="2" />
            <circle cx="53" cy="35" r="4" fill="#333" />
            {/* Wide Smile */}
            <path d="M 25 50 Q 40 65 55 50" fill="white" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
