import { createClient } from '@supabase/supabase-js';
import { saveMemory } from '@/utils/memory';

const EXTRACTION_PROMPT = `You are an expert Data-Driven Clinical Psychologist AI. 
Analyze the provided weekly wellness telemetry for this user.

CRITICAL RULES:
1. NO HALLUCINATION: You must only draw conclusions based on the EXACT numbers provided in the JSON payload.
2. If stress was 20% and mood was 80%, do NOT say the user had a terrible week. 
3. If meditation duration is 0, explicitly recommend starting small (e.g., 2 minutes).
4. Do not provide medical diagnoses.

DATA ATTENTION:
Look for correlations. (e.g., "I notice your stress average was 82%, but you only meditated for 0 minutes. There is an opportunity here.")

Output your response strictly as a JSON object matching this schema:
{
  "weekly_headline": "A short 5-word summary (e.g., 'High Stress, Low Support Focus')",
  "correlation_insight": "One sentence linking two different data points.",
  "encouragement": "A warm, supportive wrap-up paragraph."
}`;

export async function POST(request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate the User
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return Response.json({ error: "No authorization header" }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        // 2. Fetch Aggregated Stats in 1 Database round-trip
        const { data: stats, error: statsError } = await supabase.rpc('get_weekly_wellness_stats', {
            query_user_id: user.id
        });

        if (statsError) throw statsError;

        // 3. Compile the Anti-Hallucination Prompt
        const prompt = `${EXTRACTION_PROMPT}\n\nUSER'S WEEKLY RAW DATA:\n${JSON.stringify(stats, null, 2)}`;

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing");
        }

        // 4. Request Structured JSON from Groq
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.1, // LOW temperature for deterministic analytical processing
                response_format: { type: "json_object" } // Force JSON output
            }),
        });

        if (!groqResponse.ok) {
            const errData = await groqResponse.json();
            throw new Error(`Groq API error: ${groqResponse.status} - ${errData.error?.message || 'Unknown error'}`);
        }

        const llmData = await groqResponse.json();
        const insightContent = llmData.choices[0]?.message?.content;

        if (!insightContent) {
            throw new Error("Failed to generate insight content from Groq");
        }

        const insightJSON = JSON.parse(insightContent);

        // 5. Save this weekly summary back into LTEM vector DB asynchronously
        // Format a rich contextual memory string
        const weeklyMemoryString = `Weekly Insight: ${insightJSON.weekly_headline}. Breakdown: ${insightJSON.correlation_insight}`;
        saveMemory(supabase, user.id, weeklyMemoryString, GROQ_API_KEY).catch(e => {
            console.error('[v0] Failed to save weekly insight to LTEM:', e);
        });

        // 6. Return payload to frontend dashboard
        return Response.json({
            success: true,
            stats: stats,
            insights: insightJSON
        });

    } catch (error) {
        console.error("[v0] Weekly Insights Error:", error);
        return Response.json({ error: 'Failed to generate insights', details: error.message }, { status: 500 });
    }
}
