# Product Guide

## What Is Mood Visualizer?

Mood Visualizer turns your feelings into living art. Type how you feel — or tap
a preset — and watch a real-time 3D visualization morph to match your mood.
Everything runs in your browser; there's no backend, no account, and nothing
leaves your device.

## The Experience

1. **Describe your mood** — type freely ("I'm feeling overwhelmed but hopeful")
   or tap one of 6 preset buttons: calm, anxious, joyful, melancholy, angry,
   dreamy.
2. **Watch it transform** — the artwork smoothly transitions over ~2 seconds:
   colors shift, shapes speed up or slow down, textures become smooth or chaotic.
3. **Experiment** — try different words and phrases. The visualization responds
   to nuance: "a little sad" looks different from "devastated."

There's no right or wrong input. The app interprets what you type and creates a
unique visual response every time.

## Design Principles

### Emotion Is a Spectrum, Not a Category

Moods aren't buckets. The app understands feelings along four dimensions —
positive vs. negative, calm vs. energetic, mild vs. extreme, and simple vs.
layered — so the visuals reflect gradients of feeling, not just "happy" or "sad."

### Always Bright, Never Dark

The visual palette is inspired by **Pixar's Inside Out** — vibrant, playful, and
welcoming. Even negative emotions (sadness, anger) render with rich, saturated
color rather than darkness. The background is always colorful. Brightness and
saturation never drop below a lively minimum.

The goal: the app should feel like a safe, fun space to explore how you feel —
not a clinical or gloomy one.

### Instant & Private

No sign-up, no loading spinners, no network calls. What you type never leaves
your browser.

## Visual Language

### Color

| How You Feel | What You See |
|-------------|-------------|
| Positive (joy, excitement) | Warm yellows, oranges — golden glow |
| Neutral | Purple, magenta — dreamy violet |
| Negative (sadness, anger) | Cool blues, teals — deep ocean |

The background always contrasts with the central form, creating depth and
visual richness regardless of mood.

### Motion

- **Calm moods** → slow, drifting movement
- **Anxious/energetic moods** → fast, jittery animation
- **Complex moods** → chaotic, multi-layered textures
- **Simple moods** → smooth, coherent surfaces

### Shape

The central form is a cluster of soft, organic blobs. Their size, density, and
surface texture all respond to how intense and complex your mood is.

## UI Design

### Color Scheme — Inside Out Inspired

- **Background:** Deep purple gradient — evokes the "headquarters" feeling
- **Text input:** Purple-tinted glass with a warm golden focus glow
- **Visualize button:** Golden gradient (Joy's signature color)
- **Preset buttons:** Each mood gets its own character-inspired color:
  - 🟦 Calm — soft blue (Sadness)
  - 🟧 Anxious — warm orange (Anxiety)
  - 🟨 Joyful — bright yellow (Joy)
  - 🟪 Melancholy — deep indigo
  - 🟥 Angry — bold red (Anger)
  - 💜 Dreamy — rich purple

### Layout

The visualization fills the entire screen. Controls sit at the bottom center in
a floating overlay — minimal chrome, maximum art. The overlay blurs into the
scene so it feels integrated, not bolted on.

## Browser Support

Mood Visualizer requires a modern browser with WebGPU support:

- ✅ Chrome 113+ (desktop)
- ✅ Edge 113+ (desktop)
- ⚠️ Chrome on Android (behind a flag)
- ❌ Safari and Firefox (not yet supported — a friendly message is shown)

## Design Decision Log

| Decision | Why |
|----------|-----|
| Inside Out color palette | Bright & welcoming; emotion-as-color aligns with the movie's metaphor; avoids the "dark = emotional depth" cliché |
| Per-preset character colors | Instant visual association between mood labels and colors; makes the button row feel playful |
| Always-vibrant visuals | Even "negative" moods should feel visually rich, not dreary — the app is about exploration, not judgment |
| ~2-second smooth transitions | Abrupt snaps feel jarring; slow morphs make mood shifts feel alive and intentional |
| No sign-up or network calls | Emotion is personal; privacy should be the default, not a feature |
| Fullscreen canvas with minimal UI | The art is the product; controls should be discoverable but not dominant |
| 6 preset moods | Covers the core emotional spectrum without overwhelming; labels are single words for scannability |
