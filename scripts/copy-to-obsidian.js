require('dotenv').config();
const fs = require('fs');
const path = require('path');

const obsidianPath = process.env.OBSIDIAN_PATH;

if (!obsidianPath) {
  console.error('Error: OBSIDIAN_PATH not found in .env file');
  process.exit(1);
}

const pluginDir = path.join(obsidianPath, '.obsidian', 'plugins', 'obsidian-lazy-sketch');

if (!fs.existsSync(pluginDir)) {
  fs.mkdirSync(pluginDir, { recursive: true });
  console.log(`Created plugin directory: ${pluginDir}`);
}

const files = ['main.js', 'manifest.json', 'styles.css'];
const sourceDir = 'dist';

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(pluginDir, file);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file} to ${destPath}`);
  } else {
    console.error(`✗ Source file not found: ${sourcePath}`);
  }
});

console.log('\n✓ Build files copied to Obsidian successfully!');
