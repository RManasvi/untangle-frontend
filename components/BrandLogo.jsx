import React from 'react';
import Image from 'next/image';

const BrandLogo = ({ className = "h-8", showText = true, textColor = "text-slate-900" }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative h-full aspect-square overflow-hidden rounded-xl shadow-sm bg-white p-1 flex items-center justify-center">
                <Image
                    src="/logo.png"
                    alt="Untangle Logo"
                    width={80}
                    height={80}
                    priority
                    className="object-contain w-full h-full"
                />
            </div>
            {showText && (
                <span className={`font-bold text-xl tracking-tight leading-none ${textColor}`}>
                    Untangle
                </span>
            )}
        </div>
    );
};

export default BrandLogo;
