'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadTrainingPhotos } from '@/lib/uploadPhotos';
import { useAuth } from '@/context/AuthContext';

const EXPRESSIONS = ['Neutral', 'Happy', 'Stressed'];
const EXPRESSION_LABELS = {
    'Neutral': 'Neutral Face',
    'Happy': 'Happy/Smiling',
    'Stressed': 'Stressed/Serious'
};

export default function PhotoCapture({ onComplete }: { onComplete: () => void }) {
    const { user } = useAuth();
    const webcamRef = useRef<Webcam>(null);

    const [photos, setPhotos] = useState<Record<string, string>>({});
    const [currentExpressionIndex, setCurrentExpressionIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentExpression = EXPRESSIONS[currentExpressionIndex];
    const allCaptured = EXPRESSIONS.every(exp => photos[exp]);

    const capture = useCallback(() => {
        setError(null);
        const imageSrc = webcamRef.current?.getScreenshot();

        if (imageSrc) {
            setPhotos(prev => {
                const updated = { ...prev, [currentExpression]: imageSrc };
                // Find next empty expression if more are needed
                const nextEmptyIdx = EXPRESSIONS.findIndex(exp => !updated[exp]);
                if (nextEmptyIdx !== -1) {
                    setCurrentExpressionIndex(nextEmptyIdx);
                }
                return updated;
            });
        } else {
            setError("Failed to capture photo. Please check camera permissions.");
        }
    }, [webcamRef, currentExpression]);

    const handleUpload = async () => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setIsUploading(true);
        setError(null);

        const photosToUpload = EXPRESSIONS.map(exp => ({
            expression: exp.toLowerCase(),
            dataUrl: photos[exp]
        }));

        try {
            const result = await uploadTrainingPhotos(user.id, photosToUpload);
            if (result.success) {
                onComplete();
            } else {
                setError(result.error || "Failed to upload photos.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const retake = (expression: string) => {
        setPhotos(prev => {
            const updated = { ...prev };
            delete updated[expression];
            return updated;
        });
        setCurrentExpressionIndex(EXPRESSIONS.indexOf(expression));
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Facial Recognition Training
                </h3>
                <p className="text-slate-600 text-sm">
                    Calibrate your AI companion's emotional intelligence by capturing three expressions: <strong>Neutral</strong>, <strong>Happy</strong>, and <strong>Stressed</strong>.
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Step Indicator */}
            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                {EXPRESSIONS.map((exp, idx) => {
                    const isCaptured = !!photos[exp];
                    const isCurrent = idx === currentExpressionIndex;
                    return (
                        <div key={exp} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCaptured ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {isCaptured ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-tight ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                                {exp}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center group border-4 border-slate-100 shadow-inner">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            width: 640,
                            height: 480,
                            facingMode: "user"
                        }}
                        className="w-full max-w-lg object-cover"
                        onUserMediaError={() => setError("Camera access denied or unavailable.")}
                    />

                    {/* Guidance Overlay */}
                    {!allCaptured && (
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-medium border border-white/20 animate-in fade-in slide-in-from-left-4 duration-500">
                            Step {currentExpressionIndex + 1}: Show a <span className="text-yellow-400 font-bold underline capitalize">{currentExpression}</span> expression
                        </div>
                    )}

                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4">
                        <Button
                            onClick={capture}
                            className={`${allCaptured ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full px-10 py-7 shadow-xl shadow-blue-500/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95`}
                        >
                            <Camera className="h-6 w-6" />
                            <span className="text-lg font-bold">
                                {allCaptured ? 'Recapture Final Image' : `Capture ${EXPRESSION_LABELS[currentExpression as keyof typeof EXPRESSION_LABELS]}`}
                            </span>
                        </Button>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
                        {Object.keys(photos).length} / 3 COMPLETED
                    </div>
                </div>
            </div>

            {/* Previews */}
            {Object.keys(photos).length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    {EXPRESSIONS.map((exp) => (
                        <div key={exp} className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exp}</span>
                            {photos[exp] ? (
                                <div className={`relative group w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${exp === currentExpression ? 'border-blue-500 ring-4 ring-blue-50' : 'border-emerald-500'}`}>
                                    <img src={photos[exp]} alt={exp} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20 font-bold" onClick={() => retake(exp)}>
                                            Retake
                                        </Button>
                                    </div>
                                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-1 shadow-lg">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className={`w-full aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${exp === currentExpression ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase text-center px-2">Ready for Capture</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleUpload}
                    disabled={!allCaptured || isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing & Uploading...
                        </>
                    ) : (
                        'Save Photos & Continue'
                    )}
                </Button>
            </div>
        </div>
    );
}
