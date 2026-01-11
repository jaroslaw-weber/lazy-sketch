import { App, PluginSettingTab, Setting } from "obsidian";
import LazySketchPlugin from "./main";

export class LazySketchSettingTab extends PluginSettingTab {
  plugin: LazySketchPlugin;

  constructor(app: App, plugin: LazySketchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl).setHeading().setName("Lazy sketch settings");

    new Setting(containerEl)
      .setName("Replicate API token")
      .setDesc(
        "Enter your Replicate API token. Get one at https://replicate.com/account/api-tokens"
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.replicateApiToken)
          .onChange(async (value) => {
            this.plugin.settings.replicateApiToken = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default model")
      .setDesc("Enter the default replicate model to use for image generation")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultModel)
          .onChange(async (value) => {
            this.plugin.settings.defaultModel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Lora weights URL")
      .setDesc("Enter the huggingface URL for the lora weights")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.loraWeights)
          .onChange(async (value) => {
            this.plugin.settings.loraWeights = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setHeading().setName("Custom dimensions");

    new Setting(containerEl)
      .setName("Custom width")
      .setDesc("Default width for custom sketch generation (default: 1024)")
      .addText((text) =>
        text
          .setPlaceholder("1024")
          .setValue(this.plugin.settings.customWidth.toString())
          .onChange(async (value) => {
            const width = parseInt(value);
            if (!isNaN(width) && width > 0) {
              this.plugin.settings.customWidth = width;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Custom height")
      .setDesc("Default height for custom sketch generation (default: 512)")
      .addText((text) =>
        text
          .setPlaceholder("512")
          .setValue(this.plugin.settings.customHeight.toString())
          .onChange(async (value) => {
            const height = parseInt(value);
            if (!isNaN(height) && height > 0) {
              this.plugin.settings.customHeight = height;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl).setHeading().setName("Prompt patterns");

    new Setting(containerEl)
      .setName("Selected pattern")
      .setDesc("Choose which prompt pattern to use for image generation")
      .addDropdown((dropdown) => {
        this.plugin.settings.promptPatterns.forEach((pattern) => {
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
        .addTextArea((text) =>
          text
            .setPlaceholder("a style description with {prompt}")
            .setValue(pattern.pattern)
            .onChange(async (value) => {
              this.plugin.settings.promptPatterns[index].pattern = value;
              await this.plugin.saveSettings();
            })
        );
    });
  }
}
