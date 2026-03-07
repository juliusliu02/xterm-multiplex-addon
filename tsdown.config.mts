import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/MultiplexAddon.ts"],
  format: ["esm"],
  outDir: "lib",
  dts: true,
  sourcemap: true,
  clean: true,
  outExtensions: () => ({ js: ".js" }),
});
