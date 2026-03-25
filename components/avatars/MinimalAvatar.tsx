import React from 'react';

export default function MinimalAvatar({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={`w-full h-full ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="#000000" strokeWidth="2" fill="white" />
            <circle cx="40" cy="40" r="32" stroke="#007BFF" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <line x1="25" y1="35" x2="35" y2="35" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="35" x2="55" y2="35" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 30 50 H 50" stroke="#007BFF" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}
