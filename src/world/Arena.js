import Phaser from 'phaser';
import { GAME_HEIGHT, GROUND_Y, STAGE_WIDTH } from '../config/constants.js';

// Арена «Баня». Слои с разным scrollFactor по X дают параллакс при движении камеры.
// Позже каждый слой можно заменить картинкой: this.scene.add.image(...).setScrollFactor(...).

const PARALLAX = { wall: 0.5, benches: 0.8, floor: 1 };

const WOOD = {
  logLight: 0x8b5a2b,
  logDark: 0x7d4f25,
  logHighlight: 0xa8743d,
  gap: 0x3b230f,
  bench: 0xc99a5b, // липа
  benchShade: 0x9a6a38,
  post: 0x6e4520,
  floor: 0x5e3b1e,
  floorLine: 0x4a2e17,
};

export class Arena {
  constructor(scene, layer) {
    this.scene = scene;
    this.layer = layer;

    this.drawWall(this.graphics(PARALLAX.wall, 0));
    this.addSign();
    this.drawBenches(this.graphics(PARALLAX.benches, 1));
    this.drawStove(this.graphics(PARALLAX.benches, 1));
    this.addStoveFire();
    this.drawFloor(this.graphics(PARALLAX.floor, 2));
    this.drawTub(this.graphics(PARALLAX.floor, 3), STAGE_WIDTH - 170);
    this.addSteam();
  }

  graphics(scrollFactor, depth) {
    const g = this.scene.add.graphics().setScrollFactor(scrollFactor, 1).setDepth(depth);
    this.layer.add(g);
    return g;
  }

  // ---------------------------------------------------------------- стена (дальний план)

  drawWall(g) {
    const logHeight = 30;
    const left = -200;
    const width = STAGE_WIDTH + 400;

    for (let y = GROUND_Y - logHeight, i = 0; y > -300; y -= logHeight, i++) {
      g.fillStyle(i % 2 ? WOOD.logLight : WOOD.logDark, 1);
      g.fillRect(left, y, width, logHeight);
      g.fillStyle(WOOD.logHighlight, 0.6);
      g.fillRect(left, y + 4, width, 5);
      g.fillStyle(WOOD.gap, 1);
      g.fillRect(left, y + logHeight - 3, width, 3);
    }

    // Потолочная балка
    g.fillStyle(0x4a2c12, 1);
    g.fillRect(left, 30, width, 34);
    g.fillStyle(WOOD.gap, 1);
    g.fillRect(left, 64, width, 4);

    // Декор висит на уровне голов бойцов — выше его закрывает HUD.
    this.drawWindow(g, 300, 196);
    this.drawBroom(g, 470, 182);
    this.drawBroom(g, 820, 182);
    this.drawLamp(g, 1010, 196);
  }

  drawWindow(g, x, y) {
    const w = 110;
    const h = 80;
    g.fillStyle(0x3b230f, 1);
    g.fillRect(x - 8, y - 8, w + 16, h + 16);
    g.fillStyle(0xbfd3d6, 1); // запотевшее стекло
    g.fillRect(x, y, w, h);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(x + 30, y + 50, 26);
    g.fillCircle(x + 75, y + 30, 20);
    g.fillStyle(0x3b230f, 1);
    g.fillRect(x + w / 2 - 3, y, 6, h);
    g.fillRect(x, y + h / 2 - 3, w, 6);
  }

  /** Берёзовый веник на гвоздике. */
  drawBroom(g, x, y) {
    g.fillStyle(0x222222, 1);
    g.fillCircle(x, y, 3);
    g.lineStyle(2, 0x5b3a1a, 1);
    g.lineBetween(x, y, x, y + 14);
    g.fillStyle(0xd8c7a0, 1); // рукоять
    g.fillRect(x - 6, y + 14, 12, 34);
    g.fillStyle(0x7a3b1a, 1); // обвязка
    g.fillRect(x - 7, y + 40, 14, 5);
    const leaves = [
      [0, 62, 16, 0x4f7a2a],
      [-12, 76, 13, 0x5f8d33],
      [12, 76, 13, 0x4a7127],
      [-6, 92, 14, 0x6b9a3a],
      [8, 96, 12, 0x557f2d],
      [0, 110, 10, 0x4f7a2a],
    ];
    for (const [dx, dy, r, color] of leaves) {
      g.fillStyle(color, 1);
      g.fillCircle(x + dx, y + dy, r);
    }
  }

