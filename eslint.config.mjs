import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * 组件约束（对应 PRD/架构文档 11.3、实现计划第一阶段）：
 * - 业务代码禁止原生 <button>、<select>、<dialog>，必须使用 shadcn/ui。
 * - 禁止 div/span + onClick 模拟控件。
 * - src/components/ui/** 不受该限制（底层组件允许使用原生元素与 Base UI）。
 */
const noNativeControls = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/components/ui/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "JSXOpeningElement[name.name='button']",
        message:
          "业务代码禁止使用原生 <button>，请使用 @/components/ui/button 的 Button。",
      },
      {
        selector: "JSXOpeningElement[name.name='select']",
        message:
          "业务代码禁止使用原生 <select>，请使用 @/components/ui/select 的 Select。",
      },
      {
        selector: "JSXOpeningElement[name.name='dialog']",
        message:
          "业务代码禁止使用原生 <dialog>，请使用 @/components/ui/dialog 的 Dialog。",
      },
      {
        selector:
          "JSXOpeningElement[name.name='div'] JSXAttribute[name.name='onClick']",
        message:
          "禁止用 div + onClick 模拟控件，请使用 Button 或合适的 shadcn/ui 组件。",
      },
      {
        selector:
          "JSXOpeningElement[name.name='span'] JSXAttribute[name.name='onClick']",
        message:
          "禁止用 span + onClick 模拟控件，请使用 Button 或合适的 shadcn/ui 组件。",
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noNativeControls,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright 产物与 vitest 缓存。
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
