/** Hauteur du mât du drapeau (partagée avec le rendu). */
export const POLE_HEIGHT = 9.5;

/**
 * Drapeau d'arrivée. `bannerY` descend de `topY` à `bottomY` pendant l'animation de victoire.
 */
export function createGoal(world, x) {
    world.flag = {
        x,
        topY: POLE_HEIGHT - 0.5,
        bottomY: 1.4,
        bannerY: POLE_HEIGHT - 0.5,
        triggered: false,
    };
}
