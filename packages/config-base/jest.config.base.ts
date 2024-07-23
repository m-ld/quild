import type { Config } from "@jest/types";
import type { TsJestTransformerOptions } from "ts-jest";

const baseConfig: Config.InitialOptions = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.dev.json",
      } satisfies TsJestTransformerOptions,
    ],
  },
};

export default baseConfig;
