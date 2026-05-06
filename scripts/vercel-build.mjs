import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRoot = path.join(repoRoot, "vybe-stats-main");

function rmIfExists(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log(`[vercel-build] Building app in: ${appRoot}`);
execSync("npm run build", { cwd: appRoot, stdio: "inherit" });

const srcOut = path.join(appRoot, ".vercel", "output");
const dstOut = path.join(repoRoot, ".vercel", "output");

if (!fs.existsSync(srcOut)) {
  throw new Error(`[vercel-build] Missing output at ${srcOut}`);
}

console.log(`[vercel-build] Copying output to repo root: ${dstOut}`);
rmIfExists(dstOut);
copyDir(srcOut, dstOut);

