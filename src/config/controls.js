// Раскладки клавиатуры. Значения — имена из Phaser.Input.Keyboard.KeyCodes.
// На одно действие можно повесить несколько клавиш.

export const KEYBOARD_BINDINGS = {
  player1: {
    left: ['A'],
    right: ['D'],
    up: ['W'],
    down: ['S'],
    punch: ['F'],
    kick: ['G'],
    block: ['H'],
  },
  player2: {
    left: ['LEFT'],
    right: ['RIGHT'],
    up: ['UP'],
    down: ['DOWN'],
    // Numpad — если он есть, запятая/точка/слэш — для ноутбуков.
    punch: ['NUMPAD_ONE', 'COMMA'],
    kick: ['NUMPAD_TWO', 'PERIOD'],
    block: ['NUMPAD_THREE', 'FORWARD_SLASH'],
  },
};

/** Клавиша переключения отладочной отрисовки хитбоксов (` / ё). */
export const DEBUG_TOGGLE_KEY = 'BACKTICK';

const KEY_LABELS = {
  LEFT: '←',
  RIGHT: '→',
  UP: '↑',
  DOWN: '↓',
  COMMA: ',',
  PERIOD: '.',
  FORWARD_SLASH: '/',
  NUMPAD_ONE: 'Num1',
  NUMPAD_TWO: 'Num2',
  NUMPAD_THREE: 'Num3',
};

/** Человекочитаемое название привязки действия, например «Num1 / ,». */
export function formatBinding(keys) {
  return keys.map((key) => KEY_LABELS[key] ?? key).join(' / ');
}
