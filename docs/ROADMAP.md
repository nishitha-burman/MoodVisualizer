# Product Roadmap

## Vision
A web app that makes your emotions visible — type how you feel and watch a
living, GPU-rendered artwork respond in real time. Built entirely client-side
with raw WebGPU.

---

## Phase 1 — Text-Driven Mood Visualization ✅

**Status:** Complete

**What it does:**
- User types a description of their mood into a text input
- A keyword lexicon analyzes the text into four mood dimensions (valence,
  arousal, intensity, complexity)
- Those dimensions are mapped to visual properties (color, speed, turbulence,
  density, noise)
- A raymarched WGSL shader renders animated metaballs whose look and feel match
  the mood
- Transitions between moods are smoothly animated (~2s lerp)

**What was built:**
- Keyword lexicon with ~40 emotion words, each tuned across 4 dimensions
- Mood → visual mapper using lerp-based conversions
- WebGPU renderer with fullscreen raymarched fragment shader
- Animated metaballs with FBM displacement, oklch coloring, iridescence, and
  Fresnel rim lighting
- Glassmorphic UI with text input and 6 preset mood buttons
- WebGPU fallback message for unsupported browsers

---

## Phase 2 — Voice Input 🔲

**Goal:** Let users speak their mood instead of typing.

**Approach:**
- Add a microphone button to the UI
- Use the **Web Speech API** (`SpeechRecognition`) to transcribe speech to text
- Feed the transcript into the existing `analyzeText()` pipeline — no changes
  to the analyzer, mapper, or renderer
- Show the transcribed text in the input field as visual feedback

**Design notes:**
- Input source must be swappable without touching rendering code (already true)
- Handle microphone permission gracefully
- Consider continuous listening mode vs. push-to-talk

**Hook point:** `src/ui/controls.ts` — TODO comment marks where to add the mic
button and wire speech events to the existing `onMoodChange` callback.

---

## Phase 3 — ML-Powered Sentiment Analysis 🔲

**Goal:** Replace the keyword lexicon with a real language understanding model
so the app handles full sentences, nuance, and mixed emotions.

**Approach:**
- Use **Transformers.js** (Hugging Face) or **WebNN** to run a sentiment model
  entirely in the browser
- The model must output the same `MoodParams` shape (valence, arousal,
  intensity, complexity) — the mapper and renderer stay untouched
- Keep the keyword lexicon as a fast fallback for when the model is loading

**Design notes:**
- Model loading may take several seconds — show a loading indicator
- Consider lazy-loading the model only after first interaction
- WebNN may offer better performance on supported hardware; detect and prefer it

**Hook point:** `src/mood/analyzeText.ts` — TODO comment marks the swap point.
The function signature (`string → MoodParams`) is the contract.

---

## Phase 4 — GPU Compute Particle System 🔲

**Goal:** Replace or augment the raymarched shader with a compute-shader-driven
particle system for richer, more dynamic visuals.

**Approach:**
- **Curl-noise flow field** computed in a WGSL compute shader
- 50,000–500,000 particles advected through the flow field each frame
- Particle count and behavior driven by mood dimensions:
  - `intensity` → particle count
  - `arousal` → flow field speed and turbulence
  - `complexity` → noise frequency and field coherence
  - `valence` → particle color palette
- Render particles as points or instanced quads with additive blending

**Design notes:**
- Needs a storage buffer for particle positions/velocities
- Frame timing: compute pass → render pass pipeline
- May coexist with the raymarched background or replace it entirely

---

## Phase 5 — Polish & Advanced Features 🔲

**Goal:** Production-quality visuals and developer tooling.

**Planned features:**
- **Bloom / post-processing** — multi-pass glow effect on bright areas
- **GPU timestamp perf overlay** — real-time frame timing and GPU workload
  display for development
- **OffscreenCanvas in a Worker** — move rendering off the main thread for
  smoother UI interactions
- **WebCodecs recording** — capture the visualization as a video file the user
  can save/share
- **View Transitions API** — animate between mood states using the browser's
  native transition system

---

## Key Decisions Log

| Decision | Rationale |
|----------|-----------|
| Continuous mood axes over discrete categories | Enables smooth interpolation; moods are spectra, not buckets |
| Russell's circumplex model (valence + arousal) | Research-backed, covers most emotional space with just 2 axes |
| Added intensity + complexity dimensions | Pragmatic additions for richer visuals; kept optional |
| Keyword lexicon for Phase 1 | Zero dependencies, deterministic, easy to debug; designed to be replaced |
| Raw WebGPU (no Three.js) | Hackathon goal: learn the frontier API directly |
| oklch color space | Perceptually uniform hue rotation — looks natural as valence shifts |
| Raymarched metaballs for Phase 1 | Organic, mood-appropriate aesthetic; demonstrates SDF techniques |
| Smooth lerp transitions (not snapping) | Mood changes feel alive and intentional |
| Client-side only | Keeps it simple; no auth, no servers, instant deployment |
| Inside Out-inspired color palette | Bright, fun, welcoming aesthetic; per-preset character colors; high shader background lightness floor so visuals are never dark/gray |
