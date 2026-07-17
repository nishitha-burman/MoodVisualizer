/**
 * Mood dimensions produced by text analysis.
 * All values are normalized and deterministic.
 */
export interface MoodParams {
  /** -1 (negative) to +1 (positive) */
  valence: number;
  /** 0 (calm) to 1 (energized) */
  arousal: number;
  /** 0 to 1, overall emotional strength */
  intensity: number;
  /** 0 (coherent) to 1 (chaotic/fragmented) */
  complexity: number;
}

/**
 * Visual parameters derived from MoodParams, ready for GPU uniforms.
 * All values are in ranges the shader expects.
 */
export interface VisualParams {
  /** Primary hue in oklch degrees (0-360) */
  hue: number;
  /** Saturation 0-1 */
  saturation: number;
  /** Brightness 0-1 */
  brightness: number;
  /** Motion speed multiplier */
  speed: number;
  /** Turbulence / curl-noise strength */
  turbulence: number;
  /** Density / bloom amount 0-1 */
  density: number;
  /** Scale multiplier */
  scale: number;
  /** Noise frequency */
  noiseFreq: number;
  /** Coherence vs fragmentation 0-1 */
  coherence: number;
}

/**
 * GPU uniform struct layout (matches WGSL).
 * Total: 48 bytes (12 x f32), padded to 16-byte alignment.
 *
 * Byte layout:
 *   0-3:   time (f32)
 *   4-7:   hue (f32)
 *   8-11:  saturation (f32)
 *   12-15: brightness (f32)
 *   16-19: speed (f32)
 *   20-23: turbulence (f32)
 *   24-27: density (f32)
 *   28-31: scale (f32)
 *   32-35: noiseFreq (f32)
 *   36-39: coherence (f32)
 *   40-43: resolutionX (f32)
 *   44-47: resolutionY (f32)
 */
export const UNIFORM_BUFFER_SIZE = 48;
