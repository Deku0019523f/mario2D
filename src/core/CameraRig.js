import { CAMERA } from '../data/config.js';

/**
 * Recul de la caméra selon le format d'écran.
 * Écrans larges : distance de référence. Écrans verticaux (smartphones en portrait) : on recule
 * progressivement pour garder une zone de jeu lisible (l'original utilisait un seuil brutal sur la largeur).
 * @param {number} aspect largeur / hauteur
 */
export function computeCameraZ(aspect) {
    const t = Math.min(1, Math.max(0, (1.3 - aspect) / 0.9));
    return CAMERA.BASE_Z + t * CAMERA.PORTRAIT_Z_EXTRA;
}

/**
 * Caméra 2.5D « logique » (aucune dépendance à Three.js) : suit le héros avec anticipation.
 * Le moteur de rendu copie simplement x/y/z sur la caméra Three.js.
 */
export class CameraRig {
    constructor() {
        this.x = CAMERA.START.x;
        this.y = CAMERA.START.y;
        this.z = CAMERA.START.z;
    }

    /** Point visé par la caméra. */
    get lookAt() {
        return { x: this.x + 0.5, y: this.y - 1.5, z: 0 };
    }

    setAspect(aspect) {
        this.z = computeCameraZ(aspect);
    }

    /**
     * @param {number} dt durée réelle de la frame (s)
     * @param {{x:number,y:number,facing:number}} target
     */
    update(dt, target) {
        const targetX = Math.max(CAMERA.MIN_X, target.x + target.facing * CAMERA.LOOK_AHEAD);
        const targetY = Math.max(CAMERA.MIN_Y, Math.min(CAMERA.MAX_Y, target.y + 3.8));
        this.x += (targetX - this.x) * Math.min(1, CAMERA.FOLLOW_X * dt);
        this.y += (targetY - this.y) * Math.min(1, CAMERA.FOLLOW_Y * dt);
    }
}
