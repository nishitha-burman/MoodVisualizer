/**
 * Color theme configuration for mood-to-visual mapping.
 *
 * Each anchor is an oklch hue (0-360°) that the user associates with a
 * particular feeling. The mapper interpolates between these anchors based
 * on the mood dimensions.
 */
export interface ThemeConfig {
  /** Hue for happy/joyful (high valence, moderate arousal) */
  happy: number;
  /** Hue for sad (low valence, low arousal) */
  sad: number;
  /** Hue for calm (moderate valence, low arousal) */
  calm: number;
  /** Hue for anxious (moderate valence, high arousal) */
  anxious: number;
  /** Hue for angry (low valence, high arousal, high intensity) */
  angry: number;
  /** Hue for confident (high valence, moderate-high arousal, high intensity) */
  confident: number;
}

/** The curated swatch options shown in the quiz (oklch hue degrees) */
export const SWATCH_OPTIONS = [
  { label: "Coral", hue: 16, hex: "#FF7F6B" },
  { label: "Orange", hue: 50, hex: "#FF9F00" },
  { label: "Yellow", hue: 85, hex: "#F5C542" },
  { label: "Mint", hue: 155, hex: "#5EDBA6" },
  { label: "Teal", hue: 185, hex: "#4DD9D9" },
  { label: "Sky Blue", hue: 220, hex: "#6EBBFF" },
  { label: "Lavender", hue: 280, hex: "#B388FF" },
  { label: "Pink", hue: 330, hex: "#FF6EB4" },
  { label: "Red", hue: 15, hex: "#EF5350" },
  { label: "Deep Purple", hue: 300, hex: "#9C27B0" },
] as const;

/** Default theme: Inside Out inspired palette */
export const DEFAULT_THEME: ThemeConfig = {
  happy: 85,     // yellow (Joy)
  sad: 250,      // blue (Sadness)
  calm: 220,     // soft sky blue
  anxious: 50,   // orange (Anxiety)
  angry: 15,     // red (Anger)
  confident: 40, // warm gold
};

/** Quiz questions in order */
export const QUIZ_QUESTIONS: { key: keyof ThemeConfig; label: string; prompt: string }[] = [
  { key: "happy", label: "Happy", prompt: "What color feels happy to you?" },
  { key: "sad", label: "Sad", prompt: "What color feels sad?" },
  { key: "calm", label: "Calm", prompt: "What color feels calm?" },
  { key: "anxious", label: "Anxious", prompt: "What color feels anxious?" },
  { key: "angry", label: "Angry", prompt: "What color feels angry?" },
  { key: "confident", label: "Confident", prompt: "What color feels confident?" },
];

const STORAGE_KEY = "mood-viz-theme";

/** Load saved theme from localStorage, or null if none. */
export function loadTheme(): ThemeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate it has all keys
    for (const q of QUIZ_QUESTIONS) {
      if (typeof parsed[q.key] !== "number") return null;
    }
    return parsed as ThemeConfig;
  } catch {
    return null;
  }
}

/** Save a theme to localStorage. */
export function saveTheme(theme: ThemeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

/** Clear saved theme (resets to defaults on next load). */
export function clearTheme(): void {
  localStorage.removeItem(STORAGE_KEY);
}
