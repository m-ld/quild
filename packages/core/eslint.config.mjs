// @ts-nocheck

import path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["dist", "eslint.config.mjs"],
  },

  // Common rules
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:import-x/recommended",
      "plugin:@eslint-community/eslint-comments/recommended",
      "plugin:promise/recommended",
      "plugin:jest-formatting/strict"
    )
  ),
  {
    plugins: {
      "unused-imports": unusedImports,
    },

    rules: {
      "arrow-body-style": "warn",
      "default-param-last": "warn",

      "no-magic-numbers": [
        "warn",
        {
          ignoreArrayIndexes: true,
        },
      ],

      "no-invalid-this": "error",
      "array-callback-return": "error",
      "no-await-in-loop": "warn",
      "no-constant-binary-expression": "warn",
      "no-unmodified-loop-condition": "error",
      "no-unreachable-loop": "warn",
      "require-atomic-updates": "error",
      eqeqeq: "warn",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],

      "no-return-await": "warn",
      "no-useless-rename": "warn",
      "object-shorthand": "warn",

      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.[jt]s?(x)",
            "test-util/**/*.[jt]s?(x)",
            "jest.setup.ts",
            "eslint.config.mjs",
          ],
        },
      ],

      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            ["parent", "sibling", "index"],
            "internal",
            "unknown",
            "object",
            "type",
          ],

          "newlines-between": "always",

          alphabetize: {
            order: "asc",
            orderImportKind: "asc",
          },

          warnOnUnassignedImports: true,
        },
      ],

      "import-x/first": "warn",

      "@eslint-community/eslint-comments/disable-enable-pair": [
        "warn",
        {
          allowWholeFile: true,
        },
      ],

      "@eslint-community/eslint-comments/no-aggregating-enable": "warn",
      "@eslint-community/eslint-comments/no-duplicate-disable": "warn",
      "@eslint-community/eslint-comments/no-unlimited-disable": "warn",
      "@eslint-community/eslint-comments/no-unused-enable": "warn",
      "@eslint-community/eslint-comments/no-unused-disable": "warn",
      "@eslint-community/eslint-comments/require-description": "warn",
    },
  },

  // TypeScript files
  ...fixupConfigRules(
    compat.extends(
      "plugin:@typescript-eslint/strict-type-checked",
      "plugin:@typescript-eslint/stylistic-type-checked",
      "plugin:import-x/typescript"
    )
  ).map((config) => ({
    ...config,
    files: ["**/*.ts?(x)"],
  })),
  {
    files: ["**/*.ts?(x)"],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        project: "tsconfig.json",
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },

    settings: {
      "import-x/resolver": {
        typescript: {},
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-confusing-void-expression": "error",
      "@typescript-eslint/no-duplicate-type-constituents": "warn",
      "@typescript-eslint/consistent-type-exports": "warn",

      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          fixStyle: "inline-type-imports",
        },
      ],

      "default-param-last": "off",
      "@typescript-eslint/default-param-last": "error",
      "no-magic-numbers": "off",

      "@typescript-eslint/no-magic-numbers": [
        "warn",
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
        },
      ],

      "no-invalid-this": "off",
      "@typescript-eslint/no-invalid-this": "error",

      "@typescript-eslint/array-type": [
        "warn",
        {
          default: "array-simple",
        },
      ],

      "@typescript-eslint/consistent-type-assertions": [
        "warn",
        {
          assertionStyle: "never",
        },
      ],

      "@typescript-eslint/no-import-type-side-effects": "warn",
      "@typescript-eslint/no-namespace": "off",

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],
    },
  },

  // Test files
  {
    files: ["**/*.test.[jt]s?(x)"],

    rules: {
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
];
