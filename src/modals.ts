import { App, Modal } from "obsidian";

declare const window: {
  setInterval: (handler: () => void, timeout: number) => ReturnType<typeof setInterval>;
  clearInterval: (intervalId: ReturnType<typeof setInterval>) => void;
};

export class LoadingModal extends Modal {
  private startTime: number;
  private estimatedTimeMs: number;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private progressBarContainer: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private estimatedTimeText: HTMLElement | null = null;

  constructor(
    app: App,
    estimatedTimeMs: number
  ) {
    super(app);
    this.estimatedTimeMs = estimatedTimeMs;
    this.startTime = Date.now();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Generating sketch..." });

    const spinnerContainer = contentEl.createDiv({
      cls: "ls-spinner-container",
    });
    spinnerContainer.createDiv({ cls: "ls-spinner" });

    this.progressBarContainer = contentEl.createDiv({
      cls: "ls-progress-container",
    });

    this.progressBar = this.progressBarContainer.createDiv({
      cls: "ls-progress-bar",
    });

    const textContainer = contentEl.createDiv({ cls: "ls-status-text" });
    const statusText = textContainer.createDiv();
    statusText.setText("Waiting for AI generation...");

    this.estimatedTimeText = textContainer.createDiv({
      cls: "ls-estimated-time",
    });
    const estimatedSeconds = Math.round(this.estimatedTimeMs / 1000);
    this.estimatedTimeText.setText(`Estimated time: ~${estimatedSeconds}s`);

    this.updateInterval = window.setInterval(() => this.updateProgress(), 100);
  }

  updateProgress() {
    if (!this.progressBar || !this.estimatedTimeText) return;

    const elapsed = Date.now() - this.startTime;
    const progressPercent = Math.min((elapsed / this.estimatedTimeMs) * 100, 95);

    this.progressBar.style.setProperty("--ls-progress-width", `${progressPercent}%`);

    if (progressPercent >= 95) {
      this.progressBar.style.setProperty("--ls-progress-width", `95%`);
    }

    const remainingMs = Math.max(this.estimatedTimeMs - elapsed, 0);
    const remainingSeconds = Math.round(remainingMs / 1000);

    if (remainingSeconds > 0) {
      this.estimatedTimeText.setText(`Estimated time: ~${remainingSeconds}s`);
    } else {
      this.estimatedTimeText.setText("Finishing up...");
    }
  }

  onClose() {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class PromptModal extends Modal {
  resolve: (value: string | null) => void;

  constructor(
    app: App,
    resolve: (value: string | null) => void
  ) {
    super(app);
    this.resolve = resolve;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Enter your sketch prompt." });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Enter your sketch prompt...",
    });
    input.addClass("ls-prompt-input");

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    const generateButton = buttonContainer.createEl("button", {
      text: "Generate.",
      cls: "mod-cta",
    });
    generateButton.onClickEvent(() => {
      this.resolve(input.value || null);
      this.close();
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancel.",
    });
    cancelButton.onClickEvent(() => {
      this.resolve(null);
      this.close();
    });

    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.resolve(input.value || null);
        this.close();
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
