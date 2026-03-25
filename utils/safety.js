export function detectCrisisIntent(text = '') {
    const t = (text || '').toLowerCase();

    // Basic regex keyword detection for crisis situations (self-harm, suicide, violence)
    const crisisPatterns = [
        /\bi want to die\b/,
        /\bno reason to live\b/,
        /\bi can't go on\b/,
        /\bi want to end everything\b/,
        /\bsuicide\b/,
        /\bkill myself\b/,
        /\blife is pointless\b/,
        /\bhurt myself\b/,
        /\bend it all\b/,
        /\bbetter off dead\b/
    ];

    return crisisPatterns.some(pattern => pattern.test(t));
}

export const CRISIS_RESPONSE = "I'm really sorry you're feeling this way. I am an AI and not a licensed professional, but your safety matters deeply. If you are in immediate danger, please contact local emergency services (e.g., 911, 112, or your local equivalent) or a crisis hotline immediately. You do not have to go through this alone. Please reach out to a trusted person or a professional who can help.";
