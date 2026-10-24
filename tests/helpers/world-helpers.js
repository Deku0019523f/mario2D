import { createNewGame } from './lockstep.js';
import { buildWorld } from '../../src/world/LevelBuilder.js';
import { createRng } from '../../src/core/rng.js';

/**
 * Partie démarrée sur un mini-niveau personnalisé (sol plat + items donnés).
 * @param {Array} items items de niveau (voir src/data/levels.js)
 */
export function gameWithLevel(items = []) {
    const ctx = createNewGame();
    const def = {
        id: 1,
        length: 60,
        sceneryLength: 60,
        flagX: 58,
        items: [{ kind: 'platform', x: -6, width: 80, yTop: 0, height: 5 }, ...items],
    };
    ctx.game.startNewGame();
    ctx.game.world = buildWorld(def, { rng: createRng(1), version: 999 });
    ctx.game.resetPlayer(false);
    ctx.game.player.invincibleTimer = 0;
    ctx.game.player.x = 2;
    ctx.game.player.y = 0;
    ctx.game.player.onGround = true;
    ctx.events.length = 0;
    return ctx;
}

export function run(game, seconds, step = 1 / 240) {
    const n = Math.round(seconds / step);
    for (let i = 0; i < n; i++) game.step(step);
}
