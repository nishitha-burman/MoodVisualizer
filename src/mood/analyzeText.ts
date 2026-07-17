import { MoodParams } from "./types";

/**
 * Keyword-based mood analyzer.
 * Produces deterministic MoodParams from a text string using a simple lexicon.
 *
 * TODO Phase 3: Replace with Transformers.js or WebNN model producing same MoodParams shape.
 */

interface LexiconEntry {
  valence: number;
  arousal: number;
  intensity: number;
  complexity: number;
}

const LEXICON: Record<string, LexiconEntry> = {
  // Positive, calm
  calm: { valence: 0.6, arousal: 0.1, intensity: 0.4, complexity: 0.1 },
  peaceful: { valence: 0.7, arousal: 0.1, intensity: 0.5, complexity: 0.1 },
  serene: { valence: 0.8, arousal: 0.05, intensity: 0.5, complexity: 0.05 },
  relaxed: { valence: 0.6, arousal: 0.15, intensity: 0.4, complexity: 0.1 },
  content: { valence: 0.7, arousal: 0.2, intensity: 0.5, complexity: 0.15 },
  tranquil: { valence: 0.7, arousal: 0.05, intensity: 0.4, complexity: 0.05 },

  // Positive, energized
  happy: { valence: 0.8, arousal: 0.6, intensity: 0.7, complexity: 0.3 },
  joyful: { valence: 0.9, arousal: 0.8, intensity: 0.9, complexity: 0.4 },
  excited: { valence: 0.7, arousal: 0.9, intensity: 0.8, complexity: 0.5 },
  ecstatic: { valence: 1.0, arousal: 1.0, intensity: 1.0, complexity: 0.6 },
  elated: { valence: 0.9, arousal: 0.85, intensity: 0.9, complexity: 0.45 },
  euphoric: { valence: 1.0, arousal: 0.95, intensity: 1.0, complexity: 0.7 },
  cheerful: { valence: 0.75, arousal: 0.5, intensity: 0.6, complexity: 0.25 },
  grateful: { valence: 0.8, arousal: 0.3, intensity: 0.6, complexity: 0.2 },
  hopeful: { valence: 0.7, arousal: 0.4, intensity: 0.5, complexity: 0.2 },
  confident: { valence: 0.8, arousal: 0.6, intensity: 0.8, complexity: 0.2 },
  playful: { valence: 0.7, arousal: 0.7, intensity: 0.6, complexity: 0.5 },
  energetic: { valence: 0.6, arousal: 0.9, intensity: 0.8, complexity: 0.4 },

  // Negative, calm
  sad: { valence: -0.6, arousal: 0.2, intensity: 0.6, complexity: 0.2 },
  melancholy: { valence: -0.5, arousal: 0.15, intensity: 0.5, complexity: 0.3 },
  lonely: { valence: -0.6, arousal: 0.1, intensity: 0.5, complexity: 0.2 },
  nostalgic: { valence: -0.2, arousal: 0.2, intensity: 0.5, complexity: 0.4 },
  gloomy: { valence: -0.5, arousal: 0.15, intensity: 0.5, complexity: 0.25 },
  depressed: { valence: -0.8, arousal: 0.1, intensity: 0.7, complexity: 0.2 },
  empty: { valence: -0.5, arousal: 0.05, intensity: 0.3, complexity: 0.1 },
  tired: { valence: -0.3, arousal: 0.05, intensity: 0.4, complexity: 0.1 },
  bored: { valence: -0.2, arousal: 0.05, intensity: 0.3, complexity: 0.05 },
  numb: { valence: -0.3, arousal: 0.02, intensity: 0.2, complexity: 0.05 },

  // Negative, energized
  angry: { valence: -0.8, arousal: 0.9, intensity: 0.9, complexity: 0.7 },
  furious: { valence: -1.0, arousal: 1.0, intensity: 1.0, complexity: 0.9 },
  anxious: { valence: -0.5, arousal: 0.8, intensity: 0.7, complexity: 0.8 },
  stressed: { valence: -0.5, arousal: 0.7, intensity: 0.7, complexity: 0.7 },
  frustrated: { valence: -0.6, arousal: 0.7, intensity: 0.7, complexity: 0.6 },
  terrified: { valence: -0.9, arousal: 0.95, intensity: 0.9, complexity: 0.8 },
  panicked: { valence: -0.8, arousal: 1.0, intensity: 1.0, complexity: 0.9 },
  restless: { valence: -0.3, arousal: 0.7, intensity: 0.5, complexity: 0.6 },
  irritated: { valence: -0.5, arousal: 0.6, intensity: 0.5, complexity: 0.5 },
  overwhelmed: { valence: -0.6, arousal: 0.8, intensity: 0.8, complexity: 0.9 },

  // Mixed / complex
  dreamy: { valence: 0.3, arousal: 0.2, intensity: 0.4, complexity: 0.6 },
  confused: { valence: -0.2, arousal: 0.5, intensity: 0.4, complexity: 0.9 },
  curious: { valence: 0.4, arousal: 0.5, intensity: 0.5, complexity: 0.6 },
  inspired: { valence: 0.7, arousal: 0.6, intensity: 0.7, complexity: 0.5 },
  bittersweet: { valence: -0.1, arousal: 0.3, intensity: 0.6, complexity: 0.7 },
  contemplative: { valence: 0.1, arousal: 0.2, intensity: 0.4, complexity: 0.5 },
  wistful: { valence: -0.2, arousal: 0.15, intensity: 0.5, complexity: 0.5 },
  awe: { valence: 0.6, arousal: 0.5, intensity: 0.8, complexity: 0.7 },
  wonder: { valence: 0.6, arousal: 0.5, intensity: 0.7, complexity: 0.6 },
  love: { valence: 0.9, arousal: 0.5, intensity: 0.9, complexity: 0.3 },
  tender: { valence: 0.7, arousal: 0.2, intensity: 0.6, complexity: 0.2 },
  fierce: { valence: -0.3, arousal: 0.9, intensity: 0.9, complexity: 0.6 },
};

/** Default neutral mood when no keywords match */
const NEUTRAL: MoodParams = {
  valence: 0,
  arousal: 0.3,
  intensity: 0.3,
  complexity: 0.3,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Analyze a text string and produce normalized MoodParams.
 * Uses keyword matching against a lexicon; averages matches.
 *
 * TODO Phase 2: Accept input from Web Speech API transcript.
 * TODO Phase 3: Replace with ML model (same output shape).
 */
export function analyzeText(text: string): MoodParams {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
  const matches: LexiconEntry[] = [];

  for (const word of words) {
    if (LEXICON[word]) {
      matches.push(LEXICON[word]);
    }
  }

  if (matches.length === 0) {
    return { ...NEUTRAL };
  }

  const sum = matches.reduce(
    (acc, m) => ({
      valence: acc.valence + m.valence,
      arousal: acc.arousal + m.arousal,
      intensity: acc.intensity + m.intensity,
      complexity: acc.complexity + m.complexity,
    }),
    { valence: 0, arousal: 0, intensity: 0, complexity: 0 }
  );

  const n = matches.length;
  return {
    valence: clamp(sum.valence / n, -1, 1),
    arousal: clamp(sum.arousal / n, 0, 1),
    intensity: clamp(sum.intensity / n, 0, 1),
    complexity: clamp(sum.complexity / n, 0, 1),
  };
}
