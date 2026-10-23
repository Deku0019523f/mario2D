import { updateBlocks } from '../objects/Block.js';
import { updateCoins } from '../objects/Coin.js';
import { updateMushrooms } from '../objects/Mushroom.js';
import { updateParticles } from '../objects/Particle.js';
import { updateEnemies } from '../enemies/enemyAI.js';

/**
 * Met à jour toutes les entités du monde pour un pas de simulation.
 * L'ordre est celui de la version d'origine : blocs, pièces, champignons, ennemis, particules.
 * (Les nuages sont purement décoratifs : ils sont animés par le moteur de rendu.)
 *
 * @param {import('../core/Game.js').Game} game
 */
export function updateWorld(game, dt) {
    updateBlocks(game.world, dt);
    updateCoins(game);
    updateMushrooms(game, dt);
    updateEnemies(game, dt);
    updateParticles(game.world, dt);
}
