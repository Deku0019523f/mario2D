import { World } from './World.js';
import { createPlatform } from './Platform.js';
import { createPipe } from './Pipe.js';
import { createGoal } from './Goal.js';
import { generateScenery } from './scenery.js';
import { createBlock } from '../objects/Block.js';
import { createCoin } from '../objects/Coin.js';
import { createEnemy } from '../enemies/Enemy.js';

/**
 * Construit le monde logique d'un niveau à partir de sa définition (src/data/levels.js).
 * L'ordre des items est respecté à l'identique (il détermine l'ordre des colliders).
 *
 * @param {object} def définition de niveau
 * @param {{rng: () => number, version?: number}} options
 * @returns {World}
 */
export function buildWorld(def, { rng, version = 0 }) {
    const world = new World(version);
    world.levelId = def.id;
    world.levelLength = def.length;

    for (const item of def.items) {
        switch (item.kind) {
            case 'platform':
                createPlatform(world, item, rng);
                break;
            case 'pipe':
                createPipe(world, item);
                break;
            case 'block':
                createBlock(world, item.x, item.y, item.blockType, item.content);
                break;
            case 'coin':
                createCoin(world, item.x, item.y, rng);
                break;
            case 'enemy':
                createEnemy(world, item.enemyType, item.x, item.y, item.minX, item.maxX);
                break;
            default:
                throw new Error(`Type d'item de niveau inconnu : ${item.kind}`);
        }
    }

    createGoal(world, def.flagX);
    generateScenery(world, def.sceneryLength, rng);
    return world;
}
