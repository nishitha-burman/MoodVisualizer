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
