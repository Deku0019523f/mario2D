/**
 * Configuration centrale du jeu : toutes les constantes modifiables sont ici.
 * Les valeurs de gameplay sont celles de la version d'origine (legacy/) : ne les
 * changer qu'en connaissance de cause, les tests de non-régression les comparent.
 */

/** Physique du héros et des entités (unités = « mètres » du monde, secondes). */
export const PHYSICS = Object.freeze({
    GRAVITY: -26,
    HOLD_JUMP_GRAVITY_MULT: 0.54, // gravité allégée quand on maintient le saut
    MOVE_ACCEL: 40,
    MAX_SPEED_X: 8.6,
    FRICTION: 15,
    JUMP_VELOCITY: 14.8,
    SUPER_JUMP_MULT: 1.05,
    MAX_FALL_SPEED: -20,
    COYOTE_TIME: 0.15,
    JUMP_BUFFER_TIME: 0.16,
    JUMP_CUT_MIN_VY: 5, // en dessous, relâcher le saut ne le raccourcit plus
    JUMP_CUT_FACTOR: 0.62,
    HEAD_BUMP_VY: -1.5,
    STOMP_BOUNCE: 11.2,
    DAMAGE_BOUNCE: 6.5,
    FALL_DEATH_Y: -5.5,
    LEFT_BOUND: -4.5,
    ENTITY_GRAVITY_MULT: 0.85, // champignon
    PARTICLE_GRAVITY_MULT: 0.8,

    /**
     * Pas de simulation fixe : la physique est indépendante du framerate.
     * 1/240 s garde un mouvement fluide jusqu'à 144 Hz sans interpolation.
     */
    FIXED_STEP: 1 / 240,
    MAX_FRAME_TIME: 0.1, // un onglet gelé ne « téléporte » pas le jeu
});

/** Héros. */
export const PLAYER = Object.freeze({
    SPAWN_X: 2.5,
    SPAWN_Y: 1.5,
    WIDTH: 0.62,
    SUPER_WIDTH_MULT: 1.12,
    HEIGHT: 1.22, // hauteur de collision avec le décor (× scale)
    CONTACT_HEIGHT: 1.25, // hauteur de contact avec les ennemis (× scale)
    SUPER_SCALE: 1.45,
    SCALE_LERP: 10,
    RESPAWN_INVINCIBLE: 1.2,
    HIT_INVINCIBLE: 2.2,
    BLINK_RATE: 18,
    SPRITE_SIZE: 1.45,
    STARTING_LIVES: 3,
});

/** Récompenses de score. */
export const SCORE = Object.freeze({
    COIN: 100,
    BLOCK_COIN: 200,
    BRICK_SMASH: 50,
    STOMP: 200,
    BLOCK_KO: 200,
    MUSHROOM: 1000,
    VICTORY: 2000,
});

/** Types d'ennemis. */
export const ENEMY_TYPES = Object.freeze({
    goomba: { size: 1.15, speed: 2.4 },
    koopa: { size: 1.35, speed: 2.4 },
});

/** Blocs, champignons, pièces. */
export const OBJECTS = Object.freeze({
    BLOCK_SIZE: 0.92,
    BLOCK_BOUNCE_TIME: 0.18,
    BLOCK_BOUNCE_HEIGHT: 0.42,
    MUSHROOM_SIZE: 1.05,
    MUSHROOM_RADIUS: 0.45,
    MUSHROOM_SPEED: 3.4,
    MUSHROOM_RISE_SPEED: 1.6,
    COIN_PICKUP_RADIUS: 0.95,
    PIPE_RADIUS: 0.62,
    MAX_PARTICLES: 160, // garde-fou pour les appareils modestes
});

/** Caméra 2.5D. */
export const CAMERA = Object.freeze({
    FOV: 46,
    NEAR: 0.1,
    FAR: 220,
    START: Object.freeze({ x: 6, y: 5.2, z: 17.5 }),
    LOOK_AHEAD: 2.2,
    MIN_X: 3,
    MIN_Y: 4.5,
    MAX_Y: 9.5,
    FOLLOW_X: 7,
    FOLLOW_Y: 5,
    BASE_Z: 17.2, // écrans larges
    PORTRAIT_Z_EXTRA: 14, // recul supplémentaire maximal sur écrans verticaux
});

/** Clés de stockage local. */
export const STORAGE = Object.freeze({
    BEST_SCORE: 'super_mario_25d_best_score', // identique à l'original : les records sont conservés
    SETTINGS: 'super_mario_25d_settings',
});

/** Raccourcis clavier (valeurs de KeyboardEvent.key). */
export const KEYS = Object.freeze({
    LEFT: ['ArrowLeft', 'q', 'Q', 'a', 'A'],
    RIGHT: ['ArrowRight', 'd', 'D'],
    JUMP: [' ', 'ArrowUp', 'z', 'Z', 'w', 'W'],
    PAUSE: ['Escape', 'p', 'P'],
    CONFIRM: ['Enter'],
});

/** Couleurs du décor. */
export const COLORS = Object.freeze({
    SKY: 0x38bdf8,
    FOG: 0x7dd3fc,
    FOG_DENSITY: 0.0045,
});

/** Réglages graphiques par palier de qualité (voir rendering/quality.js). */
export const QUALITY_PRESETS = Object.freeze({
    low: { antialias: false, maxPixelRatio: 1, shadows: false, shadowMapSize: 512, sphereDetail: 0.6 },
    medium: { antialias: true, maxPixelRatio: 1.5, shadows: true, shadowMapSize: 1024, sphereDetail: 0.85 },
    high: { antialias: true, maxPixelRatio: 2, shadows: true, shadowMapSize: 2048, sphereDetail: 1 },
});
