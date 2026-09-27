import { FighterState as S } from './FighterState.js';
import { ARENA_BOUNDS, GRAVITY, GROUND_Y } from '../config/constants.js';

/** Замедление (px/s²) при скольжении по полу после удара или блока. */
const GROUND_FRICTION = 1800;
/** Какая доля отбрасывания применяется, если удар заблокирован. */
const BLOCK_PUSHBACK_RATIO = 0.5;
/** Минимальный подброс при нокауте, px/s. */
const KO_LAUNCH_VELOCITY = 550;

/** Состояния, в которых боец свободно реагирует на ввод. */
const FREE_STATES = new Set([S.IDLE, S.WALK_FORWARD, S.WALK_BACK, S.CROUCH, S.JUMP, S.BLOCK]);

const moveDuration = (move) => move.startup + move.active + move.recovery;
const approachZero = (value, amount) => Math.sign(value) * Math.max(0, Math.abs(value) - amount);

/**
 * Логика бойца: конечный автомат состояний, физика, хитбоксы, здоровье.
 *
 * Ничего не рисует и не знает о Phaser: отображением занимается FighterView,
 * который каждый кадр читает публичные поля (x, y, facing, state, animationKey...).
 *
 * Система координат: (x, y) — точка между ступнями, y растёт вниз, пол = GROUND_Y.
 */
export class Fighter {
  constructor({ definition, x, facing, controller }) {
    this.definition = definition;
    this.name = definition.name;
    this.stats = definition.stats;
    this.moveset = definition.moveset;
    this.controller = controller;

    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    /** 1 — смотрит вправо, -1 — влево. */
    this.facing = facing;
    this.health = this.stats.maxHealth;

    this.state = S.IDLE;
    /** Время в текущем состоянии, мс. */
    this.stateTime = 0;
    /** Растёт при каждом входе в состояние — вид по нему перезапускает анимацию. */
    this.stateSerial = 0;

    this.currentMove = null;
    this.moveHasHit = false;
    this.airAttackUsed = false;
    this.stunDuration = 0;
    this.lowBlock = false;

    /** Сцена включает ввод только во время боя. */
    this.inputEnabled = false;
    /** Выставляется победителю раунда: примет победную позу, как только сможет. */
    this.celebrating = false;
  }

  // ---------------------------------------------------------------- геттеры

  get isAlive() {
    return this.health > 0;
  }

  get healthRatio() {
    return this.health / this.stats.maxHealth;
  }

  get isGrounded() {
    return this.y >= GROUND_Y && this.vy >= 0;
  }

  get isBlocking() {
    return this.state === S.BLOCK || this.state === S.BLOCK_STUN;
  }

  get isCrouching() {
    switch (this.state) {
      case S.CROUCH:
        return true;
      case S.BLOCK:
      case S.BLOCK_STUN:
        return this.lowBlock;
      case S.ATTACK:
        return this.currentMove.stance === 'crouch';
      default:
        return false;
    }
  }

  get isAgainstWall() {
    const half = this.stats.width / 2;
    return this.x <= ARENA_BOUNDS.left + half + 1 || this.x >= ARENA_BOUNDS.right - half - 1;
  }

  /** 'startup' | 'active' | 'recovery' | null */
  get attackPhase() {
    const move = this.currentMove;
    if (!move) return null;
    if (this.stateTime < move.startup) return 'startup';
    if (this.stateTime < move.startup + move.active) return 'active';
    return 'recovery';
  }

  /**
   * Ключ анимации для вида: имя приёма во время атаки, варианты прыжка и блока,
   * иначе имя состояния.
   */
  get animationKey() {
    switch (this.state) {
      case S.ATTACK:
        return this.currentMove.name;
      case S.JUMP:
        if (this.vx === 0) return 'jump';
        return Math.sign(this.vx) === this.facing ? 'jumpForward' : 'jumpBack';
      case S.BLOCK:
      case S.BLOCK_STUN:
        return this.lowBlock ? 'crouchBlock' : 'block';
      default:
        return this.state;
    }
  }

  // ---------------------------------------------------------------- хитбоксы

