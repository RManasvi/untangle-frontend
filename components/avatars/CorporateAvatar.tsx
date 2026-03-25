import React from 'react';

export default function CorporateAvatar({ className = 'w-10 h-10' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#E2E8F0" />
            {/* Shoulders / Suit */}
            <path d="M20 80C20 65 30 55 40 55C50 55 60 65 60 80H20Z" fill="#1F2937" />
            {/* Shirt */}
            <path d="M35 55L40 65L45 55L40 55H35Z" fill="#FFFFFF" />
            {/* Tie */}
            <path d="M38 65L42 65L40 78L38 65Z" fill="#0891B2" />
            {/* Head */}
            <circle cx="40" cy="35" r="16" fill="#FDE0C5" />
            {/* Hair */}
            <path d="M24 35C24 20 56 20 56 35C56 30 24 30 24 35Z" fill="#111827" />
        </svg>
    );
}
