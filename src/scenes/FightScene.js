import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, ROUND_TIME_SECONDS, ROUND_TIMINGS, ROUNDS_TO_WIN, STAGE_WIDTH } from '../config/constants.js';
import { DEBUG_TOGGLE_KEY, KEYBOARD_BINDINGS } from '../config/controls.js';
import { DEFAULT_FIGHTER_IDS, FIGHTERS } from '../config/fighters.js';
import { KeyboardController } from '../input/KeyboardController.js';
import { Fighter } from '../fighters/Fighter.js';
import { createFighterView } from '../fighters/views/createFighterView.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { RoundTimer } from '../match/RoundTimer.js';
import { createMatchState, getMatchOutcome, recordRoundResult } from '../match/MatchState.js';
import { HUD } from '../ui/HUD.js';
import { Announcer } from '../ui/Announcer.js';
import { Arena } from '../world/Arena.js';
import { StageCamera } from '../world/StageCamera.js';
import { HitboxDebugView } from '../debug/HitboxDebugView.js';

/** Максимальный шаг симуляции — чтобы после лага бойцы не «телепортировались». */
const MAX_DELTA_MS = 50;
/** Стартовое расстояние от центра арены до бойца. */
const START_OFFSET = 160;

const Phase = Object.freeze({ INTRO: 'intro', FIGHT: 'fight', OUTRO: 'outro' });

/**
 * Один раунд. Сцена перезапускается на каждый раунд с обновлённым состоянием матча.
 *
 * Порядок кадра: ввод → бойцы → боевая система → камера → таймер/правила → HUD и виды.
 *
 * Объекты разложены по двум слоям: worldLayer снимает приближенная следящая камера,
 * uiLayer — неподвижная камера интерфейса (HUD не зумится и не трясётся).
 */
export class FightScene extends Phaser.Scene {
  constructor() {
    super('FightScene');
  }

  init(data) {
    this.match = data.match ?? createMatchState();
    this.fighterIds = data.fighterIds ?? DEFAULT_FIGHTER_IDS;
  }

  create() {
    this.worldLayer = this.add.layer().setDepth(0);
    this.uiLayer = this.add.layer().setDepth(1);
    this.cameras.main.ignore(this.uiLayer);
    this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT).ignore(this.worldLayer);
    this.stageCamera = new StageCamera(this.cameras.main);

    new Arena(this, this.worldLayer);

    this.controllers = [
      new KeyboardController(this, KEYBOARD_BINDINGS.player1),
      new KeyboardController(this, KEYBOARD_BINDINGS.player2),
    ];

    this.fighters = [
      new Fighter({ definition: FIGHTERS[this.fighterIds[0]], x: STAGE_WIDTH / 2 - START_OFFSET, facing: 1, controller: this.controllers[0] }),
      new Fighter({ definition: FIGHTERS[this.fighterIds[1]], x: STAGE_WIDTH / 2 + START_OFFSET, facing: -1, controller: this.controllers[1] }),
    ];
    this.views = this.fighters.map((fighter) => createFighterView(this, fighter, this.worldLayer));
    this.stageCamera.update(this.fighters, 0, true);

    this.combat = new CombatSystem(this.fighters);
    this.timer = new RoundTimer(ROUND_TIME_SECONDS);
    this.hud = new HUD(this, this.uiLayer, {
      names: this.fighters.map((f) => f.name),
      wins: this.match.wins,
      roundsToWin: ROUNDS_TO_WIN,
    });
    this.hud.setTime(this.timer.secondsLeft);
    this.announcer = new Announcer(this, this.uiLayer);

    this.hitboxDebug = new HitboxDebugView(this, this.worldLayer, this.fighters, this.registry.get('debugHitboxes') ?? false);
    this.input.keyboard.on(`keydown-${DEBUG_TOGGLE_KEY}`, () => {
      this.registry.set('debugHitboxes', this.hitboxDebug.toggle());
    });

