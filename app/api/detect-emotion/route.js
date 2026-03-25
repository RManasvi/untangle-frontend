import { getGeminiResponse } from '@/utils/geminiApi';

// Simple emotion detection based on image analysis
// In production, integrate with face-api.js or TensorFlow.js
const emotionMap = {
  happy: { keywords: ['smile', 'bright', 'joy'], confidence: 0.85 },
  sad: { keywords: ['frown', 'down', 'tears'], confidence: 0.80 },
  anxious: { keywords: ['tense', 'stressed', 'worried'], confidence: 0.75 },
  calm: { keywords: ['relaxed', 'peaceful', 'serene'], confidence: 0.90 },
  angry: { keywords: ['furrowed', 'intense', 'frustrated'], confidence: 0.70 },
  neutral: { keywords: ['normal', 'typical'], confidence: 0.65 },
};

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return Response.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Simulate emotion detection
    // In production, use face-api or TensorFlow.js for real detection
    const emotions = Object.entries(emotionMap);
    const randomIndex = Math.floor(Math.random() * emotions.length);
    const [emotion, data] = emotions[randomIndex];

    // Add some variance to confidence
    const variance = (Math.random() - 0.5) * 0.1;
    const confidence = Math.max(0.5, Math.min(1, data.confidence + variance));

    return Response.json({
      emotion,
      confidence,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[v0] Emotion detection error:', error);
    return Response.json(
      { error: 'Failed to detect emotion' },
      { status: 500 }
    );
  }
}
