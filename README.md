# Obsidian Lazy Sketch

Generate AI-powered sketches directly in your Obsidian notes using the Replicate API.

![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-7c3aed?style=for-the-badge&logo=obsidian)

## Features

- 🎨 Generate cute pencil sketch-style images with text prompts
- 🖼️ Insert generated images directly into your notes
- ✨ Fast generation using Z-Image-Turbo model with LoRA
- ⚙️ Customizable API settings
- 🚀 Simple and intuitive workflow

## Installation

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/jaroslaw-weber/obsidian-lazy-sketch/releases) page
2. Extract the downloaded zip file
3. Copy the extracted folder to your Obsidian plugins directory:
   - **macOS**: `~/.obsidian/plugins/`
   - **Windows**: `%APPDATA%/Obsidian/plugins/`
   - **Linux**: `~/.config/obsidian/plugins/`
4. Enable the plugin in Obsidian Settings → Community Plugins

### Development Installation

```bash
# Clone the repository
git clone https://github.com/jaroslaw-weber/obsidian-lazy-sketch.git
cd obsidian-lazy-sketch

# Install dependencies
npm install

# Build the plugin
npm run build

# Copy the built files to your Obsidian plugins directory
cp main.js manifest.json styles.css ~/.obsidian/plugins/obsidian-lazy-sketch/
```

## Setup

### Required Configuration

1. Get a Replicate API token at [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Open Obsidian Settings → Community Plugins → Lazy Sketch
3. **Enter your Replicate API Token** (required for the plugin to work)
4. The model and LoRA weights are pre-configured for pencil sketches, but you can customize them if needed

## Usage

### Method 1: Command Palette

1. Place your cursor where you want to insert the image
2. Open Command Palette (`Cmd/Ctrl + P`)
3. Run "Lazy Sketch: Generate Sketch"
4. Enter your prompt or select existing text
5. Wait for the image to generate

### Method 2: Selected Text

1. Type or select the text you want to use as a prompt
2. Run the "Generate Sketch" command
3. The selected text will be replaced with the generated image

## Example Prompts

```
A cyberpunk city at sunset, neon lights, highly detailed
A cozy cabin in the forest, watercolor style
Abstract geometric shapes with vibrant colors
A futuristic space station, digital art
```

## Configuration

### Replicate API Token
Required for image generation. Get your token at [Replicate API Tokens](https://replicate.com/account/api-tokens).

### Default Model
The Replicate model to use for generation. Popular options:
- `stability-ai/stable-diffusion-3` (default)
- `black-forest-labs/flux-schnell`
- `black-forest-labs/flux-pro`
- `openai/dall-e-3`

## Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Credits

- Built with [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Powered by [Replicate](https://replicate.com/)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/jaroslaw-weber/obsidian-lazy-sketch/issues) page.
