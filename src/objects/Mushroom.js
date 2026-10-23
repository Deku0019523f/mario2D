import { OBJECTS, PHYSICS } from '../data/config.js';
import { activateSuperMushroom } from '../player/playerStatus.js';

/**
 * Fait surgir un Super Champignon au-dessus d'un bloc.
 * @param {import('../core/Game.js').Game} game
 * @param {number} x
 * @param {number} yBlockTop ordonnée du dessus du bloc
 */
export function spawnMushroom(game, x, yBlockTop) {
    game.sfx('mushroomSpawn');
    game.world.mushrooms.push({
        x,
        y: yBlockTop - 0.5,
        targetY: yBlockTop + 0.02,
        vx: OBJECTS.MUSHROOM_SPEED,
        vy: 0,
        size: OBJECTS.MUSHROOM_SIZE,
        radius: OBJECTS.MUSHROOM_RADIUS,
        emerging: true,
        collected: false,
        visible: true,
    });
}

/** Émergence, déplacement, rebonds sur les obstacles, gravité et collecte. */
export function updateMushrooms(game, dt) {
    const colliders = game.world.colliders;
    const p = game.player;

    for (const m of game.world.mushrooms) {
        if (m.collected) continue;

        if (m.emerging) {
            m.y += OBJECTS.MUSHROOM_RISE_SPEED * dt;
            if (m.y >= m.targetY) {
                m.y = m.targetY;
                m.emerging = false;
            }
            continue;
        }

        // Déplacement horizontal : rebondit sur les tuyaux et obstacles
        m.x += m.vx * dt;
        for (let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            if (c.active === false) continue;
            if (m.y + 0.8 > c.minY + 0.08 && m.y < c.maxY - 0.08) {
                if (m.x + m.radius > c.minX && m.x - m.radius < c.maxX) {
                    if (m.vx > 0) m.x = c.minX - m.radius;
                    else m.x = c.maxX + m.radius;
                    m.vx *= -1;
                }
            }
        }

        // Gravité
        const prevY = m.y;
        m.vy += PHYSICS.GRAVITY * PHYSICS.ENTITY_GRAVITY_MULT * dt;
        m.y += m.vy * dt;
        for (let i = 0; i < colliders.length; i++) {
            const c = colliders[i];
            if (c.active === false) continue;
            if (m.x + m.radius > c.minX && m.x - m.radius < c.maxX) {
                if (m.vy <= 0 && prevY >= c.maxY - 0.2 && m.y <= c.maxY) {
                    m.y = c.maxY;
                    m.vy = 0;
                }
            }
        }

        // Collecte par le héros
        const centerY = p.y + 0.65 * p.scale;
        if (Math.hypot(p.x - m.x, centerY - (m.y + 0.5)) < OBJECTS.COIN_PICKUP_RADIUS * p.scale) {
            m.collected = true;
            m.visible = false;
            activateSuperMushroom(game);
        }
    }
}
