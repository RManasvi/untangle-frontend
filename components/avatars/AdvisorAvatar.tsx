import React from 'react';

export default function AdvisorAvatar({ className = 'w-10 h-10' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#F3F4F6" />
            {/* Shoulders / Turtleneck */}
            <path d="M20 80C20 62 30 55 40 55C50 55 60 62 60 80H20Z" fill="#4B5563" />
            <path d="M32 55C32 50 48 50 48 55V60C48 65 32 65 32 60V55Z" fill="#4B5563" />
            {/* Head */}
            <circle cx="40" cy="34" r="15" fill="#FCD34D" />
            {/* Glasses */}
            <rect x="26" y="30" width="12" height="8" rx="2" stroke="#1F2937" strokeWidth="2" fill="none" />
            <rect x="42" y="30" width="12" height="8" rx="2" stroke="#1F2937" strokeWidth="2" fill="none" />
            <path d="M38 34H42" stroke="#1F2937" strokeWidth="2" />
            {/* Hair */}
            <path d="M25 34C25 20 55 20 55 34C55 28 25 28 25 34Z" fill="#D1D5DB" />
        </svg>
    );
}
