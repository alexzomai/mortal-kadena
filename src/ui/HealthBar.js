const COLORS = {
  frame: 0xffffff,
  background: 0x1a1a1a,
  lag: 0xb3261e, // «догоняющий» след потерянного здоровья
  healthy: 0x3ecf4a,
  warning: 0xf2c230,
  critical: 0xe8542a,
};

/**
 * Полоска здоровья. align: 'left' — убывает к левому краю (игрок 1),
 * 'right' — к правому (игрок 2), как в классических файтингах.
 */
export class HealthBar {
  constructor(scene, layer, { x, y, width, height = 24, align = 'left' }) {
    this.scene = scene;
    this.ratio = 1;

    const originX = align === 'left' ? 0 : 1;
    const anchorX = align === 'left' ? x : x + width;

    this.background = scene.add.rectangle(x, y, width, height, COLORS.background).setOrigin(0, 0).setStrokeStyle(2, COLORS.frame);
    this.lag = scene.add.rectangle(anchorX, y, width, height, COLORS.lag).setOrigin(originX, 0);
    this.fill = scene.add.rectangle(anchorX, y, width, height, COLORS.healthy).setOrigin(originX, 0);
    layer.add([this.background, this.lag, this.fill]);
  }

  /** @param ratio 0..1 */
  setRatio(ratio) {
    ratio = Math.min(Math.max(ratio, 0), 1);
    if (ratio === this.ratio) return;
    this.ratio = ratio;

    this.fill.setScale(ratio, 1);
    this.fill.fillColor = ratio > 0.5 ? COLORS.healthy : ratio > 0.25 ? COLORS.warning : COLORS.critical;

    this.scene.tweens.killTweensOf(this.lag);
    this.scene.tweens.add({ targets: this.lag, scaleX: ratio, duration: 400, delay: 250, ease: 'Quad.easeOut' });
  }
}
