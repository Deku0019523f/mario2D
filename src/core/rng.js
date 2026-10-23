/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * Utilisé pour le décor : un même niveau produit toujours le même décor (tests reproductibles).
 * Les effets purement cosmétiques (particules) utilisent Math.random.
 * @param {number} seed
 * @returns {() => number} fonction renvoyant un nombre dans [0, 1)
 */
export function createRng(seed = 1) {
    let a = seed >>> 0;
    return function rng() {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
