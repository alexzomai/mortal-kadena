import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';
import { KEYBOARD_BINDINGS, formatBinding } from '../config/controls.js';

const CONTROL_ROWS = [
  ['Движение', (b) => `${formatBinding(b.left)} ${formatBinding(b.right)}`],
  ['Прыжок', (b) => formatBinding(b.up)],
  ['Присед', (b) => formatBinding(b.down)],
  ['Рука', (b) => formatBinding(b.punch)],
  ['Нога', (b) => formatBinding(b.kick)],
  ['Блок', (b) => formatBinding(b.block)],
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 90, 'MORTAL KADENA', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '72px',
        color: '#ffd23f',
        stroke: '#6b0000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.drawControls(cx - 220, 190, 'ИГРОК 1', KEYBOARD_BINDINGS.player1);
    this.drawControls(cx + 220, 190, 'ИГРОК 2', KEYBOARD_BINDINGS.player2);

    this.add
      .text(cx, 420, 'Присед + удар — нижние атаки, удар в прыжке — воздушные.\n` (ё) — показать хитбоксы', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#bbbbbb',
        align: 'center',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, 485, 'ENTER — В БОЙ', { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('FightScene', {}));
  }

  drawControls(x, y, title, bindings) {
    this.add.text(x, y, title, { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '26px', color: '#ffffff' }).setOrigin(0.5, 0);
    const lines = CONTROL_ROWS.map(([label, format]) => `${label.padEnd(9)} ${format(bindings)}`);
    this.add
      .text(x, y + 40, lines.join('\n'), { fontFamily: 'monospace', fontSize: '17px', color: '#dddddd', lineSpacing: 6 })
      .setOrigin(0.5, 0);
  }
}
