import { PlaceholderFighterView } from './PlaceholderFighterView.js';
import { SpriteFighterView } from './SpriteFighterView.js';

const VIEW_TYPES = {
  placeholder: PlaceholderFighterView,
  sprite: SpriteFighterView,
};

/**
 * Создаёт вид бойца по полю `view` из config/fighters.js.
 * @param layer слой мира (Phaser.GameObjects.Layer), куда вид кладёт свои объекты
 */
export function createFighterView(scene, fighter, layer) {
  const { type = 'placeholder', ...config } = fighter.definition.view ?? {};
  const ViewClass = VIEW_TYPES[type];
  if (!ViewClass) throw new Error(`Unknown fighter view type "${type}"`);
  return new ViewClass(scene, fighter, config, layer);
}
