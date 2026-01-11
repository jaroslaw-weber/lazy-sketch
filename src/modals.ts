import { App, Modal } from "obsidian";

export class LoadingModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Generating sketch..." });

    const spinnerContainer = contentEl.createDiv({
      cls: "ls-spinner-container",
    });
    spinnerContainer.createDiv({ cls: "ls-spinner" });

    const statusText = contentEl.createDiv({ cls: "ls-status-text" });
    statusText.setText("Waiting for AI generation...");
  }

  onClose() {
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
