# Obsidian Plugin Development Notes

## Overview

This document provides notes and guidance for developing Obsidian plugins, based on the development of the Lazy Sketch plugin.

## Plugin Structure

### Required Files

```
obsidian-plugin/
├── manifest.json       # Plugin metadata and configuration
├── package.json        # NPM dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── rollup.config.js    # Build configuration (or webpack)
├── styles.css          # Plugin styles
├── src/
│   └── main.ts        # Main plugin entry point
└── dist/              # Build output (gitignored)
```

### manifest.json

Defines plugin metadata:

```json
{
  "id": "unique-plugin-id",
  "name": "Plugin Name",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Plugin description",
  "author": "Your Name",
  "authorUrl": "https://your-website.com",
  "isDesktopOnly": false
}
```

**Important fields:**
- `id`: Must be unique, use reverse domain notation (e.g., `com.yourname.plugin-name`)
- `minAppVersion`: Minimum Obsidian version required
- `isDesktopOnly`: Set to true if plugin requires desktop-only APIs

### package.json

Standard npm package with dependencies:

```json
{
  "name": "obsidian-plugin-name",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "dev": "rollup --config rollup.config.js -w",
    "build": "rollup --config rollup.config.js --environment BUILD:production"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.7",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-typescript": "^11.1.5",
    "@types/node": "^20.10.6",
    "obsidian": "^1.4.0",
    "rollup": "^4.9.1",
    "tslib": "^2.6.2",
    "typescript": "^5.3.3"
  }
}
```

**Key dependencies:**
- `obsidian`: Obsidian API
- `@types/node`: TypeScript definitions for Node.js
- Build tools: rollup, typescript, and plugins

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "moduleResolution": "node",
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  }
}
```

## Plugin Architecture

### Plugin Class

Every plugin extends the base `Plugin` class:

```typescript
import { Plugin } from "obsidian";

export default class MyPlugin extends Plugin {
  async onload() {
    // Plugin initialization
    console.log("Loading plugin");
    
    // Register commands, settings, events, etc.
  }

  async onunload() {
    // Cleanup when plugin is disabled
    console.log("Unloading plugin");
  }
}
```

### Common Plugin Features

#### 1. Register Commands

```typescript
this.addCommand({
  id: "my-command",
  name: "My Command",
  callback: () => {
    // Command logic
  }
});
```

#### 2. Access Active Editor

```typescript
const editor = this.app.workspace.activeEditor;
if (editor) {
  const cursor = editor.getCursor();
  const selectedText = editor.getSelection();
  
  // Modify editor content
  editor.replaceRange("new text", cursor);
}
```

#### 3. Settings Tab

```typescript
import { PluginSettingTab, Setting } from "obsidian";

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Setting Name")
      .setDesc("Setting description")
      .addText(text => text
        .setPlaceholder("Default value")
        .setValue(this.plugin.settings.mySetting)
        .onChange(async (value) => {
          this.plugin.settings.mySetting = value;
          await this.plugin.saveSettings();
        }));
  }
}

// Register in onload()
this.addSettingTab(new MySettingTab(this.app, this));
```

#### 4. Load/Save Settings

```typescript
interface MyPluginSettings {
  apiKey: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  apiKey: "",
  enabled: true
};

async loadSettings() {
  this.settings = Object.assign(
    {}, 
    DEFAULT_SETTINGS, 
    await this.loadData()
  );
}

async saveSettings() {
  await this.saveData(this.settings);
}
```

#### 5. Display Notices

```typescript
import { Notice } from "obsidian";

new Notice("Operation successful");
new Notice("Error occurred", 5000); // 5 seconds
```

## Development Workflow

### Initial Setup

```bash
# Create project directory
mkdir obsidian-my-plugin
cd obsidian-my-plugin

# Initialize npm
npm init -y

# Install dependencies
npm install obsidian typescript @types/node tslib
npm install --save-dev rollup @rollup/plugin-typescript @rollup/plugin-node-resolve @rollup/plugin-commonjs
```

### Development

```bash
# Watch mode - rebuilds on file changes
npm run dev

# Production build
npm run build
```

### Testing Plugin Locally

1. Build the plugin: `npm run build`
2. Copy files to Obsidian plugins directory:
   ```bash
   cp main.js manifest.json styles.css ~/.obsidian/plugins/your-plugin-id/
   ```
3. Enable plugin in Obsidian Settings → Community Plugins
4. Reload Obsidian or use the "Reload app without saving" command

## Build Configuration (Rollup)

```javascript
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

export default {
  input: "src/main.ts",
  output: {
    dir: ".",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian", "electron", "@codemirror/*"],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    copy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "styles.css", dest: "." }
      ]
    })
  ]
};
```

## Common Patterns

### 1. Making HTTP Requests

```typescript
async fetchData(url: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key: "value" })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### 2. Modal Dialogs

```typescript
async showPrompt(): Promise<string | null> {
  return await new Promise((resolve) => {
    const modal = document.createElement("div");
    // Create and style modal content
    // Add event handlers
    // Resolve with user input or null if cancelled
  });
}
```

### 3. Registering Events

```typescript
this.registerEvent(
  this.app.workspace.on("file-open", (file) => {
    console.log("Opened file:", file?.name);
  })
);
```

## Publishing Your Plugin

1. Test thoroughly in development
2. Create a GitHub repository
3. Add documentation (README, screenshots)
4. Submit to Obsidian plugin list: https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md

## Resources

- [Obsidian Plugin API Docs](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Plugin Samples](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Community Plugins](https://obsidian.md/plugins)

## Tips

1. Use TypeScript for better type safety
2. Test on both desktop and mobile if possible
3. Handle errors gracefully with notices
4. Follow Obsidian design guidelines
5. Keep plugin id unique and consistent
6. Version your releases using semantic versioning
7. Include clear documentation and examples
8. Test with different Obsidian versions
