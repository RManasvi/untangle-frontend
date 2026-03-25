'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Heart,
  Wind,
  Menu,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import SidebarChat from '@/components/chat/SidebarChat';
import ChatMessage from '@/components/chat/ChatMessage';
import BrandLogo from '@/components/BrandLogo';
import BotAvatar from '@/components/BotAvatar';
import { useBot } from '@/context/BotContext';
import { getGroqResponse } from '@/utils/geminiApi';
import { toast } from 'sonner';
// ✅ FIX Issue 2: Use centralised AbortError helper instead of duplicating inline
import { isAbortError } from '@/utils/abortUtils';

export default function ChatPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { botStyle } = useBot();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emotionState, setEmotionState] = useState('neutral');
  const [userTurns, setUserTurns] = useState(0);
  const [showDeepBreathing, setShowDeepBreathing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // ✅ FIX Issue 2: historyLoading starts false to avoid skeleton during initial auth
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stressScore, setStressScore] = useState(0);
  const [sustainedHigh, setSustainedHigh] = useState(false);
  const messagesContainerRef = useRef(null);
  const stressBuffer = useRef([]);
  const lastStressAlertTime = useRef(0);
  const [recommendation, setRecommendation] = useState(null);
  const [wasProactiveCheck, setWasProactiveCheck] = useState(false);

  // ✅ FIX Stability: Enhanced Auth/Onboarding Guard
  useEffect(() => {
    if (loading) return; // Wait for auth rehydration

    if (!user) {
      router.push('/');
      return;
    }

    // STABILITY FIX: Only bounce to onboarding if we are ABSOLUTELY certain
    // the user is NOT onboarded. In-between rehydration states or partial
    // data should stay on /chat to avoid stress-redirect failures.
    const isExplicitlyNoOnboard = user.has_onboarded === false;
    const hasStepData = user.onboarding_step !== undefined;

    // ✅ EXTRA SAFETY: If user was redirected from stress, don't bounce them
    const stressRedirected = typeof window !== 'undefined' && localStorage.getItem('stress_detected');

    if (isExplicitlyNoOnboard && hasStepData && !stressRedirected) {
      // User is loaded AND we are sure they haven't finished.
      if (user.onboarding_step === 3) {
        router.push('/customize');
      } else if (user.onboarding_step < 3) {
        router.push('/onboarding');
      }
    }
    // If has_onboarded is null/missing, or stress_detected exists,
    // we assume user is rehydrating or needs urgent support and stay on /chat.
  }, [user, loading, router]);

  const GREETING_ID = 'greeting-msg';
  const GREETING_TEXT = "Welcome to Untangle. I'm your wellness companion, powered by advanced biometric analysis. Together, we'll help you manage stress and optimize your wellbeing with data-driven insights.";

  // ✅ FIX Issue 1B + 2: Robust history fetch with abort handling
  useEffect(() => {

    const fetchChatHistory = async () => {
      if (!user) {
        // Show greeting but do NOT touch historyLoading (Fix B)
        const hasGreetingBeenShown = sessionStorage.getItem('untangle_greeting_shown');
        if (!hasGreetingBeenShown) {
          setMessages([{
            id: GREETING_ID,
            text: GREETING_TEXT,
            sender: 'bot',
            timestamp: new Date(Date.now() - 1000000),
          }]);
          sessionStorage.setItem('untangle_greeting_shown', 'true');
        }
        return;
      }

      setHistoryLoading(true); // ✅ Only set true when user is confirmed present

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setHistoryLoading(false);
          return;
        }

        let query = supabase.from('chat_logs').select('*').eq('user_id', user.id);
        const params = new URLSearchParams(window.location.search);
        const resumeDateStr = params.get('resume_date');

        if (resumeDateStr) {
          const targetDate = new Date(resumeDateStr);
          const startOfDay = new Date(targetDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(targetDate);
          endOfDay.setHours(23, 59, 59, 999);
          query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString()).order('created_at', { ascending: true }).limit(100);
        } else {
          const yesterday = new Date();
          yesterday.setHours(yesterday.getHours() - 24);
          query = query.gte('created_at', yesterday.toISOString()).order('created_at', { ascending: true });
        }

        const { data, error } = await query;
        if (error) {
          // ✅ FIX Stability: Ignore Supabase's internal fetch aborts (Issue 123)
          if (isAbortError(error)) {
            console.warn('[Chat] Supabase query aborted — ignoring');
            return;
          }
          console.error(
            'Error fetching chat history:',
            error?.message || error?.code || JSON.stringify(error)
          );
          return;
        }

        const historyMessages = [];
        const hasGreetingBeenShown = sessionStorage.getItem('untangle_greeting_shown');
        if (!hasGreetingBeenShown) {
          historyMessages.push({ id: GREETING_ID, text: GREETING_TEXT, sender: 'bot', timestamp: new Date(Date.now() - 1000000) });
          sessionStorage.setItem('untangle_greeting_shown', 'true');
        }

        if (data && data.length > 0) {
          data.forEach((log, index) => {
            historyMessages.push({ id: `user-${log.id || index}`, text: log.user_message, sender: 'user', timestamp: new Date(log.created_at) });
            historyMessages.push({ id: `bot-${log.id || index}`, text: log.ai_response, sender: 'bot', timestamp: new Date(log.created_at) });
          });
          setUserTurns(data.length);
        }

        setMessages((prev) => {
          const map = new Map();
          prev.forEach(msg => map.set(msg.id, msg));
          historyMessages.forEach(msg => map.set(msg.id, msg));
          return Array.from(map.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });

      } catch (err) {
        if (isAbortError(err)) return; // silent ignore Turbopack aborts
        console.error('Unexpected error in fetchChatHistory:', err?.message || err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchChatHistory();
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecommendation = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/meditation/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        });

        // ✅ FIX Issue 1B: Always check res.ok before .json().
        // When the API route crashes (e.g. missing env vars), Next.js returns
        // a text/html 500 page — calling .json() on it throws:
        // "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
        if (!res.ok) {
          console.warn(`[Chat] Recommend API returned ${res.status} — skipping`);
          return;
        }

        const data = await res.json();
        if (data && !data.error && !data.hasMeditatedToday && data.recommendation) {
          setRecommendation(data.recommendation);
        }
      } catch (err) {
        if (isAbortError(err)) {
          console.warn('[Chat] Meditation fetch aborted (Standard HMR/unmount)');
          return;
        }
        console.error('[v0] Failed to fetch meditation recommendation:', err?.message || err);
      }
    };

    fetchRecommendation();
    return () => controller.abort('Component Unmount'); // ✅ explicit unmount reason
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stressScoreParam = params.get('stress_score');
    const stressData = localStorage.getItem("stress_detected");

    if (stressData || stressScoreParam) {
      let score = 0;
      if (stressData) score = JSON.parse(stressData).score;
      else if (stressScoreParam) score = parseFloat(stressScoreParam);

      if (score > 50) {
        const calmingMessages = [
          "You seem to be stressed today. I'm here to help you navigate this.",
          "I'm noticing some elevated stress markers. You seem to be feeling a bit overwhelmed today—want to talk about it?",
          "Biometric indicators suggest high stress levels. A brief mindfulness session may help restore balance.",
          "Your current stress markers are elevated. A conscious breathing exercise can quickly downregulate your nervous system.",
          "High stress load identified. Utilizing our deep breathing module is recommended for immediate regulation.",
        ];
        const randomMsg = calmingMessages[Math.floor(Math.random() * calmingMessages.length)];
        const botMessage = { id: Date.now(), text: randomMsg, sender: "bot", timestamp: new Date() };
        setMessages((prev) => [...prev, botMessage]);
        setWasProactiveCheck(true);
        toast.error("High Stress Detected", { description: "Your stress levels were elevated. Checking in...", duration: 5000 });
        localStorage.removeItem("stress_detected");
        if (stressScoreParam) router.replace('/chat');
      }
    }
  }, [router]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const getAIResponse = async (userMessage, history) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'anonymous';
      const context = wasProactiveCheck ? `RESPONDING TO PROACTIVE STRESS CHECK. User turns: ${userTurns}` : `User turns: ${userTurns}`;

      const response = await getGroqResponse(
        userMessage,
        emotionState,
        context,
        token,
        stressScore,
        sustainedHigh,
        (currentText) => {
          setMessages((prev) => {
            const hasBotStreaming = prev.some(m => m.isStreaming && m.sender === 'bot');
            if (hasBotStreaming) {
              return prev.map(m => (m.isStreaming && m.sender === 'bot') ? { ...m, text: currentText, emotion: emotionState } : m);
            } else {
              return [...prev, { id: 'streaming-bot-msg', text: currentText, sender: 'bot', emotion: emotionState, timestamp: new Date(), isStreaming: true }];
            }
          });
        },
        history.map(m => ({ role: m.sender === 'bot' ? 'assistant' : 'user', content: m.text })),
        botStyle
      );

      if (wasProactiveCheck) setWasProactiveCheck(false);

      if (!response) {
        setIsLoading(false);
        return;
      }

      setMessages((prev) => {
        const streamMsg = prev.find(m => m.id === 'streaming-bot-msg');
        const finalId = Date.now() + Math.random();
        if (streamMsg) return prev.map(m => m.id === 'streaming-bot-msg' ? { ...m, id: finalId, isStreaming: false, text: response } : m);
        else return [...prev, { id: finalId, text: response, sender: 'bot', emotion: emotionState, timestamp: new Date(), isStreaming: false }];
      });
    } catch (error) {
      if (isAbortError(error)) return;
      console.error('[v0] AI response error:', error?.message || error);
      toast.error("AI Response Error", { description: error.message });
      setMessages((prev) => [...prev, { id: Date.now() + Math.random(), text: 'Sorry, I encountered an error. Please try again.', sender: 'bot', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const messageText = customMessage || input;
    if (!messageText.trim()) return;
    const userMessage = { id: Date.now() + Math.random(), text: messageText, sender: 'user', timestamp: new Date() };
    const historyBeforeResponse = [...messages, userMessage];
    setMessages(historyBeforeResponse);
    setInput('');
    setUserTurns((prev) => prev + 1);
    await getAIResponse(messageText, historyBeforeResponse);
  };

  const handleAddToChat = (message) => handleSendMessage(message);

  useEffect(() => {
    const bc = new BroadcastChannel('stress_channel');
    let lastUpdate = 0;
    bc.onmessage = (event) => {
      const now = Date.now();
      if (now - lastUpdate < 1000) return;
      lastUpdate = now;
      const { stress_score } = event.data;
      setStressScore(stress_score);
      stressBuffer.current.push(stress_score);
      if (stressBuffer.current.length > 5) stressBuffer.current.shift();
      const avg = stressBuffer.current.reduce((a, b) => a + b, 0) / stressBuffer.current.length;
      setSustainedHigh(stressBuffer.current.length >= 5 && avg > 0.6);
    };
    return () => bc.close();
  }, []);

  useEffect(() => {
    if (!sustainedHigh) return;
    const now = Date.now();
    if (now - lastStressAlertTime.current < 60000) return;
    lastStressAlertTime.current = now;
    const level = Math.round(stressScore * 100);
    const botMessage = { id: Date.now(), text: `I'm noticing your stress is elevated (around ${level}%). You seem to be feeling a bit stressed today. Would you like to talk about what's on your mind?`, sender: 'bot', timestamp: new Date() };
    setMessages(prev => [...prev, botMessage]);
    toast.error("Stress Alert Detected", { description: "Detecting sustained high stress. Reaching out...", duration: 5000 });
    setWasProactiveCheck(true);
  }, [sustainedHigh, stressScore]);

  // Auth + onboarding loading guard (shown before auth resolves)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ FIX Issue 1B: If history is loading, show a skeleton/spinner inside the chat layout
  // (NOT a full-screen spinner that looks like infinite load — the input remains usable)
  return (
    <div className="h-screen overflow-hidden bg-background">
      <SidebarChat open={sidebarOpen} onClose={() => setSidebarOpen(false)} onAddToChat={handleAddToChat} />

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <BotAvatar className="w-10 h-10 border border-border" />
                <div className="flex flex-col gap-0">
                  <BrandLogo className="h-5 -ml-1.5" />
                  <p className="text-[10px] text-muted-foreground">Session Tracking - {user?.email}</p>
                </div>
              </div>
            </div>

            {/* Emotion Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-secondary text-secondary-foreground`}>
              <Heart className="h-4 w-4" />
              {emotionState.charAt(0).toUpperCase() + emotionState.slice(1)}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/stress')} className="border-border text-foreground hover:bg-secondary">
                <Wind className="h-4 w-4 mr-2" /> Stress Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="border-border text-foreground hover:bg-secondary">Dashboard</Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')} className="border-border text-foreground hover:bg-secondary">Settings</Button>
              <Button variant="ghost" size="icon" onClick={() => logout().then(() => router.push('/'))} className="text-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar" style={{ minHeight: 0 }}>
          <div className="max-w-5xl mx-auto space-y-4">
            {/* ✅ FIX Issue 1B: Show inline skeleton while history loads, not a full-screen spinner */}
            {historyLoading ? (
              <div className="flex flex-col gap-4 py-8 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              // ✅ FIX Issue 1B: Fallback when history is empty (error or genuinely new user)
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-60">
                <BotAvatar className="w-16 h-16 border-2 border-border" />
                <div>
                  <p className="font-semibold text-foreground">Welcome to Untangle</p>
                  <p className="text-sm text-muted-foreground mt-1">Start a conversation to begin your wellness session.</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )}
          </div>
        </div>

        {/* Proactive Recommendation */}
        {recommendation && (
          <div className="flex-shrink-0 border-t border-border bg-secondary/30">
            <div className="max-w-5xl mx-auto p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm font-medium text-foreground">{recommendation.message}</p>
              </div>
              <Button size="sm" onClick={() => router.push('/meditation')} className="bg-primary text-primary-foreground shadow-md rounded-full px-6">
                Try {recommendation.recommended_duration} Min Session
              </Button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-card shadow-lg">
          <div className="max-w-5xl mx-auto p-4">
            <div className="flex gap-3 mb-3">
              <Button variant="outline" size="sm" className="border-border text-foreground bg-transparent hover:bg-secondary" onClick={() => router.push('/meditation')}>
                <Wind className="h-4 w-4 mr-2" /> Meditation
              </Button>
              <Button variant="outline" size="sm" className="border-border text-foreground bg-transparent hover:bg-secondary" onClick={() => setInput('I need help with anxiety')}>
                <Wind className="h-4 w-4 mr-2" /> Help with Anxiety
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
              <Input type="text" placeholder="Share your thoughts or feelings..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6">
                {isLoading ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
