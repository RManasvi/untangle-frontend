'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, RotateCcw, Wind } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import BotAvatar from '@/components/BotAvatar';
import StreakIndicator from '@/components/StreakIndicator';
import PostMeditationReward from '@/components/PostMeditationReward';
import PostMeditationFeedback from '@/components/PostMeditationFeedback';
// ✅ FIX: awardMeditationPoints was calling createServerClient() from the browser.
// All gamification logic now runs via the server-side API route instead.
import { calculateEffectiveness, classifyEffectiveness } from '@/lib/adaptiveLogic';

export default function MeditationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(300); // Default 5 minutes
  const [selectedType, setSelectedType] = useState('mindfulness');
  const [breathPhase, setBreathPhase] = useState('inhale');

  const [rewardStats, setRewardStats] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [showReward, setShowReward] = useState(false);

  // Mock stress levels for feedback demonstration (In Epic 5 full flow, these would come from the stress monitoring)
  const preStressRef = useRef(Math.floor(Math.random() * 30) + 60); // 60-90%
  const postStressRef = useRef(Math.floor(Math.random() * 30) + 30); // 30-60%

  const handleSessionComplete = async () => {
    setIsActive(false);

    if (!user) {
      console.error('[v0] No user found — cannot log meditation');
      setSessionCompleted(true);
      return;
    }

    try {
      // Calculate effectiveness
      const preStress = preStressRef.current;
      const postStress = postStressRef.current;
      const effectivenessScore = calculateEffectiveness(preStress, postStress);
      const classification = classifyEffectiveness(effectivenessScore);

      // ✅ FIX: Call the server-side API route — service-role key is only available there.
      // Previously called awardMeditationPoints() directly which tried to use
      // createServerClient() in the browser, throwing 'Missing env vars'.
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const awardRes = await fetch('/api/gamification/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          durationMinutes: Math.floor(duration / 60),
          preStress,
          postStress,
        }),
      });

      if (!awardRes.ok) {
        console.error('[v0] Gamification API failed:', awardRes.status);
      }

      const stats = awardRes.ok
        ? await awardRes.json()
        : { points_earned: 0, total_points: 0, new_level: 1, streak: 0, badges_earned: [] };

      // Reuse the supabase client already created above for the session insert
      const { data: insertedSession, error } = await supabase

        .from('meditation_sessions')
        .insert({
          user_id: user.id,
          session_type: selectedType === 'bodyScan' ? 'body_scan' : selectedType === 'breathing' ? 'deep_breathing' : 'mindfulness',
          duration_minutes: Math.floor(duration / 60),
          points_earned: stats.points_earned,
          pre_stress_level: preStress,
          post_stress_level: postStress,
          effectiveness_score: effectivenessScore,
          effectiveness_classification: classification
        })
        .select()
        .single();

      if (error) {
        console.error('[v0] Supabase insert error:', error.message);
      } else {
        console.log('[v0] Meditation session logged directly to Supabase');
      }

      const reduction = Math.max(0, preStress - postStress);
      const sessionId = insertedSession?.id;

      setFeedbackStats({
        reduction,
        classification,
        pointsEarned: stats.points_earned,
        totalPoints: stats.total_points,
        newLevel: stats.new_level,
        streak: stats.streak,
        badgesEarned: stats.badges_earned,
        sessionId
      });

      setRewardStats({
        pointsEarned: stats.points_earned,
        totalPoints: stats.total_points,
        newLevel: stats.new_level,
        streak: stats.streak,
        badgesEarned: stats.badges_earned,
        stressReduction: reduction
      });

      setSessionCompleted(true);
    } catch (error) {
      console.error('[v0] Failed to log meditation:', error);
      setSessionCompleted(true); // Fallback
    }
  };

  useEffect(() => {
    let interval = null;

    if (isActive && time < duration) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (time >= duration && time > 0 && isActive) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, time, duration]);

  // Breathing cycle animation
  useEffect(() => {
    if (selectedType === 'breathing' && isActive) {
      const cyclePhases = [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold', duration: 7 },
        { phase: 'exhale', duration: 8 },
      ];

      let currentPhase = 0;
      let phaseTime = 0;

      const breathInterval = setInterval(() => {
        phaseTime++;
        if (phaseTime >= cyclePhases[currentPhase].duration) {
          phaseTime = 0;
          currentPhase = (currentPhase + 1) % cyclePhases.length;
        }
        setBreathPhase(cyclePhases[currentPhase].phase);
      }, 1000);

      return () => clearInterval(breathInterval);
    }
  }, [isActive, selectedType]);

  const meditationTypes = {
    breathing: {
      title: 'Deep Breathing',
      desc: '4-7-8 breathing technique',
      instructions: [
        'Breathe in for 4 counts through your nose',
        'Hold the breath for 7 counts',
        'Exhale slowly for 8 counts through your mouth',
        'Repeat this cycle 4-5 times',
      ],
    },
    mindfulness: {
      title: 'Mindfulness Meditation',
      desc: 'Present moment awareness',
      instructions: [
        'Find a comfortable seated position',
        'Close your eyes gently',
        'Focus on your natural breath',
        'When mind wanders, gently return focus to breath',
      ],
    },
    bodyScan: {
      title: 'Body Scan Relaxation',
      desc: 'Progressive muscle relaxation',
      instructions: [
        'Lie down on your back comfortably',
        'Focus awareness on your toes first',
        'Move awareness slowly upward through your body',
        'Release tension as you notice it',
      ],
    },
  };

  const current = meditationTypes[selectedType];
  const progress = (time / duration) * 100;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  const handleReset = () => {
    setTime(0);
    setIsActive(false);
    setBreathPhase('inhale');
    setSessionCompleted(false);
    setRewardStats(null);
    setFeedbackStats(null);
    setShowReward(false);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    handleReset();
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 relative">
      {/* Completion Modal Chaining */}
      {sessionCompleted && showReward && rewardStats ? (
        <PostMeditationReward stats={rewardStats} onClose={handleReset} />
      ) : sessionCompleted && feedbackStats && !showReward ? (
        <PostMeditationFeedback
          stats={feedbackStats}
          onClose={() => setShowReward(true)}
          onContinue={() => setShowReward(true)}
        />
      ) : sessionCompleted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Card className="max-w-md w-full border-blue-100 shadow-xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Wind className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-slate-900 font-bold">Session Complete</CardTitle>
              <p className="text-slate-600 mt-2">
                You have successfully completed your {Math.floor(duration / 60)}-minute mindfulness protocol.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                View Performance Portfolio
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full border-blue-200 text-slate-700"
              >
                Meditate Again
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/chat')}
              className="text-slate-700 hover:bg-blue-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
            <StreakIndicator />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <BotAvatar className="w-12 h-12 shadow-sm border border-slate-200" />
            <div className="flex flex-col gap-0">
              <BrandLogo className="h-7 -ml-2" />
              <p className="text-slate-600 text-sm">Optimize your cognitive functions with evidence-based sessions</p>
            </div>
          </div>
        </div>

        {/* Meditation Card */}
        <Card className="border-blue-100 bg-white shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-slate-900">{current.title}</CardTitle>
            <p className="text-sm text-slate-600 mt-2">{current.desc}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timer Display */}
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-blue-600 font-mono">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              {/* Breathing Animation */}
              {selectedType === 'breathing' && isActive && !sessionCompleted && (
                <div className="flex justify-center">
                  <div
                    className={`w-32 h-32 rounded-full border-4 border-blue-500 flex items-center justify-center transition-transform duration-1000 ${breathPhase === 'inhale'
                      ? 'scale-110'
                      : breathPhase === 'hold'
                        ? 'scale-110'
                        : 'scale-100'
                      }`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-600 capitalize">
                        {breathPhase}
                      </p>
                      <Wind className="h-6 w-6 text-blue-600 mx-auto mt-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress */}
              <Progress value={progress} className="h-2" />
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => setIsActive(!isActive)}
                className={`${isActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="border-blue-200 text-slate-700 bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Duration Selection */}
            <div>
              <p className="text-sm font-medium text-slate-900 mb-3">Duration</p>
              <div className="grid grid-cols-4 gap-2">
                {[60, 300, 600, 900].map((dur) => (
                  <Button
                    key={dur}
                    variant={duration === dur ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDurationChange(dur)}
                    className={
                      duration === dur
                        ? 'bg-blue-600 text-white'
                        : 'border-blue-200 text-slate-700'
                    }
                    disabled={isActive}
                  >
                    {dur === 60 ? '1m' : dur === 300 ? '5m' : dur === 600 ? '10m' : '15m'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-slate-900 mb-3">Instructions:</h4>
              <ol className="space-y-2">
                {current.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="font-semibold text-blue-600 flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="text-slate-700 text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Type Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Choose Meditation Type:</p>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(meditationTypes).map(([key, meditation]) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                onClick={() => handleTypeChange(key)}
                disabled={isActive}
                className={
                  selectedType === key
                    ? 'bg-blue-600 text-white justify-start h-auto py-3'
                    : 'border-blue-200 text-slate-700 justify-start h-auto py-3 hover:bg-blue-50'
                }
              >
                <Wind className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{meditation.title}</div>
                  <div className="text-xs opacity-75">{meditation.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
