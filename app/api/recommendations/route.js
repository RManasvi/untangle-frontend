import { createClient } from '@supabase/supabase-js';
import { retrieveMemories } from '@/utils/memory';

const RECOMMENDATION_PROMPT = `You are a high-performance cognitive load analyst. 
Your objective is to provide deterministic, actionable interventions to optimize mental performance and mitigate burnout risk for IT professionals.

CRITICAL ANALYTICAL RULES:
1. Tone must be strictly professional, clinical, and data-driven. Avoid motivational fluff.
2. Interventions must be practical, specific, and measurable.
3. Base suggestions entirely on the telemetry and historical data provided.
4. If Burnout Risk > 70, prioritize high-impact recovery and critical rest.

DATA-DRIVEN LOGIC:
- meditationFrequency = 0: Recommend localized breathing or pattern interrupt.
- stressTrendPercentage > 10: Suggest immediate workload stabilization.
- lateNightRatio > 25: Recommend chronobiological adjustments.

Output response as a JSON array of 3 actionable items:
[
  {
    "title": "Title (e.g., 'Chronobiological Reset')",
    "description": "Deterministic instruction.",
    "why_it_works": "Direct link to user metric.",
    "difficulty": "Easy", "Medium", or "Hard"
  }
]`;

/**
 * ✅ FIX Issue 6: Multi-strategy JSON extractor.
 * Groq / Llama3 occasionally prepends "Here is the JSON:" or wraps the array
 * in an object. This handles all three patterns without throwing.
 */
function extractJsonFromLLMResponse(content) {
    // Strategy 1 — direct parse
    try { return JSON.parse(content); } catch (_) {}

    // Strategy 2 — extract [...] array from prose
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try { return JSON.parse(arrayMatch[0]); } catch (_) {}
    }

    // Strategy 3 — extract {...} object that wraps the array
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        try {
            const parsed = JSON.parse(objectMatch[0]);
            // Handle { "recommendations": [...] } or { "interventions": [...] }
            return Array.isArray(parsed)
                ? parsed
                : (parsed.recommendations || parsed[Object.keys(parsed)[0]]);
        } catch (_) {}
    }

    return null; // All strategies failed
}

export async function POST(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = request.headers.get('authorization');
        if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const requestBody = await request.json();
        const { metrics_snapshot, risk_score_internal } = requestBody;

        if (!metrics_snapshot) {
            return Response.json({ error: 'Missing required telemetry payload' }, { status: 400 });
        }

        // 1. Context Augmentation (RAG)
        const memories = await retrieveMemories(supabase, user.id, 'burnout stress triggers core anxieties');
        const LTEM_context = memories.length > 0
            ? `Historical Patterns:\n- ${memories.join('\n- ')}`
            : 'No historical data available.';

        // 2. Structured Prompt Generation
        const prompt = `${RECOMMENDATION_PROMPT}

--- CURRENT TELEMETRY PAYLOAD ---
Calculated Burnout Risk (0-100): ${risk_score_internal}
Average Stress (7-day): ${Math.round(metrics_snapshot.avgStress7d * 100)}%
Stress Trend Delta: ${Math.round(metrics_snapshot.stressTrendPercentage)}% vs last week
Late-Night Activity Ratio: ${Math.round(metrics_snapshot.lateNightRatio)}%
Meditation Frequency (7-day): ${metrics_snapshot.meditationFrequency}
Peak Stress Hour: ${metrics_snapshot.peakStressHour}:00

--- LONG-TERM COGNITIVE PATTERNS ---
${LTEM_context}
`;

        // 3. AI Generation
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // ✅ FIX Issue 6: More reliable JSON than llama3-70b-8192
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }),
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text().catch(() => 'unknown');
            console.error('[Recommendations] Groq API error:', groqResponse.status, errText.slice(0, 200));
            throw new Error(`Groq generation failed: ${groqResponse.status}`);
        }

        const llmData = await groqResponse.json();
        const rawContent = llmData.choices?.[0]?.message?.content ?? '';

        // ✅ FIX Issue 6: Use robust extractor
        const recommendations = extractJsonFromLLMResponse(rawContent);

        if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
            console.error('[Recommendations] LLM returned unparseable content:', rawContent.slice(0, 300));
            // ✅ FIX Issue 6: Return 500 so the client knows it failed — NOT 200 with empty array
            return Response.json(
                { success: false, error: 'AI returned an invalid format', recommendations: [] },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            recommendations
        });

    } catch (error) {
        console.error('[v0] Recommendations API Error:', error?.message ?? error);
        return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 });
    }
}

