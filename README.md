# Obsidian Lazy Sketch

Generate AI-powered sketches directly in your Obsidian notes using the Replicate API.

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7c3aed?style=for-the-badge&logo=obsidian)

## Demo

Watch the plugin in action:


https://github.com/user-attachments/assets/764d1cc4-0a2d-4fc6-b9ec-eb4c0f932e8d


## Features

- 🎨 Generate cute pencil sketch-style images with text prompts
- 🖼️ Insert generated images directly into your notes
- ✨ Fast generation using Z-Image-Turbo model with LoRA
- ⚙️ Customizable API settings
- 🎯 Multiple prompt patterns (cute, detailed, whimsical)
- 🚀 Simple and intuitive workflow

## Installation

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/jaroslaw-weber/obsidian-lazy-sketch-plugin/releases) page
2. Extract the downloaded zip file
3. Copy the extracted folder to your Obsidian plugins directory:
   - **macOS**: `~/.obsidian/plugins/`
   - **Windows**: `%APPDATA%/Obsidian/plugins/`
   - **Linux**: `~/.config/obsidian/plugins/`
4. Enable the plugin in Obsidian Settings → Community Plugins

### Development Installation

```bash
# Clone the repository
git clone https://github.com/jaroslaw-weber/obsidian-lazy-sketch-plugin.git
cd obsidian-lazy-sketch-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Configure your Obsidian path in .env
# OBSIDIAN_PATH=/path/to/your/vault

# Build and copy to your Obsidian plugins directory
npm run build
```

## Setup

### Required Configuration

1. Get a Replicate API token at [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Open Obsidian Settings → Community Plugins → Lazy Sketch
3. **Enter your Replicate API Token** (required for the plugin to work)
4. The model and LoRA weights are pre-configured for pencil sketches, but you can customize them if needed

## How to Use

### Method 1: Command Palette with Input

1. Place your cursor where you want to insert the image
2. Open Command Palette (`Cmd/Ctrl + P`)
3. Run "Lazy Sketch: Generate Sketch"
4. Enter your prompt in the popup dialog
5. Click "Generate" or press Enter
6. Wait for the image to generate (usually 8-10 seconds)
7. The sketch will be inserted as `![prompt](files/sketch_*.jpg)`

### Method 2: Using Selected Text

1. Type your prompt in your note (e.g., "A cat wearing a hat")
2. Select the text
3. Run "Lazy Sketch: Generate Sketch" command
4. The selected text will be replaced with the generated image

### Example Prompts

```
A cat wearing a hat
A cozy cabin in the forest
Abstract geometric shapes with vibrant colors
A futuristic space station
A simple tree with falling leaves
```

### Understanding Prompt Patterns

The plugin supports different artistic styles:

- **Cute**: "a color pencil sketch. clear white background. cute & fun & simple. {prompt}"
- **Detailed**: "a detailed pencil sketch. clean white background. intricate & realistic. {prompt}"
- **Whimsical**: "a playful pencil sketch. white background. whimsical & imaginative. {prompt}"

You can customize these patterns in the plugin settings.

## Generated Files

Images are automatically saved to a `files/` folder in your vault with filenames like:
- `sketch_prompt_1234567890.jpg`

The timestamp ensures each image has a unique filename.

## Configuration

### Replicate API Token
Required for image generation. Get your token at [Replicate API Tokens](https://replicate.com/account/api-tokens).

### Default Model
The Replicate model to use for generation. The default is `prunaai/z-image-turbo-lora` which is optimized for fast pencil sketch generation.

### LoRA Weights URL
The huggingface URL for the LoRA weights that define the pencil sketch style. Default: `https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch/blob/main/Zimage_pencil_sketch.safetensors`

### Prompt Patterns
Customize the prompt templates that wrap your user input. Use `{prompt}` as a placeholder for your actual prompt.

## Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production (also copies to Obsidian if .env is configured)
npm run build
```

### Project Structure

```
├── src/              # Source code
│   ├── main.ts       # Main plugin logic
│   └── styles.css    # Plugin styles
├── scripts/          # Build scripts
│   └── copy-to-obsidian.js
├── assets/           # Media files
│   └── lazy-sketch-demo.gif
└── dist/             # Build output (generated)
```

## Troubleshooting


### "Please set your Replicate API token in settings"
Make sure you've entered your API token in the plugin settings. Get one at [Replicate API Tokens](https://replicate.com/account/api-tokens).

### Image generation is slow
The plugin uses the fast Z-Image-Turbo model which typically takes 8-10 seconds. Check the Obsidian console (Ctrl+Shift+I) for detailed status messages.

### Generated images are 0 bytes
This should now be fixed in the latest version. If you still encounter this, try reinstalling the plugin.

### "Error: Generation failed"
Check the Obsidian console (Ctrl+Shift+I) for detailed error messages. Common causes:
- Invalid API token
- API quota exceeded
- Network connectivity issues
- Model is temporarily unavailable

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

MIT License - see LICENSE file for details

## Credits

- Built with [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Powered by [Replicate](https://replicate.com/)
- Pencil sketch style using [Z-Image-Turbo with LoRA](https://huggingface.co/Ttio2/Z-Image-Turbo-pencil-sketch)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/jaroslaw-weber/obsidian-lazy-sketch-plugin/issues) page.
