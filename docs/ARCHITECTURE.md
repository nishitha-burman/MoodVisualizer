# Architecture

## Overview

Mood Visualizer is a **client-side only** web app that converts a text
description of how someone feels into a living, GPU-rendered generative art
piece. There is no backend, no server, and no external API calls — everything
runs in the browser using **WebGPU**.

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌────────┐
│  User    │────▶│ analyzeText │────▶│ mapToVisual  │────▶│ Uniform Buffer │────▶│ WGSL   │
│  Input   │     │             │     │              │     │ (48 bytes)     │     │ Shader │
│ (text)   │     │ → MoodParams│     │ → VisualParams│    │                │     │        │
└──────────┘     └─────────────┘     └──────────────┘     └────────────────┘     └────────┘
```

Data flows **one direction only**. Each stage is decoupled from the others so
components can be swapped independently.

## Modules

### `src/mood/analyzeText.ts` — The Analyzer

Converts raw text into four normalized mood dimensions (`MoodParams`).

**Current implementation (Phase 1):** A keyword lexicon of ~40 emotion words.
Each word has hand-tuned values for valence, arousal, intensity, and complexity.
The function tokenizes the input, matches against the lexicon, and averages all
matches. If nothing matches, it returns a neutral mood.

This module is designed to be **swappable**. The only contract is: take a string,
return a `MoodParams` object. Phase 3 will replace this with an ML model
(Transformers.js or WebNN) without changing anything downstream.

### `src/mood/mapToVisual.ts` — The Mapper

Converts `MoodParams` into `VisualParams` that the shader understands. Every
conversion uses `lerp(min, max, moodValue)` to map a mood dimension to a visual
range:

| Mood Dimension | Visual Property                   | Range              |
|---------------|-----------------------------------|--------------------|
| `valence`     | Hue (oklch degrees)               | 220° cool → 50° warm (through 300° neutral) |
| `valence`     | Brightness                        | 0.3 → 0.75         |
| `intensity`   | Saturation                        | 0.3 → 0.9          |
| `arousal`     | Motion speed                      | 0.2 → 2.5          |
| `arousal` + `complexity` | Turbulence              | 0.1 → 1.5 (70/30 blend) |
| `intensity`   | Density                           | 0.3 → 1.0          |
| `intensity`   | Scale                             | 0.6 → 1.8          |
| `complexity`  | Noise frequency                   | 1.0 → 6.0          |
| `complexity`  | Coherence (inverted)              | 1.0 → 0.0          |

### `src/mood/types.ts` — Shared Types & Uniform Layout

Defines the `MoodParams` and `VisualParams` interfaces and documents the exact
byte layout of the GPU uniform buffer (48 bytes = 12 × f32). This file is the
**single source of truth** for the TypeScript ↔ WGSL contract.

### `src/gpu/renderer.ts` — The Renderer

A `MoodRenderer` class that owns the full WebGPU lifecycle:

1. **Init** — requests adapter/device, configures the canvas context, creates the
   uniform buffer, compiles the shader module, builds the render pipeline and
   bind group.
2. **Render loop** — `requestAnimationFrame` loop that:
   - **Lerps** current visual params toward the target (t=0.03/frame ≈ 2s
     transition). Hue uses angular lerp to take the shortest path around the
     color wheel.
   - **Writes** the 48-byte uniform buffer (time + 9 visual params + resolution).
   - **Draws** a fullscreen quad (6 vertices, 2 triangles).
3. **Resize** — handles DPR-aware canvas resizing on window resize.

The renderer never knows about moods or text — it only receives `VisualParams`
via `setTarget()`.

### `src/shaders/mood.wgsl` — The Shader

A fullscreen **raymarched fragment shader** that renders the mood as an organic
3D form:

- **Scene:** 3–4 animated metaballs combined with `smooth_union`. Positions
  orbit using sin/cos functions driven by `time * speed`.
- **Displacement:** Fractal Brownian Motion (FBM) layered on the SDF surface.
  Octave count is driven by `coherence` (2 for smooth, 5 for chaotic).
  Frequency is `noise_freq`, amplitude is `turbulence`.
- **Color:** oklch → linear sRGB conversion in-shader. Base hue from uniforms,
  with a secondary hue shifted +60° for iridescence based on surface normal.
  Fresnel rim lighting adds a third hue shifted +120°.
- **Lighting:** Directional diffuse + specular (Phong, power 32) + Fresnel rim.
- **Background:** Subtle FBM noise + vignette in complementary hue.
- **Post:** Reinhard tone mapping + gamma correction.

### `src/ui/controls.ts` — UI Wiring

Vanilla DOM event handlers for the text input, visualize button, and preset
mood buttons. Calls a single `onMoodChange(text)` callback. Also handles the
WebGPU fallback message.

### `index.html` — Layout & Styles

Fullscreen canvas with a glassmorphic UI overlay at the bottom: text input,
visualize button, and 6 preset mood buttons (calm, anxious, joyful, melancholy,
angry, dreamy). All styles are inline — no CSS framework.

## GPU Uniform Buffer Layout (48 bytes)

This layout must match **exactly** between `src/mood/types.ts` and
`src/shaders/mood.wgsl`. If you add, remove, or reorder fields, update both
files and this doc.

| Offset | Field        | Type | Source          |
|--------|-------------|------|-----------------|
| 0      | time        | f32  | `performance.now()` |
| 4      | hue         | f32  | VisualParams    |
| 8      | saturation  | f32  | VisualParams    |
| 12     | brightness  | f32  | VisualParams    |
| 16     | speed       | f32  | VisualParams    |
| 20     | turbulence  | f32  | VisualParams    |
| 24     | density     | f32  | VisualParams    |
| 28     | scale       | f32  | VisualParams    |
| 32     | noiseFreq   | f32  | VisualParams    |
| 36     | coherence   | f32  | VisualParams    |
| 40     | resolutionX | f32  | canvas.width    |
| 44     | resolutionY | f32  | canvas.height   |

## Smooth Transitions

When the user submits new text, the renderer doesn't snap to new visuals. It
uses per-frame linear interpolation (`t = 0.03` at ~60fps ≈ 2-second
transitions). Hue interpolation uses `lerpAngle` to take the shortest path
around the 360° color wheel, preventing jarring full-spectrum sweeps.
