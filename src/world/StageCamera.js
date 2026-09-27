import { CAMERA, GAME_HEIGHT, GAME_WIDTH, GROUND_Y, STAGE_WIDTH } from '../config/constants.js';

/**
 * Камера боя в духе классических MK:
 *  - приближена (zoom) и плавно следует за серединой между бойцами;
 *  - бойцы не могут разойтись шире экрана — отступающий упирается в край кадра;
 *  - в прыжке камера немного поднимается, чтобы голова не уходила под HUD.
 */
export class StageCamera {
  constructor(camera) {
    this.camera = camera;
    this.viewWidth = GAME_WIDTH / CAMERA.zoom;
    this.viewHeight = GAME_HEIGHT / CAMERA.zoom;
    /** Верх кадра, когда оба бойца на земле. */
    this.baseTop = GROUND_Y - this.viewHeight * CAMERA.groundScreenRatio;
    this.center = null;

    camera.setZoom(CAMERA.zoom);
    camera.setBounds(0, this.baseTop - CAMERA.maxRise, STAGE_WIDTH, this.viewHeight + CAMERA.maxRise);
  }

  /** Ограничивает расстояние между бойцами шириной кадра. Вызывать после физики и расталкивания. */
  constrainFighters([a, b]) {
    const maxDistance = this.viewWidth - CAMERA.edgeMargin * 2 - (a.stats.width + b.stats.width) / 2;
    const excess = Math.abs(b.x - a.x) - maxDistance;
    if (excess <= 0) return;

    const dir = Math.sign(b.x - a.x); // куда смотреть от a, чтобы увидеть b
    const aRetreating = Math.sign(a.vx) === -dir;
    const bRetreating = Math.sign(b.vx) === dir;

    // Двигаем того, кто уходит; если оба (или никто) — поровну.
    if (aRetreating && !bRetreating) a.x += dir * excess;
    else if (bRetreating && !aRetreating) b.x -= dir * excess;
    else {
      a.x += (dir * excess) / 2;
      b.x -= (dir * excess) / 2;
    }
  }

  /** @param snap — встать сразу в целевую точку (начало раунда) */
  update(fighters, dt, snap = false) {
    const [a, b] = fighters;
    const targetX = (a.x + b.x) / 2;
    const highestHead = Math.min(...fighters.map((f) => f.getHurtbox().y));
    const top = Math.min(this.baseTop, highestHead - CAMERA.headroom);
    const targetY = top + this.viewHeight / 2;

    if (!this.center || snap) {
      this.center = { x: targetX, y: targetY };
    } else {
      this.center.x += (targetX - this.center.x) * (1 - Math.exp(-CAMERA.followSpeedX * dt));
      this.center.y += (targetY - this.center.y) * (1 - Math.exp(-CAMERA.followSpeedY * dt));
    }

    this.camera.centerOn(this.center.x, this.center.y);
  }
}
