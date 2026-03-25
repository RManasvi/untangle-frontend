import React from 'react';

export default function CuteAvatar({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={`w-full h-full ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cuteGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6B9D" />
                    <stop offset="1" stopColor="#FFA500" />
                </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="38" fill="url(#cuteGrad)" />
            {/* Eyes */}
            <circle cx="28" cy="35" r="5" fill="white" />
            <circle cx="52" cy="35" r="5" fill="white" />
            {/* Sparkles in eyes */}
            <circle cx="29" cy="34" r="2" fill="#333" />
            <circle cx="53" cy="34" r="2" fill="#333" />
            {/* Smile */}
            <path d="M 30 50 Q 40 60 50 50" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Blush */}
            <ellipse cx="20" cy="45" rx="4" ry="2" fill="#FF4477" opacity="0.6" />
            <ellipse cx="60" cy="45" rx="4" ry="2" fill="#FF4477" opacity="0.6" />
        </svg>
    );
}
