/**
 * Состояния бойца. Значения совпадают с суффиксами ключей анимаций
 * (для атак вместо 'attack' используется имя приёма — см. Fighter.animationKey).
 */
export const FighterState = Object.freeze({
  IDLE: 'idle',
  WALK_FORWARD: 'walkForward',
  WALK_BACK: 'walkBack',
  CROUCH: 'crouch',
  JUMP: 'jump',
  BLOCK: 'block',
  ATTACK: 'attack',
  HIT_STUN: 'hitStun',
  BLOCK_STUN: 'blockStun',
  KO: 'ko',
  VICTORY: 'victory',
});
