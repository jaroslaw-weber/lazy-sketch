const typescript = require("@rollup/plugin-typescript");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const copy = require("rollup-plugin-copy");

const isProduction = process.env.BUILD === "production";
const outputDir = process.env.OUTPUT_DIR || "dist";

module.exports = {
  input: "src/main.ts",
  output: {
    dir: outputDir,
    sourcemap: isProduction ? false : "inline",
    sourcemapExcludeSources: isProduction,
    format: "cjs",
    exports: "default",
  },
  external: ["obsidian", "electron", "@codemirror/autocomplete", "@codemirror/closebrackets", "@codemirror/collab", "@codemirror/commands", "@codemirror/comment", "@codemirror/fold", "@codemirror/gutter", "@codemirror/highlight", "@codemirror/history", "@codemirror/language", "@codemirror/lint", "@codemirror/matchbrackets", "@codemirror/panel", "@codemirror/rangeset", "@codemirror/rectangular-selection", "@codemirror/search", "@codemirror/state", "@codemirror/stream-parser", "@codemirror/text", "@codemirror/tooltip", "@codemirror/view"],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    copy({
      targets: [
        { src: "manifest.json", dest: outputDir },
        { src: "styles.css", dest: outputDir }
      ]
    })
  ]
};
