// /**
//  * Demo data generator for testing without Python backend
//  */

// import type { StressData } from '@/app/page'

// export function generateDemoData(): StressData {
//   const now = Date.now()
//   const baseStress = Math.random() * 0.3 + 0.2

//   // Add some realistic variation
//   const noise = Math.sin(now / 10000) * 0.1
//   const stress = Math.max(0, Math.min(1.5, baseStress + noise))

//   let stressLevel: string
//   if (stress < 0.35) {
//     stressLevel = 'calm'
//   } else if (stress < 0.65) {
//     stressLevel = 'mild'
//   } else {
//     stressLevel = 'high'
//   }

//   return {
//     timestamp: now,
//     eyebrow_raise: Math.random() * 0.08 * (1 + Math.sin(now / 5000)),
//     lip_tension: Math.random() * 0.6 + (stress * 0.4),
//     head_nod_intensity: Math.random() * 1.5 * (1 + Math.sin(now / 8000) * 0.5),
//     symmetry_delta: Math.random() * 0.05,
//     blink_rate: 15 + Math.random() * 10 + (stress * 5),
//     stress_score: stress,
//     stress_level: stressLevel,
//   }
// }

// export function generateDemoHistory(count: number): StressData[] {
//   const history: StressData[] = []
//   const startTime = Date.now() - count * 1000

//   for (let i = 0; i < count; i++) {
//     const t = i / count
//     const stress = 0.3 + 0.2 * Math.sin(t * Math.PI * 4) + Math.random() * 0.1

//     let stressLevel: string
//     if (stress < 0.35) {
//       stressLevel = 'calm'
//     } else if (stress < 0.65) {
//       stressLevel = 'mild'
//     } else {
//       stressLevel = 'high'
//     }

//     history.push({
//       timestamp: startTime + i * 1000,
//       eyebrow_raise: Math.abs(Math.sin(t * Math.PI * 2) * 0.08),
//       lip_tension: Math.max(0, Math.sin(t * Math.PI * 3) * 0.5 + 0.3),
//       head_nod_intensity: Math.abs(Math.sin(t * Math.PI * 1.5) * 1.5),
//       symmetry_delta: Math.random() * 0.05,
//       blink_rate: 15 + Math.sin(t * Math.PI * 2) * 8 + Math.random() * 3,
//       stress_score: stress,
//       stress_level: stressLevel,
//     })
//   }

//   return history
// }
/**
 * Demo data generator for testing without Python backend
 */

export interface StressData {
  timestamp: number;
  eyebrow_raise: number;
  lip_tension: number;
  head_nod_intensity: number;
  symmetry_delta: number;
  blink_rate: number;
  stress_score: number;
  stress_level: string;
  stress_label?: string;
}

export function generateDemoData(): StressData {
  const now = Date.now();
  const baseStress = Math.random() * 0.3 + 0.2;

  // Add some realistic variation
  const noise = Math.sin(now / 10000) * 0.1;
  const stress = Math.max(0, Math.min(1, baseStress + noise));

  let stressLevel: string;
  let stressLabel: string;

  if (stress < 0.3) {
    stressLevel = "calm";
    stressLabel = "Calm";
  } else if (stress < 0.6) {
    stressLevel = "mild";
    stressLabel = "Slight Stress";
  } else {
    stressLevel = "high";
    stressLabel = "High Stress";
  }

  return {
    timestamp: now,
    eyebrow_raise: Math.random() * 0.08 * (1 + Math.sin(now / 5000)),
    lip_tension: Math.random() * 0.6 + stress * 0.4,
    head_nod_intensity: Math.random() * 1.5 * (1 + Math.sin(now / 8000) * 0.5),
    symmetry_delta: Math.random() * 0.05,
    blink_rate: 15 + Math.random() * 10 + stress * 5,
    stress_score: stress,
    stress_level: stressLevel,
    stress_label: stressLabel,
  };
}

export function generateDemoHistory(count: number): StressData[] {
  const history: StressData[] = [];
  const startTime = Date.now() - count * 1000;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const stress = 0.3 + 0.2 * Math.sin(t * Math.PI * 4) + Math.random() * 0.1;

    let stressLevel: string;
    let stressLabel: string;

    if (stress < 0.3) {
      stressLevel = "calm";
      stressLabel = "Calm";
    } else if (stress < 0.6) {
      stressLevel = "mild";
      stressLabel = "Slight Stress";
    } else {
      stressLevel = "high";
      stressLabel = "High Stress";
    }

    history.push({
      timestamp: startTime + i * 1000,
      eyebrow_raise: Math.abs(Math.sin(t * Math.PI * 2) * 0.08),
      lip_tension: Math.max(0, Math.sin(t * Math.PI * 3) * 0.5 + 0.3),
      head_nod_intensity: Math.abs(Math.sin(t * Math.PI * 1.5) * 1.5),
      symmetry_delta: Math.random() * 0.05,
      blink_rate: 15 + Math.sin(t * Math.PI * 2) * 8 + Math.random() * 3,
      stress_score: stress,
      stress_level: stressLevel,
      stress_label: stressLabel,
    });
  }

  return history;
}