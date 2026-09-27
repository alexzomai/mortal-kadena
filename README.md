# Mortal Kadena

Браузерный 2D-файтинг на Phaser 3 для двух игроков на одной клавиатуре.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в dist/
```

## Управление

| Действие | Игрок 1 | Игрок 2 |
|---|---|---|
| Ходьба | A / D | ← / → |
| Прыжок | W | ↑ |
| Присед | S | ↓ |
| Рука | F | Num1 или `,` |
| Нога | G | Num2 или `.` |
| Блок (держать) | H | Num3 или `/` |

- Присед + удар — нижние атаки (нижний удар рукой, подсечка).
- Удар в прыжке — воздушные атаки (одна за прыжок).
- Верхний удар рукой проходит над присевшим противником.
- `` ` `` (ё) — показать/скрыть хитбоксы.

Раскладки задаются в `src/config/controls.js`.

## Структура

```
src/
  main.js                     конфиг Phaser, список сцен
  config/
    constants.js              размеры, гравитация, время раунда, правила матча
    controls.js               раскладки клавиатуры
    fighters.js               ростер: характеристики, набор приёмов, вид
  input/
    InputController.js        базовый источник ввода (действия, justPressed)
    KeyboardController.js     клавиатура
  fighters/
    Fighter.js                логика бойца: состояния, физика, хитбоксы, урон
    FighterState.js           перечень состояний (= ключи анимаций)
    moves.js                  frame data приёмов
    views/
      PlaceholderFighterView.js  цветные прямоугольники
      SpriteFighterView.js       шаблон под spritesheet
      createFighterView.js       выбор вида по конфигу
  combat/
    CombatSystem.js           попадания, блок, отбрасывание, расталкивание тел
    geometry.js               пересечение прямоугольников
  match/
    RoundTimer.js             таймер раунда
    MatchState.js             счёт раундов, определение победителя матча
  scenes/
    BootScene.js              загрузка ресурсов
    TitleScene.js             заставка и подсказка по управлению
    FightScene.js             раунд: связывает всё вместе
    ResultScene.js            экран победы/поражения
  ui/
    HUD.js, HealthBar.js      полоски здоровья, таймер, маркеры раундов
    Announcer.js              «ROUND 1», «FIGHT!», «K.O.»
  world/
    Arena.js                  арена «Баня»: слои с параллаксом, огонь в печи, пар
    StageCamera.js            камера в стиле MK: зум, слежение, ограничение по ширине экрана
  debug/HitboxDebugView.js    отрисовка хитбоксов
tools/sprites/                нарезка спрайтлистов (sheet.mjs, preview.mjs, build.mjs)
art/                          исходники графики и разметка кадров
```

### Ключевые идеи

- **Логика отделена от рендера.** `Fighter` ничего не рисует и не импортирует Phaser.
  Вид (`*FighterView`) каждый кадр читает его публичные поля: `x`, `y`, `facing`,
  `state`, `animationKey`, `stateSerial`.
- **Боец не знает про клавиши.** Он спрашивает у контроллера абстрактные действия
  (`left`, `punch`, `block`...). Любой источник ввода — наследник `InputController`.
- **Приёмы — это данные.** Урон, тайминги (startup / active / recovery), хитбокс
  и отбрасывание описаны в `moves.js`. Новый удар — новая запись.
- **Два слоя и две камеры.** Всё игровое кладётся в `worldLayer` (его снимает
  приближенная следящая камера), интерфейс — в `uiLayer` (неподвижная камера).
  Новый объект мира, не добавленный в `worldLayer`, отрисуется дважды — это сразу видно.
- **Камера как в MK.** Арена шире экрана (`STAGE_WIDTH`), камера едет за серединой
  между бойцами, бойцы не могут разойтись шире кадра, в прыжке камера приподнимается.
  Параметры — `CAMERA` в `config/constants.js`.
- **Раунд = перезапуск сцены.** `FightScene` получает состояние матча
  (`{ round, wins }`) через `scene.restart(data)`.

Координаты бойца — точка между ступнями; хитбоксы задаются относительно неё
и зеркалятся по `facing`.

## Спрайты бойцов

Бойцы нарисованы спрайтами из рипов MK3 (`art/source/`). Такие листы «рваные»:
кадры разного размера разбросаны по строкам на зелёном фоне, поэтому их режет скрипт.

```
art/source/<id>.png|webp          исходный рип
art/fighters/<id>.json            разметка: какие кадры → какая анимация / фаза удара
public/assets/fighters/<id>.png   собранная сетка кадров (генерируется)
public/assets/fighters/<id>.json  размер ячейки, масштаб, анимации (генерируется)
```

Порядок работы:

1. `npm run sprites:preview -- art/source/<id>.png art/preview/<id>` — картинки по строкам
   листа с номерами кадров вида `строка.кадр` (например `4.3`).
2. Прописать номера в `art/fighters/<id>.json`:
   - `animations` — обычные состояния (`idle`, `walkForward`, `walkBack`, `crouch`, `jump`,
     `jumpForward`, `jumpBack`, `block`, `crouchBlock`, `hitStun`, `ko`, `victory`), с `fps` и `loop`;
   - `attacks` — кадры приёмов по фазам `startup` / `active` / `recovery`. Кадр выбирается
     по фазе удара, поэтому картинка всегда совпадает с активным хитбоксом;
   - `offsetY` у анимации — поднять кадры (например, кувырок в прыжке);
   - `targetHeight` — рост в стойке в мире (из него считается масштаб);
   - `despill: true` — убрать зелёную кайму у листов с потерей качества (webp/jpg).
3. `npm run sprites:build` — собрать все листы.
4. В `config/fighters.js`: `view: { type: 'sprite', textureKey: '<id>' }`.

Точка опоры кадра («между ступнями») находится автоматически по нижним пикселям кадра
и ставится в центр нижнего края ячейки, поэтому спрайт рисуется с origin (0.5, 1)
и отражается через `flipX`. Хитбоксы под спрайты — `SPRITE_MOVESET` в `config/fighters.js`.

Процедурные человечки остались: `view: { type: 'placeholder', color, accentColor }`.

> Рипы MK3 — чужая графика (Midway / Warner Bros.). Для личного прототипа годится,
> для публикации нужно заменить своей.

## Как добавить геймпад

Создать `src/input/GamepadController.js`:

```js
import { InputController } from './InputController.js';

export class GamepadController extends InputController {
  constructor(padIndex) {
    super();
    this.padIndex = padIndex;
    this.reset();
  }

  readRaw() {
    const pad = navigator.getGamepads()[this.padIndex];
    const button = (i) => Boolean(pad?.buttons[i]?.pressed);
    const axisX = pad?.axes[0] ?? 0;
    const axisY = pad?.axes[1] ?? 0;
    return {
      left: button(14) || axisX < -0.5,
      right: button(15) || axisX > 0.5,
      up: button(12) || axisY < -0.5,
      down: button(13) || axisY > 0.5,
      punch: button(2), // X / □
      kick: button(0), // A / ✕
      block: button(5) || button(7), // RB / RT
    };
  }
}
```

и использовать его вместо `KeyboardController` в `FightScene.create()`
(или сделать контроллер, объединяющий оба источника).
