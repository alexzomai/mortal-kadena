/** Обратный отсчёт раунда. Отображением занимается HUD. */
export class RoundTimer {
  constructor(seconds) {
    this.remainingMs = seconds * 1000;
    this.running = false;
  }

  start() {
    this.running = true;
  }

  stop() {
    this.running = false;
  }

  update(deltaMs) {
    if (this.running) this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
  }

  get isExpired() {
    return this.remainingMs <= 0;
  }

  get secondsLeft() {
    return Math.ceil(this.remainingMs / 1000);
  }
}
