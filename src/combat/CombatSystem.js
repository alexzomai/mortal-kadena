import { intersectionCenter, rectsOverlap } from './geometry.js';

/** Доля отбрасывания, передаваемая атакующему, если противник прижат к стене. */
const WALL_PUSHBACK_RATIO = 0.5;

/**
 * Взаимодействие двух бойцов: расталкивание тел и проверка попаданий.
 * Вызывается после Fighter.update() обоих бойцов.
 */
export class CombatSystem {
  constructor(fighters) {
    this.fighters = fighters;
  }

  /** @returns {Array} события попаданий этого кадра (для эффектов в сцене) */
  update() {
    const [a, b] = this.fighters;
    this.separate(a, b);

    // Сначала находим оба попадания, потом применяем — так одновременные удары «размениваются».
    const hits = [this.detectHit(a, b), this.detectHit(b, a)].filter(Boolean);
    return hits.map((hit) => this.applyHit(hit));
  }

  detectHit(attacker, defender) {
    if (!defender.isAlive) return null;
    const hitbox = attacker.getActiveHitbox();
    if (!hitbox) return null;
    const hurtbox = defender.getHurtbox();
    if (!rectsOverlap(hitbox, hurtbox)) return null;

    return {
      attacker,
      defender,
      move: attacker.currentMove,
      point: intersectionCenter(hitbox, hurtbox),
    };
  }

  applyHit(hit) {
    const { attacker, defender, move } = hit;
    attacker.moveHasHit = true;

    const direction = Math.sign(defender.x - attacker.x) || attacker.facing;
    const result = defender.takeHit(move, direction);

    // Противнику некуда отлетать — отталкиваем атакующего, чтобы не было бесконечного прижима.
    if (defender.isAgainstWall && attacker.isGrounded) {
      attacker.vx = -direction * move.knockback.x * WALL_PUSHBACK_RATIO;
    }

    return { ...hit, ...result };
  }

  /** Не даёт телам бойцов пересекаться («пушбоксы»). */
  separate(a, b) {
    const minDistance = (a.stats.width + b.stats.width) / 2;
    const hurtA = a.getHurtbox();
    const hurtB = b.getHurtbox();
    const verticalOverlap = hurtA.y < hurtB.y + hurtB.h && hurtB.y < hurtA.y + hurtA.h;
    if (!verticalOverlap || Math.abs(b.x - a.x) >= minDistance) return;

    const dir = Math.sign(b.x - a.x) || a.facing;
    const overlap = minDistance - Math.abs(b.x - a.x);
    a.x -= (dir * overlap) / 2;
    b.x += (dir * overlap) / 2;
    a.clampToArena();
    b.clampToArena();

    // Если один упёрся в стену — второго отодвигаем целиком.
    if (Math.abs(b.x - a.x) < minDistance) {
      if (a.isAgainstWall) b.x = a.x + dir * minDistance;
      else a.x = b.x - dir * minDistance;
      a.clampToArena();
      b.clampToArena();
    }
  }
}
