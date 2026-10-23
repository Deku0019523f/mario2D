/**
 * Terrain / plateforme d'herbe. Crée le collider et le descripteur visuel.
 * @param {import('./World.js').World} world
 * @param {{x:number,width:number,yTop:number,height:number}} def
 * @param {() => number} rng générateur déterministe (position des buissons)
 */
export function createPlatform(world, def, rng) {
    const { x, width, yTop, height } = def;

    // Buissons décoratifs à l'arrière du chemin (positions locales, centrées sur la plateforme)
    const bushes = [];
    for (let bx = -width / 2 + 2.5; bx < width / 2 - 2.5; bx += 6.5) {
        if (rng() > 0.35) bushes.push(bx);
    }

    world.platforms.push({ x, width, yTop, height, bushes });
    world.colliders.push({
        type: 'ground',
        minX: x,
        maxX: x + width,
        minY: yTop - height,
        maxY: yTop,
    });
}
