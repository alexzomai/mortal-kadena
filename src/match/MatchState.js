import { MAX_ROUNDS, ROUNDS_TO_WIN } from '../config/constants.js';

// Состояние матча — простой объект, передаётся между перезапусками FightScene.

export function createMatchState() {
  return { round: 1, wins: [0, 0] };
}

/** @param winnerIndex 0 | 1 | null (ничья) */
export function recordRoundResult(match, winnerIndex) {
  const wins = [...match.wins];
  if (winnerIndex !== null) wins[winnerIndex]++;
  return { round: match.round + 1, wins };
}

/** @returns {{ decided: boolean, winnerIndex: 0 | 1 | null }} */
export function getMatchOutcome(match) {
  const winnerIndex = match.wins.findIndex((w) => w >= ROUNDS_TO_WIN);
  if (winnerIndex !== -1) return { decided: true, winnerIndex };

  if (match.round > MAX_ROUNDS) {
    const [w1, w2] = match.wins;
    return { decided: true, winnerIndex: w1 === w2 ? null : w1 > w2 ? 0 : 1 };
  }
  return { decided: false, winnerIndex: null };
}
