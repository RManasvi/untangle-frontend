'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useBot, BotStyle } from '@/context/BotContext';
import BrandLogo from '@/components/BrandLogo';

export default function CustomizePage() {
  const router = useRouter();
  const { user, updateUser, loading } = useAuth();
  const { setBotStyle } = useBot();
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [responseLength, setResponseLength] = useState(50);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && user) {
      if (user.onboarding_step >= 4) {
        router.push('/chat');
      } else if (user.onboarding_step < 3) {
        router.push('/onboarding');
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

  const styleOptions = [
    { id: 'professional', label: 'Balanced Advisor', desc: 'Authoritative, sophisticated, and data-driven.' },
    { id: 'minimalist', label: 'Minimalist Assistant', desc: 'Direct, efficient, and strictly factual.' },
    { id: 'corporate', label: 'Executive Consultant', desc: 'Strategic, polished, and leadership-focused.' },
    { id: 'advisor', label: 'Health Strategist', desc: 'Insightful, partnership-oriented, and holistic.' },
    { id: 'wellness_coach', label: 'Performance Coach', desc: 'Clinical, supportive, and recovery-focused.' },
  ];

  const handleComplete = async () => {
    await setBotStyle(selectedStyle);
    
    // Finalize onboarding in database
    await updateUser({
      ...user,
      onboarding_step: 4,
      bot_style: selectedStyle
    });

    localStorage.setItem(
      'botCustomization',
      JSON.stringify({
        voiceTone: 'balanced', // Default to balanced for professional variant
        personality: selectedStyle,
        responseLength,
      })
    );
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <BrandLogo className="h-10" />
          <p className="text-slate-600 ml-11">
            Configure your Wellness Advisor's analytical personality and response parameters.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={100} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">Step 3 of 3 - Calibration Complete</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Personality Style */}
          <Card className="border-blue-100 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Analytical Persona</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Select the consultation style that best supports your performance goals.
              </p>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedStyle} onValueChange={(val) => setSelectedStyle(val)}>
                <div className="grid gap-3">
                  {styleOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedStyle === opt.id
                        ? 'bg-blue-50 border-blue-200 outline outline-2 outline-blue-600'
                        : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      onClick={() => setSelectedStyle(opt.id)}
                    >
                      <RadioGroupItem value={opt.id} id={`style-${opt.id}`} />
                      <Label htmlFor={`style-${opt.id}`} className="cursor-pointer flex-1">
                        <div className="font-bold text-slate-900">{opt.label}</div>
                        <div className="text-xs text-slate-600 mt-1">{opt.desc}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Response Detail Level */}
          <Card className="border-blue-100 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Information Density</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Configure the desired detail level for telemetric insights.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider
                value={[responseLength]}
                onValueChange={(val) => setResponseLength(val[0])}
                min={20}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span>Abbreviated</span>
                <span className="text-blue-600">{responseLength}% Content Volume</span>
                <span>Exhaustive</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/onboarding')}
              className="flex-1 border-blue-200 text-slate-700 h-14 rounded-xl font-bold"
            >
              Previous Step
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-xl font-bold shadow-lg shadow-slate-200"
            >
              Initialize Advisor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
