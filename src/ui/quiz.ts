import { ThemeConfig, SWATCH_OPTIONS, QUIZ_QUESTIONS, DEFAULT_THEME, saveTheme } from "../mood/theme";

export type QuizCompleteCallback = (theme: ThemeConfig) => void;

/**
 * Initialize and show the color theme quiz overlay.
 * Calls onComplete with the user's chosen theme when done (or skipped).
 * Calls onPreview with partial theme data for live canvas updates.
 */
export function showQuiz(
  onComplete: QuizCompleteCallback,
  onPreview: (hue: number) => void,
): void {
  const overlay = document.getElementById("quiz-overlay")!;
  const questionText = document.getElementById("quiz-question")!;
  const swatchGrid = document.getElementById("quiz-swatches")!;
  const progressDots = document.getElementById("quiz-progress")!;
  const skipBtn = document.getElementById("quiz-skip")!;

  const answers: Partial<ThemeConfig> = {};
  let currentStep = 0;

  function renderStep() {
    const question = QUIZ_QUESTIONS[currentStep];
    questionText.textContent = question.prompt;

    // Update progress dots
    const dots = progressDots.querySelectorAll(".quiz-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentStep);
      dot.classList.toggle("completed", i < currentStep);
    });

    // Clear and render swatches
    swatchGrid.innerHTML = "";
    // Render curated swatches
    SWATCH_OPTIONS.forEach((swatch) => {
      const btn = document.createElement("button");
      btn.className = "quiz-swatch";
      btn.style.background = swatch.hex;
      btn.setAttribute("aria-label", swatch.label);
      btn.title = swatch.label;

      // Check if this was previously selected for this question
      const prevAnswer = answers[question.key];
      if (prevAnswer === swatch.hue) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => {
        selectColor(swatch.hue);
      });

      swatchGrid.appendChild(btn);
    });

    // Add color wheel picker as last circle
    const pickerBtn = document.createElement("button");
    pickerBtn.className = "quiz-swatch quiz-swatch-picker";
    pickerBtn.setAttribute("aria-label", "Pick custom color");
    pickerBtn.title = "Pick your own color";

    // Hidden native color input
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.style.position = "absolute";
    colorInput.style.opacity = "0";
    colorInput.style.width = "0";
    colorInput.style.height = "0";
    colorInput.style.pointerEvents = "none";

    pickerBtn.addEventListener("click", () => {
      colorInput.click();
    });

    colorInput.addEventListener("input", (e) => {
      const hex = (e.target as HTMLInputElement).value;
      const hue = hexToHue(hex);
      onPreview(hue);
      // Show selection state
      swatchGrid.querySelectorAll(".quiz-swatch").forEach((s) =>
        s.classList.remove("selected"),
      );
      pickerBtn.classList.add("selected");
      pickerBtn.style.borderColor = hex;
    });

    colorInput.addEventListener("change", (e) => {
      const hex = (e.target as HTMLInputElement).value;
      const hue = hexToHue(hex);
      selectColor(hue);
    });

    pickerBtn.appendChild(colorInput);
    swatchGrid.appendChild(pickerBtn);

    function selectColor(hue: number) {
      answers[question.key] = hue;
      onPreview(hue);

      swatchGrid.querySelectorAll(".quiz-swatch").forEach((s) =>
        s.classList.remove("selected"),
      );
      // Find and highlight the matching swatch
      const swatches = swatchGrid.querySelectorAll(".quiz-swatch");
      swatches.forEach((s) => {
        const bg = (s as HTMLElement).style.background;
        if (bg) s.classList.remove("selected");
      });

      setTimeout(() => {
        if (currentStep < QUIZ_QUESTIONS.length - 1) {
          currentStep++;
          renderStep();
        } else {
          finish();
        }
      }, 400);
    }
  }

  function finish() {
    // Fill any missing answers with defaults
    const theme: ThemeConfig = { ...DEFAULT_THEME };
    for (const q of QUIZ_QUESTIONS) {
      if (answers[q.key] !== undefined) {
        theme[q.key] = answers[q.key]!;
      }
    }
    saveTheme(theme);
    overlay.classList.add("quiz-exit");
    setTimeout(() => {
      overlay.style.display = "none";
      overlay.classList.remove("quiz-exit");
      onComplete(theme);
    }, 400);
  }

  // Skip button — use defaults
  skipBtn.addEventListener("click", () => {
    saveTheme(DEFAULT_THEME);
    overlay.classList.add("quiz-exit");
    setTimeout(() => {
      overlay.style.display = "none";
      overlay.classList.remove("quiz-exit");
      onComplete(DEFAULT_THEME);
    }, 400);
  });

  // Build progress dots
  progressDots.innerHTML = "";
  QUIZ_QUESTIONS.forEach(() => {
    const dot = document.createElement("span");
    dot.className = "quiz-dot";
    progressDots.appendChild(dot);
  });

  // Show and start
  overlay.style.display = "flex";
  renderStep();
}

/** Convert a hex color (#rrggbb) to an approximate hue in degrees. */
function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return hue;
}
