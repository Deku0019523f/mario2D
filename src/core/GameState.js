/**
 * États possibles du jeu.
 *
 *  MENU      écran d'accueil / de fin affiché ; le monde s'anime derrière (comme l'original)
 *  PLAYING   partie en cours
 *  PAUSED    partie suspendue (ajout : pause manuelle ou perte de focus)
 *  WIN_ANIM  animation du drapeau puis marche vers le château
 *  GAMEOVER  plus de vies
 */
export const MODE = Object.freeze({
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    WIN_ANIM: 'WIN_ANIM',
    GAMEOVER: 'GAMEOVER',
});

/** Événements 'mode' émis en plus des états ci-dessus. */
export const MODE_EVENT = Object.freeze({
    VICTORY: 'VICTORY', // fin de l'animation de victoire (le mode repasse à MENU)
});
