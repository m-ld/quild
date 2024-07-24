import { existsSync, readdirSync } from "node:fs";

import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  projects: readdirSync("packages")
    .map((pkg) => `<rootDir>/packages/${pkg}/jest.config.ts`)
    .filter((path) => existsSync(path)),
};

export default config;
