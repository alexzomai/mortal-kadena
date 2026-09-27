import { DEFAULT_MOVESET, withHitboxes } from '../fighters/moves.js';

// Ростер бойцов. Чтобы добавить персонажа — добавь запись: свои stats,
// свой moveset (или DEFAULT_MOVESET) и view.
//
// view.type:
//   'placeholder' — процедурный человечек (PlaceholderFighterView): { color, accentColor }
//   'sprite'      — спрайтлист (SpriteFighterView): { textureKey } — файлы
//                   public/assets/fighters/<textureKey>.{png,json}, собираются `npm run sprites:build`
//                   из разметки art/fighters/<textureKey>.json

const BASE_STATS = {
  maxHealth: 100,
  walkSpeed: 220, // px/s, шаг вперёд
  backSpeed: 170, // px/s, шаг назад
  jumpVelocity: 950, // px/s, начальная вертикальная скорость прыжка
  jumpForwardSpeed: 260, // px/s, горизонтальная скорость диагонального прыжка
  width: 60, // ширина тела (хёртбокс и «пушбокс»)
  height: 170, // рост стоя
  crouchHeight: 110, // рост в приседе
};

/**
 * Хитбоксы под спрайты MK3: замерены по активным кадрам собранных листов
 * (кулак/стопа + небольшой запас). Для человечков-плейсхолдеров — DEFAULT_MOVESET.
 */
const SPRITE_MOVESET = withHitboxes(DEFAULT_MOVESET, {
  punch: { x: 20, y: -166, w: 62, h: 26 },
  kick: { x: 20, y: -122, w: 66, h: 22 },
  lowPunch: { x: 20, y: -104, w: 58, h: 22 },
  sweep: { x: 10, y: -30, w: 60, h: 28 },
  airPunch: { x: 20, y: -166, w: 62, h: 26 },
  airKick: { x: 0, y: -36, w: 52, h: 36 },
});

export const FIGHTERS = {
  lyokha: {
    id: 'lyokha',
    name: 'ЛЁХА',
    stats: { ...BASE_STATS },
    moveset: SPRITE_MOVESET,
    view: { type: 'sprite', textureKey: 'lyokha' },
    // view: { type: 'placeholder', color: 0xc8373b, accentColor: 0xffd0c0 },
  },
  egor: {
    id: 'egor',
    name: 'ЕГОР',
    stats: { ...BASE_STATS },
    moveset: SPRITE_MOVESET,
    view: { type: 'sprite', textureKey: 'egor' },
    // view: { type: 'placeholder', color: 0x2f6fd6, accentColor: 0xc8e4ff },
  },
};

export const DEFAULT_FIGHTER_IDS = ['lyokha', 'egor'];
