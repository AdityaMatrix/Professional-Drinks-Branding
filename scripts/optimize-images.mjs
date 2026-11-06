// Turns the full-size originals in design-assets/ into the small WebP files the app ships.
// Run with `npm run images` after changing an original.
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'design-assets';
const OUT = 'src/assets/images';

const cans = {
  'cans/reyna final.png': 'can-reyna',
  'cans/phnx final.png': 'can-phoenix',
  'cans/jett final.png': 'can-jett',
  'cans/sage final.png': 'can-sage',
};
const cards = {
  'phoenix.png': 'agent-phoenix',
  'jett1.webp': 'agent-jett',
  'sage3.jpg': 'agent-sage',
  'reyna1.jpg': 'agent-reyna',
};
const backgrounds = {
  'wallpaperflare.com_wallpaper.jpg': 'bg-about',
  '391500-valorant-game-fracture-background-4k-pc-wallpaper.jpg': 'bg-contact',
};

async function write(pipeline, name) {
  const file = path.join(OUT, `${name}.webp`);
  await pipeline.webp({ quality: 78, effort: 6 }).toFile(file);
  const { size } = await stat(file);
  console.log(`${name}.webp`.padEnd(24), `${(size / 1024).toFixed(0)} KB`);
  return size;
}

await mkdir(OUT, { recursive: true });
let total = 0;

for (const [src, name] of Object.entries(cans)) {
  // The originals are 1920x1080 canvases that are mostly transparent, so trim first.
  const trimmed = await sharp(path.join(SRC, src)).trim().png().toBuffer();
  total += await write(sharp(trimmed).resize({ height: 900, withoutEnlargement: true }), name);
}
for (const [src, name] of Object.entries(cards)) {
  total += await write(
    sharp(path.join(SRC, src)).resize({ width: 800, withoutEnlargement: true }),
    name,
  );
}
for (const [src, name] of Object.entries(backgrounds)) {
  total += await write(
    sharp(path.join(SRC, src)).resize({ width: 1920, withoutEnlargement: true }),
    name,
  );
}
total += await write(
  sharp(path.join(SRC, '1200px-Valorant_logo_-_black_color_version.svg.png')).resize({
    width: 160,
  }),
  'logo',
);

console.log('total'.padEnd(24), `${(total / 1024).toFixed(0)} KB`);
