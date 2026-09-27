import Phaser from 'phaser';
import { FIGHTERS } from '../config/fighters.js';

const FIGHTER_ASSETS_PATH = 'assets/fighters';

/**
 * Загрузка ресурсов.
 *
 * Для бойцов с view.type === 'sprite' грузятся файлы, собранные
 * `npm run sprites:build` (см. tools/sprites/build.mjs):
 *   <textureKey>.json — размер ячейки, масштаб, анимации и кадры атак;
 *   <textureKey>.png  — сетка кадров.
 * Анимации регистрируются с ключами `<textureKey>:<animationKey>`.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Фаза 1: метаданные (размер ячейки нужен, чтобы нарезать PNG).
    for (const textureKey of spriteTextureKeys()) {
      this.load.json(textureKey, `${FIGHTER_ASSETS_PATH}/${textureKey}.json`);
    }
  }

  create() {
    // Фаза 2: сами листы, затем анимации.
    for (const textureKey of spriteTextureKeys()) {
      const meta = this.cache.json.get(textureKey);
      this.load.spritesheet(textureKey, `${FIGHTER_ASSETS_PATH}/${textureKey}.png`, {
        frameWidth: meta.frameWidth,
        frameHeight: meta.frameHeight,
      });
    }
    this.load.once('complete', () => {
      this.createFighterAnimations();
      this.scene.start('TitleScene');
    });
    this.load.start();
  }

  createFighterAnimations() {
    for (const textureKey of spriteTextureKeys()) {
      const meta = this.cache.json.get(textureKey);
      for (const [name, anim] of Object.entries(meta.animations)) {
        this.anims.create({
          key: `${textureKey}:${name}`,
          frames: anim.frames.map((frame) => ({ key: textureKey, frame })),
          frameRate: anim.fps,
          repeat: anim.loop ? -1 : 0,
        });
      }
    }
  }
}

function spriteTextureKeys() {
  const keys = Object.values(FIGHTERS)
    .filter((f) => f.view?.type === 'sprite')
    .map((f) => f.view.textureKey);
  return [...new Set(keys)];
}
