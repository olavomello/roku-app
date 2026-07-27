/**
 * deploy.js — Roku channel packager + sideloader
 *
 * Inspired by Playlet (github.com/iBicha/playlet) and
 * Jellyfin Roku (github.com/jellyfin/jellyfin-roku).
 *
 * Usage:
 *   npm run package          → build deploy/roku-channel.zip only
 *   npm run deploy           → build zip + sideload to Roku device
 *   node scripts/deploy.js              (same as package)
 *   node scripts/deploy.js --deploy     (same as deploy)
 *
 * NEVER runs transpile-roku.js. BRS/XML files are the source of truth.
 */

import rokuDeploy from "roku-deploy";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// ─── File patterns (mirrors bsconfig.json) ────────────────────────────────────
// Uses **/*.* to match only files (not directories), avoiding roku-deploy warnings.
const CHANNEL_FILES = [
  "manifest",
  "source/**/*.*",
  "components/**/*.*",
  "services/**/*.*",
  "models/**/*.*",
  "utils/**/*.*",
  "feeds/**/*.*",
  "assets/**/*.*",
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();

  const DEPLOY = process.argv.includes("--deploy");
  const ROKU_HOST =
    process.env.ROKU_HOST ||
    process.env.ROKU_IP ||
    "10.0.0.171";
  const ROKU_PASS =
    process.env.ROKU_PASSWORD ||
    process.env.ROKU_DEV_PASSWORD ||
    process.env.ROKU_PASS;
  const OUT_DIR = path.join(ROOT, "deploy");

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Mirror zip to public/ for browser download link
  const PUBLIC_DIR = path.join(ROOT, "public");
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const packageOptions = {
    rootDir: ROOT,
    outDir: OUT_DIR,
    outFile: "roku-channel",
    retainDeploymentArchive: true,
    incrementBuildNumber: false,
    files: CHANNEL_FILES,
  };

  // Step 1: always package first
  console.log("\n📦  Packaging Roku channel …");
  await rokuDeploy.createPackage(packageOptions);

  const zipPath = path.join(OUT_DIR, "roku-channel.zip");
  const sizeKb = (fs.statSync(zipPath).size / 1024).toFixed(1);
  console.log(`✅  deploy/roku-channel.zip  (${sizeKb} KB)`);

  // Mirror to public/ for web download
  fs.copyFileSync(zipPath, path.join(PUBLIC_DIR, "roku-channel.zip"));
  console.log(`📎  public/roku-channel.zip updated`);

  // Step 2: sideload if --deploy flag
  if (DEPLOY) {
    if (!ROKU_HOST) {
      console.error("❌  ROKU_HOST not set in .env");
      process.exit(1);
    }
    if (!ROKU_PASS) {
      console.warn("⚠️   ROKU_PASSWORD not set — using empty password");
    }
    console.log(`\n🚀  Sideloading to Roku at ${ROKU_HOST} …`);
    await rokuDeploy.publish({
      ...packageOptions,
      host: ROKU_HOST,
      password: ROKU_PASS || "",
      username: "rokudev",
    });
    console.log(`✅  Deployed → http://${ROKU_HOST}`);
  } else {
    console.log(
      `\n   To sideload:  npm run deploy\n   Roku device:  http://${ROKU_HOST}\n`,
    );
  }
}

main().catch((err) => {
  console.error("❌ ", err.message || err);
  process.exit(1);
});
