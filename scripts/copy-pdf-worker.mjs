// Copies the pdf.js worker into public/ so it can be loaded as a same-origin
// classic asset instead of being parsed by webpack. Runs before dev/build.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const workerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const target = join(process.cwd(), "public", "pdf.worker.min.mjs");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(workerPath, target);
console.log("Copied pdf.js worker → public/pdf.worker.min.mjs");
