import { GAME_WIDTH } from '../config/constants.js';
import { HealthBar } from './HealthBar.js';

const MARGIN = 30;
const BAR_WIDTH = 370;
const BAR_Y = 22;
const DEPTH = 50;

/** Верхняя панель: здоровье, имена, таймер, выигранные раунды. */
export class HUD {
  constructor(scene, layer, { names, wins, roundsToWin }) {
    this.scene = scene;
    this.layer = layer;
    const p2BarX = GAME_WIDTH - MARGIN - BAR_WIDTH;
    const nameStyle = { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '20px', color: '#ffffff' };

    this.healthBars = [
      new HealthBar(scene, layer, { x: MARGIN, y: BAR_Y, width: BAR_WIDTH, align: 'left' }),
      new HealthBar(scene, layer, { x: p2BarX, y: BAR_Y, width: BAR_WIDTH, align: 'right' }),
    ];

    layer.add([
      scene.add.text(MARGIN, BAR_Y + 30, names[0], nameStyle).setDepth(DEPTH),
      scene.add.text(GAME_WIDTH - MARGIN, BAR_Y + 30, names[1], nameStyle).setOrigin(1, 0).setDepth(DEPTH),
    ]);

    this.timerText = scene.add
      .text(GAME_WIDTH / 2, BAR_Y + 12, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '40px',
        color: '#ffd23f',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH);
    layer.add(this.timerText);

    // Кружки выигранных раундов — у внутреннего края полосок
    for (let i = 0; i < roundsToWin; i++) {
      this.drawWinMarker(MARGIN + BAR_WIDTH - 8 - i * 20, BAR_Y + 42, i < wins[0]);
      this.drawWinMarker(p2BarX + 8 + i * 20, BAR_Y + 42, i < wins[1]);
    }
  }

  drawWinMarker(x, y, filled) {
    const marker = this.scene.add
      .circle(x, y, 7, filled ? 0xffd23f : 0x000000, filled ? 1 : 0.5)
      .setStrokeStyle(2, 0xffd23f)
      .setDepth(DEPTH);
    this.layer.add(marker);
  }

  setHealth(playerIndex, ratio) {
    this.healthBars[playerIndex].setRatio(ratio);
  }

  setTime(seconds) {
    const text = String(seconds).padStart(2, '0');
    if (this.timerText.text !== text) this.timerText.setText(text);
  }
}
