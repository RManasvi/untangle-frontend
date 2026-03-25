'use client';

// Client-side wrapper that calls the server endpoint
export async function getGroqResponse(userMessage, emotionState, context = '', token = null, averageStress = null, sustainedHigh = false, onUpdate = null, previousHistory = [], botStyle = 'professional') {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Read customization from localStorage
    const customization = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('botCustomization') || '{}')
      : {};

    // Read governance constraints set during onboarding (Privacy Configurations step)
    const botSetup = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('botSetup') || '{}')
      : {};
    const governanceConstraints = botSetup.restrictions || '';

    console.log('[v0] Fetching /api/chat with body:', { message: userMessage, botStyle, histLen: previousHistory.length, hasGovernance: !!governanceConstraints });
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({
        message: userMessage,
        emotion: emotionState,
        context: context,
        averageStress,
        sustainedHigh,
        previousHistory,
        botStyle,
        governanceConstraints,
        userPreferences: {
          tone: customization.voiceTone || null,
          personality: customization.personality || null,
          length: customization.responseLength || null
        }
      }),
    });

    console.log('[v0] /api/chat response status:', response.status);
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Daily AI limit reached. Please rest your eyes and return tomorrow.");
      }
      const errorText = await response.text();
      console.error('[v0] Chat API Error Text:', errorText);
      throw new Error(`Chat API error: ${response.status} - ${errorText}`);
    }

    // Non-streaming handling
    const text = await response.text();
    if (onUpdate) onUpdate(text);
    return text;

  } catch (error) {
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.warn('[v0] Chat fetch aborted (likely due to navigation or re-render)');
      return null;
    }
    console.error('[v0] Chat API Error:', error);
    throw error;
  }
}

// Legacy export names for backward compatibility
export const getGeminiResponse = getGroqResponse;
export const analyzeEmotionWithGemini = getGroqResponse;
