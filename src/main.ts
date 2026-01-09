import { App, Plugin, PluginSettingTab, Setting, Notice, MarkdownView, requestUrl, Modal } from "obsidian";

interface PromptPattern {
  name: string;
  pattern: string;
}

interface LazySketchSettings {
  replicateApiToken: string;
  defaultModel: string;
  loraWeights: string;
  selectedPattern: string;
  promptPatterns: PromptPattern[];
}

const DEFAULT_SETTINGS: LazySketchSettings = {
  replicateApiToken: "",
  defaultModel: "prunaai/z-image-turbo-lora:197b2db2015aa366d2bc61a941758adf4c31ac66b18573f5c66dc388ab081ca2",
  loraWeights: "https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch/blob/main/Zimage_pencil_sketch.safetensors",
  selectedPattern: "cute",
  promptPatterns: [
    {
      name: "cute",
      pattern: "a color pencil sketch. clear white background. cute & fun & simple. {prompt}"
    },
    {
      name: "detailed",
      pattern: "a detailed pencil sketch. clean white background. intricate & realistic. {prompt}"
    },
    {
      name: "whimsical",
      pattern: "a playful pencil sketch. white background. whimsical & imaginative. {prompt}"
    }
  ]
}

export default class LazySketchPlugin extends Plugin {
  settings: LazySketchSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "generate-sketch",
      name: "Generate sketch.",
      callback: () => this.generateSketch()
    });

    this.addSettingTab(new LazySketchSettingTab(this.app, this));
  }

  async generateSketch() {
    if (!this.settings.replicateApiToken) {
      new Notice("Please set your Replicate API token in settings.");
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("Please open a markdown file first.");
      return;
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const selection = editor.getSelection();

    const prompt = selection || await this.promptForPrompt();
    if (!prompt) return;

    class LoadingModal extends Modal {
      constructor(app: App) {
        super(app);
      }

      onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Generating sketch..." });

        const spinnerContainer = contentEl.createDiv({ cls: "ls-spinner-container" });
        spinnerContainer.createDiv({ cls: "ls-spinner" });

        const statusText = contentEl.createDiv({ cls: "ls-status-text" });
        statusText.setText("Waiting for AI generation...");
      }

      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    }

    const loadingModal = new LoadingModal(this.app);
    loadingModal.open();

    try {
      const imageUrl = await this.callReplicateAPI(prompt);
      
      const imagePath = await this.downloadAndSaveImage(imageUrl, prompt);
      
      if (!selection) {
        editor.replaceRange(`![${prompt}](${imagePath})\n`, cursor);
      } else {
        editor.replaceSelection(`![${prompt}](${imagePath})`);
      }
      
      loadingModal.close();
      new Notice("Sketch generated successfully.");
    } catch (error) {
      loadingModal.close();
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
      new Notice(`Error: ${errorMessage}.\nCheck console (Ctrl+Shift+I) for details.`);
    }
  }

  async promptForPrompt(): Promise<string | null> {
    return await new Promise((resolve) => {
      class PromptModal extends Modal {
        constructor(app: App, resolve: (value: string | null) => void) {
          super(app);
          this.resolve = resolve;
        }

        resolve: (value: string | null) => void;

        onOpen() {
          const { contentEl } = this;
          contentEl.createEl("h2", { text: "Enter your sketch prompt." });

          const input = contentEl.createEl("input", {
            type: "text",
            placeholder: "Enter your sketch prompt..."
          });
          input.addClass("ls-prompt-input");

          const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

          const generateButton = buttonContainer.createEl("button", {
            text: "Generate.",
            cls: "mod-cta"
          });
          generateButton.onClickEvent(() => {
            this.resolve(input.value || null);
            this.close();
          });

          const cancelButton = buttonContainer.createEl("button", {
            text: "Cancel."
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

      new PromptModal(this.app, resolve).open();
    });
  }

  async downloadAndSaveImage(imageUrl: string, prompt: string): Promise<string> {
    const adapter = this.app.vault.adapter;
    const filesDir = "files";
    
    if (!await adapter.exists(filesDir)) {
      await adapter.mkdir(filesDir);
    }
    
    const response = await requestUrl({
      url: imageUrl,
      method: "GET"
    });
    
    const timestamp = Date.now();
    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
    const filename = `sketch_${sanitizedPrompt}_${timestamp}.jpg`;
    const filePath = `${filesDir}/${filename}`;
    
    await adapter.writeBinary(filePath, response.arrayBuffer);
    
    return filePath;
  }

  async callReplicateAPI(userPrompt: string): Promise<string> {
    const selectedPattern = this.settings.promptPatterns.find(
      p => p.name === this.settings.selectedPattern
    ) || this.settings.promptPatterns[0];

    const formattedPrompt = selectedPattern.pattern.replace("{prompt}", userPrompt);

    try {
      const requestBody = {
        version: this.settings.defaultModel,
        input: {
          guidance_scale: 0,
          height: 512,
          lora_scales: [1],
          lora_weights: [this.settings.loraWeights],
          num_inference_steps: 8,
          output_format: "jpg",
          output_quality: 80,
          prompt: formattedPrompt,
          width: 1024
        }
      };

      const response = await requestUrl({
        url: "https://api.replicate.com/v1/predictions",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.replicateApiToken}`,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify(requestBody)
      });

      const prediction = response.json;

      if (prediction.error) {
        throw new Error(prediction.error);
      }

      let attempts = 0;
      const maxAttempts = 120;

      while (prediction.status !== "succeeded" && prediction.status !== "failed") {
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error("Timeout: Polling took too long.");
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await requestUrl({
          url: prediction.urls.get,
          method: "GET",
          headers: {
            "Authorization": `Token ${this.settings.replicateApiToken}`
          }
        });

        Object.assign(prediction, statusResponse.json);
      }

      if (prediction.status === "failed") {
        throw new Error(prediction.error || "Generation failed.");
      }

      return prediction.output[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to Replicate API.");
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
  }
}

class LazySketchSettingTab extends PluginSettingTab {
  plugin: LazySketchPlugin;

  constructor(app: App, plugin: LazySketchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setHeading()
      .setName("Lazy sketch settings");

    new Setting(containerEl)
      .setName("Replicate API token")
      .setDesc("Enter your Replicate API token. Get one at https://replicate.com/account/api-tokens.")
      .addText(text => text
        .setPlaceholder("r8_...")
        .setValue(this.plugin.settings.replicateApiToken)
        .onChange(async (value) => {
          this.plugin.settings.replicateApiToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default model")
      .setDesc("Enter the default Replicate model to use for image generation.")
      .addText(text => text
        .setPlaceholder("prunaai/z-image-turbo-lora")
        .setValue(this.plugin.settings.defaultModel)
        .onChange(async (value) => {
          this.plugin.settings.defaultModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("LoRA weights URL")
      .setDesc("Enter the huggingface URL for the LoRA weights.")
      .addText(text => text
        .setPlaceholder("https://huggingface.co/...")
        .setValue(this.plugin.settings.loraWeights)
        .onChange(async (value) => {
          this.plugin.settings.loraWeights = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setHeading()
      .setName("Prompt patterns");

    new Setting(containerEl)
      .setName("Selected pattern")
      .setDesc("Choose which prompt pattern to use for image generation.")
      .addDropdown(dropdown => {
        this.plugin.settings.promptPatterns.forEach(pattern => {
          dropdown.addOption(pattern.name, pattern.name);
        });
        dropdown.setValue(this.plugin.settings.selectedPattern);
        dropdown.onChange(async (value) => {
          this.plugin.settings.selectedPattern = value;
          await this.plugin.saveSettings();
          this.display();
        });
      });

    this.plugin.settings.promptPatterns.forEach((pattern, index) => {
      new Setting(containerEl)
        .setName(`Pattern: ${pattern.name}`)
        .setDesc("Use {prompt} as a placeholder for your user input.")
        .addTextArea(text => text
          .setPlaceholder("a style description with {prompt}")
          .setValue(pattern.pattern)
          .onChange(async (value) => {
            this.plugin.settings.promptPatterns[index].pattern = value;
            await this.plugin.saveSettings();
          }));
    });
  }
}
