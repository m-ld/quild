import { defineConfig } from "tsup";

export default defineConfig(({ tsconfig }) => ({
  entry: ["src/index.ts", "src/m-ld/index.ts"],
  sourcemap: true,
  format: ["cjs", "esm"],
  onSuccess: `tsc ${tsconfig ? `--project ${tsconfig}` : ""}`,
}));
