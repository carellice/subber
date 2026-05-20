const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { PNG } = require("pngjs");

const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "logo.png");
const resPath = path.join(root, "android", "app", "src", "main", "res");
const densities = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192]
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resizeLogo(size) {
  const tmp = path.join(os.tmpdir(), `subber-logo-${size}-${Date.now()}.png`);
  execFileSync("sips", ["-z", String(size), String(size), logoPath, "--out", tmp], { stdio: "ignore" });
  const image = PNG.sync.read(fs.readFileSync(tmp));
  fs.rmSync(tmp, { force: true });
  return image;
}

function paintWhite(canvas, rounded = false) {
  const radius = canvas.width / 2;
  const center = (canvas.width - 1) / 2;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const idx = (canvas.width * y + x) << 2;
      const inside = !rounded || Math.hypot(x - center, y - center) <= radius;
      canvas.data[idx] = 255;
      canvas.data[idx + 1] = 255;
      canvas.data[idx + 2] = 255;
      canvas.data[idx + 3] = inside ? 255 : 0;
    }
  }
}

function compositeLogo(canvas, logo, offsetX, offsetY) {
  for (let y = 0; y < logo.height; y += 1) {
    for (let x = 0; x < logo.width; x += 1) {
      const sourceIdx = (logo.width * y + x) << 2;
      const targetX = x + offsetX;
      const targetY = y + offsetY;
      if (targetX < 0 || targetY < 0 || targetX >= canvas.width || targetY >= canvas.height) continue;

      const targetIdx = (canvas.width * targetY + targetX) << 2;
      const sourceAlpha = logo.data[sourceIdx + 3] / 255;
      const targetAlpha = canvas.data[targetIdx + 3] / 255;
      const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);

      if (outAlpha === 0) continue;

      for (let channel = 0; channel < 3; channel += 1) {
        const source = logo.data[sourceIdx + channel] / 255;
        const target = canvas.data[targetIdx + channel] / 255;
        const out = (source * sourceAlpha + target * targetAlpha * (1 - sourceAlpha)) / outAlpha;
        canvas.data[targetIdx + channel] = Math.round(out * 255);
      }

      canvas.data[targetIdx + 3] = Math.round(outAlpha * 255);
    }
  }
}

function writePng(file, canvas) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, PNG.sync.write(canvas));
}

function createIcon(size, { foreground = false, rounded = false } = {}) {
  const canvas = new PNG({ width: size, height: size });
  const logoSize = Math.round(size * (foreground ? 0.58 : 0.72));
  const logo = resizeLogo(logoSize);
  const offset = Math.round((size - logoSize) / 2);

  if (!foreground) {
    paintWhite(canvas, rounded);
  }

  compositeLogo(canvas, logo, offset, offset);
  return canvas;
}

function writeXml(file, contents) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, contents);
}

if (!fs.existsSync(logoPath)) {
  console.error(`Logo non trovato: ${logoPath}`);
  process.exit(1);
}

if (!fs.existsSync(resPath)) {
  console.error("Cartella Android non trovata. Esegui prima: npm run mobile:add:android");
  process.exit(1);
}

for (const [density, size] of densities) {
  const dir = path.join(resPath, `mipmap-${density}`);
  writePng(path.join(dir, "ic_launcher.png"), createIcon(size));
  writePng(path.join(dir, "ic_launcher_round.png"), createIcon(size, { rounded: true }));
  writePng(path.join(dir, "ic_launcher_foreground.png"), createIcon(Math.round(size * 2.25), { foreground: true }));
}

writeXml(
  path.join(resPath, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`
);

writeXml(
  path.join(resPath, "mipmap-anydpi-v26", "ic_launcher.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`
);

writeXml(
  path.join(resPath, "mipmap-anydpi-v26", "ic_launcher_round.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`
);

console.log("Icone Android generate con sfondo bianco.");
