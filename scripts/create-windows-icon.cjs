const fs = require("node:fs/promises");
const path = require("node:path");
const pngToIco = require("png-to-ico");

async function main() {
  const root = path.join(__dirname, "..");
  const source = path.join(root, "public", "logo.png");
  const targetDir = path.join(root, "build");
  const target = path.join(targetDir, "icon.ico");

  await fs.mkdir(targetDir, { recursive: true });
  const buffer = await pngToIco(source);
  await fs.writeFile(target, buffer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
