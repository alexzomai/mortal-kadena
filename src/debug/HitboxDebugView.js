/**
 * Отладочная отрисовка: хёртбоксы (зелёные), хитбоксы атак (красные — активные,
 * контур — замах/возврат), точка позиции бойца.
 */
export class HitboxDebugView {
  constructor(scene, layer, fighters, enabled = false) {
    this.fighters = fighters;
    this.enabled = enabled;
    this.gfx = scene.add.graphics().setDepth(90);
    layer.add(this.gfx);
  }

  toggle() {
    this.enabled = !this.enabled;
    this.gfx.clear();
    return this.enabled;
  }

  update() {
    if (!this.enabled) return;
    const g = this.gfx;
    g.clear();

    for (const f of this.fighters) {
      const hurt = f.getHurtbox();
      g.lineStyle(2, 0x00ff66, 1);
      g.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);

      const attack = f.getAttackRect();
      if (attack) {
        if (f.getActiveHitbox()) {
          g.fillStyle(0xff0033, 0.45);
          g.fillRect(attack.x, attack.y, attack.w, attack.h);
        }
        g.lineStyle(1, 0xff0033, 1);
        g.strokeRect(attack.x, attack.y, attack.w, attack.h);
      }

      g.fillStyle(0xffff00, 1);
      g.fillCircle(f.x, f.y, 3);
    }
  }
}