  /** Область, по которой бойца можно ударить. */
  getHurtbox() {
    const w = this.stats.width;
    const h = this.isCrouching ? this.stats.crouchHeight : this.stats.height;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  /** Прямоугольник текущего приёма в мировых координатах (без учёта фазы). */
  getAttackRect() {
    const move = this.currentMove;
    if (!move) return null;
    const { x, y, w, h } = move.hitbox;
    return {
      x: this.facing === 1 ? this.x + x : this.x - x - w,
      y: this.y + y,
      w,
      h,
    };
  }

  /** Хитбокс, способный нанести урон в этом кадре, или null. */
  getActiveHitbox() {
    if (this.state !== S.ATTACK || this.moveHasHit || this.attackPhase !== 'active') return null;
    return this.getAttackRect();
  }

  // ---------------------------------------------------------------- цикл

  update(dt, opponent) {
    this.stateTime += dt * 1000;
    this.updateTimedStates();
    if (FREE_STATES.has(this.state)) this.updateFreeState(opponent);
    this.applyPhysics(dt);
  }

  setState(state, restart = false) {
    if (this.state === state && !restart) return;
    this.state = state;
    this.stateTime = 0;
    this.stateSerial++;
  }

  /** Выход из состояний, которые длятся фиксированное время. */
  updateTimedStates() {
    switch (this.state) {
      case S.ATTACK:
        if (this.stateTime >= moveDuration(this.currentMove)) {
          this.currentMove = null;
          this.setState(this.isGrounded ? S.IDLE : S.JUMP);
        }
        break;
      case S.HIT_STUN:
        if (this.stateTime >= this.stunDuration && this.isGrounded) this.setState(S.IDLE);
        break;
      case S.BLOCK_STUN:
        if (this.stateTime >= this.stunDuration) this.setState(S.BLOCK);
        break;
    }
  }

  updateFreeState(opponent) {
    if (this.isGrounded) this.faceTowards(opponent);

    if (this.inputEnabled) {
      this.handleInput();
    } else if (this.isGrounded) {
      this.vx = 0;
      this.setState(this.celebrating ? S.VICTORY : S.IDLE);
    }
  }

  handleInput() {
    const input = this.controller;
    const crouchHeld = input.isDown('down');

    // Атаки доступны и на земле, и в воздухе.
    if (input.justPressed('punch')) return this.tryAttack('punch', crouchHeld);
    if (input.justPressed('kick')) return this.tryAttack('kick', crouchHeld);

    // В прыжке траекторию не меняем — как в классических MK.
    if (!this.isGrounded) return;

    if (input.isDown('block')) {
      this.vx = 0;
      this.lowBlock = crouchHeld;
      this.setState(S.BLOCK);
      return;
    }

    const direction = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);

    if (input.isDown('up')) return this.jump(direction);

    if (crouchHeld) {
      this.vx = 0;
      this.setState(S.CROUCH);
      return;
    }

    if (direction === 0) {
      this.vx = 0;
      this.setState(S.IDLE);
      return;
    }

    const forward = direction === this.facing;
    this.vx = direction * (forward ? this.stats.walkSpeed : this.stats.backSpeed);
    this.setState(forward ? S.WALK_FORWARD : S.WALK_BACK);
  }

  tryAttack(button, crouchHeld) {
    const stance = !this.isGrounded ? 'air' : crouchHeld ? 'crouch' : 'stand';
    const move = this.moveset[stance]?.[button];
    if (!move) return;

    if (stance === 'air') {
      if (this.airAttackUsed) return;
      this.airAttackUsed = true;
    } else {
      this.vx = 0;
    }

    this.currentMove = { ...move, stance };
    this.moveHasHit = false;
    this.setState(S.ATTACK, true);
  }

  jump(direction) {
    this.vy = -this.stats.jumpVelocity;
    this.vx = direction * this.stats.jumpForwardSpeed;
    this.airAttackUsed = false;
    this.setState(S.JUMP);
  }

  /** Победная поза — примет её, как только приземлится и выйдет из оглушения. */
  celebrate() {
    this.celebrating = true;
  }

  faceTowards(opponent) {
    const dx = opponent.x - this.x;
    if (Math.abs(dx) > 1) this.facing = Math.sign(dx);
  }

  // ---------------------------------------------------------------- физика

  applyPhysics(dt) {
    const airborne = this.y < GROUND_Y || this.vy < 0;

    if (airborne) {
      this.vy += GRAVITY * dt;
    } else if (this.state !== S.WALK_FORWARD && this.state !== S.WALK_BACK) {
      this.vx = approachZero(this.vx, GROUND_FRICTION * dt);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (airborne && this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.land();
    }

    this.clampToArena();
  }

  land() {
    if (this.state === S.JUMP || (this.state === S.ATTACK && this.currentMove.stance === 'air')) {
      this.vx = 0;
      this.currentMove = null;
      this.setState(S.IDLE);
    }
  }

  clampToArena() {
    const half = this.stats.width / 2;
    this.x = Math.min(Math.max(this.x, ARENA_BOUNDS.left + half), ARENA_BOUNDS.right - half);
  }

  // ---------------------------------------------------------------- урон

  /**
   * Применяет попадание приёма.
   * @param move      приём атакующего
   * @param direction направление удара (1 — вправо, -1 — влево)
   * @returns {{ blocked: boolean, ko: boolean, damage: number }}
   */
  takeHit(move, direction) {
    this.currentMove = null;

    const facingAttacker = this.facing === -direction;
    if (this.isBlocking && this.isGrounded && facingAttacker) {
      this.vx = direction * move.knockback.x * BLOCK_PUSHBACK_RATIO;
      this.stunDuration = move.blockStun;
      this.setState(S.BLOCK_STUN, true);
      return { blocked: true, ko: false, damage: 0 };
    }

    const damage = Math.min(this.health, move.damage);
    this.health -= damage;
    this.vx = direction * move.knockback.x;
    if (move.knockback.y > 0) this.vy = -move.knockback.y;

    if (this.health <= 0) {
      this.vy = Math.min(this.vy, -KO_LAUNCH_VELOCITY);
      this.setState(S.KO, true);
      return { blocked: false, ko: true, damage };
    }

    this.stunDuration = move.hitStun;
    this.setState(S.HIT_STUN, true);
    return { blocked: false, ko: false, damage };
  }
}
