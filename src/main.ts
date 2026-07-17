import { MoodRenderer } from "./gpu/renderer";
import { analyzeText } from "./mood/analyzeText";
import { mapToVisual } from "./mood/mapToVisual";
import { initUI, showFallback } from "./ui/controls";

/**
 * Application entry point.
 * Wires together: UI → analyzeText → mapToVisual → GPU renderer.
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

  // Wire UI: text input triggers the full pipeline
  initUI((text: string) => {
    const mood = analyzeText(text);
    const visual = mapToVisual(mood);
    renderer.setTarget(visual);
  });
}

main();
