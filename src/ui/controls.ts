import { ThemeConfig } from "../mood/theme";

export type MoodChangeCallback = (text: string) => void;

/**
 * Wire up the UI controls: text input, visualize button, and preset buttons.
 *
 * TODO Phase 3: Add microphone button to capture Web Speech API input
 * and feed transcript to the same callback.
 */
export function initUI(onMoodChange: MoodChangeCallback): void {
  const input = document.getElementById("mood-input") as HTMLInputElement;
  const btn = document.getElementById("visualize-btn") as HTMLButtonElement;
  const presets = document.querySelectorAll<HTMLButtonElement>(".preset-btn");

  function submit() {
    const text = input.value.trim();
    if (text) onMoodChange(text);
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  presets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const mood = preset.dataset.mood!;
      input.value = mood;
      onMoodChange(mood);
    });
  });
}

/** Map preset mood names to ThemeConfig keys. */
const PRESET_TO_THEME: Record<string, keyof ThemeConfig> = {
  calm: "calm",
  anxious: "anxious",
  joyful: "happy",
  melancholy: "sad",
  angry: "angry",
  dreamy: "calm", // dreamy borrows from calm hue
};

/**
 * Update preset button colors to match the user's theme.
 * Converts oklch hue to an HSL color for the button gradient.
 */
export function applyThemeToPresets(theme: ThemeConfig): void {
  const presets = document.querySelectorAll<HTMLButtonElement>(".preset-btn");
  presets.forEach((preset) => {
    const mood = preset.dataset.mood!;
    const themeKey = PRESET_TO_THEME[mood];
    if (!themeKey) return;

    const hue = theme[themeKey];
    // Convert oklch-ish hue to HSL hue (approximate — close enough for buttons)
    const hslHue = hue;
    const light = `hsl(${hslHue}, 70%, 60%)`;
    const dark = `hsl(${hslHue}, 75%, 45%)`;
    const textColor = hslHue > 40 && hslHue < 200 ? "#1a0533" : "#fff";

    preset.style.background = `linear-gradient(135deg, ${light}, ${dark})`;
    preset.style.color = textColor;
    preset.style.boxShadow = `0 2px 8px hsla(${hslHue}, 70%, 50%, 0.35)`;
  });
}

/**
 * Show the WebGPU-not-supported fallback message and hide the canvas UI.
 */
export function showFallback(): void {
  const fallback = document.getElementById("fallback-msg")!;
  const overlay = document.getElementById("ui-overlay")!;
  const canvas = document.getElementById("gpu-canvas")!;
  fallback.style.display = "block";
  overlay.style.display = "none";
  canvas.style.display = "none";
}
