import React from 'react';

export default function ProAvatar({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" className={`w-full h-full ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="60" height="60" rx="12" fill="#E6EEF4" />
            <rect x="0" y="0" width="80" height="80" rx="16" fill="#CCCCCC" opacity="0.5" />
            <rect x="15" y="15" width="50" height="50" rx="8" fill="#1E75B6" />
            {/* Visor */}
            <rect x="25" y="30" width="30" height="10" rx="4" fill="white" />
            <circle cx="32" cy="35" r="2" fill="#1E75B6" />
            <circle cx="48" cy="35" r="2" fill="#1E75B6" />
            {/* Communication Lines */}
            <path d="M 30 55 H 50" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M 35 60 H 45" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
