import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const nextPackage = require.resolve("next/package.json");
const nextRoot = dirname(nextPackage);
const requiredRuntimeFile = join(nextRoot, "dist", "server", "require-hook.js");

if (!existsSync(requiredRuntimeFile)) {
  console.warn("Next.js installation is incomplete; reinstalling locked dependencies with npm ci…");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCommand, ["ci"], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(requiredRuntimeFile)) {
  console.error(
    "Next.js is still incomplete. Run npm ci manually, then retry npm run dev."
  );
  process.exit(1);
}
