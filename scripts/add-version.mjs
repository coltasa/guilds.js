#!/usr/bin/env node

import { access, appendFile, readFile, constants } from "node:fs/promises"
import path from "node:path"
import url from "node:url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const dist = path.resolve(__dirname, "..", "packages", "guilds.js", "dist")

try {
    await access(dist, constants.F_OK)
} catch {
    console.error("The dist/ directory is missing.")
    process.exit(1)
}

const { version } = JSON.parse(
    await readFile(
        path.resolve(__dirname, "..", "packages", "guilds.js", "package.json"),
        "utf8"
    )
)

await Promise.all([
    appendFile(path.resolve(dist, "index.cjs"), `\nexports.version = "${version}";\n`),
    appendFile(
        path.resolve(dist, "index.d.cts"),
        `\nexport declare const version = "${version}";\n`
    ),
])

console.log(`Version string: ${version}`)
