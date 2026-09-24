import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js 16 no longer lints during `next build`, so this only runs through
// `yarn lint`. The two presets are the ones create-next-app generates.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Warnings, not errors, when this config was added (2026-09-24): the code
    // had 137 `any`s and 12 effects that set state on mount (reading
    // localStorage, the theme, the currency after hydration). Rewriting them
    // blind is riskier than the lint finding. New code should not add more;
    // raise these back to "error" once the counts reach zero.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Backup copies left in a checkout (see tsconfig.json) are not source.
    "*.bak-*/**",
  ]),
]);

export default eslintConfig;
