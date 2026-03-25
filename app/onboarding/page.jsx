'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Mic, CheckCircle2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import PhotoCapture from '@/components/PhotoCapture';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // ✅ FIX: All hooks moved above conditional returns (Rules of Hooks)
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [restrictions, setRestrictions] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user) {
      if (user.onboarding_step >= 4) {
        router.push('/chat');
      } else if (user.onboarding_step === 3) {
        router.push('/customize');
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save setup to database
      await updateUser({
        ...user,
        onboarding_step: 3 // Lead to customize page
      });
      
      localStorage.setItem(
        'botSetup',
        JSON.stringify({
          files: uploadedFiles.map((f) => f.name),
          voiceRecorded,
          restrictions,
        })
      );
      router.push('/customize');
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <BrandLogo className="h-10" />
          <p className="text-slate-500 ml-11 font-medium">
            Protocol Initialization Phase {step} / 3
          </p>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-8 h-1.5 bg-slate-100" />

        {/* Content */}
        <Card className="border-slate-200 bg-white shadow-xl mb-8 overflow-hidden">
          <div className="h-1 w-full bg-slate-900" />
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">
              {step === 1 && 'Privacy Configurations & Compliance'}
              {step === 2 && 'Biometric Telemetry Setup'}
              {step === 3 && 'Vocal Calibration (Optional)'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  Define your data governance preferences and primary objectives so your Wellness Advisor can optimize its analytical engine for your specific professional environment.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Governance Constraints
                  </label>
                  <textarea
                    placeholder="e.g., Exclude corporate proprietary data, prioritize productivity metrics, maintain strict confidentiality on medical history..."
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-0 focus:outline-none transition-all"
                    rows={5}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <PhotoCapture onComplete={() => setStep(3)} />
            )}

            {step === 3 && (
              <div className="space-y-4 text-center">
                <p className="text-slate-600 mb-4 text-sm leading-relaxed mx-auto max-w-md">
                  Calibrate the acoustic analysis engine with a brief vocal sample to enable real-time detection of vocal strain and cognitive fatigue markers.
                </p>
                <div className="flex items-center justify-center p-12 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <button
                    onClick={() => setVoiceRecorded(!voiceRecorded)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all shadow-sm ${voiceRecorded
                      ? 'bg-emerald-600 text-white shadow-emerald-100'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                  >
                    <Mic className="h-5 w-5" />
                    {voiceRecorded ? 'Calibration Verified' : 'Begin Acoustic Calibration'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  Calibration is recommended for high-fidelity stress monitoring
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            variant="ghost"
            className="text-slate-500 font-bold hover:text-slate-900"
          >
            Previous Phase
          </Button>
          {step !== 2 && (
            <Button
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-bold shadow-lg transition-all"
            >
              {step === 3 ? 'Finalize Profile' : 'Proceed to Next Phase'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
