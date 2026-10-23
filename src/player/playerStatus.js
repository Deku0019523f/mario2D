import { PHYSICS, PLAYER, SCORE } from '../data/config.js';
import { TEXTS } from '../data/texts.js';
import { MODE } from '../core/GameState.js';
import { resetPlayer } from './Player.js';

/** Le héros ramasse un Super Champignon. */
export function activateSuperMushroom(game) {
    const p = game.player;
    game.sfx('powerUp');
    game.score.add(SCORE.MUSHROOM);
    if (!p.isSuper) {
        p.isSuper = true;
        p.targetScale = PLAYER.SUPER_SCALE;
        game.floatText(p.x, p.y + 1.8, TEXTS.floating.superMario, 'rose-400');
    } else {
        game.floatText(p.x, p.y + 1.8, TEXTS.floating.mushroomBonus, 'amber-300');
    }
    game.burst(p.x, p.y + 1.0, 0xef4444, 14);
}

/** Le héros est touché : il rétrécit s'il est Super, sinon il perd une vie. */
export function damagePlayer(game) {
    const p = game.player;
    if (p.invincibleTimer > 0 || game.mode !== MODE.PLAYING) return;

    if (p.isSuper) {
        game.sfx('powerDown');
        p.isSuper = false;
        p.targetScale = 1;
        p.invincibleTimer = PLAYER.HIT_INVINCIBLE;
        p.vy = PHYSICS.DAMAGE_BOUNCE;
        game.floatText(p.x, p.y + 1.5, TEXTS.floating.hit, 'amber-300');
        game.burst(p.x, p.y + 0.8, 0xfef08a, 10);
    } else {
        loseLife(game, TEXTS.reasons.enemy);
    }
}

/** Perte d'une vie : Game Over s'il n'en reste plus, sinon retour au départ. */
export function loseLife(game, reason) {
    const p = game.player;
    game.lives.lose();

    if (game.lives.isDead) {
        game.sfx('gameOver');
        game.setMode(MODE.GAMEOVER, { reason });
    } else {
        game.sfx('powerDown');
        game.floatText(p.x, p.y + 1.4, TEXTS.floating.lifeLost(game.lives.lives), 'rose-400');
        resetPlayer(p, false);
    }
}
