import { App, Plugin, PluginSettingTab, Setting, Notice, MarkdownView, requestUrl } from "obsidian";

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
  loraWeights: "https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch/resolve/main/Zimage_pencil_sketch.safetensors",
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
    console.log("Loading Lazy Sketch plugin");

    await this.loadSettings();

    this.addCommand({
      id: "generate-sketch",
      name: "Generate Sketch",
      callback: () => this.generateSketch()
    });

    this.addSettingTab(new LazySketchSettingTab(this.app, this));
  }

  async generateSketch() {
    if (!this.settings.replicateApiToken) {
      new Notice("Please set your Replicate API token in settings");
      return;
    }

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("Please open a markdown file first");
      return;
    }

    const editor = activeView.editor;
    const cursor = editor.getCursor();
    const selection = editor.getSelection();

    const prompt = selection || await this.promptForPrompt();
    if (!prompt) return;

    new Notice("Generating sketch...");

    try {
      const imageUrl = await this.callReplicateAPI(prompt);
      
      if (!selection) {
        editor.replaceRange(`![${prompt}](${imageUrl})\n`, cursor);
      } else {
        editor.replaceSelection(`![${prompt}](${imageUrl})`);
      }
      
      new Notice("Sketch generated successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Full error:", error);
      new Notice(`Error: ${errorMessage}\nCheck console (Ctrl+Shift+I) for details`);
    }
  }

  async promptForPrompt(): Promise<string | null> {
    return await new Promise((resolve) => {
      const input = document.createElement("input");
      input.placeholder = "Enter your sketch prompt...";
      input.style.cssText = "padding: 10px; margin: 10px; width: 80%;";
      
      const modal = document.createElement("div");
      modal.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background-primary); padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000;";
      
      const button = document.createElement("button");
      button.textContent = "Generate";
      button.style.cssText = "padding: 8px 16px; margin-left: 10px; cursor: pointer;";
      button.onclick = () => {
        resolve(input.value || null);
        modal.remove();
      };
      
      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.style.cssText = "padding: 8px 16px; margin-left: 10px; cursor: pointer;";
      cancelButton.onclick = () => {
        resolve(null);
        modal.remove();
      };
      
      modal.appendChild(input);
      modal.appendChild(button);
      modal.appendChild(cancelButton);
      document.body.appendChild(modal);
      
      input.focus();
      
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          resolve(input.value || null);
          modal.remove();
        }
      });
    });
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

      console.log("=== REQUEST START ===");
      console.log("URL: https://api.replicate.com/v1/predictions");
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      console.log("Token:", this.settings.replicateApiToken.substring(0, 10) + "...");

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

      console.log("=== RESPONSE START ===");
      console.log("Status:", response.status);
      console.log("Response JSON:", response.json);
      console.log("=== RESPONSE END ===");

      const prediction = response.json;

      if (prediction.error) {
        throw new Error(prediction.error);
      }

      let attempts = 0;
      const maxAttempts = 120;

      while (prediction.status !== "succeeded" && prediction.status !== "failed") {
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error("Timeout: Polling took too long");
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
        console.log(`[${attempts}s] Status: ${prediction.status}`);
      }

      if (prediction.status === "failed") {
        throw new Error(prediction.error || "Generation failed");
      }

      console.log("Generated image:", prediction.output[0]);
      return prediction.output[0];
    } catch (error) {
      console.error("=== ERROR CAUGHT ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to Replicate API");
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    console.log("Unloading Lazy Sketch plugin");
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
    containerEl.createEl("h2", { text: "Lazy Sketch Settings" });

    new Setting(containerEl)
      .setName("Replicate API Token")
      .setDesc("Enter your Replicate API token. Get one at https://replicate.com/account/api-tokens")
      .addText(text => text
        .setPlaceholder("r8_...")
        .setValue(this.plugin.settings.replicateApiToken)
        .onChange(async (value) => {
          this.plugin.settings.replicateApiToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default Model")
      .setDesc("Enter the default Replicate model to use for image generation")
      .addText(text => text
        .setPlaceholder("prunaai/z-image-turbo-lora")
        .setValue(this.plugin.settings.defaultModel)
        .onChange(async (value) => {
          this.plugin.settings.defaultModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("LoRA Weights URL")
      .setDesc("Enter the huggingface URL for the LoRA weights")
      .addText(text => text
        .setPlaceholder("https://huggingface.co/...")
        .setValue(this.plugin.settings.loraWeights)
        .onChange(async (value) => {
          this.plugin.settings.loraWeights = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl("h3", { text: "Prompt Patterns" });

    new Setting(containerEl)
      .setName("Selected Pattern")
      .setDesc("Choose which prompt pattern to use for image generation")
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
        .setDesc("Use {prompt} as a placeholder for your user input")
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
