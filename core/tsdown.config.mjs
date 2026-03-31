import { defineConfig } from "tsdown"

export default defineConfig({
    cjsDefault: true,
    clean: true,
    deps: { skipNodeModulesBundle: true },
    dts: true,
    entry: ["src/index.ts"],
    format: "cjs",
    minify: false,
    name: "@guilds/core",
    outDir: "dist",
    platform: "node",
    removeNodeProtocol: false,
    shims: true,
    target: "node22",
})
