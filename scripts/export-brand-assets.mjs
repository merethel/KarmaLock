/**
 * Rasterizes SVG brand marks to PNGs for Expo (icon, splash, adaptive, favicon).
 * Run: node scripts/export-brand-assets.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAsync } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brandDir = join(root, "assets", "brand");
const imagesDir = join(root, "assets", "images");

const splashSvg = readFileSync(join(brandDir, "splash.svg"), "utf8");
const appIconSvg = readFileSync(join(brandDir, "app-icon.svg"), "utf8");
const wordmarkSvg = readFileSync(join(brandDir, "wordmark.svg"), "utf8");

async function writePng(name, buffer) {
  const path = join(imagesDir, name);
  writeFileSync(path, buffer);
  console.log("wrote", path);
}

async function main() {
  const splash = await renderAsync(splashSvg, {
    fitTo: { mode: "width", value: 2048 },
    background: "#000000",
  });
  await writePng("splash-icon.png", splash.asPng());

  const icon = await renderAsync(appIconSvg, {
    fitTo: { mode: "width", value: 1024 },
    background: "#000000",
  });
  await writePng("icon.png", icon.asPng());

  const adaptive = await renderAsync(appIconSvg, {
    fitTo: { mode: "width", value: 1024 },
    background: "transparent",
  });
  await writePng("adaptive-icon.png", adaptive.asPng());

  const fav = await renderAsync(wordmarkSvg, {
    fitTo: { mode: "width", value: 64 },
    background: "#000000",
  });
  await writePng("favicon.png", fav.asPng());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
