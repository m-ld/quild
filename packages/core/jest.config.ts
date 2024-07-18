import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    // Force module rxjs to resolve with the CJS entry point, because Jest does
    // not support package.json.exports. See
    // https://github.com/uuidjs/uuid/issues/451
    rxjs: require.resolve("rxjs"),
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default config;
