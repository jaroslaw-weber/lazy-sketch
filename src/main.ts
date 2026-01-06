import { App, Plugin, PluginSettingTab, Setting, Notice } from "obsidian";

interface LazySketchSettings {
  replicateApiToken: string;
  defaultModel: string;
  loraWeights: string;
}

const DEFAULT_SETTINGS: LazySketchSettings = {
  replicateApiToken: "",
  defaultModel: "prunaai/z-image-turbo-lora",
  loraWeights: "Ttio2/Z-Image-Turbo-pencil-sketch:Zimage_pencil_sketch"
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

    const activeView = this.app.workspace.activeLeaf?.view;
    if (!activeView) return;

    const editor = this.app.workspace.activeEditor;
    if (!editor) return;

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
      console.error("Error generating sketch:", error);
      new Notice("Failed to generate sketch. Check console for details.");
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
    });
  }

  async callReplicateAPI(userPrompt: string): Promise<string> {
    const formattedPrompt = `a color pencil sketch. clear white background. cute & fun & simple. ${userPrompt}`;
    
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.settings.replicateApiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: this.settings.defaultModel,
        input: {
          prompt: formattedPrompt,
          lora_weights: this.settings.loraWeights,
          num_inference_steps: 4,
          width: 1024,
          height: 1024
        }
      })
    });

    const prediction = await response.json();
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${this.settings.replicateApiToken}`
        }
      });
      
      Object.assign(prediction, await statusResponse.json());
    }

    if (prediction.status === "failed") {
      throw new Error(prediction.error || "Generation failed");
    }

    return prediction.output[0];
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
      .setName("LoRA Weights")
      .setDesc("Enter the LoRA weights to use for the pencil sketch style")
      .addText(text => text
        .setPlaceholder("Ttio2/Z-Image-Turbo-pencil-sketch:Zimage_pencil_sketch")
        .setValue(this.plugin.settings.loraWeights)
        .onChange(async (value) => {
          this.plugin.settings.loraWeights = value;
          await this.plugin.saveSettings();
        }));
  }
}
