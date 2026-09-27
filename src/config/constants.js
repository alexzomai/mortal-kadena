// Глобальные константы игры и арены.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Y-координата пола: «ноги» бойцов стоят на этой линии. */
export const GROUND_Y = 470;

/** Ширина всей арены в мировых координатах — больше экрана, камера по ней ездит. */
export const STAGE_WIDTH = 1500;

/** Горизонтальные границы арены (по краям тела бойца). */
export const ARENA_BOUNDS = { left: 20, right: STAGE_WIDTH - 20 };

/** Камера боя в стиле MK: приближение и слежение за бойцами. */
export const CAMERA = {
  zoom: 1.35,
  /** Какая доля высоты кадра над полом (остальное — пол под ногами). */
  groundScreenRatio: 0.88,
  /** Насколько камера может подняться вслед за прыжком, px мира. */
  maxRise: 140,
  /** Запас над головой самого высокого бойца, px мира (там HUD). */
  headroom: 90,
  /** Отступ бойцов от краёв экрана, px мира. */
  edgeMargin: 20,
  /** Скорость догоняния (больше — жёстче), 1/s. */
  followSpeedX: 12,
  followSpeedY: 14,
};

/** Гравитация, px/s². */
export const GRAVITY = 2400;

export const ROUND_TIME_SECONDS = 60;
export const ROUNDS_TO_WIN = 2;
/** Страховка от бесконечной серии ничьих. */
export const MAX_ROUNDS = 5;

/** Длительности (мс) служебных фаз раунда. */
export const ROUND_TIMINGS = {
  introRoundLabel: 1000,
  introFightLabel: 700,
  outroResultDelay: 1000,
  outroTotal: 2800,
};
