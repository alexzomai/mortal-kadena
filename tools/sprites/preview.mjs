// Превью для разметки: для каждой строки листа — картинка с рамками и номерами кадров.
// Использование: node tools/sprites/preview.mjs art/source/lyokha.png art/preview/lyokha

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { detectFrames, loadSheet } from './sheet.mjs';

const [, , sheetPath, outDir] = process.argv;
if (!sheetPath || !outDir) {
  console.error('usage: node tools/sprites/preview.mjs <sheet> <outDir>');
  process.exit(1);
}

const SCALE = 2;
const LABEL_HEIGHT = 18;

const sheet = await loadSheet(sheetPath);
const frames = detectFrames(sheet);
await fs.mkdir(outDir, { recursive: true });

const bands = new Map();
for (const f of frames) {
  if (!bands.has(f.band)) bands.set(f.band, []);
  bands.get(f.band).push(f);
}

for (const [band, list] of bands) {
  const top = list[0].bandTop;
  const bottom = list[0].bandBottom;
  const bandHeight = bottom - top + 1;
  const width = sheet.width * SCALE;
  const height = (bandHeight + LABEL_HEIGHT) * SCALE;

  const boxes = list
    .map((f) => {
      const x = f.x * SCALE;
      const y = (f.y - top + LABEL_HEIGHT) * SCALE;
      return `<rect x="${x}" y="${y}" width="${f.w * SCALE}" height="${f.h * SCALE}" fill="none" stroke="red" stroke-width="1"/>
        <text x="${x}" y="${(LABEL_HEIGHT - 3) * SCALE}" font-family="Arial" font-weight="bold" font-size="${13 * SCALE}" fill="black">${f.id}</text>`;
    })
    .join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${boxes}</svg>`);

  const strip = await sharp(sheet.path)
    .extract({ left: 0, top, width: sheet.width, height: bandHeight })
    .resize(sheet.width * SCALE, bandHeight * SCALE, { kernel: 'nearest' })
    .extend({ top: LABEL_HEIGHT * SCALE, bottom: 0, left: 0, right: 0, background: '#ffffff' })
    .png()
    .toBuffer();

  await sharp(strip)
    .composite([{ input: svg }])
    .png()
    .toFile(path.join(outDir, `band-${String(band).padStart(2, '0')}.png`));
}

console.log(`${frames.length} frames in ${bands.size} bands → ${outDir}`);
