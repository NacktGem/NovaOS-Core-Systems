import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/**","**/.next/**","**/node_modules/**","artifacts/**","ai_models/**","tools/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { project: false } },
    plugins: {},
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/**/{app,src}/**/*.{ts,tsx,js,jsx}"],
  },
];
