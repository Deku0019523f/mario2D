import { ENEMY_TYPES } from '../data/config.js';

/**
 * Crée un ennemi patrouillant entre `minX` et `maxX`.
 * @param {import('../world/World.js').World} world
 * @param {'goomba'|'koopa'} type
 */
export function createEnemy(world, type, x, y, minX = x - 4, maxX = x + 4) {
    const def = ENEMY_TYPES[type];
    if (!def) throw new Error(`Type d'ennemi inconnu : ${type}`);
    const enemy = {
        type,
        x,
        y,
        vx: -def.speed,
        vy: 0,
        size: def.size,
        width: def.size * 0.72,
        height: def.size * 0.82,
        minX,
        maxX,
        state: 'walk', // 'walk' | 'squashed'
        frame: 0, // image d'animation de marche (0/1), lue par le rendu
        animTimer: 0,
        squashTimer: 0,
        visible: true,
    };
    world.enemies.push(enemy);
    return enemy;
}

/** Aplatit un ennemi (il disparaît quand `squashTimer` expire). */
export function squashEnemy(enemy, duration) {
    enemy.state = 'squashed';
    enemy.squashTimer = duration;
}
