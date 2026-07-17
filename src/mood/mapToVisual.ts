import { MoodParams, VisualParams } from "./types";
import { ThemeConfig, DEFAULT_THEME } from "./theme";

/** Module-level active theme — set via setActiveTheme(). */
let activeTheme: ThemeConfig = DEFAULT_THEME;

/** Update the active color theme used by the mapper. */
export function setActiveTheme(theme: ThemeConfig): void {
  activeTheme = theme;
}

/** Get the currently active theme. */
export function getActiveTheme(): ThemeConfig {
  return activeTheme;
}

/**
 * Maps mood dimensions to visual parameters for the GPU shader.
 *
 * Hue is derived from the active ThemeConfig anchors based on mood dimensions.
 * Other visual properties (speed, turbulence, etc.) remain mood-driven.
 */
export function mapToVisual(mood: MoodParams): VisualParams {
  const hue = computeHue(mood, activeTheme);

  // Brightness: positive moods are brighter (raised floor for fun/vibrant feel)
  const brightness = lerp(0.45, 0.8, (mood.valence + 1) / 2);

  // Saturation: higher intensity = more saturated (raised floor)
  const saturation = lerp(0.45, 0.95, mood.intensity);

  // Speed: driven by arousal
  const speed = lerp(0.2, 2.5, mood.arousal);

  // Turbulence: arousal + some complexity influence
  const turbulence = lerp(0.1, 1.5, mood.arousal * 0.7 + mood.complexity * 0.3);

  // Density: intensity drives bloom/density
  const density = lerp(0.3, 1.0, mood.intensity);

  // Scale: intensity makes things bigger/bolder
  const scale = lerp(0.6, 1.8, mood.intensity);

  // Noise frequency: complexity drives fragmentation
  const noiseFreq = lerp(1.0, 6.0, mood.complexity);

  // Coherence: inverse of complexity (1 = smooth, 0 = chaotic)
  const coherence = 1.0 - mood.complexity;

  return { hue, saturation, brightness, speed, turbulence, density, scale, noiseFreq, coherence };
}

/**
 * Compute hue from mood dimensions using theme color anchors.
 *
 * Strategy: weight each theme anchor by how closely the mood matches that
 * feeling, then blend all hues using angular weighted average.
 */
function computeHue(mood: MoodParams, theme: ThemeConfig): number {
  // Calculate how much each anchor "matches" the current mood.
  // Each weight is 0-1 based on proximity in the mood space.
  const weights: { hue: number; weight: number }[] = [
    {
      hue: theme.happy,
      // Happy: high valence, moderate arousal
      weight: Math.max(0, mood.valence) * (1 - Math.abs(mood.arousal - 0.4) * 0.5),
    },
    {
      hue: theme.sad,
      // Sad: low valence, low arousal
      weight: Math.max(0, -mood.valence) * (1 - mood.arousal),
    },
    {
      hue: theme.calm,
      // Calm: low arousal, neutral-to-positive valence
      weight: (1 - mood.arousal) * (1 - mood.intensity) * ((mood.valence + 1) / 2),
    },
    {
      hue: theme.anxious,
      // Anxious: high arousal, moderate-negative valence
      weight: mood.arousal * (1 - Math.max(0, mood.valence) * 0.5),
    },
    {
      hue: theme.angry,
      // Angry: low valence, high arousal, high intensity
      weight: Math.max(0, -mood.valence) * mood.arousal * mood.intensity,
    },
    {
      hue: theme.confident,
      // Confident: high valence, moderate-high arousal, high intensity
      weight: Math.max(0, mood.valence) * mood.arousal * mood.intensity,
    },
  ];

  // Weighted angular average of hues
  let sinSum = 0;
  let cosSum = 0;
  let totalWeight = 0;

  for (const { hue, weight } of weights) {
    if (weight <= 0) continue;
    const rad = (hue * Math.PI) / 180;
    sinSum += Math.sin(rad) * weight;
    cosSum += Math.cos(rad) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    // Fallback: neutral purple
    return 280;
  }

  let angle = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
