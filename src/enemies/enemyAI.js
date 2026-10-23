import { PHYSICS, PLAYER, SCORE } from '../data/config.js';
import { TEXTS } from '../data/texts.js';
import { MODE } from '../core/GameState.js';
import { squashEnemy } from './Enemy.js';
import { damagePlayer } from '../player/playerStatus.js';

/**
 * Patrouille, animation et collision avec le héros pour tous les ennemis.
 * @param {import('../core/Game.js').Game} game
 */
export function updateEnemies(game, dt) {
    const world = game.world;
    const p = game.player;

    for (const en of world.enemies) {
        if (en.state === 'squashed') {
            en.squashTimer -= dt;
            if (en.squashTimer <= 0) en.visible = false;
            continue;
        }

        // Patrouille entre les bornes
        en.x += en.vx * dt;
        if (en.x <= en.minX) { en.x = en.minX; en.vx = Math.abs(en.vx); }
        if (en.x >= en.maxX) { en.x = en.maxX; en.vx = -Math.abs(en.vx); }

        // Rebond contre les tuyaux
        for (let i = 0; i < world.colliders.length; i++) {
            const c = world.colliders[i];
            if (c.type === 'pipe' && en.y + 0.6 > c.minY && en.y < c.maxY) {
                if (en.x + 0.45 > c.minX && en.x - 0.45 < c.maxX) {
                    en.vx *= -1;
                    en.x += en.vx * dt * 2;
                }
            }
        }

        // Animation de marche à 2 images
        en.animTimer += dt * 5.5;
        en.frame = Math.floor(en.animTimer) % 2;

        // Contact avec le héros
        if (game.mode === MODE.PLAYING) {
            const dx = Math.abs(p.x - en.x);
            const playerH = PLAYER.CONTACT_HEIGHT * p.scale;
            if (dx < 0.68 * p.scale && p.y < en.y + en.height && p.y + playerH > en.y) {
                if (p.vy < 0 && p.y >= en.y + en.height * 0.42) {
                    // Écrasement par le dessus
                    squashEnemy(en, 0.55);
                    p.vy = PHYSICS.STOMP_BOUNCE;
                    game.score.add(SCORE.STOMP);
                    game.sfx('stomp');
                    game.burst(en.x, en.y + 0.4, 0xffffff, 8);
                    game.floatText(en.x, en.y + 1.0, TEXTS.floating.stomp, 'emerald-300');
                } else {
                    damagePlayer(game);
                }
            }
        }
    }
}
