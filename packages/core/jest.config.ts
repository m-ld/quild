import baseConfig from "@quild/config-base/jest.config.base.ts";

import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  ...baseConfig,
  setupFilesAfterEnv: ["<rootDir>/src/test-util/jest.setup.ts"],
};

export default config;
