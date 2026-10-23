import { OBJECTS } from '../data/config.js';

/** Tuyau vert (Warp Pipe) : collider étroit centré sur `x`. */
export function createPipe(world, { x, y, height }) {
    const radius = OBJECTS.PIPE_RADIUS;
    world.pipes.push({ x, y, height, radius });
    world.colliders.push({
        type: 'pipe',
        minX: x - radius * 1.02,
        maxX: x + radius * 1.02,
        minY: y,
        maxY: y + height,
    });
}
