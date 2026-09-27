// Разбор «рваных» спрайтлистов (рипы с однотонным фоном, кадры разного размера).
//
// Кадры ищутся так:
//   1. пиксель считается пустым, если близок к цвету фона (берётся из угла листа);
//   2. лист режется на горизонтальные полосы (строки) по пустым строкам пикселей;
//   3. каждая полоса режется на кадры по пустым столбцам.
// Кадр получает id вида "3.5" — пятый кадр третьей строки (нумерация с 1).

import sharp from 'sharp';

/** Порог «похожести» на фон (квадрат расстояния в RGB). */
const BG_DISTANCE_SQ = 60 * 60;
/** Щели меньше этого не разделяют строки/кадры (артефакты сжатия, оторванные пиксели). */
const MIN_ROW_GAP = 3;
const MIN_COL_GAP = 2;
/** Кадры меньше этого — мусор (точки, обрывки эффектов). */
const MIN_FRAME_SIZE = 6;

export async function loadSheet(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const bg = [data[0], data[1], data[2]];

  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const dr = data[i * 4] - bg[0];
    const dg = data[i * 4 + 1] - bg[1];
    const db = data[i * 4 + 2] - bg[2];
    mask[i] = dr * dr + dg * dg + db * db > BG_DISTANCE_SQ ? 1 : 0;
  }
  return { path, width, height, data, mask, bg };
}

/** Непрерывные участки, где predicate(i) истинно; щели короче minGap склеиваются. */
function runs(length, predicate, minGap) {
  const result = [];
  let start = -1;
  let lastFilled = -1;
  for (let i = 0; i < length; i++) {
    if (!predicate(i)) continue;
    if (start === -1) start = i;
    else if (i - lastFilled > minGap) {
      result.push([start, lastFilled]);
      start = i;
    }
    lastFilled = i;
  }
  if (start !== -1) result.push([start, lastFilled]);
  return result;
}

export function detectFrames(sheet) {
  const { width, height, mask } = sheet;
  const rowFilled = (y) => {
    for (let x = 0; x < width; x++) if (mask[y * width + x]) return true;
    return false;
  };

  const frames = [];
  runs(height, rowFilled, MIN_ROW_GAP).forEach(([top, bottom], bandIndex) => {
    const colFilled = (x) => {
      for (let y = top; y <= bottom; y++) if (mask[y * width + x]) return true;
      return false;
    };
    let frameIndex = 0;
    for (const [left, right] of runs(width, colFilled, MIN_COL_GAP)) {
      // Точные вертикальные границы кадра внутри полосы
      let y0 = bottom;
      let y1 = top;
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          if (mask[y * width + x]) {
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            break;
          }
        }
      }
      const w = right - left + 1;
      const h = y1 - y0 + 1;
      if (w < MIN_FRAME_SIZE || h < MIN_FRAME_SIZE) continue;
      frameIndex++;
      frames.push({ id: `${bandIndex + 1}.${frameIndex}`, band: bandIndex + 1, x: left, y: y0, w, h, bandTop: top, bandBottom: bottom });
    }
  });
  return frames;
}

/**
 * Точка опоры кадра — «между ступнями»: среднее X непрозрачных пикселей в нижних
 * footRows строках кадра, Y — нижняя граница. Для кадров в воздухе годится так же.
 */
export function findAnchor(sheet, frame, footRows = 10) {
  const { width, mask } = sheet;
  let sum = 0;
  let count = 0;
  const bottom = frame.y + frame.h - 1;
  for (let y = bottom; y > bottom - footRows && y >= frame.y; y--) {
    for (let x = frame.x; x < frame.x + frame.w; x++) {
      if (mask[y * width + x]) {
        sum += x;
        count++;
      }
    }
  }
  return { x: count ? Math.round(sum / count) : frame.x + Math.round(frame.w / 2), y: bottom };
}
