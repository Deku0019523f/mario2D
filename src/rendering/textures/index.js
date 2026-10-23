import { installRoundRectPolyfill } from './canvasUtils.js';
import { createMarioPoseTexture } from './marioTexture.js';
import { createGoombaTexture, createKoopaTexture } from './enemyTextures.js';
import { createSuperMushroomTexture, createQuestionBlockTexture, createBrickBlockTexture } from './itemTextures.js';

const MARIO_POSES = ['idle', 'run1', 'run2', 'run3', 'jump'];

/**
 * Génère tous les sprites du jeu (une seule fois, au démarrage).
 * @param {{doc?: Document}} [opts]
 * @returns {{
 *   marioSmall: Record<string, import('three').Texture>,
 *   marioSuper: Record<string, import('three').Texture>,
 *   goomba: import('three').Texture[],
 *   koopa: import('three').Texture[],
 *   mushroom: import('three').Texture,
 *   qBlockActive: import('three').Texture,
 *   qBlockUsed: import('three').Texture,
 *   brick: import('three').Texture,
 *   dispose: () => void
 * }}
 */
export function createSpriteTextures(opts = {}) {
    installRoundRectPolyfill();

    const marioSet = (isSuper) =>
        Object.fromEntries(MARIO_POSES.map((pose) => [pose, createMarioPoseTexture(pose, isSuper, opts)]));

    const textures = {
        marioSmall: marioSet(false),
        marioSuper: marioSet(true),
        goomba: [0, 1, 2].map((step) => createGoombaTexture(step, opts)),
        koopa: [0, 1, 2].map((step) => createKoopaTexture(step, opts)),
        mushroom: createSuperMushroomTexture(opts),
        qBlockActive: createQuestionBlockTexture(false, opts),
        qBlockUsed: createQuestionBlockTexture(true, opts),
        brick: createBrickBlockTexture(opts),
    };

    textures.dispose = () => {
        const all = [
            ...Object.values(textures.marioSmall),
            ...Object.values(textures.marioSuper),
            ...textures.goomba,
            ...textures.koopa,
            textures.mushroom,
            textures.qBlockActive,
            textures.qBlockUsed,
            textures.brick,
        ];
        all.forEach((t) => t.dispose());
    };

    return textures;
}
