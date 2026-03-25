import { pipeline } from '@xenova/transformers';

// ── Singleton embedding model ─────────────────────────────────────────────────
// Persists between requests within the same Node.js process so the 30MB model
// is only downloaded and loaded once.
let extractor: any = null;
let extractorLoading = false;

/**
 * ✅ FIX Issue 5: Lazy-load the embedding model with a 5s timeout.
 * Returns null (does NOT throw) on failure so every caller can degrade gracefully
 * instead of throwing, which would timeout Vercel functions and crash the chat route.
 */
async function getExtractor(): Promise<any | null> {
    if (extractor) return extractor;

    // Prevent concurrent load attempts
    if (extractorLoading) return null;

    extractorLoading = true;
    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Embedding model load timeout')), 5000)
        );
        extractor = await Promise.race([
            pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true }),
            timeoutPromise,
        ]);
        console.log('[Memory] Embedding model loaded successfully');
        return extractor;
    } catch (e: any) {
        console.warn('[Memory] Embedding model unavailable — memory features disabled:', e.message);
        extractor = null;
        return null;
    } finally {
        extractorLoading = false;
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return [];
    try {
        // ✅ FIX Issue 5: Graceful degradation — return [] instead of throwing
        const model = await getExtractor();
        if (!model) return [];

        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data) as number[];
    } catch (e: any) {
        console.error('[v0] Embedding generation failed:', e.message);
        return []; // ✅ Return empty array, NEVER throw — callers must handle []
    }
}

export async function retrieveMemories(
    supabase: any,
    userId: string,
    currentMessage: string
): Promise<string[]> {
    if (!supabase || !userId || !currentMessage) return [];

    // Skip embedding for short/trivial messages
    if (currentMessage.trim().length < 5 || currentMessage.split(' ').length < 2) {
        return [];
    }

    try {
        const inputEmbedding = await generateEmbedding(currentMessage);
        // ✅ FIX Issue 5: If embedding is empty (model unavailable), skip the RPC call
        if (inputEmbedding.length === 0) return [];

        const { data: memories, error } = await supabase.rpc('match_user_memories', {
            query_embedding: inputEmbedding,
            match_count: 3,
            query_user_id: userId
        });

        if (error) return [];

        return (memories || [])
            .filter((m: any) => m.similarity > 0.4)
            .map((m: any) => m.insight_text);

    } catch (err) {
        return [];
    }
}

const EXTRACTION_PROMPT = `
You are a psychological insight extraction engine.
Analyze the following user message from a wellness chatbot session. 

Rules:
1. If the message contains recurring emotional themes, stress triggers, core anxieties, or important personal context, extract it. Example: "User experiences severe anxiety regarding workplace evaluations."
2. If the message is trivial ("hello", "thanks"), return exactly the word "NULL".
3. If the message contains immediate crisis indicators (e.g., self-harm), return exactly the word "NULL" to prevent automated triggering.

User Message: "{USER_MESSAGE}"

Response:
`;

export async function saveMemory(
    supabase: any,
    userId: string,
    userMessage: string,
    groqApiKey: string
): Promise<void> {
    if (!supabase || !userId || !groqApiKey || !userMessage) return;
    if (userMessage.length < 15) return;

    try {
        const prompt = EXTRACTION_PROMPT.replace('{USER_MESSAGE}', userMessage);

        const extractionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            }),
        });

        if (!extractionResponse.ok) return;

        const data = await extractionResponse.json();
        const insight: string = data.choices?.[0]?.message?.content?.trim() ?? '';

        if (!insight || insight === 'NULL' || insight.toLowerCase() === 'null' || insight.length < 10) {
            return;
        }

        console.log(`[v0] Memory Extracted: "${insight}"`);

        const embedding = await generateEmbedding(insight);
        // ✅ FIX Issue 5: Skip DB insert if embedding model was unavailable
        if (embedding.length === 0) {
            console.warn('[Memory] Skipping memory save — embedding unavailable');
            return;
        }

        const { error: insertError } = await supabase
            .from('user_memories')
            .insert({
                user_id: userId,
                insight_text: insight,
                embedding: embedding,
                importance_score: 5
            });

        if (insertError) {
            console.error('[v0] failed to insert memory:', insertError?.message, insertError?.code);
        }

    } catch (error: any) {
        console.error('[v0] Silent Background Error in saveMemory:', error?.message);
    }
}
