import { FighterState as S } from '../FighterState.js';
import { GROUND_Y } from '../../config/constants.js';
import { ATTACK_POSES, POSES, lerpPose, offsetPose } from './stickPoses.js';

const HIT_FLASH_MS = 90;
const SKIN_COLOR = 0xf0c8a0;
const HEAD_RADIUS = 14;
const WIDTH = { torso: 18, leg: 11, arm: 9 };

const UPPER_BODY = ['head', 'neck', 'elbowF', 'handF', 'elbowB', 'handB'];

/** Затемнение цвета для дальних конечностей. */
function shade(color, factor) {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

const easeOut = (t) => 1 - (1 - t) * (1 - t);

/**
 * Временный вид бойца — процедурный человечек из «костей» (позы в stickPoses.js).
 * Интерфейс вида: constructor(scene, fighter, config, layer), update(), destroy().
 * SpriteFighterView реализует тот же интерфейс — замена без правок логики.
 */
export class PlaceholderFighterView {
  constructor(scene, fighter, { color = 0xcccccc, accentColor = 0xffffff } = {}, layer) {
    this.scene = scene;
    this.fighter = fighter;
    this.color = color;
    this.backColor = shade(color, 0.65);
    this.accentColor = accentColor;

    this.shadow = scene.add.ellipse(fighter.x, GROUND_Y, 70, 12, 0x000000, 0.4).setDepth(5);
    this.gfx = scene.add.graphics().setDepth(10);
    layer.add([this.shadow, this.gfx]);
  }

  update() {
    const f = this.fighter;
    const lift = GROUND_Y - f.y;
    this.shadow.setPosition(f.x, GROUND_Y).setScale(Math.max(0.4, 1 - lift / 300));

    this.gfx.clear();
    this.drawFigure(this.computePose());
  }

  // ---------------------------------------------------------------- позы

  computePose() {
    const f = this.fighter;
    switch (f.state) {
      case S.ATTACK:
        return this.attackPose();
      case S.WALK_FORWARD:
        return this.walkPose(1);
      case S.WALK_BACK:
        return this.walkPose(-1);
      case S.CROUCH:
        return POSES.crouch;
      case S.JUMP:
        return POSES.jump;
      case S.BLOCK:
      case S.BLOCK_STUN:
        return f.lowBlock ? POSES.crouchBlock : POSES.block;
      case S.HIT_STUN:
        return POSES.hit;
      case S.KO:
        return f.isGrounded ? POSES.knockedOut : POSES.hit;
      case S.VICTORY:
        return POSES.victory;
      default:
        return this.idlePose();
    }
  }

  /** Лёгкое «дыхание» в стойке. */
  idlePose() {
    const bob = Math.sin(this.scene.time.now * 0.005) * 2;
    return offsetPose(POSES.stand, Object.fromEntries(UPPER_BODY.map((joint) => [joint, [0, bob]])));
  }

  walkPose(direction) {
    const swing = Math.sin(this.fighter.stateTime * 0.014) * direction;
    return offsetPose(POSES.stand, {
      kneeF: [swing * 10, 0],
      footF: [swing * 18, Math.max(0, swing) * 8],
      kneeB: [-swing * 10, 0],
      footB: [-swing * 18, Math.max(0, -swing) * 8],
    });
  }

  /** Удар выпрямляется на замахе, держится в активной фазе и возвращается на восстановлении. */
  attackPose() {
    const f = this.fighter;
    const move = f.currentMove;
    const { base, strike } = ATTACK_POSES[move.name] ?? { base: 'stand', strike: POSES.stand };

    let t;
    if (f.attackPhase === 'startup') t = easeOut(f.stateTime / move.startup);
    else if (f.attackPhase === 'active') t = 1;
    else t = 1 - (f.stateTime - move.startup - move.active) / move.recovery;

    return lerpPose(POSES[base], strike, Math.min(Math.max(t, 0), 1));
  }

  // ---------------------------------------------------------------- отрисовка

  drawFigure(pose) {
    const f = this.fighter;
    const flashing = f.state === S.HIT_STUN && f.stateTime < HIT_FLASH_MS;
    const front = flashing ? 0xffffff : this.color;
    const back = flashing ? 0xffffff : this.backColor;
    const guard = f.state === S.BLOCK_STUN ? this.accentColor : null;

    const p = {};
    for (const [joint, [x, y]] of Object.entries(pose)) {
      p[joint] = { x: f.x + x * f.facing, y: f.y - y };
    }

    // Сзади наперёд: дальние конечности, торс, голова, ближние конечности.
    this.drawLimb(p.neck, p.elbowB, p.handB, WIDTH.arm, guard ?? back);
    this.drawLimb(p.hip, p.kneeB, p.footB, WIDTH.leg, back);
    this.drawSegment(p.neck, p.hip, WIDTH.torso, front);
    this.drawHead(p.head, front);
    this.drawBelt(p.hip);
    this.drawLimb(p.hip, p.kneeF, p.footF, WIDTH.leg, front);
    this.drawLimb(p.neck, p.elbowF, p.handF, WIDTH.arm, guard ?? front);

    this.gfx.fillStyle(SKIN_COLOR, 1);
    this.gfx.fillCircle(p.handB.x, p.handB.y, 6);
    this.gfx.fillCircle(p.handF.x, p.handF.y, 6);
  }

  drawSegment(a, b, width, color) {
    const g = this.gfx;
    g.lineStyle(width, color, 1);
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.fillStyle(color, 1);
    g.fillCircle(a.x, a.y, width / 2);
    g.fillCircle(b.x, b.y, width / 2);
  }

  drawLimb(root, joint, end, width, color) {
    this.drawSegment(root, joint, width, color);
    this.drawSegment(joint, end, width, color);
  }

  drawHead(head, color) {
    const g = this.gfx;
    const facing = this.fighter.facing;
    g.fillStyle(color, 1);
    g.fillCircle(head.x, head.y, HEAD_RADIUS);
    // Прорезь маски с глазами — смотрит в сторону противника
    g.fillStyle(SKIN_COLOR, 1);
    g.fillRect(facing === 1 ? head.x - 2 : head.x - 12, head.y - 5, 14, 6);
    g.fillStyle(0x000000, 1);
    g.fillRect(head.x + facing * 6 - 1.5, head.y - 4, 3, 3);
  }

  drawBelt(hip) {
    this.gfx.fillStyle(this.accentColor, 1);
    this.gfx.fillRect(hip.x - WIDTH.torso / 2, hip.y - 4, WIDTH.torso, 6);
  }

  destroy() {
    this.shadow.destroy();
    this.gfx.destroy();
  }
}
