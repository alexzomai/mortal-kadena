/** Абстрактные действия, которыми оперирует боец. Он не знает про конкретные клавиши. */
export const ACTIONS = Object.freeze(['left', 'right', 'up', 'down', 'punch', 'kick', 'block']);

const emptySnapshot = () => Object.fromEntries(ACTIONS.map((action) => [action, false]));

/**
 * Базовый источник ввода. Наследник реализует только readRaw() —
 * так клавиатура, геймпад (Gamepad API) или AI подключаются одинаково.
 *
 * Вызывай update() ровно один раз за кадр, до обновления бойцов.
 */
export class InputController {
  constructor() {
    this.current = emptySnapshot();
    this.previous = emptySnapshot();
  }

  /** @returns {Record<string, boolean>} какие действия зажаты в данный момент */
  readRaw() {
    throw new Error(`${this.constructor.name}.readRaw() is not implemented`);
  }

  update() {
    this.previous = this.current;
    this.current = this.readRaw();
  }

  isDown(action) {
    return this.current[action];
  }

  /** true только в кадр нажатия. */
  justPressed(action) {
    return this.current[action] && !this.previous[action];
  }

  /** Синхронизирует состояние, чтобы уже зажатые кнопки не считались «нажатыми». */
  reset() {
    this.current = this.readRaw();
    this.previous = { ...this.current };
  }
}
