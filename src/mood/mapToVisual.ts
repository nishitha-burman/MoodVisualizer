import { MoodParams, VisualParams } from "./types";

/**
 * Maps mood dimensions to visual parameters for the GPU shader.
 *
 * Mapping summary:
 *   valence  → hue (cool blues for negative, warm oranges/yellows for positive), brightness
 *   arousal  → speed, turbulence
 *   intensity → density, scale
 *   complexity → noise frequency, coherence (inverted)
 */
export function mapToVisual(mood: MoodParams): VisualParams {
  // Valence → hue: negative = cool (220-260°), positive = warm (20-60°)
  // Neutral maps to purple/magenta (280-300°) range
  const hue = mood.valence >= 0
    ? lerp(300, 50, mood.valence)   // neutral→warm
    : lerp(300, 220, -mood.valence); // neutral→cool

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
