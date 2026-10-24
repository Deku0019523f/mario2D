/**
 * Génère les descripteurs du décor d'arrière-plan (collines, nuages, relief lointain).
 * Purement visuel et déterministe grâce au générateur fourni.
 * @param {import('./World.js').World} world
 * @param {number} levelLength étendue horizontale à couvrir
 * @param {() => number} rng
 */
export function generateScenery(world, levelLength, rng) {
    const { hills, clouds, far } = world.scenery;

    // Collines arrondies (couche proche)
    const hillColors = [0x4ade80, 0x22c55e, 0x16a34a];
    for (let x = -10; x < levelLength + 30; x += 14) {
        hills.push({
            x: x + (rng() - 0.5) * 4,
            y: -2,
            z: -5.5 - rng() * 4,
            height: 4 + rng() * 5.5,
            radius: 3.2 + rng() * 2.2,
            color: hillColors[Math.floor(rng() * hillColors.length)],
        });
    }

    // Nuages défilants
    for (let x = -15; x < levelLength + 35; x += 11) {
        clouds.push({
            x,
            y: 7.5 + rng() * 5,
            z: -4 - rng() * 6,
            speed: 0.35 + rng() * 0.35,
            maxX: levelLength + 40,
        });
    }

    // Relief lointain (couche de parallaxe supplémentaire, très en retrait)
    const farColors = [0x86d4b4, 0x9bdcc0, 0x7fcdb0];
    for (let x = -30; x < levelLength + 60; x += 22) {
        far.push({
            x: x + (rng() - 0.5) * 6,
            y: -4,
            z: -30 - rng() * 6,
            radius: 7 + rng() * 4,
            squash: 0.75 + rng() * 0.35,
            color: farColors[Math.floor(rng() * farColors.length)],
        });
    }
}
