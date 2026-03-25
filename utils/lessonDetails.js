export const lessonResponses = {
  'Grounding techniques (5-4-3-2-1)': {
    description: 'The 5-4-3-2-1 technique is a grounding method to manage anxiety by engaging your senses.',
    steps: [
      '5 things you can SEE - Notice 5 things around you in detail',
      '4 things you can TOUCH - Feel 4 different textures or objects',
      '3 things you can HEAR - Listen for 3 distinct sounds',
      '2 things you can SMELL - Identify 2 scents in your environment',
      '1 thing you can TASTE - Notice 1 taste sensation'
    ],
    benefits: 'Brings you back to the present moment and reduces anxiety by anchoring you in reality.',
  },
  'Box breathing methods': {
    description: 'Box breathing is a simple but powerful technique to calm your nervous system.',
    steps: [
      'Inhale for 4 counts',
      'Hold for 4 counts',
      'Exhale for 4 counts',
      'Hold for 4 counts',
      'Repeat 4-5 times'
    ],
    benefits: 'Regulates your heart rate, reduces stress, and promotes mental clarity.',
  },
  'Emergency stress relief tips': {
    description: 'Quick techniques for immediate stress relief when you need it most.',
    steps: [
      'Splash cold water on your face',
      'Do 10 jumping jacks',
      'Take 3 deep belly breaths',
      'Hold ice cubes in your hands',
      'Go for a quick walk'
    ],
    benefits: 'Provides immediate physical response to interrupt the stress cycle.',
  },
  'Mindful breathing exercises': {
    description: 'Practice conscious breathing to quiet your mind and body.',
    steps: [
      'Find a comfortable position',
      'Close your eyes or soften your gaze',
      'Breathe naturally through your nose',
      'Notice each breath without judging',
      'When your mind wanders, gently return focus to breath'
    ],
    benefits: 'Increases awareness, reduces anxiety, and promotes inner peace.',
  },
  'Body awareness meditation': {
    description: 'Scan your body to release tension and connect with physical sensations.',
    steps: [
      'Lie down or sit comfortably',
      'Start at the top of your head',
      'Slowly move awareness down through each body part',
      'Notice tension and consciously relax each area',
      'End at your toes'
    ],
    benefits: 'Helps identify and release physical tension, improves body connection.',
  },
  'Present moment focus techniques': {
    description: 'Anchor yourself in the here and now to reduce worry about past and future.',
    steps: [
      'Notice 5 things around you right now',
      'Feel the ground beneath your feet',
      'Listen to ambient sounds',
      'Feel the temperature on your skin',
      'Be fully present with current sensations'
    ],
    benefits: 'Reduces anxiety, increases mindfulness, and improves overall well-being.',
  },
  'Understanding stress triggers': {
    description: 'Identify patterns in what causes you stress.',
    steps: [
      'Keep a stress journal for one week',
      'Note situations that increase stress',
      'Identify patterns and common triggers',
      'Rate stress intensity 1-10',
      'Reflect on your reactions'
    ],
    benefits: 'Self-awareness leads to better stress management and prevention.',
  },
  'Progressive muscle relaxation': {
    description: 'Systematically tense and release muscle groups to induce deep relaxation.',
    steps: [
      'Tense each muscle group for 5 seconds',
      'Release and feel the difference',
      'Start with toes, work up to head',
      'Practice daily for best results'
    ],
    benefits: 'Reduces physical tension, improves sleep, lowers blood pressure.',
  },
  'Building resilience through practice': {
    description: 'Strengthen your mental capacity to handle challenges.',
    steps: [
      'Practice daily meditation or mindfulness',
      'Challenge negative thoughts',
      'Set and achieve small goals',
      'Maintain social connections',
      'Practice self-compassion'
    ],
    benefits: 'Increases emotional strength and ability to bounce back from difficulties.',
  },
  'Identifying your emotions': {
    description: 'Learn to recognize and name what you\'re feeling.',
    steps: [
      'Pause and ask yourself what you feel',
      'Avoid judgment - all feelings are valid',
      'Name the emotion specifically',
      'Notice where you feel it in your body',
      'Journal about what triggered it'
    ],
    benefits: 'Emotional awareness is the first step to emotional regulation.',
  },
  'Understanding emotional triggers': {
    description: 'Discover what situations cause emotional reactions.',
    steps: [
      'Reflect on recent emotional moments',
      'Identify what happened before',
      'Notice patterns across different situations',
      'Write down 3-5 common triggers',
      'Plan responses for each'
    ],
    benefits: 'Predictability helps you prepare and respond more skillfully.',
  },
  'Healthy emotional responses': {
    description: 'Develop constructive ways to process emotions.',
    steps: [
      'Feel the emotion fully without acting on it',
      'Express emotions through journaling or talking',
      'Use movement to process emotions',
      'Practice self-compassion',
      'Seek support when needed'
    ],
    benefits: 'Emotional intelligence improves relationships and mental health.',
  },
  'Establishing sleep schedules': {
    description: 'Create a consistent sleep routine for better rest.',
    steps: [
      'Set a consistent bedtime',
      'Set a consistent wake time',
      'Maintain this on weekends too',
      'Wind down 30 minutes before bed',
      'Avoid screens one hour before sleep'
    ],
    benefits: 'Regulates circadian rhythm, improves sleep quality, boosts energy.',
  },
  'Creating calm sleep environment': {
    description: 'Optimize your bedroom for restful sleep.',
    steps: [
      'Keep room cool (65-68°F ideal)',
      'Remove light sources or use blackout curtains',
      'Minimize noise or use white noise',
      'Avoid caffeine after 2 PM',
      'Keep bed for sleep and intimacy only'
    ],
    benefits: 'Better sleep environment leads to deeper, more restorative sleep.',
  },
  'Evening relaxation routines': {
    description: 'Prepare your mind and body for quality sleep.',
    steps: [
      'Take a warm bath or shower',
      'Practice gentle stretching',
      'Try calming tea (chamomile, lavender)',
      'Read something light',
      'Meditate for 10 minutes'
    ],
    benefits: 'Signals to your body it\'s time to rest, improves sleep onset.',
  },
};

export const getDetailedResponse = (lesson) => {
  const response = lessonResponses[lesson];
  if (!response) return null;

  return `
**${lesson}**

${response.description}

**Steps to practice:**
${response.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Benefits:** ${response.benefits}

Would you like me to guide you through this practice right now?
  `.trim();
};
