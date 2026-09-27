import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants.js';

const HEADLINE_FONT = 'Impact, "Arial Black", sans-serif';

/** Экран итогов матча: победитель/проигравший, счёт, реванш или меню. */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { winnerIndex, winnerName, wins, fighterIds } = this.result;
    const cx = GAME_WIDTH / 2;

    const headline = winnerIndex === null ? 'DRAW' : `PLAYER ${winnerIndex + 1} WINS`;
    this.add
      .text(cx, 150, headline, { fontFamily: HEADLINE_FONT, fontSize: '80px', color: '#ffd23f', stroke: '#6b0000', strokeThickness: 10 })
      .setOrigin(0.5);

    if (winnerName) {
      this.add.text(cx, 230, winnerName, { fontFamily: HEADLINE_FONT, fontSize: '34px', color: '#ffffff' }).setOrigin(0.5);

      const loserIndex = 1 - winnerIndex;
      this.add
        .text(cx, 275, `PLAYER ${loserIndex + 1} — DEFEATED`, { fontFamily: HEADLINE_FONT, fontSize: '22px', color: '#b3261e' })
        .setOrigin(0.5);
    }

    this.add
      .text(cx, 330, `${wins[0]} : ${wins[1]}`, { fontFamily: HEADLINE_FONT, fontSize: '48px', color: '#ffffff' })
      .setOrigin(0.5);

    this.add
      .text(cx, 440, 'ENTER — реванш     ESC — главное меню', { fontFamily: 'monospace', fontSize: '20px', color: '#dddddd' })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('FightScene', { fighterIds }));
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
