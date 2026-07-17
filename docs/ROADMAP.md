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

## Phase 2 — Color Themes & Personalization 🔲

**Goal:** Let users define their own color-emotion associations so the
visualization feels personally meaningful.

**Why this is Phase 2:** Color-mood mapping is deeply personal. The default
the default palette assumes blue = sad and yellow = happy, but many people have
completely different associations (e.g., pink/coral/mint = happiness, black =
sadness, red = anxiety). Without personalization, the visualization may feel
"wrong" to a large portion of users. This is crucial to the core experience.

**Approach:**
- **Preset themes** — curated color palettes users can pick from:
  - *Classic* (default) — warm yellows for joy, cool blues for sadness
  - *Pastel Dreams* — pinks, corals, and mints for positive; muted darks for
    negative
  - *Ocean* — teals and aquas for calm; deep navy for sadness; warm sand for joy
  - *Monochrome* — grayscale intensity; shape and motion carry the mood
  - *Neon* — high-saturation electric colors across the spectrum
- **Custom theme builder** — two modes:
  - *Quiz mode:* Ask 4–6 questions ("Pick a color that feels happy," "Pick a
    color that feels anxious," etc.) and interpolate a full hue curve from the
    answers
  - *Direct mode:* Color pickers for each mood anchor (positive, negative,
    calm, energetic) with a live preview on the canvas
- **Storage:** Save the active theme and any custom palettes to `localStorage`
- **Implementation:** The theme overrides the hue/saturation/brightness ranges
  in `mapToVisual.ts`. The mapper reads from a `ThemeConfig` object instead of
  hardcoded constants.

**Design notes:**
- Theme selection UI: a settings gear icon in the overlay that opens a panel
- The quiz should feel playful, not clinical — use the canvas itself as the
  background while answering
- Custom themes should be exportable/importable (JSON) so users can share them
- Keep the default experience unchanged for users who skip customization

**Hook point:** `src/mood/mapToVisual.ts` — extract the hardcoded hue/saturation
ranges into a `ThemeConfig` interface. The mapper function takes the config as a
parameter (or reads from a module-level ref).

---

## Phase 3 — Voice Input 🔲

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

## Phase 4 — ML-Powered Sentiment Analysis 🔲

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

## Phase 5 — GPU Compute Particle System 🔲

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

## Phase 6 — Polish & Advanced Features 🔲

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

## Phase 7 — Mood Journal & Shareable Snapshots 🔲

**Goal:** Let users save, revisit, and share their mood visualizations.

**Planned features:**
- **Mood journal** — save timestamped mood entries to IndexedDB (text + mood
  params + thumbnail). Browse past entries in a timeline view and replay any
  saved mood on the canvas.
- **Shareable snapshots** — capture the current canvas frame + mood text as a
  downloadable/shareable image (PNG with overlaid text). Uses
  `canvas.toBlob()` for zero-dependency export.

**Design notes:**
- All data stays local (IndexedDB) — no accounts, no cloud sync
- Journal UI should be a slide-out panel, not a separate page
- Thumbnail generation can reuse the existing canvas at a reduced resolution

---

## Phase 8 — Ambient Soundscape 🔲

**Goal:** Generate a real-time audio layer that matches the mood visualization.

**Approach:**
- Use the **Web Audio API** to synthesize tones, drones, and textures
- Map mood dimensions to audio properties:
  - `valence` → harmonic mode (major/minor intervals)
  - `arousal` → tempo and rhythmic density
  - `intensity` → volume and filter resonance
  - `complexity` → number of oscillator layers and detuning
- Audio transitions should lerp in sync with the visual transitions (~2s)

**Design notes:**
- Audio must be opt-in (browser autoplay policies)
- Add a speaker toggle button to the UI overlay
- Keep audio subtle and ambient — it supports the visuals, not competes

---

## Phase 9 — Alternative Input Modes 🔲

**Goal:** Expand how users can express their mood beyond text and voice.

**Planned features:**
- **Emoji/face input** — use the webcam + a lightweight face expression model
  (e.g., TensorFlow.js face-landmarks) to detect emotions from facial
  expressions and map them to `MoodParams`
- **Mobile touch gestures** — swipe up/down for valence, left/right for
  arousal; pinch for intensity. Direct manipulation of mood dimensions without
  words.

**Design notes:**
- Webcam access requires explicit permission — show a clear opt-in prompt
- Touch gestures should coexist with text input, not replace it
- Consider a "mood wheel" radial UI as an alternative to gestures

---

## Phase 10 — Accessibility 🔲

**Goal:** Make the mood visualization experience inclusive for all users.

**Planned features:**
- **Screen reader descriptions** — generate a live ARIA description of the
  current visualization state (e.g., "Warm golden blobs moving slowly with
  smooth surfaces — a calm, positive mood")
- **Reduced motion mode** — honor `prefers-reduced-motion` by slowing or
  pausing animation while keeping color shifts
- **High contrast mode** — alternative palette for users who need stronger
  visual differentiation

**Design notes:**
- Descriptions should update on mood change, not every frame
- Use `aria-live="polite"` for non-intrusive screen reader updates

---

## Phase 11 — Multi-User Sync 🔲

**Goal:** Let multiple people share a live mood canvas in real time.

**Approach:**
- Use **WebRTC data channels** for peer-to-peer communication (no server
  required beyond initial signaling)
- Each participant sends their `MoodParams` to all peers
- The renderer blends or layers multiple users' moods:
  - Average mode: merge all moods into one unified visualization
  - Layer mode: show each person's mood as a separate blob cluster
- Share via a simple room link (signaling via a lightweight public STUN/TURN
  or a simple WebSocket relay)

**Design notes:**
- This is the first feature that introduces networking — keep it optional
- Gracefully degrade: if connection drops, fall back to solo mode
- Show participant names/avatars near their blob cluster in layer mode
- Cap at 4–6 participants to keep visuals readable

**Use cases:** couples check-ins, group therapy ice-breakers, collaborative
art, shared experiences with friends.

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
| Vibrant default color palette | Bright, fun, welcoming aesthetic; per-preset character colors; high shader background lightness floor so visuals are never dark/gray |
