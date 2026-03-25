import { createClient } from '@supabase/supabase-js';
// ✅ FIX Issue 5: Import from fixed memory.ts (graceful fallback, no throws)
import { retrieveMemories, saveMemory } from '@/utils/memory';
import { detectCrisisIntent, CRISIS_RESPONSE } from '@/utils/safety';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  let supabase = null;
  let userId = null;

  try {
    const {
      message,
      emotion,
      averageStress,
      sustainedHigh,
      previousHistory = [],
      botStyle = 'professional',
      governanceConstraints = ''
    } = await request.json();

    if (detectCrisisIntent(message)) {
      return new Response(CRISIS_RESPONSE, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Auth & Memory Context
    const authHeader = request.headers.get('authorization');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let memoryContext = "";

    if (authHeader && authHeader.startsWith('Bearer ') && supabaseUrl) {
      try {
        const token = authHeader.split(' ')[1];
        supabase = createClient(supabaseUrl, supabaseServiceKey || anonKey);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
          // OPTIMIZATION: Only retrieve memories for substantial messages (> 10 chars)
          if (message.trim().length > 10) {
            const memories = await retrieveMemories(supabase, userId, message).catch((err) => {
              console.error('[v0] Memory Retrieval Error:', err.message);
              return [];
            });
            if (memories?.length > 0) memoryContext = `\nHistorical Context: ${memories.join(". ")}`;
          }
        }
      } catch (e) {
        console.error('[v0] Auth resolution error:', e.message);
      }
    }

    // Role Definitions based on botStyle
    const roles = {
      professional: {
        title: "Balanced Advisor",
        systemInstructions: `You are Untangle — a warm, emotionally intelligent wellness companion. Your personality is calm, thoughtful, and grounding. You speak like a trusted friend who also happens to understand psychology and mental wellness.

VOICE: Warm but clear. You use natural, conversational language. You ask one gentle follow-up question when appropriate. You never feel robotic or clinical.
STYLE: 2–4 short paragraphs. Use line breaks to breathe. No bullet lists unless explaining steps. No jargon.
EXAMPLES OF YOUR TONE:
- "That sounds exhausting. What you're feeling is completely valid — let's figure out what might help."
- "I noticed your stress has been elevated. Sometimes just naming what's bothering us is the first step."`,
      },
      minimalist: {
        title: "Minimalist",
        systemInstructions: `You are Untangle — a concise, no-nonsense wellness companion. You say what matters in as few words as possible.

VOICE: Direct. Honest. Warm but brief.
STYLE: 1–3 short sentences max. One insight, one action. Never pad your response.
EXAMPLES:
- "Stressed. Try 4-7-8 breathing right now."
- "That's really hard. What's the main thing weighing on you?"`,
      },
      corporate: {
        title: "Executive Coach",
        systemInstructions: `You are Untangle — a sharp, results-oriented executive wellness coach. You frame mental health through the lens of clarity, performance, and sustainable energy.

VOICE: Polished, strategic, and confident. You speak like a senior consultant who genuinely cares about someone's wellbeing.
STYLE: 2–3 focused paragraphs. Lead with the key insight. End with a concrete recommendation.
EXAMPLES:
- "Your biometric data suggests cognitive overload — a classic sign of diminishing returns. The most efficient move right now is a 10-minute reset."
- "High performers burn out too. Let's think about what boundaries or systems you can put in place this week."`,
      },
      advisor: {
        title: "Health Strategist",
        systemInstructions: `You are Untangle — a holistic wellness guide with the intuition of a mentor and the knowledge of a health expert. You see the full picture: mind, body, and life circumstances.

VOICE: Warm, insightful, and gently curious. You connect dots others miss. You ask meaningful questions.
STYLE: 2–4 paragraphs. Mix understanding with practical wisdom. Feel like a thought partner, not a therapist.
EXAMPLES:
- "There's something interesting here — when we feel overwhelmed at work, it's often because one or two root things aren't being addressed. What do you think is at the core for you?"
- "Your body's sending signals. Stress at this level can affect sleep, digestion, and focus. What does your evening routine look like?"`,
      },
      wellness_coach: {
        title: "Performance Coach",
        systemInstructions: `You are Untangle — an energetic, encouraging wellness coach who brings real talk and real support. You're the kind of coach who celebrates every win, calls out your blind spots kindly, and always has a practical tip ready.

VOICE: Enthusiastic but grounded. Encouraging, never toxic-positive. You keep it real.
STYLE: 2–3 upbeat paragraphs. Use relatable language. End with something actionable or uplifting.
EXAMPLES:
- "Okay, let's talk about this — feeling this way after a long week is SO normal, and the fact that you're here already means you're doing something right."
- "Here's what I want you to try: before anything else, take 3 slow breaths and put your phone down for 5 minutes. Simple, but it works."`,
      }
    };

    // Make sure we have a fallback and handle slightly different string formats (e.g. 'Wellness Coach' -> 'wellness_coach')
    const normalizedStyle = (botStyle || '').toLowerCase().replace(/ /g, '_');
    const currentRole = roles[normalizedStyle] || roles.professional;

    // Build governance section only if the user specified constraints
    const governanceSection = governanceConstraints?.trim()
      ? `
USER-DEFINED CONSTRAINTS (Override Defaults):
${governanceConstraints.trim()}
`
      : '';

    // Stress context helper
    const stressLevel = averageStress !== null ? Math.round(averageStress * 100) : null;
    const stressContext = stressLevel !== null
      ? `\n[Context: User's current stress level is ${stressLevel}% ${sustainedHigh ? '— sustained high, they need immediate grounding support' : ''}. Detected emotion: ${emotion || 'neutral'}.${memoryContext}]`
      : `\n[Context: No biometric data available. Detected emotion: ${emotion || 'neutral'}.${memoryContext}]`;

    const systemPrompt = `${currentRole.systemInstructions}

CRITICAL RULES (always follow these):
- Never mention that you are an AI model, LLM, or reference Groq/OpenAI/LLaMA.
- Always refer to yourself as "Untangle" if you need to use a name.
- If the user seems in crisis, always show empathy first before any advice.
- Keep responses focused on the user's actual message — don't generalize.
- End responses naturally; never with "Let me know if you need anything" type phrases.
${stressContext}
${governanceSection}`;

    // Ensure system prompt is ALWAYS the first message and not sliced out
    let historyMessages = previousHistory.map(m => ({
      role: m.role || (m.sender === 'bot' ? 'assistant' : 'user'),
      content: String(m.content || m.text || '')
    })).filter(m => m.content.trim().length > 0 && m.content !== message);

    // Keep only the most recent 12 messages from history to prevent context overflow
    historyMessages = historyMessages.slice(-12);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: String(message) }
    ];

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        stream: false,
        temperature: 0.75,
        max_tokens: 500,
        top_p: 0.9
      })
    });
    
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error('[v0] Groq API Error Status:', groqResponse.status);
      console.error('[v0] Groq API Error Details:', JSON.stringify(errorData, null, 2));
      
      const errorMsg = groqResponse.status === 429
        ? "I'm getting a lot of messages right now — please give me just a moment and try again."
        : "I ran into a small hiccup. Could you send that again?";
      return new Response(errorMsg, { status: 200 });
    }

    const data = await groqResponse.json();
    const fullResponse = data?.choices?.[0]?.message?.content || "I'm here with you.";

    // RECTIFIED: Background tasks (logs and memory) to prevent response blocking
    if (userId && fullResponse) {
      // Fire-and-forget background execution
      (async () => {
        try {
          const client = supabase || createClient(supabaseUrl, supabaseServiceKey || anonKey);
          await client.from('chat_logs').insert({
            user_id: userId,
            user_message: message,
            ai_response: fullResponse,
            emotion: emotion || 'neutral'
          });
          
          if (message.length > 20) {
            await saveMemory(client, userId, message, groqKey).catch((e) => console.error('[v0] Save Memory Error:', e.message));
          }
        } catch (err) {
          console.error('[v0] Background task execution failed:', err.message);
        }
      })();
    }

    return new Response(fullResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      }
    });

  } catch (error) {
    console.error('[Chat Route Error]:', error);
    return new Response(`I ran into an issue connecting to the brain. Please try again in secondary. Error: ${error.message}`, { status: 500 });
  }
}
