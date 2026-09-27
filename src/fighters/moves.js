/**
 * Описание приёмов (frame data). Все времена — в миллисекундах.
 *
 *   name        — идентификатор, он же ключ анимации
 *   startup     — замах: хитбокса ещё нет
 *   active      — хитбокс активен
 *   recovery    — возврат в стойку, боец уязвим
 *   damage      — урон при попадании
 *   hitbox      — прямоугольник удара относительно точки «между ступнями»:
 *                 x — от центра бойца до ближнего края хитбокса (вперёд, по направлению взгляда)
 *                 y — верхний край относительно пола (отрицательный = выше)
 *   knockback   — скорость отбрасывания противника, px/s (y > 0 — подбрасывает вверх)
 *   hitStun     — сколько противник оглушён после попадания
 *   blockStun   — сколько противник «залипает» в блоке
 *
 * Moveset сгруппирован по стойке, в которой нажата кнопка: stand / crouch / air.
 */
export const DEFAULT_MOVESET = {
  stand: {
    punch: {
      name: 'punch',
      startup: 70,
      active: 80,
      recovery: 150,
      damage: 5,
      hitbox: { x: 20, y: -150, w: 65, h: 24 },
      knockback: { x: 180, y: 0 },
      hitStun: 260,
      blockStun: 150,
    },
    kick: {
      name: 'kick',
      startup: 120,
      active: 90,
      recovery: 250,
      damage: 9,
      hitbox: { x: 20, y: -105, w: 85, h: 28 },
      knockback: { x: 320, y: 0 },
      hitStun: 340,
      blockStun: 200,
    },
  },
  crouch: {
    punch: {
      name: 'lowPunch',
      startup: 60,
      active: 70,
      recovery: 140,
      damage: 4,
      hitbox: { x: 20, y: -85, w: 60, h: 22 },
      knockback: { x: 140, y: 0 },
      hitStun: 220,
      blockStun: 130,
    },
    kick: {
      name: 'sweep',
      startup: 110,
      active: 90,
      recovery: 320,
      damage: 8,
      hitbox: { x: 20, y: -28, w: 95, h: 24 },
      knockback: { x: 200, y: 450 },
      hitStun: 500,
      blockStun: 200,
    },
  },
  air: {
    punch: {
      name: 'airPunch',
      startup: 50,
      active: 200,
      recovery: 100,
      damage: 6,
      hitbox: { x: 10, y: -125, w: 60, h: 26 },
      knockback: { x: 220, y: 0 },
      hitStun: 280,
      blockStun: 160,
    },
    kick: {
      name: 'airKick',
      startup: 80,
      active: 250,
      recovery: 100,
      damage: 10,
      hitbox: { x: 10, y: -80, w: 80, h: 30 },
      knockback: { x: 350, y: 250 },
      hitStun: 420,
      blockStun: 220,
    },
  },
};

/**
 * Копия moveset с другими хитбоксами (тайминги и урон — прежние).
 * @param overrides { [moveName]: hitbox }, например { punch: { x, y, w, h } }
 */
export function withHitboxes(moveset, overrides) {
  const result = {};
  for (const [stance, moves] of Object.entries(moveset)) {
    result[stance] = {};
    for (const [button, move] of Object.entries(moves)) {
      const hitbox = overrides[move.name];
      result[stance][button] = hitbox ? { ...move, hitbox } : move;
    }
  }
  return result;
}
