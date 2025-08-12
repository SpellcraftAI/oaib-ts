/* eslint-disable @typescript-eslint/no-explicit-any */
import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import { defineConfig } from "eslint/config"

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  tseslint.configs.recommended as any,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    rules: {
      indent: ["error", 2],
      semi: ["error", "never"]
    }
  }
])
