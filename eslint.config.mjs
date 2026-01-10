import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([

	// ✅ ...then only lint TS in src
	...obsidianmd.configs.recommended,

	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: { project: "./tsconfig.json" },
		},
		// optional: if you want to be extra explicit
		// ignores: [],
	},
]);
