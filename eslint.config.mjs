import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The repository vendors an agent skill library across a dozen editor
    // directories. Those scripts are prompts and tooling, not app code, and
    // linting them buries the app's own findings under thousands of errors.
    ".agents/**",
    ".augment/**",
    ".claude/**",
    ".codebuddy/**",
    ".codewhale/**",
    ".continue/**",
    ".cursor/**",
    ".factory/**",
    ".gemini/**",
    ".kilocode/**",
    ".kiro/**",
    ".opencode/**",
    ".qoder/**",
    ".roo/**",
    ".trae/**",
    ".warp/**",
    ".windsurf/**",
    ".github/prompts/**",
    // Vendored from the React Bits registry; edits here would be lost on
    // reinstall, so it is not held to this project's rules.
    "src/components/MoltenMetal/**",
    "src/components/TiltedCard/**",
  ]),
]);

export default eslintConfig;
