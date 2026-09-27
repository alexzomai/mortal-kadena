import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants.js';

/** Крупные надписи по центру экрана: «ROUND 1», «FIGHT!», «K.O.» и т.д. */
export class Announcer {
  constructor(scene, layer) {
    this.scene = scene;
    this.layer = layer;
    this.current = null;
  }

  /**
   * @param text      что показать
   * @param duration  сколько держать на экране, мс (0 — пока не заменят)
   */
  show(text, { duration = 1000, color = '#ffd23f', fontSize = 80 } = {}) {
    this.clear();

    const label = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, text, {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color,
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScale(1.6)
      .setAlpha(0);
    this.layer.add(label);

    this.scene.tweens.add({ targets: label, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    if (duration > 0) {
      this.scene.tweens.add({ targets: label, alpha: 0, delay: duration, duration: 200, onComplete: () => label.destroy() });
    }
    this.current = label;
  }

  clear() {
    if (!this.current) return;
    this.scene.tweens.killTweensOf(this.current);
    this.current.destroy();
    this.current = null;
  }
}
