import {
  App,
  Plugin,
  Notice,
  MarkdownView,
} from "obsidian";
import { DEFAULT_SETTINGS, LazySketchSettings } from "./types";
import { LazySketchSettingTab } from "./settings";
import { LoadingModal, PromptModal } from "./modals";
import { callReplicateAPI } from "./api";
import { downloadAndSaveImage } from "./utils";

export default class LazySketchPlugin extends Plugin {
  settings: LazySketchSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "generate-sketch-default",
      name: "Generate sketch (default / 2:1)",
      callback: () => this.generateSketch(1024, 512),
    });

    this.addCommand({
      id: "generate-sketch-wide",
      name: "Generate sketch (wide / 4:1)",
      callback: () => this.generateSketch(1024, 256),
    });

    this.addCommand({
      id: "generate-sketch-ultra-wide",
      name: "Generate sketch (ultra-wide / 8:1)",
      callback: () => this.generateSketch(1536, 192),
    });

    this.addSettingTab(new LazySketchSettingTab(this.app, this));
  }

  async generateSketch(width: number, height: number) {
    if (!this.settings.replicateApiToken) {
      new Notice("Please set your replicate API token in settings.");
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("Please open a Markdown file first");
      return;
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const selection = editor.getSelection();

    const prompt = selection || (await this.promptForPrompt());
    if (!prompt) return;

    const loadingModal = new LoadingModal(this.app);
    loadingModal.open();

    try {
      const imageUrl = await callReplicateAPI(
        prompt,
        this.settings,
        width,
        height
      );

      const imagePath = await downloadAndSaveImage(this.app, imageUrl, prompt);

      if (!selection) {
        editor.replaceRange(`![${prompt}](${imagePath})\n`, cursor);
      } else {
        editor.replaceSelection(`![${prompt}](${imagePath})`);
      }

      loadingModal.close();
      new Notice("Sketch generated successfully.");
    } catch (error) {
      loadingModal.close();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred.";
      new Notice(
        `Error: ${errorMessage}.\nCheck console (Ctrl+Shift+I) for details.`
      );
    }
  }

  async promptForPrompt(): Promise<string | null> {
    return await new Promise((resolve) => {
      new PromptModal(this.app, resolve).open();
    });
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    ) as LazySketchSettings;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {}
}
