import { useState, useEffect } from 'react';

export function useLiveStress() {
    const [liveStress, setLiveStress] = useState<{ score: number; emotion: string } | null>(null);

    useEffect(() => {
        const bc = new BroadcastChannel('stress_channel');
        
        bc.onmessage = (event) => {
            const { stress_score, emotion } = event.data;
            setLiveStress({ 
                score: Math.round(stress_score * 100), 
                emotion: emotion 
            });
        };

        return () => {
            bc.close();
        };
    }, []);

    return liveStress;
}
