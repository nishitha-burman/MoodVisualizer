# Mood Visualizer

A web app that transforms text descriptions of emotions into living, GPU-accelerated generative art using the raw WebGPU API.

## Quick Start

```bash
npm install
npm run dev
```

Open in Chrome/Edge (WebGPU required). Type how you're feeling and hit **Visualize**.

## Architecture

```
src/
├── main.ts              # Entry point, wires modules together
├── mood/
│   ├── types.ts         # MoodParams & VisualParams interfaces, uniform layout
│   ├── analyzeText.ts   # Keyword lexicon → MoodParams (swappable)
│   └── mapToVisual.ts   # MoodParams → VisualParams for GPU
├── gpu/
│   └── renderer.ts      # WebGPU init, pipeline, render loop
├── shaders/
│   └── mood.wgsl        # Fullscreen raymarched fragment shader
└── ui/
    └── controls.ts      # DOM event wiring
```

**Data flow:** `text → analyzeText() → MoodParams → mapToVisual() → VisualParams → GPU uniforms → shader`

## Mood Dimensions

| Dimension    | Range       | Meaning                          |
|-------------|-------------|----------------------------------|
| `valence`   | −1 … +1    | Negative ↔ positive emotion      |
| `arousal`   | 0 … 1      | Calm ↔ energized                 |
| `intensity` | 0 … 1      | Overall emotional strength       |
| `complexity`| 0 … 1      | Coherent ↔ chaotic/fragmented    |

## Visual Mapping

| Mood Dimension | Visual Parameter(s)                    |
|---------------|----------------------------------------|
| valence       | Color hue (cool↔warm oklch), brightness |
| arousal       | Motion speed, turbulence strength       |
| intensity     | Density/bloom, overall scale            |
| complexity    | Noise frequency, coherence              |

## GPU Uniform Buffer Layout (48 bytes)

| Offset | Field        | Type |
|--------|-------------|------|
| 0      | time        | f32  |
| 4      | hue         | f32  |
| 8      | saturation  | f32  |
| 12     | brightness  | f32  |
| 16     | speed       | f32  |
| 20     | turbulence  | f32  |
| 24     | density     | f32  |
| 28     | scale       | f32  |
| 32     | noiseFreq   | f32  |
| 36     | coherence   | f32  |
| 40     | resolutionX | f32  |
| 44     | resolutionY | f32  |

## Roadmap

- [x] Phase 1 — Text-driven mood visualization (keyword lexicon + raymarched shader)
- [x] Phase 2 — Color themes & personalization (quiz-based color mapping)
- [ ] Phase 3 — Voice input (Web Speech API → same pipeline)
- [ ] Phase 4 — Real sentiment analysis (Transformers.js / WebNN)
- [ ] Phase 5 — GPU compute particles (curl-noise flow field, 50k–500k particles)
- [ ] Phase 6 — Post-processing, perf overlay, video capture
- [ ] Phase 7 — Mood journal & shareable snapshots
- [ ] Phase 8 — Ambient soundscape (Web Audio API)
- [ ] Phase 9 — Alternative input modes (webcam, touch gestures)
- [ ] Phase 10 — Accessibility (screen reader, reduced motion)
- [ ] Phase 11 — Multi-user sync (WebRTC)

## Browser Requirements

Latest Chrome or Edge with WebGPU enabled. Falls back to a clear error message if `navigator.gpu` is unavailable.
