import { PLAYER } from '../data/config.js';

/**
 * État du héros (données pures). Les champs `pose`, `visible`, `shadow`, `flipScaleX`,
 * `landTimer` sont des sorties destinées au rendu.
 */
export function createPlayer() {
    return {
        x: PLAYER.SPAWN_X,
        y: 0,
        vx: 0,
        vy: 0,
        facing: 1, // 1 = droite, -1 = gauche
        onGround: false,
        isSuper: false,
        scale: 1,
        targetScale: 1,
        invincibleTimer: 0,

        jumpBuffer: 0,
        coyoteTimer: 0,

        // Sorties pour le rendu
        animTimer: 0,
        pose: 'idle', // 'idle' | 'run1' | 'run2' | 'run3' | 'jump'
        flipScaleX: 1,
        visible: true,
        landTimer: 0, // > 0 juste après un atterrissage (écrasement du sprite)
        shadow: { visible: false, x: 0, y: 0, scale: 1 },
    };
}

/**
 * Replace le héros au départ. `keepPowerUp` conserve le Super Champignon (passage de niveau).
 */
export function resetPlayer(player, keepPowerUp = false) {
    player.x = PLAYER.SPAWN_X;
    player.y = PLAYER.SPAWN_Y;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
    player.onGround = false;
    if (!keepPowerUp) {
        player.isSuper = false;
        player.scale = 1;
        player.targetScale = 1;
    }
    player.invincibleTimer = PLAYER.RESPAWN_INVINCIBLE;
    player.visible = true;
}
