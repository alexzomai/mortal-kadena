/**
 * Позы человечка-плейсхолдера.
 *
 * Координаты суставов — [x, y] относительно точки между ступнями:
 * x — вперёд (по направлению взгляда), y — вверх. Отражение по facing делает вид.
 * Суффикс F — ближняя к противнику рука/нога, B — дальняя.
 *
 * В активной фазе удара кулак/стопа совпадают с хитбоксом приёма из moves.js.
 */

export const JOINTS = ['head', 'neck', 'hip', 'elbowF', 'handF', 'elbowB', 'handB', 'kneeF', 'footF', 'kneeB', 'footB'];

const stand = {
  head: [0, 156],
  neck: [0, 140],
  hip: [0, 92],
  elbowF: [20, 112],
  handF: [28, 134],
  elbowB: [8, 110],
  handB: [16, 130],
  kneeF: [16, 48],
  footF: [24, 0],
  kneeB: [-14, 48],
  footB: [-24, 0],
};

const crouch = {
  head: [4, 96],
  neck: [4, 82],
  hip: [-4, 40],
  elbowF: [22, 62],
  handF: [28, 80],
  elbowB: [10, 60],
  handB: [16, 76],
  kneeF: [32, 40],
  footF: [26, 0],
  kneeB: [-24, 30],
  footB: [-26, 0],
};

const jump = {
  ...stand,
  kneeF: [26, 72],
  footF: [10, 42],
  kneeB: [12, 64],
  footB: [-10, 38],
};

export const POSES = {
  stand,
  crouch,
  jump,
  block: {
    ...stand,
    elbowF: [24, 120],
    handF: [18, 152],
    elbowB: [20, 116],
    handB: [24, 148],
  },
  crouchBlock: {
    ...crouch,
    elbowF: [24, 72],
    handF: [18, 98],
    elbowB: [20, 68],
    handB: [24, 94],
  },
  hit: {
    ...stand,
    head: [-20, 150],
    neck: [-12, 136],
    elbowF: [0, 118],
    handF: [12, 108],
    elbowB: [-26, 124],
    handB: [-40, 112],
  },
  knockedOut: {
    head: [-74, 14],
    neck: [-56, 12],
    hip: [0, 12],
    elbowF: [-48, 28],
    handF: [-34, 6],
    elbowB: [-40, 4],
    handB: [-26, 2],
    kneeF: [34, 24],
    footF: [70, 8],
    kneeB: [36, 10],
    footB: [72, 4],
  },
  victory: {
    ...stand,
    elbowF: [14, 160],
    handF: [16, 184],
    elbowB: [-18, 110],
    handB: [-8, 96],
  },
};

/** Позы атак: base — из какой позы выходит удар, strike — поза в активной фазе. */
export const ATTACK_POSES = {
  punch: {
    base: 'stand',
    strike: { ...stand, head: [8, 156], neck: [6, 140], elbowF: [52, 138], handF: [80, 138] },
  },
  kick: {
    base: 'stand',
    strike: {
      ...stand,
      head: [-24, 150],
      neck: [-18, 136],
      hip: [-4, 92],
      elbowF: [2, 116],
      handF: [14, 126],
      elbowB: [-30, 116],
      handB: [-38, 126],
      kneeF: [50, 96],
      footF: [100, 92],
      kneeB: [-8, 48],
      footB: [-12, 0],
    },
  },
  lowPunch: {
    base: 'crouch',
    strike: { ...crouch, head: [12, 96], neck: [10, 82], elbowF: [48, 76], handF: [76, 74] },
  },
  sweep: {
    base: 'crouch',
    strike: {
      head: [-22, 86],
      neck: [-16, 72],
      hip: [-8, 34],
      elbowF: [6, 58],
      handF: [14, 50],
      elbowB: [-26, 40],
      handB: [-32, 6],
      kneeF: [50, 20],
      footF: [110, 14],
      kneeB: [-30, 24],
      footB: [-20, 0],
    },
  },
  airPunch: {
    base: 'jump',
    strike: { ...jump, head: [8, 154], neck: [6, 138], elbowF: [40, 120], handF: [66, 112] },
  },
  airKick: {
    base: 'jump',
    strike: {
      ...jump,
      head: [-18, 150],
      neck: [-12, 136],
      elbowF: [8, 120],
      handF: [18, 130],
      kneeF: [42, 80],
      footF: [86, 64],
      kneeB: [4, 62],
      footB: [-10, 44],
    },
  },
};

export function lerpPose(from, to, t) {
  const result = {};
  for (const joint of JOINTS) {
    const [ax, ay] = from[joint];
    const [bx, by] = to[joint];
    result[joint] = [ax + (bx - ax) * t, ay + (by - ay) * t];
  }
  return result;
}

/** Копия позы со смещёнными суставами: offsets = { joint: [dx, dy] }. */
export function offsetPose(pose, offsets) {
  const result = { ...pose };
  for (const [joint, [dx, dy]] of Object.entries(offsets)) {
    result[joint] = [pose[joint][0] + dx, pose[joint][1] + dy];
  }
  return result;
}
