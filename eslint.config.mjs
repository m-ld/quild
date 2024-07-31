import path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      // Ignore built files
      "packages/*/dist",

      // These are minimal changes on top of the todomvc repo's version, so we
      // don't want to be beholden to our lint config.
      "examples/todomvc-vanilla-m-ld",
      "examples/todomvc-react-m-ld",
    ],
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

      "no-return-await": "warn",
      "no-useless-rename": "warn",
      "object-shorthand": "warn",

      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "packages/*/src/**/*.test.[jt]s?(x)",
            "packages/*/src/**/*.type-test.[jt]s?(x)",
            "packages/*/src/test-util/**/*.[jt]s?(x)",
            "packages/*/*",
            "*",
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

  // TypeScript rules
  ...fixupConfigRules(
    compat.extends(
      "plugin:@typescript-eslint/strict-type-checked",
      "plugin:@typescript-eslint/stylistic-type-checked",
      "plugin:import-x/typescript"
    )
  ),
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        // Use all dev-time tsconfigs
        project: [
          "./tsconfig.(dev|node).json",
          "packages/*/tsconfig.(dev|node).json",
        ],
        // For TypeScript project references (TK: keep?)
        EXPERIMENTAL_useProjectService: true,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },

    settings: {
      "import-x/resolver": {
        typescript: {},
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": [
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

      "@typescript-eslint/no-unnecessary-condition": [
        "warn",
        { allowConstantLoopConditions: true },
      ],

      "@typescript-eslint/no-invalid-void-type": [
        "error",
        { allowAsThisParameter: true },
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
