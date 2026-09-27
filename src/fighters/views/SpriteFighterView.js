import { FighterState as S } from '../FighterState.js';
import { GROUND_Y } from '../../config/constants.js';

const HIT_FLASH_MS = 90;

/** Состояния, при повторном входе в которые анимация начинается заново. */
const RESTART_ON_REENTER = new Set([S.HIT_STUN, S.KO]);

/**
 * Вид бойца на spritesheet, собранном tools/sprites/build.mjs.
 *
 * - Обычные состояния — Phaser-анимации `${textureKey}:${animationKey}` (создаются в BootScene).
 * - Атаки кадрами не «проигрываются», а выбираются по фазе удара (startup/active/recovery),
 *   поэтому картинка всегда совпадает с активным хитбоксом, как бы ни менялись тайминги в moves.js.
 *
 * Спрайт рисуется «от ступней» (origin 0.5, 1) и смотрит вправо; влево — через flipX.
 */
export class SpriteFighterView {
  constructor(scene, fighter, { textureKey }, layer) {
    this.scene = scene;
    this.fighter = fighter;
    this.textureKey = textureKey;
    this.meta = scene.cache.json.get(textureKey);
    this.playedSerial = -1;
    this.playedKey = null;

    this.shadow = scene.add.ellipse(fighter.x, GROUND_Y, 80, 12, 0x000000, 0.4).setDepth(5);
    this.sprite = scene.add
      .sprite(fighter.x, fighter.y, textureKey, 0)
      .setOrigin(0.5, 1)
      .setScale(this.meta.scale)
      .setDepth(10);
    layer.add([this.shadow, this.sprite]);
  }

  update() {
    const f = this.fighter;
    const lift = GROUND_Y - f.y;
    this.shadow.setPosition(f.x, GROUND_Y).setScale(Math.max(0.4, 1 - lift / 300));

    this.sprite.setPosition(f.x, f.y);
    this.sprite.setFlipX(f.facing < 0);

    if (f.state === S.ATTACK) {
      this.showAttackFrame();
    } else if (f.stateSerial !== this.playedSerial) {
      this.playState();
    }
    this.playedSerial = f.stateSerial;

    if (f.state === S.HIT_STUN && f.stateTime < HIT_FLASH_MS) {
      this.sprite.setTintFill(0xffffff);
    } else {
      this.sprite.clearTint();
    }
  }

  playState() {
    const f = this.fighter;
    const key = f.animationKey;
    // Блок → «залипание» в блоке и т.п. не должны дёргать анимацию с начала
    if (key === this.playedKey && !RESTART_ON_REENTER.has(f.state)) return;

    const animKey = `${this.textureKey}:${key}`;
    if (!this.scene.anims.exists(animKey)) return;
    this.sprite.play(animKey);
    this.playedKey = key;
  }

  showAttackFrame() {
    const f = this.fighter;
    const move = f.currentMove;
    const frames = this.meta.attacks[move.name];
    if (!frames) return;

    const phase = f.attackPhase;
    let phaseStart = 0;
    let phaseLength = move.startup;
    if (phase === 'active') {
      phaseStart = move.startup;
      phaseLength = move.active;
    } else if (phase === 'recovery') {
      phaseStart = move.startup + move.active;
      phaseLength = move.recovery;
    }

    const list = frames[phase];
    const progress = Math.min(Math.max((f.stateTime - phaseStart) / phaseLength, 0), 0.999);
    this.sprite.stop();
    this.sprite.setFrame(list[Math.floor(progress * list.length)]);
    this.playedKey = move.name;
  }

  destroy() {
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
