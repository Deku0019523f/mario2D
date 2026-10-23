import { OBJECTS, SCORE } from '../data/config.js';
import { TEXTS } from '../data/texts.js';
import { spawnMushroom } from './Mushroom.js';
import { squashEnemy } from '../enemies/Enemy.js';

/**
 * Bloc interactif ("?" ou brique).
 * @param {import('../world/World.js').World} world
 * @param {number} x centre
 * @param {number} yBottom ordonnée du dessous du bloc
 * @param {'question'|'brick'} blockType
 * @param {'mushroom'|'coin'|'empty'} content
 */
export function createBlock(world, x, yBottom, blockType, content) {
    const size = OBJECTS.BLOCK_SIZE;
    const collider = {
        type: 'block',
        minX: x - size / 2,
        maxX: x + size / 2,
        minY: yBottom,
        maxY: yBottom + size,
        active: true,
        block: null,
    };
    const block = {
        x,
        baseY: yBottom + size / 2,
        size,
        blockType,
        content,
        used: false,
        destroyed: false,
        bounceTimer: 0,
        offsetY: 0, // décalage vertical animé (rebond), lu par le rendu
        collider,
    };
    collider.block = block;
    world.colliders.push(collider);
    world.blocks.push(block);
    return block;
}

/** Animation de rebond des blocs frappés. */
export function updateBlocks(world, dt) {
    for (const b of world.blocks) {
        if (b.bounceTimer > 0) {
            b.bounceTimer = Math.max(0, b.bounceTimer - dt);
            b.offsetY = Math.sin((b.bounceTimer / OBJECTS.BLOCK_BOUNCE_TIME) * Math.PI) * OBJECTS.BLOCK_BOUNCE_HEIGHT;
        } else {
            b.offsetY = 0;
        }
    }
}

/**
 * Le héros frappe le dessous d'un bloc : élimine un ennemi posé dessus, libère le contenu
 * d'un bloc "?", ou fracasse une brique si le héros est Super.
 * @param {import('../core/Game.js').Game} game
 */
export function triggerBlockHit(game, block) {
    if (block.destroyed) return;
    block.bounceTimer = OBJECTS.BLOCK_BOUNCE_TIME;

    // Un ennemi posé juste au-dessus du bloc frappé est éliminé
    const blockTop = block.baseY + block.size / 2;
    for (const en of game.world.enemies) {
        if (en.state === 'walk' && Math.abs(en.x - block.x) < 1.1 && Math.abs(en.y - blockTop) < 0.6) {
            squashEnemy(en, 0.45);
            game.score.add(SCORE.BLOCK_KO);
            game.sfx('stomp');
            game.floatText(en.x, en.y + 1.2, TEXTS.floating.blockKo, 'emerald-300');
        }
    }

    if (block.blockType === 'question' && !block.used) {
        block.used = true;
        if (block.content === 'mushroom') {
            spawnMushroom(game, block.x, blockTop);
        } else {
            game.sfx('coin');
            game.score.addCoin();
            game.score.add(SCORE.BLOCK_COIN);
            game.burst(block.x, block.baseY + 0.9, 0xfacc15, 8);
            game.floatText(block.x, block.baseY + 1.2, TEXTS.floating.blockCoin, 'amber-300');
        }
    } else if (block.blockType === 'brick') {
        if (game.player.isSuper) {
            // En mode Super, le héros fracasse les briques
            game.sfx('brick');
            block.destroyed = true;
            block.collider.active = false;
            game.score.add(SCORE.BRICK_SMASH);
            game.burst(block.x, block.baseY, 0xb45309, 14);
            game.floatText(block.x, block.baseY + 0.8, TEXTS.floating.brick, 'orange-400');
        } else {
            game.sfx('bump');
        }
    } else {
        game.sfx('bump');
    }
}
