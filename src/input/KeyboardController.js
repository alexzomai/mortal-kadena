import Phaser from 'phaser';
import { ACTIONS, InputController } from './InputController.js';

/** Ввод с клавиатуры по раскладке из config/controls.js. */
export class KeyboardController extends InputController {
  constructor(scene, bindings) {
    super();
    const { KeyCodes } = Phaser.Input.Keyboard;

    this.keys = {};
    for (const action of ACTIONS) {
      this.keys[action] = (bindings[action] ?? []).map((name) => {
        const code = KeyCodes[name];
        if (code === undefined) throw new Error(`Unknown key "${name}" for action "${action}"`);
        return scene.input.keyboard.addKey(code);
      });
    }
    this.reset();
  }

  readRaw() {
    const snapshot = {};
    for (const action of ACTIONS) {
      snapshot[action] = this.keys[action].some((key) => key.isDown);
    }
    return snapshot;
  }
}
