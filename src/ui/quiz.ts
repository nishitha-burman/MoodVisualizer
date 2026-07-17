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
        // Record answer
        answers[question.key] = swatch.hue;

        // Live preview
        onPreview(swatch.hue);

        // Brief visual feedback then advance
        swatchGrid.querySelectorAll(".quiz-swatch").forEach((s) =>
          s.classList.remove("selected"),
        );
        btn.classList.add("selected");

        setTimeout(() => {
          if (currentStep < QUIZ_QUESTIONS.length - 1) {
            currentStep++;
            renderStep();
          } else {
            finish();
          }
        }, 400);
      });

      swatchGrid.appendChild(btn);
    });
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
