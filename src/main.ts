import { MoodRenderer } from "./gpu/renderer";
import { analyzeText } from "./mood/analyzeText";
import { mapToVisual, setActiveTheme } from "./mood/mapToVisual";
import { loadTheme, ThemeConfig } from "./mood/theme";
import { initUI, showFallback, applyThemeToPresets } from "./ui/controls";
import { showQuiz } from "./ui/quiz";

/**
 * Application entry point.
 * Wires together: UI → analyzeText → mapToVisual → GPU renderer.
 * Shows color theme quiz on first visit.
 */
async function main() {
  const canvas = document.getElementById("gpu-canvas") as HTMLCanvasElement;
  const renderer = new MoodRenderer(canvas);

  const ok = await renderer.init();
  if (!ok) {
    showFallback();
    return;
  }

  // Start render loop with default neutral state
  renderer.start();

  // Check for saved theme
  const savedTheme = loadTheme();

  function activateApp(theme: ThemeConfig) {
    setActiveTheme(theme);
    applyThemeToPresets(theme);
    // Wire UI: text input triggers the full pipeline
    initUI((text: string) => {
      const mood = analyzeText(text);
      const visual = mapToVisual(mood);
      renderer.setTarget(visual);
    });
  }

  if (savedTheme) {
    // Returning user: apply saved theme and go
    activateApp(savedTheme);
  } else {
    // First visit: show the quiz
    showQuiz(
      (theme) => activateApp(theme),
      (hue) => {
        // Live preview: show the selected color on the canvas
        renderer.setTarget({
          hue,
          saturation: 0.75,
          brightness: 0.7,
          speed: 0.5,
          turbulence: 0.3,
          density: 0.6,
          scale: 1.2,
          noiseFreq: 2.0,
          coherence: 0.8,
        });
      },
    );
  }

  // Settings gear: re-open quiz
  const settingsBtn = document.getElementById("settings-btn")!;
  settingsBtn.addEventListener("click", () => {
    showQuiz(
      (theme) => {
        setActiveTheme(theme);
        applyThemeToPresets(theme);
      },
      (hue) => {
        renderer.setTarget({
          hue,
          saturation: 0.75,
          brightness: 0.7,
          speed: 0.5,
          turbulence: 0.3,
          density: 0.6,
          scale: 1.2,
          noiseFreq: 2.0,
          coherence: 0.8,
        });
      },
    );
  });
}

main();
