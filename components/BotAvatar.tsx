'use client';

import React from 'react';
import ProAvatar from './avatars/ProAvatar';
import MinimalAvatar from './avatars/MinimalAvatar';
import CorporateAvatar from './avatars/CorporateAvatar';
import AdvisorAvatar from './avatars/AdvisorAvatar';
import WellnessCoachAvatar from './avatars/WellnessCoachAvatar';
import { useBot, BotStyle } from '@/context/BotContext';

interface BotAvatarProps {
    className?: string;
    forceStyle?: BotStyle; // Option to override context (useful for settings page)
}

export default function BotAvatar({ className = '', forceStyle }: BotAvatarProps) {
    // If forceStyle is provided, don't use context to avoid issues rendering multiple variants on settings page
    // We use a small local hook to safely try using context if it's available and not forced
    let displayStyle: BotStyle = forceStyle || 'professional';

    if (!forceStyle) {
        try {
            // It's possible to use outside provider safely if we catch
            const botContext = useBot();
            displayStyle = botContext.botStyle;
        } catch (e) {
            // Fallback to professional
        }
    }

    const AvatarComponent = {
        professional: ProAvatar,
        minimalist: MinimalAvatar,
        corporate: CorporateAvatar,
        advisor: AdvisorAvatar,
        wellness_coach: WellnessCoachAvatar,
    }[displayStyle] || ProAvatar;

    return (
        <div className={`overflow-hidden rounded-full flex items-center justify-center bg-transparent ${className}`}>
            <AvatarComponent className="w-full h-full" />
        </div>
    );
}
