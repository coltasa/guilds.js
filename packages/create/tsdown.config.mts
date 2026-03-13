import { defineConfig } from "tsdown"

export default defineConfig({
    cjsDefault: true,
    clean: true,
    dts: false,
    entry: ["src/index.ts"],
    format: "cjs",
    minify: false,
    name: "guilds.js",
    platform: "node",
    removeNodeProtocol: false,
    shims: true,
    skipNodeModulesBundle: true,
    target: "node22",
})
