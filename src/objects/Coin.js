import { OBJECTS, SCORE } from '../data/config.js';
import { TEXTS } from '../data/texts.js';

/** Pièce d'or. `phase` ne sert qu'à décaler l'animation de flottement (rendu). */
export function createCoin(world, x, y, rng) {
    world.coins.push({
        x,
        y,
        baseY: y,
        collected: false,
        visible: true,
        phase: rng() * Math.PI * 2,
    });
}

/** Collecte des pièces par le héros. */
export function updateCoins(game) {
    const p = game.player;
    const centerY = p.y + 0.65 * p.scale;
    for (const c of game.world.coins) {
        if (c.collected) continue;
        if (Math.hypot(p.x - c.x, centerY - c.y) < OBJECTS.COIN_PICKUP_RADIUS * p.scale) {
            c.collected = true;
            c.visible = false;
            game.score.addCoin();
            game.score.add(SCORE.COIN);
            game.sfx('coin');
            game.burst(c.x, c.y, 0xfacc15, 6);
            game.floatText(c.x, c.y + 0.6, TEXTS.floating.coin, 'amber-300');
        }
    }
}
