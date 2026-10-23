/**
 * Données des niveaux (déclaratif).
 *
 * `items` est une liste ORDONNÉE : l'ordre de création détermine l'ordre des colliders et des
 * entités (ex. quel bloc est testé en premier), ce qui doit rester identique à la version
 * d'origine. Le test tests/integration/legacy-parity.test.js compare ce niveau à l'original.
 *
 * Types d'items :
 *  - platform : { x, width, yTop, height }       terrain / îlot (collider 'ground')
 *  - pipe     : { x, y, height }                 tuyau vert (collider 'pipe')
 *  - block    : { x, y, blockType, content }     'question' | 'brick' ; 'mushroom' | 'coin' | 'empty'
 *  - coin     : { x, y }
 *  - enemy    : { enemyType, x, y, minX, maxX }  'goomba' | 'koopa'
 */

const platform = (x, width, yTop, height) => ({ kind: 'platform', x, width, yTop, height });
const pipe = (x, y, height) => ({ kind: 'pipe', x, y, height });
const block = (x, y, blockType, content) => ({ kind: 'block', x, y, blockType, content });
const coin = (x, y) => ({ kind: 'coin', x, y });
const enemy = (enemyType, x, y, minX, maxX) => ({ kind: 'enemy', enemyType, x, y, minX, maxX });

/** Escalier royal de 5 marches avant le mât du drapeau. */
function royalStairs() {
    const items = [];
    for (let step = 0; step < 5; step++) {
        const sx = 116 + step * 1.1;
        const sy = (step + 1) * 0.8;
        items.push(platform(sx, 1.1, sy, sy));
        items.push(coin(sx + 0.55, sy + 1.1));
    }
    return items;
}

export const LEVEL_1 = Object.freeze({
    id: 1,
    length: 128, // abscisse du drapeau = longueur de référence de la barre de progression
    sceneryLength: 135, // étendue du décor d'arrière-plan
    flagX: 128,
    items: [
        // Section 1 : départ sécurisé + premier bloc "?" avec Super Champignon garanti
        platform(-6, 34, 0, 5),
        coin(6.5, 1.4),
        coin(7.9, 1.4),
        coin(9.3, 1.4),

        block(10.5, 2.55, 'question', 'mushroom'),
        block(13.5, 2.55, 'brick', 'empty'),
        block(14.45, 2.55, 'question', 'coin'),
        block(15.4, 2.55, 'brick', 'empty'),
        block(16.35, 2.55, 'question', 'mushroom'),
        block(14.9, 5.1, 'question', 'coin'),

        enemy('goomba', 17.5, 0, 12, 21),

        pipe(23.5, 0, 1.35),
        coin(23.5, 2.6),

        // Section 2 : vallée avec fossé et plateforme aérienne accessible
        platform(30.5, 32.5, 0, 5),
        platform(27.2, 2.8, 1.65, 0.85), // îlot suspendu bas au-dessus du fossé
        coin(28.6, 2.9),

        pipe(36, 0, 1.5),
        enemy('goomba', 41, 0, 37.5, 45),
        enemy('koopa', 43.5, 0, 38, 45.5),

        pipe(47, 0, 1.85),

        block(51.5, 2.65, 'brick', 'empty'),
        block(52.45, 2.65, 'question', 'mushroom'),
        block(53.4, 2.65, 'brick', 'empty'),
        coin(51.5, 4.2),
        coin(52.45, 4.2),
        coin(53.4, 4.2),

        enemy('goomba', 58, 0, 54, 61.5),

        // Section 3 : îlots célestes à double hauteur
        platform(65.5, 28.5, 0, 5),
        platform(69, 9, 2.7, 0.9),
        coin(71, 4.0),
        coin(73.5, 4.0),
        coin(76, 4.0),
        block(73.5, 5.3, 'question', 'mushroom'),

        enemy('koopa', 73.5, 2.7, 69.5, 77.5),
        enemy('goomba', 76, 0, 68, 82),
        enemy('goomba', 81, 0, 74, 86),

        pipe(88, 0, 1.55),

        // Section 4 : dernière ligne droite, escalier et drapeau final
        platform(96.5, 46.5, 0, 5),
        block(101, 2.55, 'question', 'coin'),
        block(101.95, 2.55, 'brick', 'empty'),
        block(102.9, 2.55, 'question', 'mushroom'),

        enemy('koopa', 107, 0, 100, 112),
        enemy('goomba', 111, 0, 104, 114),

        ...royalStairs(),
    ],
});

/**
 * Registre des niveaux. Comme dans la version d'origine, « Niveau Suivant » rejoue la même
 * disposition (seul le numéro du monde change) : les niveaux 2+ réutilisent donc LEVEL_1.
 * Pour ajouter un vrai niveau 2, créer LEVEL_2 ci-dessus et l'ajouter à ce tableau.
 */
export const LEVELS = Object.freeze([LEVEL_1]);

/** Renvoie la définition du niveau `n` (1-indexé) avec le numéro de monde demandé. */
export function getLevel(n = 1) {
    const def = LEVELS[n - 1] || LEVELS[LEVELS.length - 1];
    return def === LEVELS[n - 1] ? def : { ...def, id: n };
}