  drawLamp(g, x, y) {
    g.fillStyle(0xffd27a, 0.08);
    g.fillCircle(x, y + 30, 90);
    g.fillStyle(0xffd27a, 0.12);
    g.fillCircle(x, y + 30, 50);
    g.fillStyle(0x3b230f, 1);
    g.fillRect(x - 18, y, 36, 60);
    g.fillStyle(0xffe3a0, 1);
    g.fillRect(x - 12, y + 6, 24, 48);
    g.fillStyle(0x3b230f, 1);
    for (let i = 0; i < 3; i++) g.fillRect(x - 12 + i * 10, y + 6, 3, 48);
  }

  addSign() {
    const x = 640;
    const y = 222;
    const g = this.graphics(PARALLAX.wall, 0);
    g.fillStyle(0xb88650, 1);
    g.fillRoundedRect(x - 130, y - 22, 260, 44, 6);
    g.lineStyle(3, 0x5b3a1a, 1);
    g.strokeRoundedRect(x - 130, y - 22, 260, 44, 6);

    const text = this.scene.add
      .text(x, y, 'С ЛЁГКИМ ПАРОМ!', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#4a2410',
      })
      .setOrigin(0.5)
      .setScrollFactor(PARALLAX.wall, 1)
      .setDepth(0);
    this.layer.add(text);
  }

  // ---------------------------------------------------------------- полки и печь (средний план)

  drawBenches(g) {
    const from = 380;
    const to = STAGE_WIDTH - 60;
    this.drawBench(g, from, to, 345, 30); // верхний полок
    this.drawBench(g, from - 40, to, 410, 24); // нижний полок
  }

  drawBench(g, from, to, top, apronHeight) {
    const width = to - from;

    // Ножки
    g.fillStyle(WOOD.post, 1);
    for (let x = from + 20; x < to; x += 160) g.fillRect(x, top, 14, GROUND_Y - top);

    // Сиденье из досок
    g.fillStyle(WOOD.bench, 1);
    g.fillRect(from, top - 12, width, 12);
    g.fillStyle(0xe0b67a, 1);
    g.fillRect(from, top - 12, width, 3);

    // Фартук
    g.fillStyle(WOOD.benchShade, 1);
    g.fillRect(from, top, width, apronHeight);
    g.fillStyle(WOOD.gap, 0.5);
    for (let x = from; x < to; x += 22) g.fillRect(x, top, 2, apronHeight);
  }

  /** Печь-каменка с камнями и трубой. */
  drawStove(g) {
    const x = 110;
    const w = 190;
    const top = 300;

    // Труба
    g.fillStyle(0x3a3a3e, 1);
    g.fillRect(x + w / 2 - 14, -300, 28, top - 20 + 300);

    // Корпус
    g.fillStyle(0x2b2b2e, 1);
    g.fillRect(x, top, w, GROUND_Y - top);
    g.fillStyle(0x3f3f44, 1);
    g.fillRect(x, top, w, 8);
    g.fillStyle(0x55555c, 1);
    for (let ry = top + 20; ry < GROUND_Y; ry += 40) {
      g.fillCircle(x + 8, ry, 3);
      g.fillCircle(x + w - 8, ry, 3);
    }

    // Камни
    const stones = [
      [20, -8, 16], [48, -12, 18], [80, -10, 17], [112, -14, 19], [146, -9, 16], [172, -7, 13],
      [36, -26, 14], [66, -30, 16], [98, -32, 15], [130, -28, 15], [158, -22, 12],
      [82, -46, 13], [116, -44, 12],
    ];
    stones.forEach(([sx, sy, r], i) => {
      g.fillStyle(i % 3 === 0 ? 0x6d6a66 : i % 3 === 1 ? 0x85807a : 0x5a5752, 1);
      g.fillCircle(x + sx, top + sy, r);
    });

    // Дверца топки
    g.fillStyle(0x1a1a1c, 1);
    g.fillRect(x + 45, 385, 100, 60);
    this.fireRect = { x: x + 55, y: 395, w: 80, h: 42 };
  }

  addStoveFire() {
    const { x, y, w, h } = this.fireRect;
    const fire = this.scene.add
      .rectangle(x, y, w, h, 0xff7a1a)
      .setOrigin(0, 0)
      .setScrollFactor(PARALLAX.benches, 1)
      .setDepth(1);
    const glow = this.scene.add
      .ellipse(x + w / 2, y + h, w * 2.6, 70, 0xff9a3a, 0.18)
      .setScrollFactor(PARALLAX.benches, 1)
      .setDepth(1);
    this.layer.add([glow, fire]);

    this.scene.tweens.add({
      targets: [fire, glow],
      alpha: { from: 1, to: 0.7 },
      duration: 140,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ---------------------------------------------------------------- пол (передний план)

  drawFloor(g) {
    g.fillStyle(WOOD.floor, 1);
    g.fillRect(-200, GROUND_Y, STAGE_WIDTH + 400, GAME_HEIGHT - GROUND_Y + 100);

    // Доски пола «в перспективе»
    g.lineStyle(2, WOOD.floorLine, 1);
    const vanishX = STAGE_WIDTH / 2;
    for (let x = -1200; x < STAGE_WIDTH + 1200; x += 70) {
      g.lineBetween(vanishX + (x - vanishX) * 0.55, GROUND_Y, x, GAME_HEIGHT + 60);
    }

    // Плинтус
    g.fillStyle(0x3b230f, 1);
    g.fillRect(-200, GROUND_Y - 4, STAGE_WIDTH + 400, 6);
  }

  /** Деревянная шайка с ковшом. */
  drawTub(g, x, ground = GROUND_Y) {
    // Ковш
    g.lineStyle(5, 0x8a5a2b, 1);
    g.lineBetween(x + 10, ground - 44, x + 46, ground - 78);
    // Шайка
    g.fillStyle(0xa8743d, 1);
    g.fillRect(x - 40, ground - 44, 80, 44);
    g.fillStyle(WOOD.gap, 0.5);
    for (let sx = x - 40; sx < x + 40; sx += 13) g.fillRect(sx, ground - 44, 2, 44);
    g.fillStyle(0x555555, 1);
    g.fillRect(x - 42, ground - 36, 84, 5);
    g.fillRect(x - 42, ground - 12, 84, 5);
    g.fillStyle(0x7fb2c9, 1); // вода
    g.fillRect(x - 36, ground - 44, 72, 5);
  }

  // ---------------------------------------------------------------- пар

  addSteam() {
    const rnd = Phaser.Math.Between;
    for (let i = 0; i < 18; i++) {
      // Часть пара — за бойцами, часть — перед ними
      const inFront = i % 3 === 0;
      const puff = this.scene.add
        .ellipse(rnd(0, STAGE_WIDTH), rnd(200, GROUND_Y), rnd(90, 180), rnd(50, 90), 0xffffff, 1)
        .setAlpha(0)
        .setDepth(inFront ? 20 : 4);
      this.layer.add(puff);

      const maxAlpha = inFront ? 0.08 : 0.2;
      this.scene.tweens.add({
        targets: puff,
        y: '-=160',
        scale: { from: 0.7, to: 1.4 },
        duration: rnd(4000, 7000),
        delay: rnd(0, 4000),
        repeat: -1,
        onRepeat: () => (puff.x = rnd(0, STAGE_WIDTH)),
        // Пар проявляется и тает: альфа растёт до середины, затем уходит в 0
        onUpdate: (tween) => puff.setAlpha(maxAlpha * Math.sin(Math.PI * tween.progress)),
      });
    }
  }
}
