import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  format: ["cjs", "esm"],
  onSuccess: "tsc --project tsconfig.build.json",
});
