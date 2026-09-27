// Сборка спрайтлиста бойца из «рваного» рипа по конфигу разметки.
//
// Использование: node tools/sprites/build.mjs art/fighters/lyokha.json
//
// На выходе (config.output):
//   <output>.png  — сетка одинаковых ячеек, фон прозрачный;
//                   в каждой ячейке точка «между ступнями» стоит в центре нижнего края,
//                   поэтому в Phaser хватает origin (0.5, 1) и flipX.
//   <output>.json — размер ячейки, масштаб и анимации в индексах кадров сетки.
//
// Кадры в конфиге — id из превью (node tools/sprites/preview.mjs): "строка.кадр".

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { detectFrames, findAnchor, loadSheet } from './sheet.mjs';

const configPath = process.argv[2];
if (!configPath) {
  console.error('usage: node tools/sprites/build.mjs <config.json>');
  process.exit(1);
}
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

const sheet = await loadSheet(config.source);
const framesById = new Map(detectFrames(sheet).map((f) => [f.id, f]));

const getFrame = (id) => {
  const frame = framesById.get(id);
  if (!frame) throw new Error(`${configPath}: frame "${id}" not found in ${config.source}`);
  return frame;
};

// ---------------------------------------------------------------- какие кадры нужны

/** Все ссылки на кадры: { id, offsetY } → индекс в выходной сетке. */
const cells = [];
const cellIndex = new Map();
const useFrame = (id, offsetY = 0) => {
  const key = `${id}@${offsetY}`;
  if (!cellIndex.has(key)) {
    cellIndex.set(key, cells.length);
    cells.push({ frame: getFrame(id), offsetY });
  }
  return cellIndex.get(key);
};

const animations = {};
for (const [name, anim] of Object.entries(config.animations)) {
  animations[name] = {
    frames: anim.frames.map((id) => useFrame(id, anim.offsetY ?? 0)),
    fps: anim.fps ?? 10,
    loop: anim.loop ?? false,
  };
}

const attacks = {};
for (const [name, attack] of Object.entries(config.attacks)) {
  attacks[name] = {};
  for (const phase of ['startup', 'active', 'recovery']) {
    attacks[name][phase] = attack[phase].map((id) => useFrame(id, attack.offsetY ?? 0));
  }
}

// ---------------------------------------------------------------- размеры ячейки

for (const cell of cells) cell.anchor = findAnchor(sheet, cell.frame);

let halfWidth = 0;
let cellHeight = 0;
for (const { frame, anchor, offsetY } of cells) {
  halfWidth = Math.max(halfWidth, anchor.x - frame.x + 1, frame.x + frame.w - anchor.x);
  cellHeight = Math.max(cellHeight, anchor.y - frame.y + 1 + offsetY);
}
const cellWidth = halfWidth * 2;
const columns = Math.ceil(Math.sqrt(cells.length * (cellHeight / cellWidth)));
const rows = Math.ceil(cells.length / columns);

// Масштаб: средний рост в стойке → config.targetHeight (рост бойца в мире)
const idleHeights = config.animations.idle.frames.map((id) => getFrame(id).h);
const scale = config.targetHeight / (idleHeights.reduce((a, b) => a + b, 0) / idleHeights.length);

// ---------------------------------------------------------------- перенос пикселей

const out = Buffer.alloc(columns * cellWidth * rows * cellHeight * 4);
const outWidth = columns * cellWidth;
const { data, mask, width } = sheet;

cells.forEach(({ frame, anchor, offsetY }, i) => {
  const cellX = (i % columns) * cellWidth;
  const cellY = Math.floor(i / columns) * cellHeight;
  for (let y = frame.y; y < frame.y + frame.h; y++) {
    for (let x = frame.x; x < frame.x + frame.w; x++) {
      const src = y * width + x;
      if (!mask[src]) continue;
      const dx = cellX + halfWidth + (x - anchor.x);
      const dy = cellY + cellHeight - 1 - (anchor.y - y) - offsetY;
      const dst = (dy * outWidth + dx) * 4;
      let r = data[src * 4];
      let g = data[src * 4 + 1];
      const b = data[src * 4 + 2];
      // Подавление зелёной каймы от сжатия на краях силуэта
      if (config.despill && isEdge(x, y)) g = Math.min(g, Math.max(r, b));
      out[dst] = r;
      out[dst + 1] = g;
      out[dst + 2] = b;
      out[dst + 3] = 255;
    }
  }
});

function isEdge(x, y) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= sheet.height || !mask[ny * width + nx]) return true;
  }
  return false;
}

await fs.mkdir(path.dirname(config.output), { recursive: true });
await sharp(out, { raw: { width: outWidth, height: rows * cellHeight, channels: 4 } })
  .png()
  .toFile(`${config.output}.png`);

const meta = {
  frameWidth: cellWidth,
  frameHeight: cellHeight,
  frameCount: cells.length,
  scale: Number(scale.toFixed(3)),
  animations,
  attacks,
};
await fs.writeFile(`${config.output}.json`, JSON.stringify(meta, null, 2));

console.log(
  `${configPath}: ${cells.length} frames, cell ${cellWidth}x${cellHeight}, scale ${meta.scale} → ${config.output}.{png,json}`,
);
