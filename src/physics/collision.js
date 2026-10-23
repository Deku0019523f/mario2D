/**
 * Détection et résolution de collisions AABB 2D (plan X/Y du jeu).
 *
 * Un « collider » est un rectangle { minX, maxX, minY, maxY, type, active? } :
 *  - type 'ground' : terrain / îlot, 'pipe' : tuyau, 'block' : bloc "?" ou brique (collider.block = bloc).
 *  - active === false : collider désactivé (brique détruite).
 *
 * Ces fonctions reprennent à l'identique les tolérances de la version d'origine
 * (0.08 en latéral, 0.06 / 0.18 / 0.25 en vertical) qui conditionnent la sensation de jeu.
 */

/**
 * Résolution latérale : le corps est repoussé hors de tout collider qu'il chevauche.
 * @param {{x:number,y:number,vx:number}} body
 * @param {number} halfW demi-largeur
 * @param {number} height hauteur de collision
 * @param {Array} colliders
 */
export function resolveSide(body, halfW, height, colliders) {
    for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.active === false) continue;
        if (body.y + height > c.minY + 0.08 && body.y < c.maxY - 0.08) {
            if (body.x + halfW > c.minX && body.x - halfW < c.maxX) {
                if (body.vx > 0) {
                    body.x = c.minX - halfW;
                    body.vx = 0;
                } else if (body.vx < 0) {
                    body.x = c.maxX + halfW;
                    body.vx = 0;
                }
            }
        }
    }
}

/**
 * Résolution verticale : atterrissage sur le dessus d'un collider, ou coup de tête par dessous.
 * `body.onGround` doit avoir été remis à false avant l'appel.
 *
 * @param {{x:number,y:number,vy:number,onGround:boolean}} body
 * @param {number} prevY position Y avant le déplacement
 * @param {number} halfW
 * @param {number} height
 * @param {Array} colliders
 * @param {(collider:object)=>void} onHeadBump appelé quand la tête heurte le dessous d'un collider
 * @param {number} headBumpVy vitesse verticale appliquée après le choc
 */
export function resolveVertical(body, prevY, halfW, height, colliders, onHeadBump, headBumpVy) {
    for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.active === false) continue;
        if (body.x + halfW > c.minX + 0.06 && body.x - halfW < c.maxX - 0.06) {
            if (body.vy <= 0 && prevY >= c.maxY - 0.18 && body.y <= c.maxY) {
                // Atterrissage
                body.y = c.maxY;
                body.vy = 0;
                body.onGround = true;
            } else if (body.vy > 0 && prevY + height <= c.minY + 0.25 && body.y + height >= c.minY) {
                // Coup de tête
                body.y = c.minY - height;
                body.vy = headBumpVy;
                onHeadBump(c);
            }
        }
    }
}

/**
 * Hauteur du sol le plus proche sous (x, y), ou `null` s'il n'y en a pas (précipice).
 * Sert à positionner l'ombre portée du héros.
 */
export function findGroundBelow(x, y, colliders) {
    let best = -10;
    for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.active !== false && x >= c.minX && x <= c.maxX && c.maxY <= y + 0.05) {
            if (c.maxY > best) best = c.maxY;
        }
    }
    return best > -5 ? best : null;
}
