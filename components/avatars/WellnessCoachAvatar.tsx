import React from 'react';

export default function WellnessCoachAvatar({ className = 'w-10 h-10' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#ECFDF5" />
            {/* Shoulders / Medical Scrub */}
            <path d="M22 80C22 65 30 55 40 55C50 55 58 65 58 80H22Z" fill="#047857" />
            {/* Inner collar */}
            <path d="M35 55L40 65L45 55H35Z" fill="#D1FAE5" />
            {/* Head */}
            <circle cx="40" cy="35" r="16" fill="#FFEDD5" />
            {/* Hair (tied back/neat) */}
            <path d="M24 35C24 15 56 15 56 35Z" fill="#451A03" />
            <circle cx="40" cy="18" r="6" fill="#451A03" />
        </svg>
    );
}