    this.startIntro();
  }

  // ---------------------------------------------------------------- фазы раунда

  startIntro() {
    this.phase = Phase.INTRO;
    this.announcer.show(`ROUND ${this.match.round}`, { duration: ROUND_TIMINGS.introRoundLabel - 200 });
    this.time.delayedCall(ROUND_TIMINGS.introRoundLabel, () => {
      this.announcer.show('FIGHT!', { duration: ROUND_TIMINGS.introFightLabel, color: '#ff3b3b' });
      this.startFight();
    });
  }

  startFight() {
    this.phase = Phase.FIGHT;
    this.controllers.forEach((c) => c.reset());
    this.fighters.forEach((f) => (f.inputEnabled = true));
    this.timer.start();
  }

  endRound(reason) {
    this.phase = Phase.OUTRO;
    this.timer.stop();
    this.fighters.forEach((f) => (f.inputEnabled = false));

    const [p1, p2] = this.fighters;
    const winnerIndex = p1.health === p2.health ? null : p1.health > p2.health ? 0 : 1;
    const winner = winnerIndex === null ? null : this.fighters[winnerIndex];

    this.announcer.show(reason === 'ko' ? 'K.O.' : 'TIME', { duration: ROUND_TIMINGS.outroResultDelay - 200, color: '#ff3b3b' });

    this.time.delayedCall(ROUND_TIMINGS.outroResultDelay, () => {
      if (winner) {
        winner.celebrate();
        const flawless = winner.healthRatio === 1;
        this.announcer.show(flawless ? 'FLAWLESS VICTORY' : `${winner.name} WINS`, { duration: 0, fontSize: 64 });
      } else {
        this.announcer.show('DRAW', { duration: 0, fontSize: 64 });
      }
    });

    this.time.delayedCall(ROUND_TIMINGS.outroTotal, () => this.finishRound(winnerIndex));
  }

  finishRound(winnerIndex) {
    const match = recordRoundResult(this.match, winnerIndex);
    const outcome = getMatchOutcome(match);

    if (outcome.decided) {
      const winner = outcome.winnerIndex === null ? null : this.fighters[outcome.winnerIndex];
      this.scene.start('ResultScene', {
        winnerIndex: outcome.winnerIndex,
        winnerName: winner?.name ?? null,
        wins: match.wins,
        fighterIds: this.fighterIds,
      });
    } else {
      this.scene.restart({ match, fighterIds: this.fighterIds });
    }
  }

  // ---------------------------------------------------------------- кадр

  update(_time, delta) {
    const deltaMs = Math.min(delta, MAX_DELTA_MS);
    const dt = deltaMs / 1000;
    const [p1, p2] = this.fighters;

    this.controllers.forEach((c) => c.update());
    p1.update(dt, p2);
    p2.update(dt, p1);

    for (const hit of this.combat.update()) this.onHit(hit);
    this.stageCamera.constrainFighters(this.fighters);
    this.stageCamera.update(this.fighters, dt);

    if (this.phase === Phase.FIGHT) {
      this.timer.update(deltaMs);
      if (!p1.isAlive || !p2.isAlive) this.endRound('ko');
      else if (this.timer.isExpired) this.endRound('time');
    }

    this.fighters.forEach((f, i) => this.hud.setHealth(i, f.healthRatio));
    this.hud.setTime(this.timer.secondsLeft);
    this.views.forEach((view) => view.update());
    this.hitboxDebug.update();
  }

  onHit({ point, blocked, ko }) {
    this.spawnHitSpark(point, blocked);
    if (!blocked) this.cameras.main.shake(ko ? 250 : 80, ko ? 0.012 : 0.004);
  }

  spawnHitSpark({ x, y }, blocked) {
    const spark = this.add.star(x, y, 6, 6, 18, blocked ? 0x9fd8ff : 0xffe066).setDepth(60);
    this.worldLayer.add(spark);
    this.tweens.add({
      targets: spark,
      scale: { from: 0.6, to: 1.6 },
      alpha: { from: 1, to: 0 },
      angle: 45,
      duration: 160,
      onComplete: () => spark.destroy(),
    });
  }
}
