import { OBJECTS, PHYSICS } from '../data/config.js';

/**
 * Particules cosmétiques (éclats de briques, étincelles, poussière).
 * @param {import('../world/World.js').World} world
 * @param {() => number} rand
 * @param {{size?: number, speed?: number}} [opts] size : échelle du cube ; speed : multiplicateur de vitesse
 */
export function spawnParticles(world, rand, x, y, color, count = 10, opts = {}) {
    const size = opts.size ?? 1;
    const speed = opts.speed ?? 1;
    for (let i = 0; i < count; i++) {
        world.particles.push({
            id: world.nextParticleId++,
            x,
            y,
            z: 0.2,
            vx: (rand() - 0.5) * 9 * speed,
            vy: (4 + rand() * 7) * speed,
            vz: (rand() - 0.5) * 4 * speed,
            life: 1,
            color,
            size,
            rotX: 0,
            rotY: 0,
        });
    }
    // Garde-fou : on retire les plus anciennes si la limite est dépassée.
    const overflow = world.particles.length - OBJECTS.MAX_PARTICLES;
    if (overflow > 0) world.particles.splice(0, overflow);
}

export function updateParticles(world, dt) {
    const list = world.particles;
    for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy += PHYSICS.GRAVITY * PHYSICS.PARTICLE_GRAVITY_MULT * dt;
        p.rotX += 6 * dt;
        p.rotY += 6 * dt;
        p.life -= 1.8 * dt;
        if (p.life <= 0) list.splice(i, 1);
    }
}
